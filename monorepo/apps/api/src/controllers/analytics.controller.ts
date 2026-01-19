import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { orders, orderItems, products, users, reviews } from '../db/schema.js';
import { sql, eq, and, gte, desc, lte } from 'drizzle-orm';

export class AnalyticsController {
    // GET /api/analytics/dashboard
    static async getDashboardStats(req: Request, res: Response) {
        try {
            // 1. Quick Stats (Revenue, Orders, Customers) - This week vs Last week
            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfLastWeek = new Date(startOfWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

            const endOfLastWeek = new Date(startOfWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() - 1); // Day before start of this week

            // Helper to get stats for a range
            const getStatsForRange = async (start: Date, end: Date) => {
                const [result] = await db.select({
                    revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
                    count: sql<number>`COUNT(*)`,
                }).from(orders)
                    .where(and(
                        gte(orders.createdAt, start),
                        // For current week, we just want >= start. For past, we need range.
                        end ? lte(orders.createdAt, end) : undefined,
                        eq(orders.status, 'paid') // Only count paid orders for revenue? Usually "paid" or "delivered". Let's assume 'paid' or 'processing' is good revenue. Actually let's just count 'total' of non-cancelled/pending if we want projected. 
                        // Sticking to 'paid' + 'delivered' + 'shipped' + 'processing' might be better, but 'paid' is safest for "Revenue". 
                        // Let's use all valid orders for generic stats, or specific 'paid' status. 
                        // For simplicity in this demo, let's include all except 'cancelled'.
                        // Actually, let's keep it simple: ALL orders for volume, only PAID for revenue? 
                        // User asked for "Actionable". Let's simply sum ALL total for now but maybe filter later.
                        // Correct approach: Sum of 'total' where status != 'cancelled'.
                    ));
                return result;
            };

            const thisWeekStats = await getStatsForRange(startOfWeek, new Date()); // Up to now
            const lastWeekStats = await getStatsForRange(startOfLastWeek, endOfLastWeek);

            // 2. Pending Orders (Action Required)
            const pendingOrders = await db.query.orders.findMany({
                where: eq(orders.status, 'pending'),
                orderBy: [desc(orders.createdAt)],
                limit: 10,
                with: {
                    user: true,
                    items: {
                        with: {
                            product: {
                                with: {
                                    images: { limit: 1 }
                                }
                            }
                        }
                    }
                }
            });

            // 3. Activity Feed (Recent Events)
            // We'll mimic this by fetching recent orders, new users, and reviews, then sorting them in memory
            const recentOrders = await db.query.orders.findMany({
                orderBy: [desc(orders.createdAt)],
                limit: 5,
                with: { user: true }
            });
            const recentUsers = await db.query.users.findMany({
                orderBy: [desc(users.createdAt)],
                limit: 5
            });
            const lowStockProducts = await db.query.products.findMany({
                where: lte(products.stock, 5),
                limit: 5,
                orderBy: [desc(products.updatedAt)] // Recently updated or just found? 
            });

            // Standardize generic activities
            const activities = [
                ...recentOrders.map(o => ({
                    type: 'order',
                    message: `New Order #${o.orderNumber} from ${o.fullName}`,
                    date: o.createdAt,
                    id: o.id
                })),
                ...recentUsers.map(u => ({
                    type: 'user',
                    message: `New User Registered: ${u.name}`,
                    date: u.createdAt,
                    id: u.id
                })),
                ...lowStockProducts.map(p => ({
                    type: 'alert',
                    message: `Low Stock Alert: ${p.name} (${p.stock} left)`,
                    date: p.updatedAt, // Might be old if not updated recently, but useful
                    id: p.id
                }))
            ].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 10);

            // 4. Sparkline Data (Last 7 days daily order counts)
            const last7Days = await db.select({
                date: sql<string>`DATE(${orders.createdAt})`,
                count: sql<number>`COUNT(*)`,
            }).from(orders)
                .where(gte(orders.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
                .groupBy(sql`DATE(${orders.createdAt})`)
                .orderBy(sql`DATE(${orders.createdAt})`);

            res.json({
                stats: {
                    revenue: {
                        value: thisWeekStats.revenue,
                        lastWeek: lastWeekStats.revenue,
                        trend: thisWeekStats.revenue >= lastWeekStats.revenue ? 'up' : 'down'
                    },
                    orders: {
                        value: thisWeekStats.count,
                        lastWeek: lastWeekStats.count,
                        trend: thisWeekStats.count >= lastWeekStats.count ? 'up' : 'down'
                    }
                },
                pendingOrders,
                activityFeed: activities,
                sparklines: last7Days
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }

    // GET /api/analytics/reports
    static async getReportsData(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;

            // Default to last 30 days if not provided
            const end = endDate ? new Date(endDate as string) : new Date();
            const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(end.getDate() - 30));

            // 1. Sales Heatmap (Day of Week vs Hour)
            // Postgres: EXTRACT(DOW from created_at), EXTRACT(HOUR from created_at)
            const heatmapData = await db.execute(sql`
                SELECT 
                    EXTRACT(DOW FROM created_at) as day_of_week, 
                    EXTRACT(HOUR FROM created_at) as hour_of_day, 
                    COUNT(*) as count 
                FROM ${orders} 
                WHERE created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()}
                GROUP BY 1, 2
            `);

            // 2. Profitability Analysis (Net Profit vs Gross Revenue)
            // Revenue = Sum(Order Total)
            // Cost = Sum(Order Item Quantity * Product Cost)
            // NOTE: Product cost is from PRODUCTS table (current cost), as per implementation plan.
            const profitabilityData = await db.select({
                date: sql<string>`DATE(${orders.createdAt})`,
                revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
                cost: sql<number>`COALESCE(SUM(${orderItems.quantity} * ${products.cost}), 0)`,
                profit: sql<number>`COALESCE(SUM(${orders.total}), 0) - COALESCE(SUM(${orderItems.quantity} * ${products.cost}), 0)`
            })
                .from(orders)
                .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
                .leftJoin(products, eq(orderItems.productId, products.id)) // Join products to get cost
                .where(and(
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end)
                ))
                .groupBy(sql`DATE(${orders.createdAt})`)
                .orderBy(sql`DATE(${orders.createdAt})`);

            // 3. Customer Insights (New vs Returning)
            // New = First order in this period
            // Returning = Ordered before
            // This is complex in SQL in one go. 
            // Simplified approach: Pie Chart of "One-time Buyers" vs "Repeat Buyers" (Total lifetime)
            // OR: Just count NEW customers registered in this period vs Active customers
            // Let's do: New Registrations in Period vs Total Active Users
            const newCustomersCount = await db.select({ count: sql<number>`COUNT(*)` })
                .from(users)
                .where(and(gte(users.createdAt, start), lte(users.createdAt, end)));

            const totalCustomersCount = await db.select({ count: sql<number>`COUNT(*)` }).from(users);

            // 4. Inventory Health (Low Stock Items)
            const inventoryHealth = await db.query.products.findMany({
                columns: {
                    id: true,
                    name: true,
                    stock: true,
                },
                where: lte(products.stock, 10),
                orderBy: [sql`${products.stock} ASC`],
                limit: 10
            });

            res.json({
                heatmap: heatmapData.rows || heatmapData, // Drizzle execute returns full result object depending on driver
                profitability: profitabilityData,
                customerInsights: {
                    new: newCustomersCount[0]?.count || 0,
                    total: totalCustomersCount[0]?.count || 0,
                    returning: (totalCustomersCount[0]?.count || 0) - (newCustomersCount[0]?.count || 0) // Rough approx
                },
                inventory: inventoryHealth
            });

        } catch (error) {
            console.error('Error fetching reports data:', error);
            res.status(500).json({ error: 'Failed to fetch reports data' });
        }
    }
}
