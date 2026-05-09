import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from '../lib/auth.js';
import { db } from '../db/index.js';
import jwt from 'jsonwebtoken';
import { mockReq, mockRes, mockNext, buildUser, generateTestToken } from '../test-utils/mocks.js';

describe('verifyToken middleware', () => {
  let res: ReturnType<typeof mockRes>;
  let next: ReturnType<typeof mockNext>;

  beforeEach(() => {
    res = mockRes();
    next = mockNext();
    vi.clearAllMocks();
  });

  it('[TDD-RED] should return 401 when no auth header', async () => {
    const req = mockReq({ headers: {} });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('[TDD-RED] should return 401 when auth header is not Bearer', async () => {
    const req = mockReq({ headers: { authorization: 'Basic token123' } });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('[TDD-RED] should return 401 when token is malformed', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer this-is-not-a-valid-jwt' } });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('[TDD-RED] should return 401 when user not found in DB', async () => {
    const token = generateTestToken('nonexistent-id');
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('[TDD-GREEN] should attach user to req and call next on valid token', async () => {
    const user = buildUser();
    const token = generateTestToken(user.id);
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(user);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });

    await verifyToken(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user).not.toHaveProperty('password');
    expect(req.user.id).toBe(user.id);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('[TDD-RED] should return 403 when user is blocked', async () => {
    const user = buildUser({ status: 'blocked' });
    const token = generateTestToken(user.id);
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(user);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Account is blocked or inactive' });
    expect(next).not.toHaveBeenCalled();
  });

  it('[TDD-RED] should return 403 when user is inactive', async () => {
    const user = buildUser({ status: 'inactive' });
    const token = generateTestToken(user.id);
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(user);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Account is blocked or inactive' });
    expect(next).not.toHaveBeenCalled();
  });

  it('[TDD-RED] should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-id', email: 'test@test.com', role: 'customer' },
      process.env.JWT_SECRET || 'test-jwt-secret-key',
      { expiresIn: '0s' }
    );
    // Wait 1ms for expiry
    await new Promise(r => setTimeout(r, 10));
    const req = mockReq({ headers: { authorization: `Bearer ${expiredToken}` } });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
