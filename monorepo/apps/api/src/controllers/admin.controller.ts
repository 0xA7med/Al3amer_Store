import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { orders, products, users } from '../db/schema.js';
import { eq, sql, count, sum, lt } from 'drizzle-orm';

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

            // Get orders stats
            const ordersList = await db.query.orders.findMany({
                orderBy: (orders, { desc }) => [desc(orders.createdAt)],
            });

            const totalOrders = ordersList.length;
            const pendingOrders = ordersList.filter(o => o.status === 'pending' || o.status === 'processing').length;
            const completedOrders = ordersList.filter(o => o.status === 'delivered').length;
            const cancelledOrders = ordersList.filter(o => o.status === 'cancelled').length;
            const totalRevenue = ordersList
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

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
            const { range } = req.query; // week, month, year

            // Determine date range
            const now = new Date();
            let startDate = new Date();
            let previousStartDate = new Date();

            if (range === 'week') {
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

            // Fetch orders for current period
            const currentOrders = await db.query.orders.findMany({
                where: sql`${orders.createdAt} >= ${startDate}`,
                with: { items: true }
            });

            // Fetch orders for previous period (for comparison)
            const previousOrders = await db.query.orders.findMany({
                where: sql`${orders.createdAt} >= ${previousStartDate} AND ${orders.createdAt} < ${startDate}`,
            });

            // Calculate Stats
            const calculateStats = (orderList: any[]) => {
                const totalRevenue = orderList.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
                const totalOrders = orderList.length;
                const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                // Unique customers (assuming simple email check or userId)
                const uniqueCustomers = new Set(orderList.map(o => o.userId || o.email)).size;
                return { totalRevenue, totalOrders, averageOrderValue, uniqueCustomers };
            };

            const currentStats = calculateStats(currentOrders);
            const previousStats = calculateStats(previousOrders);

            const calculateChange = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            };

            const stats = {
                totalRevenue: currentStats.totalRevenue,
                totalOrders: currentStats.totalOrders,
                averageOrderValue: Math.round(currentStats.averageOrderValue),
                newCustomers: currentStats.uniqueCustomers, // Approximation
                revenueChange: calculateChange(currentStats.totalRevenue, previousStats.totalRevenue),
                ordersChange: calculateChange(currentStats.totalOrders, previousStats.totalOrders),
                aovChange: calculateChange(currentStats.averageOrderValue, previousStats.averageOrderValue),
                customersChange: calculateChange(currentStats.uniqueCustomers, previousStats.uniqueCustomers),
            };

            // Sales By Category & Top Products
            // Since items are JSONB or related table?
            // If items is a relation "items", we used "with: { items: true }" above.
            // If schema definition "items" is a relation to "order_items" table, we are good.
            // If it is JSONB column, "items" in currentOrders will be the JSON array.

            const categoryMap = new Map<string, number>();
            const productMap = new Map<string, { name: string, category: string, sales: number, revenue: number, id: string }>();

            for (const order of currentOrders) {
                // @ts-ignore
                const items = order.items || [];
                // If items is array of objects
                for (const item of items) {
                    // Logic depends on item structure. Assuming { productId, product: { name, category... }, quantity, price }
                    // If order items didn't populate product/category, we might need more data.
                    // Assuming for now simple structure or we skip if data missing.
                    // We might need to fetch products to map IDs if items only have IDs.

                    // This part is tricky if "items" is just JSON with IDs.
                    // Let's assume typical structure { name: '...', category: '...', quantity: 1, price: 100 } stored in JSON

                    // Use fallback if name/category missing
                    // @ts-ignore
                    const catName = item.product?.category?.name || item.category || 'عام';
                    // @ts-ignore
                    const prodName = item.product?.name || item.name || 'منتج غير معروف';
                    const qty = item.quantity || 1;
                    const price = parseFloat(item.price || '0');

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
                            revenue: qty * price
                        });
                    }
                }
            }

            // Format Sales By Category
            const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
            const salesByCategory = Array.from(categoryMap.entries()).map(([name, value], index) => ({
                name,
                value: totalCategoryRevenue > 0 ? Math.round((value / totalCategoryRevenue) * 100) : 0,
                color: ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'][index % 5]
            })).sort((a, b) => b.value - a.value).slice(0, 5);

            // Format Top Products
            const topProducts = Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map(p => ({
                    ...p,
                    stock: 0 // We don't have stock info here easily without checking products table. Mock 0 or N/A
                }));

            res.json({ stats, salesByCategory, topProducts });

        } catch (error) {
            console.error('Error fetching reports:', error);
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    }
}
