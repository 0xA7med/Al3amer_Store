import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, or, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

export class AuthController {
    // POST /api/auth/register - Register new user
    static async register(req: Request, res: Response) {
        try {
            const { name, email, phone, password, address } = req.body;

            const normalizedEmail = normalizeEmail(email);

            // Check if user already exists
            let existingUser;
            if (phone) {
                existingUser = await db.query.users.findFirst({
                    where: or(ilike(users.email, normalizedEmail), eq(users.phone, phone)),
                });
            } else {
                existingUser = await db.query.users.findFirst({
                    where: ilike(users.email, normalizedEmail),
                });
            }

            if (existingUser) {
                if (existingUser.email === normalizedEmail) {
                    return res.status(409).json({ error: 'Email already registered' });
                }
                return res.status(409).json({ error: 'Phone number already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const [newUser] = await db.insert(users).values({
                name,
                email: normalizedEmail,
                phone,
                password: hashedPassword,
                address,
                role: 'customer',
                loyaltyPoints: 0,
            }).returning();

            // Generate JWT
            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email, role: newUser.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Remove password from response
            const { password: _, ...userWithoutPassword } = newUser;

            res.status(201).json({
                user: userWithoutPassword,
                token,
            });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }

    // POST /api/auth/login - Login user
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const normalizedEmail = normalizeEmail(email);

            // Find user
            const user = await db.query.users.findFirst({
                where: ilike(users.email, normalizedEmail),
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ error: 'Account is blocked or inactive' });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                user: userWithoutPassword,
                token,
            });
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    }

    // GET /api/auth/me - Get current user
    static async me(req: Request, res: Response) {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        res.json(user);
    }

    // POST /api/auth/social - Sync Firebase user with backend
    static async socialLogin(req: Request, res: Response) {
        try {
            const { email, phone, name, uid, providerId } = req.body;
            console.log('Social Login Attempt:', { email, phone, name, providerId, uid });

            const normalizedEmail = email ? normalizeEmail(email) : undefined;

            // 1. Try to find existing user by Email OR Phone
            let user = undefined;

            if (normalizedEmail) {
                user = await db.query.users.findFirst({ 
                    where: ilike(users.email, normalizedEmail) 
                });
            }

            if (!user && phone) {
                user = await db.query.users.findFirst({ where: eq(users.phone, phone) });
            }

            // 2. If User Exists -> Login
            if (user) {
                if (user.status !== 'active') {
                    return res.status(403).json({ error: 'Account is blocked or inactive' });
                }
                console.log('User found, logging in:', user.id);
                const token = jwt.sign(
                    { userId: user.id, email: user.email, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                const { password: _, ...userWithoutPassword } = user;
                return res.json({ user: userWithoutPassword, token });
            }

            // 3. If New User -> Register
            console.log('User not found, registering new user...');

            const finalEmail = normalizedEmail || `${uid}@social.login`;

            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const [newUser] = await db.insert(users).values({
                name: name || 'New User',
                email: finalEmail,
                phone: phone || null,
                password: hashedPassword,
                role: 'customer',
                loyaltyPoints: 0,
            }).returning();

            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email, role: newUser.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            const { password: _, ...userWithoutPassword } = newUser;
            return res.status(201).json({ user: userWithoutPassword, token });

        } catch (error: any) {
            console.error('Error in social login:', error);
            res.status(500).json({ 
                error: 'Failed to process social login',
                message: error instanceof Error ? error.message : 'Unknown error',
                detail: error?.detail || error?.message
            });
        }
    }
}
