import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export class AuthController {
    // POST /api/auth/register - Register new user
    static async register(req: Request, res: Response) {
        try {
            const { name, email, phone, password, address } = req.body;

            if (!name || !email || !phone || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if user already exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const [newUser] = await db.insert(users).values({
                name,
                email,
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

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Find user
            const user = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
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
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);

            const decoded = jwt.verify(token, JWT_SECRET) as any;

            const user = await db.query.users.findFirst({
                where: eq(users.id, decoded.userId),
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const { password: _, ...userWithoutPassword } = user;

            res.json(userWithoutPassword);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(401).json({ error: 'Invalid token' });
        }
    }
}
