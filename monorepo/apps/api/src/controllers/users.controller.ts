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
                    address,
                    notes,
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
                phone2?: string;
                address: string | null;
                orders: number;
                totalSpent: number;
                status: string;
                joinDate: string;
                loyaltyPoints: number;
                governorate?: string;
                city?: string;
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
                            governorate: undefined, // Will be filled from order or user metadata if we had it
                            city: undefined,
                            type: 'registered',
                        });
                    } else {
                        // Guest — synthesise record from order data
                        phoneMap.set(phone, {
                            id: `guest_${phone}`,
                            name: row.full_name || 'زائر',
                            email: row.email || '',
                            phone,
                            address: row.address || null,
                            orders: 0,
                            totalSpent: 0,
                            status: 'active', // Show as active by default for guest buyers
                            joinDate: row.created_at?.toISOString?.() || String(row.created_at),
                            loyaltyPoints: 0,
                            governorate: row.governorate,
                            city: row.city,
                            type: 'guest',
                        });
                    }
                }

                const entry = phoneMap.get(phone)!;
                if (!entry.address && row.address) entry.address = row.address;
                if (!entry.governorate && row.governorate) entry.governorate = row.governorate;
                if (!entry.city && row.city) entry.city = row.city;
                
                // Extract secondary phone from notes if available
                if (!entry.phone2 && row.notes) {
                    const noteStr = String(row.notes);
                    const phone2Match = noteStr.match(/(?:رقم إضافي:|Phone 2:)\s*(01\d{8,9})/);
                    if (phone2Match && phone2Match[1]) {
                        entry.phone2 = phone2Match[1];
                    }
                }

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
                        governorate: undefined,
                        city: undefined,
                        type: 'registered',
                    });
                }
            }

            // 5. Sort by totalSpent desc, filter by search, paginate
            const { page = '1', limit = '50', search } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const offset = (pageNum - 1) * limitNum;

            let unified = Array.from(phoneMap.values());
            
            if (search && typeof search === 'string') {
                const searchLower = search.toLowerCase();
                unified = unified.filter(u => 
                    u.phone.includes(searchLower) || 
                    (u.phone2 && u.phone2.includes(searchLower)) ||
                    u.name.toLowerCase().includes(searchLower)
                );
            }

            unified = unified.sort((a, b) => b.totalSpent - a.totalSpent);
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

            // If it's a guest ID (guest_...)
            if (id.startsWith('guest_')) {
                const phone = id.replace('guest_', '');
                // 1. Check if user already exists (maybe they just registered?)
                const existing = await db.query.users.findFirst({ where: eq(users.phone, phone) });
                if (existing) {
                    const [updated] = await db.update(users).set({ status }).where(eq(users.id, existing.id)).returning();
                    return res.json(updated);
                }
                
                // 2. Create a "shadow user" to persist the status
                const [newUser] = await db.insert(users).values({
                    name: 'زائر',
                    email: `guest_${phone}@al3amer.store`, // Placeholder unique email
                    phone,
                    role: 'customer',
                    status,
                    password: '---', // Locked
                }).returning();
                return res.json(newUser);
            }

            const [updatedUser] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
            if (!updatedUser) return res.status(404).json({ error: 'User not found' });

            res.json(updatedUser);
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    }

    // DELETE /api/users/:id - Delete user OR guest and their associations
    static async deleteCustomer(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (id.startsWith('guest_')) {
                const phone = id.replace('guest_', '');
                // For a guest, "Delete" means deleting all their orders (associated by phone)
                await db.delete(orders).where(eq(orders.phone, phone));
                return res.json({ message: 'Guest orders deleted' });
            }

            const user = await db.query.users.findFirst({ where: eq(users.id, id) });
            if (!user) return res.status(404).json({ error: 'User not found' });

            // Delete user and their orders
            await db.delete(orders).where(eq(orders.userId, id));
            await db.delete(users).where(eq(users.id, id));

            res.json({ message: 'User and associated orders deleted' });
        } catch (error) {
            console.error('Error deleting customer:', error);
            res.status(500).json({ error: 'Failed to delete customer' });
        }
    }

    // PUT /api/users/:id - Admin update user details
    static async updateCustomer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, email, phone, address, governorate, city } = req.body;

            // Basic Validation
            if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });

            if (id.startsWith('guest_')) {
                const oldPhone = id.replace('guest_', '');
                const existing = await db.query.users.findFirst({ where: eq(users.phone, oldPhone) });
                
                if (existing) {
                    const updateData: any = { name, phone, address, updatedAt: new Date() };
                    if (email) updateData.email = email;

                    const [updated] = await db.update(users)
                        .set(updateData)
                        .where(eq(users.id, existing.id))
                        .returning();
                    return res.json(updated);
                }

                const [newUser] = await db.insert(users).values({
                    name,
                    email: email || `guest_${phone || oldPhone}@al3amer.store`,
                    phone: phone || oldPhone,
                    address: address || null,
                    role: 'customer',
                    status: 'active',
                    password: '---'
                }).returning();
                return res.json(newUser);
            }

            const updateData: any = { name, phone, address, updatedAt: new Date() };
            if (email) updateData.email = email;

            const [updatedUser] = await db.update(users)
                .set(updateData)
                .where(eq(users.id, id))
                .returning();
            
            if (!updatedUser) return res.status(404).json({ error: 'User not found' });
            res.json(updatedUser);
        } catch (error: any) {
            console.error('Update customer error:', error);
            if (error.code === '23505') { // Postgres unique_violation
                return res.status(400).json({ error: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل لعميل آخر' });
            }
            res.status(500).json({ error: 'حدث خطأ في النظام أثناء التحديث' });
        }
    }
}
