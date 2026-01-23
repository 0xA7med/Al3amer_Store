import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { orders, products, users, aiBundleLogs } from '../db/schema.js';
import { eq, sql, count, sum, lt, or, inArray } from 'drizzle-orm';

export class AdminController {
    // GET /api/admin/stats - Dashboard statistics
    static async getStats(_req: Request, res: Response) {
        try {
            // Get total products count
            const [productsResult] = await db.select({ count: count() }).from(products);
            const totalProducts = productsResult?.count || 0;

            // Get low stock products count (stock < 10)
            const [lowStockResult] = await db.select({ count: count() })
                .from(products)
                .where(lt(products.stock, 10));
            const lowStockProducts = lowStockResult?.count || 0;

            // Get total customers count
            const [customersResult] = await db.select({ count: count() })
                .from(users)
                .where(eq(users.role, 'customer'));
            const totalCustomers = customersResult?.count || 0;

            // Get orders stats via SQL Aggregation
            const [ordersStats] = await db.select({
                totalOrders: count(),
                totalRevenue: sum(sql`CAST(${orders.total} AS DECIMAL)`), // Ensure numeric casting
            }).from(orders);

            const [pendingStats] = await db.select({ count: count() }).from(orders)
                .where(or(eq(orders.status, 'pending'), eq(orders.status, 'processing')));

            const [completedStats] = await db.select({ count: count() }).from(orders)
                .where(eq(orders.status, 'delivered'));

            const [cancelledStats] = await db.select({ count: count() }).from(orders)
                .where(eq(orders.status, 'cancelled'));

            const totalOrders = ordersStats?.totalOrders || 0;
            const totalRevenue = parseFloat(ordersStats?.totalRevenue as string) || 0;
            const pendingOrders = pendingStats?.count || 0;
            const completedOrders = completedStats?.count || 0;
            const cancelledOrders = cancelledStats?.count || 0;

            // Get recent orders (last 5)
            const recentOrders = await db.query.orders.findMany({
                limit: 5,
                orderBy: (orders, { desc }) => [desc(orders.createdAt)],
                with: {
                    user: true,
                    items: true,
                },
            });

            res.json({
                totalProducts,
                lowStockProducts,
                totalCustomers,
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue,
                recentOrders,
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }

    // GET /api/admin/reports - Aggregated reports with robust error handling
    static async getReports(req: Request, res: Response) {
        try {
            const { range } = req.query; // week, month, year, or custom range (future proof)

            // 1. Date Sanitization (UTC Normalization)
            const now = new Date();
            const startDate = new Date();
            const previousStartDate = new Date();
            const previousEndDate = new Date(); // To accurately compare ranges

            // Helper to reset time to start of day UTC
            const resetTime = (d: Date) => {
                d.setUTCHours(0, 0, 0, 0);
                return d;
            };

            if (range === 'week') {
                startDate.setDate(now.getDate() - 7);
                previousStartDate.setDate(now.getDate() - 14);
                previousEndDate.setDate(now.getDate() - 7);
            } else if (range === 'year') {
                startDate.setFullYear(now.getFullYear() - 1);
                previousStartDate.setFullYear(now.getFullYear() - 2);
                previousEndDate.setFullYear(now.getFullYear() - 1);
            } else if (range === 'custom') {
                const { startDate: qStart, endDate: qEnd } = req.query;
                if (qStart && qEnd) {
                    startDate.setTime(new Date(qStart as string).getTime());
                    // End date is usually inclusive, so set to end of that day or use simple logic
                    // Here we assume startDate is dynamic.

                    // Logic for custom comparison: Compare with previous period of same length
                    const duration = new Date(qEnd as string).getTime() - startDate.getTime();
                    previousStartDate.setTime(startDate.getTime() - duration);
                    previousEndDate.setTime(startDate.getTime());
                }
            } else {
                // Default month (Last 30 days)
                startDate.setDate(now.getDate() - 30);
                previousStartDate.setDate(now.getDate() - 60);
                previousEndDate.setDate(now.getDate() - 30);
            }

            // 2. Fetch Aggregated Stats via SQL (Efficient & Robust)
            // Current Period Stats
            const [currentStats] = await db.select({
                totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
                totalOrders: count(),
                uniqueCustomers: count(orders.userId), // Approximate, better to count distinct if needed but count() is safer for now
                // For Net Profit, we need cost. Assuming items link. Complex query minimized for stability:
                // We will calc profit from a simplified heuristic if cost isn't on orders table directly.
                // Assuming we fetch full orders for detailed breakdown is expensive.
                // Let's stick to the previous logic but safe:
            }).from(orders)
                .where(sql`${orders.createdAt} >= ${startDate}`);

            // Previous Period Stats (for Growth)
            const [previousStats] = await db.select({
                totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
                totalOrders: count(),
            }).from(orders)
                .where(sql`${orders.createdAt} >= ${previousStartDate} AND ${orders.createdAt} < ${previousEndDate}`);

            // 3. Robust Calculation Helpers
            const safeDiv = (num: number, den: number) => (den === 0 ? 0 : num / den);
            const calcGrowth = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            };

            const currentRevenue = Number(currentStats?.totalRevenue || 0);
            const currentOrdersCount = Number(currentStats?.totalOrders || 0);
            const prevRevenue = Number(previousStats?.totalRevenue || 0);
            const prevOrdersCount = Number(previousStats?.totalOrders || 0);

            // New Customers (Last 30 Days fixed for 'Growth' metric usually)
            const [newCustomersResult] = await db.select({ count: count() })
                .from(users)
                .where(sql`${users.createdAt} >= ${startDate} AND ${users.role} = 'customer'`);
            const newCustomersCount = newCustomersResult?.count || 0;

            // 4. Daily Sales Chart (Last 30 Days guaranteed)
            // Using a generating series approach in code to ensure no gaps
            const chartDataRaw = await db.execute(sql`
                SELECT 
                    DATE(created_at) as date, 
                    COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue,
                    COUNT(*) as orders
                FROM orders
                WHERE created_at >= ${startDate}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            const chartDataMap = new Map(
                (chartDataRaw as any[]).map(row => [
                    new Date(row.date).toISOString().split('T')[0],
                    { revenue: Number(row.revenue), orders: Number(row.orders) }
                ])
            );

            const filledChartData = [];
            const d = new Date(startDate);
            while (d <= now) {
                const dateStr = d.toISOString().split('T')[0];
                const data = chartDataMap.get(dateStr) || { revenue: 0, orders: 0 };
                filledChartData.push({
                    date: dateStr,
                    day: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }), // For plotting
                    revenue: data.revenue,
                    orders: data.orders
                });
                d.setDate(d.getDate() + 1);
            }

            // 5. Top Products & Category Breakdown
            // We need to join with items. For performance, we limit the subquery or just fetch recent items.
            // Since we need "Top Products" for the selected range, we query order_items joined with orders.
            // Note: Drizzle syntax for deep nested aggregation can be complex.
            // Falling back to a raw performant query for "Top Items"

            // This raw query assumes standard schema naming (users table etc) match.
            // Ideally use query builder if possible, but raw SQL is often cleaner for complex aggregations.
            // We will use the query builder for safety to avoid raw SQL injection risks manually.

            // Fetching items for the period to Aggregate in JS (memory efficient if paged, but here we scan range)
            // For robust 'Enterprise' apps, we should use DB-side aggregation.
            // Let's try DB-side for Categories and Products.

            // Note: `db.query.orders.findMany` is what we had. It's OK for medium scale.
            // Let's optimize it by selecting only needed fields for aggregation.
            const periodOrders = await db.query.orders.findMany({
                where: sql`${orders.createdAt} >= ${startDate}`,
                with: {
                    items: {
                        with: {
                            product: {
                                with: { category: true, images: true }
                            }
                        }
                    }
                }
            });

            // Aggregate Client-Side (safe for now, allows complex business logic like 'net profit' if cost is on product)
            const catMap = new Map<string, number>();
            const prodMap = new Map<string, any>();
            let calculatedNetProfit = 0;

            for (const order of periodOrders) {
                const items = order.items || [];
                for (const item of items) {
                    const price = Number(item.price || 0);
                    const qty = item.quantity || 1;
                    const total = price * qty;
                    const cost = Number(item.product?.cost || 0) * qty;

                    calculatedNetProfit += (total - cost);

                    // Category
                    const catName = item.product?.category?.name || 'Uncategorized';
                    catMap.set(catName, (catMap.get(catName) || 0) + total);

                    // Product
                    const pid = item.product?.id || item.id;
                    if (!prodMap.has(pid)) {
                        prodMap.set(pid, {
                            id: pid,
                            name: item.product?.name || item.name,
                            sales: 0,
                            revenue: 0,
                            stock: item.product?.stock || 0,
                            category: catName,
                            image: item.product?.images?.[0]?.url
                        });
                    }
                    const p = prodMap.get(pid);
                    p.sales += qty;
                    p.revenue += total;
                }
            }

            // Formatting Response
            const salesByCategory = Array.from(catMap.entries())
                .map(([name, val], i) => ({
                    name,
                    value: safeDiv(val, currentRevenue) * 100, // percentage
                    amount: val,
                    color: ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'][i % 4]
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            const topProducts = Array.from(prodMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            const response = {
                // Summary Object
                summary: {
                    revenue: currentRevenue,
                    orders: currentOrdersCount,
                    growth: calcGrowth(currentRevenue, prevRevenue),
                    netProfit: calculatedNetProfit,
                    averageOrderValue: safeDiv(currentRevenue, currentOrdersCount),
                    newCustomers: newCustomersCount,
                },
                // Backward compatibility stats object (flattened)
                stats: {
                    totalRevenue: currentRevenue,
                    totalOrders: currentOrdersCount,
                    averageOrderValue: safeDiv(currentRevenue, currentOrdersCount),
                    newCustomers: newCustomersResult?.count || 0,// using 'uniqueCustomers' from pure count might differ
                    netProfit: calculatedNetProfit,
                    revenueChange: calcGrowth(currentRevenue, prevRevenue),
                    ordersChange: calcGrowth(currentOrdersCount, prevOrdersCount),
                    aovChange: 0, // Placeholder, requires prev AOV calc
                    customersChange: 0,
                },
                dailySalesChart: filledChartData,
                salesByCategory,
                topProducts,
            };

            res.json(response);

        } catch (error) {
            console.error('Error fetching reports:', error);
            // Return a safe fallback rather than crashing
            res.status(500).json({
                error: 'Failed to generate report',
                summary: { revenue: 0, orders: 0, growth: 0 },
                dailySalesChart: []
            });
        }
    }

    // GET /api/admin/ai-logs - Fetch paginated AI bundle logs
    static async getAILogs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const [countResult] = await db.select({ count: count() }).from(aiBundleLogs);
            const totalLogs = countResult?.count || 0;

            // Fetch logs with user info
            const logs = await db.query.aiBundleLogs.findMany({
                limit,
                offset,
                orderBy: (logs, { desc }) => [desc(logs.createdAt)],
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    }
                }
            });

            // Calculate stats
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [totalResult] = await db.select({ count: count() }).from(aiBundleLogs);
            const totalRecommendations = totalResult?.count || 0;

            // Get average bundle value and business type stats
            const allLogs = await db.query.aiBundleLogs.findMany({
                columns: { resultBundle: true, businessType: true }
            });
            const bundleValues = allLogs
                .map(l => (l.resultBundle as any)?.price || 0)
                .filter(v => v > 0);
            const avgBundleValue = bundleValues.length > 0
                ? Math.round(bundleValues.reduce((a, b) => a + b, 0) / bundleValues.length)
                : 0;

            // Get most popular business type
            const businessTypes = allLogs.map(l => l.businessType);
            const typeCount = businessTypes.reduce((acc, type) => {
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const popularType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];

            const stats = {
                totalRecommendations,
                conversionRate: 18.5, // Placeholder - would need order tracking
                avgBundleValue,
                popularBusinessType: popularType ? { name: popularType[0], percentage: Math.round((popularType[1] / totalRecommendations) * 100) } : null,
            };

            res.json({
                logs,
                pagination: {
                    page,
                    limit,
                    total: totalLogs,
                    totalPages: Math.ceil(totalLogs / limit),
                },
                stats,
            });
        } catch (error) {
            console.error('Error fetching AI logs:', error);
            res.status(500).json({ error: 'Failed to fetch AI logs' });
        }
    }

    // GET /api/admin/debug-models - List actually available models for the configured API key
    static async debugModels(_req: Request, res: Response) {
        try {
            const appSettings = await db.query.settings.findFirst();
            const apiKey = appSettings?.googleApiKey || process.env.GOOGLE_API_KEY;

            if (!apiKey) {
                return res.status(400).json({ error: 'Google API Key is not configured' });
            }

            // Using direct fetch to Google API for maximum reliability in debugging
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
            const data = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({
                    error: 'Failed to fetch models from Google API',
                    details: data
                });
            }

            res.json(data);
        } catch (error: any) {
            console.error('Error in debugModels:', error);
            res.status(500).json({ error: 'Failed to debug models', details: error.message });
        }
    }
}
