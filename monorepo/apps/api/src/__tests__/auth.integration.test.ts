import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { db } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { buildUser } from '../test-utils/mocks.js';

// Mock DB
vi.mock('../db/index.js', () => {
    return {
        db: {
            query: {
                users: {
                    findFirst: vi.fn()
                }
            },
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn()
                })
            })
        }
    };
});

describe('Auth Integration Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully complete the full auth flow: register -> login -> access protected route', async () => {
        const password = 'mySuperSecretPassword';
        const hashedPassword = await bcrypt.hash(password, 10);
        const mockUser = buildUser({
            id: 'uuid-1234',
            name: 'Integration Test User',
            email: 'integration@test.com',
            phone: '01012345678',
            password: hashedPassword,
            status: 'active',
            role: 'customer'
        });

        // 1. REGISTER
        // Mock no existing user
        vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
        // Mock insert returning new user
        const valuesMock = vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([mockUser])
        });
        vi.mocked(db.insert).mockReturnValueOnce({ values: valuesMock } as any);

        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Integration Test User',
                email: 'integration@test.com',
                phone: '01012345678',
                password: password,
            });

        expect(registerRes.status).toBe(201);
        expect(registerRes.body).toHaveProperty('token');
        expect(registerRes.body.user).toHaveProperty('email', 'integration@test.com');
        expect(registerRes.body.user).not.toHaveProperty('password');

        // 2. LOGIN
        // Mock find existing user
        vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(mockUser);

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'integration@test.com',
                password: password,
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty('token');
        const token = loginRes.body.token;

        // Verify token is valid JWT
        const decoded = jwt.decode(token);
        expect(decoded).toMatchObject({ userId: 'uuid-1234', email: 'integration@test.com' });

        // 3. ACCESS PROTECTED ROUTE (/auth/me)
        // Mock find existing user again for the verifyToken middleware
        vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(mockUser);

        const meRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(meRes.status).toBe(200);
        expect(meRes.body).toHaveProperty('email', 'integration@test.com');
        expect(meRes.body).not.toHaveProperty('password');

        // 4. INVALID TOKEN (Logout simulation - using invalid token)
        const invalidRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer invalid.token.string`);

        expect(invalidRes.status).toBe(401);
    });

    it('should reject registration if phone already exists', async () => {
        // Mock that user with this phone already exists
        const existingUser = buildUser({ phone: '01099999999', email: 'other@test.com' });
        vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(existingUser);

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test',
                email: 'new@test.com',
                phone: '01099999999',
                password: 'password123',
            });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error', 'Phone number already registered');
    });
});
