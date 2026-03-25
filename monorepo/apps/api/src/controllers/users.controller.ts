import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, orders } from '../db/schema.js';
import { eq, count, sql, isNull, isNotNull } from 'drizzle-orm';

import bcrypt from 'bcryptjs';

export class UsersController {
    // POST /api/users - Create new user (Admin)
    static async create(req: Request, res: Response) {
        try {
            const { name, email, phone, password, address, status } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [user] = await db.insert(users).values({
                name, email, phone, password: hashedPassword, address,
                role: 'customer', status: status || 'active', loyaltyPoints: 0,
            }).returning();

            const { password: _, ...userWithoutPassword } = user;
            res.status(201).json(userWithoutPassword);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    /**
     * GET /api/users
     * Returns a UNIFIED list of customers: registered users + guest order groups.
     * Groups all orders by phone_number. If a registered user exists with that phone,
     * they are used as the record; otherwise a guest record is synthesised.
     */
    static async list(req: Request, res: Response) {
        try {
            // 1. Fetch all registered customers
            const registeredUsers = await db.query.users.findMany({
                where: eq(users.role, 'customer'),
                orderBy: (u, { desc }) => [desc(u.createdAt)],
            });

            // 2. Fetch ALL orders (guest + registered), only fields we need
            const allOrders = await db.execute(sql`
                SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    email,
                    governorate,
                    city,
                    CAST(total AS DECIMAL) as total,
                    created_at,
                    status
                FROM orders
                ORDER BY created_at DESC
            `);

            // 3. Build a map: phone → aggregated customer record
            const phoneMap = new Map<string, {
                id: string;
                name: string;
                email: string;
                phone: string;
                address: string | null;
                orders: number;
                totalSpent: number;
                status: string;
                joinDate: string;
                loyaltyPoints: number;
                type: 'registered' | 'guest';
            }>();

            // Pre-index registered users by phone
            const registeredByPhone = new Map<string, typeof registeredUsers[number]>();
            for (const u of registeredUsers) {
                if (u.phone) registeredByPhone.set(u.phone.trim(), u);
            }

            // Aggregate orders by phone
            for (const row of allOrders as any[]) {
                const phone: string = (row.user_phone || row.phone || '').trim();
                if (!phone) continue;

                if (!phoneMap.has(phone)) {
                    const regUser = registeredByPhone.get(phone);
                    if (regUser) {
                        // Registered user
                        phoneMap.set(phone, {
                            id: regUser.id,
                            name: regUser.name,
                            email: regUser.email || '',
                            phone,
                            address: regUser.address || null,
                            orders: 0,
                            totalSpent: 0,
                            status: regUser.status || 'active',
                            joinDate: (regUser.createdAt as any)?.toISOString?.() || String(regUser.createdAt),
                            loyaltyPoints: regUser.loyaltyPoints || 0,
                            type: 'registered',
                        });
                    } else {
                        // Guest — synthesise record from order data
                        phoneMap.set(phone, {
                            id: `guest_${phone}`,
                            name: row.full_name || 'زائر',
                            email: row.email || '',
                            phone,
                            address: null,
                            orders: 0,
                            totalSpent: 0,
                            status: 'guest',
                            joinDate: row.created_at?.toISOString?.() || String(row.created_at),
                            loyaltyPoints: 0,
                            type: 'guest',
                        });
                    }
                }

                const entry = phoneMap.get(phone)!;
                entry.orders += 1;
                entry.totalSpent += Number(row.total || 0);
            }

            // 4. Also add registered users that have NO orders (so they appear in the list)
            for (const u of registeredUsers) {
                const phone = (u.phone || '').trim();
                if (phone && !phoneMap.has(phone)) {
                    phoneMap.set(phone, {
                        id: u.id,
                        name: u.name,
                        email: u.email || '',
                        phone,
                        address: u.address || null,
                        orders: 0,
                        totalSpent: 0,
                        status: u.status || 'active',
                        joinDate: (u.createdAt as any)?.toISOString?.() || String(u.createdAt),
                        loyaltyPoints: u.loyaltyPoints || 0,
                        type: 'registered',
                    });
                }
            }

            // 5. Sort by totalSpent desc, paginate
            const { page = '1', limit = '50' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const offset = (pageNum - 1) * limitNum;

            const unified = Array.from(phoneMap.values())
                .sort((a, b) => b.totalSpent - a.totalSpent);
            const total = unified.length;
            const paged = unified.slice(offset, offset + limitNum);

            res.json({
                data: paged,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            });
        } catch (error) {
            console.error('Error fetching unified customers:', error);
            res.status(500).json({ error: 'Failed to fetch customers' });
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

            const userOrders = await db.query.orders.findMany({
                where: eq(orders.userId, id),
                with: {
                    items: {
                        with: { product: { with: { images: true } } }
                    },
                },
                orderBy: (o, { desc }) => [desc(o.createdAt)],
            });

            res.json({ ...user, orders: userOrders });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }

    // PUT /api/users/profile - Update user profile
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { name, phone } = req.body;
            if (!name && !phone) return res.status(400).json({ error: 'No fields to update' });

            const updateData: any = {};
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;
            updateData.updatedAt = new Date();

            const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
            if (!updatedUser) return res.status(404).json({ error: 'User not found' });

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

            const [updatedUser] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
            if (!updatedUser) return res.status(404).json({ error: 'User not found' });

            res.json(updatedUser);
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    }
}
