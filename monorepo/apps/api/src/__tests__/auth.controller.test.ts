import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../controllers/auth.controller.js';
import { db } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockReq, mockRes, buildUser } from '../test-utils/mocks.js';

describe('AuthController', () => {
  let res: ReturnType<typeof mockRes>;

  beforeEach(() => {
    res = mockRes();
    vi.clearAllMocks();
  });

  // ═══════════════ REGISTER ═══════════════
  describe('register', () => {
    it('[TDD-RED] should return 409 when user already exists', async () => {
      const existing = buildUser();
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(existing);
      const req = mockReq({ body: { name: 'أحمد', email: 'ahmed@example.com', phone: '0100', password: 'pass123' } });

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
    });

    it('[TDD-GREEN] should create user and return 201 with token', async () => {
      const newUser = buildUser({ password: '$2a$10$hashedpassword' });
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([newUser]),
        }),
      });
      const req = mockReq({ body: { name: 'أحمد', email: 'ahmed@example.com', phone: '0100', password: 'pass123' } });

      await AuthController.register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.not.objectContaining({ password: expect.anything() }),
          token: expect.any(String),
        })
      );
    });

    it('[TDD-GREEN] should normalize email during registration', async () => {
      const newUser = buildUser({ email: 'ahmed@example.com' });
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
      const valuesMock = vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([newUser]),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: valuesMock,
      });
      const req = mockReq({ body: { name: 'أحمد', email: '  AHMED@Example.COM  ', phone: '0100', password: 'pass123' } });

      await AuthController.register(req, res);

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ahmed@example.com' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('[TDD-RED] should handle internal server error', async () => {
      vi.mocked(db.query.users.findFirst).mockRejectedValueOnce(new Error('DB down'));
      const req = mockReq({ body: { name: 'أحمد', email: 'a@b.com', phone: '0100', password: 'pass' } });

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to register user' });
    });
  });

  // ═══════════════ LOGIN ═══════════════
  describe('login', () => {
    it('[TDD-RED] should return 401 when user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
      const req = mockReq({ body: { email: 'unknown@test.com', password: 'pass' } });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('[TDD-RED] should return 403 when user is blocked', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(buildUser({ status: 'blocked' }));
      const req = mockReq({ body: { email: 'blocked@test.com', password: 'pass' } });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account is blocked or inactive' });
    });

    it('[TDD-RED] should return 403 when user is inactive', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(buildUser({ status: 'inactive' }));
      const req = mockReq({ body: { email: 'inactive@test.com', password: 'pass' } });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account is blocked or inactive' });
    });

    it('[TDD-RED] should return 401 when password is wrong', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(buildUser());
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);
      const req = mockReq({ body: { email: 'ahmed@example.com', password: 'wrongpass' } });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('[TDD-GREEN] should login successfully and return user with token', async () => {
      const user = buildUser();
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(user);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);
      const req = mockReq({ body: { email: 'ahmed@example.com', password: 'correctpass' } });

      await AuthController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.not.objectContaining({ password: expect.anything() }),
          token: expect.any(String),
        })
      );
    });

    it('[TDD-GREEN] should normalize email during login', async () => {
      const user = buildUser();
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(user);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);
      const req = mockReq({ body: { email: '  AHMED@Example.COM  ', password: 'correctpass' } });

      await AuthController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: expect.any(String) })
      );
    });
  });

  // ═══════════════ ME ═══════════════
  describe('me', () => {
    it('[TDD-GREEN] should return user data from req.user', async () => {
      const user = buildUser();
      const req = mockReq({ user });

      await AuthController.me(req, res);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    it('[TDD-RED] should return 401 when req.user is not set', async () => {
      const req = mockReq({ user: undefined });

      await AuthController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });
  });

  // ═══════════════ SOCIAL LOGIN ═══════════════
  describe('socialLogin', () => {
    it('[TDD-GREEN] should login existing user by email', async () => {
      const user = buildUser();
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(user);
      const req = mockReq({ body: { uid: 'firebase-123', email: 'ahmed@example.com', providerId: 'google.com' } });

      await AuthController.socialLogin(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.not.objectContaining({ password: expect.anything() }),
          token: expect.any(String),
        })
      );
    });

    it('[TDD-RED] should return 403 when existing user is blocked', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(buildUser({ status: 'blocked' }));
      const req = mockReq({ body: { uid: 'firebase-123', email: 'blocked@test.com', providerId: 'google.com' } });

      await AuthController.socialLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account is blocked or inactive' });
    });

    it('[TDD-RED] should return 403 when existing user is inactive', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(buildUser({ status: 'inactive' }));
      const req = mockReq({ body: { uid: 'firebase-123', email: 'inactive@test.com', providerId: 'google.com' } });

      await AuthController.socialLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account is blocked or inactive' });
    });

    it('[TDD-GREEN] should register new user when not found', async () => {
      const newUser = buildUser({ id: 'new-id-123' });
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
      const req = mockReq({ body: { uid: 'firebase-123', name: 'أحمد', email: 'ahmed@test.com', phone: '0100', providerId: 'google.com' } });

      await AuthController.socialLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.not.objectContaining({ password: expect.anything() }),
          token: expect.any(String),
        })
      );
    });

    it('[TDD-RED] should handle social login server errors', async () => {
      vi.mocked(db.query.users.findFirst).mockRejectedValueOnce(new Error('DB error'));
      const req = mockReq({ body: { uid: 'firebase-123', email: 'test@test.com', providerId: 'google.com' } });

      await AuthController.socialLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
