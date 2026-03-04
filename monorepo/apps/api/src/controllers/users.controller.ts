import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, orders } from '../db/schema.js';
import { eq, count, sql, ne } from 'drizzle-orm';

import bcrypt from 'bcryptjs';

export class UsersController {
    // POST /api/users - Create new user (Admin)
    static async create(req: Request, res: Response) {
        try {
            const { name, email, phone, password, address, status } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if user exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [user] = await db.insert(users).values({
                name,
                email,
                phone,
                password: hashedPassword,
                address,
                role: 'customer',
                status: status || 'active',
                loyaltyPoints: 0,
            }).returning();

            const { password: _, ...userWithoutPassword } = user;
            res.status(201).json(userWithoutPassword);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
    // GET /api/users - List all users with order count (Admin only)
    static async list(req: Request, res: Response) {
        try {
            const { page = '1', limit = '10' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const offset = (pageNum - 1) * limitNum;

            // Get users (customers only, not admins)
            const usersList = await db.query.users.findMany({
                where: eq(users.role, 'customer'),
                limit: limitNum,
                offset,
                orderBy: (users, { desc }) => [desc(users.createdAt)],
            });

            // Get order counts for each user
            const usersWithOrderCount = await Promise.all(
                usersList.map(async (user) => {
                    const [orderCount] = await db
                        .select({ count: count() })
                        .from(orders)
                        .where(eq(orders.userId, user.id));

                    const [totalSpent] = await db
                        .select({ total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)` })
                        .from(orders)
                        .where(eq(orders.userId, user.id));

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        loyaltyPoints: user.loyaltyPoints,
                        status: 'active', // Default status
                        joinDate: user.createdAt,
                        orders: orderCount?.count || 0,
                        totalSpent: parseFloat(totalSpent?.total || '0'),
                    };
                })
            );

            // Get total count
            const [totalResult] = await db
                .select({ count: count() })
                .from(users)
                .where(eq(users.role, 'customer'));

            res.json({
                data: usersWithOrderCount,
                pagination: {
                    total: totalResult?.count || 0,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil((totalResult?.count || 0) / limitNum),
                },
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    // GET /api/users/:id - Get single user with order history
    static async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await db.query.users.findFirst({
                where: eq(users.id, id),
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get user's orders
            const userOrders = await db.query.orders.findMany({
                where: eq(orders.userId, id),
                with: {
                    items: {
                        with: {
                            product: {
                                with: {
                                    images: true
                                }
                            }
                        }
                    },
                },
                orderBy: (orders, { desc }) => [desc(orders.createdAt)],
            });

            res.json({
                ...user,
                orders: userOrders,
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }

    // PUT /api/users/profile - Update user profile (name, phone)
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { name, phone } = req.body;

            if (!name && !phone) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            const updateData: any = {};
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;
            updateData.updatedAt = new Date();

            const [updatedUser] = await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId))
                .returning();

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const { password: _, ...userWithoutPassword } = updatedUser;
            res.json(userWithoutPassword);
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    // PATCH /api/users/:id/status - Update user status
    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive', 'blocked'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const [updatedUser] = await db.update(users)
                .set({ status })
                .where(eq(users.id, id))
                .returning();

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(updatedUser);
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    }
}
