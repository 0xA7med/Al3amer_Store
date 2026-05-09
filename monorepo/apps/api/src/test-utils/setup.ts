import { vi, beforeAll } from 'vitest';

// Set test env before any imports
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'ab3ce19d499c8ab359071c52937b161d6406f3e07410e23d23f817e50f013a42';

// Mock DB module globally
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      products: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      orders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      categories: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      brands: {
        findFirst: vi.fn(),
      },
      settings: {
        findFirst: vi.fn(),
      },
      coupons: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([{
          id: 'inserted-id',
          name: 'Test',
          email: 'test@example.com',
          phone: '0100',
          password: '$2a$10$hashed',
          role: 'customer',
          status: 'active',
          loyaltyPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      })),
    })),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
      where: vi.fn().mockResolvedValue(undefined),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
    }),
    transaction: vi.fn().mockImplementation(async (cb: any) => {
      const tx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      return cb(tx);
    }),
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));
