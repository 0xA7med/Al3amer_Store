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

    // GET /api/admin/reports - Aggregated reports
    static async getReports(req: Request, res: Response) {
        try {
            const { range, startDate: customStart, endDate: customEnd } = req.query;

            // Determine date range with timezone safety (use UTC)
            const now = new Date();
            let startDate = new Date();
            let previousStartDate = new Date();

            if (customStart && customEnd) {
                // Custom date range from query params
                startDate = new Date(customStart as string);
                const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
            } else if (range === 'week') {
                startDate.setDate(now.getDate() - 7);
                previousStartDate.setDate(now.getDate() - 14);
            } else if (range === 'year') {
                startDate.setFullYear(now.getFullYear() - 1);
                previousStartDate.setFullYear(now.getFullYear() - 2);
            } else {
                // Default month
                startDate.setMonth(now.getMonth() - 1);
                previousStartDate.setMonth(now.getMonth() - 2);
            }

            // Reset time to start of day (UTC) for consistent date comparison
            startDate.setUTCHours(0, 0, 0, 0);
            previousStartDate.setUTCHours(0, 0, 0, 0);

            // ============= CURRENT PERIOD ORDERS =============
            let currentOrders: any[] = [];
            try {
                currentOrders = await db.query.orders.findMany({
                    where: sql`${orders.createdAt} >= ${startDate}`,
                    with: {
                        items: {
                            with: {
                                product: {
                                    with: {
                                        images: true,
                                        category: true,
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (err) {
                console.error('Error fetching current orders:', err);
                currentOrders = [];
            }

            // ============= PREVIOUS PERIOD ORDERS =============
            let previousOrders: any[] = [];
            try {
                previousOrders = await db.query.orders.findMany({
                    where: sql`${orders.createdAt} >= ${previousStartDate} AND ${orders.createdAt} < ${startDate}`,
                });
            } catch (err) {
                console.error('Error fetching previous orders:', err);
                previousOrders = [];
            }

            // ============= CALCULATE STATS (with safety guards) =============
            const calculateStats = (orderList: any[]) => {
                // Guard against empty array
                if (!orderList || orderList.length === 0) {
                    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, uniqueCustomers: 0, netProfit: 0, totalCost: 0 };
                }

                let totalRevenue = 0;
                let totalCost = 0;

                for (const order of orderList) {
                    // Only count paid/delivered orders for revenue (safety check for null total)
                    if (order.status === 'delivered' || order.status === 'shipped') {
                        totalRevenue += parseFloat(order.total || '0') || 0;
                    }
                    // Calculate cost from order items if available
                    const items = order.items || [];
                    for (const item of items) {
                        const productCost = parseFloat(item.product?.cost || '0') || 0;
                        totalCost += productCost * (item.quantity || 1);
                    }
                }

                const totalOrders = orderList.length;
                // SAFETY: Prevent divide by zero
                const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                const uniqueCustomers = new Set(orderList.map(o => o.userId || o.email).filter(Boolean)).size;
                const netProfit = totalRevenue - totalCost;

                return { totalRevenue, totalOrders, averageOrderValue, uniqueCustomers, netProfit, totalCost };
            };

            const currentStats = calculateStats(currentOrders);
            const previousStats = calculateStats(previousOrders);

            // Calculate change percentage (with safety guard for zero previous)
            const calculateChange = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            };

            // ============= DAILY SALES CHART (last 30 days) =============
            let dailySalesChart: any[] = [];
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

                const dailySalesRaw = await db.execute(sql`
                    SELECT 
                        DATE(created_at) as date, 
                        COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue,
                        COUNT(*) as orders
                    FROM orders
                    WHERE created_at >= ${thirtyDaysAgo}
                    GROUP BY DATE(created_at)
                    ORDER BY date ASC
                `);

                // Format daily sales for chart (fill missing days with 0)
                const salesMap = new Map(
                    (dailySalesRaw as any[]).map(row => [
                        new Date(row.date).toISOString().split('T')[0],
                        { revenue: parseFloat(row.revenue) || 0, orders: parseInt(row.orders) || 0 }
                    ])
                );

                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayData = salesMap.get(dateStr) || { revenue: 0, orders: 0 };
                    dailySalesChart.push({
                        date: dateStr,
                        day: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
                        revenue: dayData.revenue,
                        orders: dayData.orders,
                    });
                }
            } catch (err) {
                console.error('Error fetching daily sales chart:', err);
                // Fill with empty data for 30 days
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    dailySalesChart.push({
                        date: date.toISOString().split('T')[0],
                        day: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
                        revenue: 0,
                        orders: 0,
                    });
                }
            }

            // ============= NEW CUSTOMERS COUNT =============
            let newCustomersCount = 0;
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const [newCustomersResult] = await db.select({ count: count() })
                    .from(users)
                    .where(sql`${users.createdAt} >= ${thirtyDaysAgo} AND ${users.role} = 'customer'`);
                newCustomersCount = newCustomersResult?.count || 0;
            } catch (err) {
                console.error('Error fetching new customers:', err);
            }

            const stats = {
                totalRevenue: Math.round(currentStats.totalRevenue),
                totalOrders: currentStats.totalOrders,
                averageOrderValue: Math.round(currentStats.averageOrderValue),
                newCustomers: currentStats.uniqueCustomers,
                netProfit: Math.round(currentStats.netProfit),
                revenueChange: calculateChange(currentStats.totalRevenue, previousStats.totalRevenue),
                ordersChange: calculateChange(currentStats.totalOrders, previousStats.totalOrders),
                aovChange: calculateChange(currentStats.averageOrderValue, previousStats.averageOrderValue),
                customersChange: calculateChange(currentStats.uniqueCustomers, previousStats.uniqueCustomers),
                customerGrowth: newCustomersCount,
            };

            // ============= SALES BY CATEGORY & TOP PRODUCTS =============
            const categoryMap = new Map<string, number>();
            const productMap = new Map<string, { name: string, category: string, sales: number, revenue: number, id: string, imageUrl: string }>();

            for (const order of currentOrders) {
                const items = order.items || [];
                for (const item of items) {
                    const catName = item.product?.category?.name || 'عام';
                    const prodName = item.product?.name || item.name || 'منتج غير معروف';
                    const qty = item.quantity || 1;
                    const price = parseFloat(item.price || '0') || 0;
                    const imageUrl = item.product?.images?.find((img: any) => img.isPrimary)?.url ||
                        item.product?.images?.[0]?.url || '';

                    categoryMap.set(catName, (categoryMap.get(catName) || 0) + (qty * price));

                    const prodKey = item.productId || item.id || prodName;
                    const existing = productMap.get(prodKey);
                    if (existing) {
                        existing.sales += qty;
                        existing.revenue += qty * price;
                    } else {
                        productMap.set(prodKey, {
                            id: prodKey,
                            name: prodName,
                            category: catName,
                            sales: qty,
                            revenue: qty * price,
                            imageUrl,
                        });
                    }
                }
            }

            // Format Sales By Category (with safety guard for zero total)
            const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
            const salesByCategory = Array.from(categoryMap.entries()).map(([name, value], index) => ({
                name,
                value: totalCategoryRevenue > 0 ? Math.round((value / totalCategoryRevenue) * 100) : 0,
                color: ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'][index % 5]
            })).sort((a, b) => b.value - a.value).slice(0, 5);

            // Format Top Products with stock info
            let topProducts: any[] = [];
            try {
                const topProductIds = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => p.id);

                // Fetch current stock for top products (only if we have IDs)
                const stockData = topProductIds.length > 0
                    ? await db.query.products.findMany({
                        where: inArray(products.id, topProductIds),
                        columns: { id: true, stock: true }
                    })
                    : [];
                const stockMap = new Map(stockData.map(p => [p.id, p.stock || 0]));

                topProducts = Array.from(productMap.values())
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map(p => ({
                        ...p,
                        stock: stockMap.get(p.id) || 0
                    }));
            } catch (err) {
                console.error('Error fetching top products stock:', err);
                topProducts = Array.from(productMap.values())
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map(p => ({ ...p, stock: 0 }));
            }

            res.json({ stats, salesByCategory, topProducts, dailySalesChart });

        } catch (error) {
            console.error('Error fetching reports:', error);
            // Return safe defaults instead of crashing
            res.status(200).json({
                stats: {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    newCustomers: 0,
                    netProfit: 0,
                    revenueChange: 0,
                    ordersChange: 0,
                    aovChange: 0,
                    customersChange: 0,
                    customerGrowth: 0,
                },
                salesByCategory: [],
                topProducts: [],
                dailySalesChart: [],
                error: 'Partial data returned due to an error'
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
}
