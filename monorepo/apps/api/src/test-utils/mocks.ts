import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mock Express Request/Response ──
export function mockReq(overrides: Record<string, any> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as any;
}

export function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

export function mockNext(): any {
  return vi.fn();
}

// ── User Factory ──
export function buildUser(overrides: Record<string, any> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '01001234567',
    password: '$2a$10$hashedpassword',
    role: 'customer',
    status: 'active',
    address: 'شارع النيل',
    city: 'القاهرة',
    governorate: 'القاهرة',
    loyaltyPoints: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildAdmin(overrides: Record<string, any> = {}) {
  return buildUser({ role: 'admin', email: 'admin@example.com', ...overrides });
}

// ── Product Factory ──
export function buildProduct(overrides: Record<string, any> = {}) {
  return {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'كاشير Z900',
    price: '5000.00',
    discountPrice: null,
    stock: 50,
    status: 'active',
    slug: 'kashier-z900',
    sku: 'KSH-Z900',
    description: 'كاشير متكامل',
    categoryId: null,
    brandId: null,
    category: null,
    brand: null,
    images: [],
    reviews: [],
    orderItems: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Order Factory ──
export function buildOrder(overrides: Record<string, any> = {}) {
  return {
    id: '323e4567-e89b-12d3-a456-426614174002',
    orderNumber: 'ORD-123456',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    fullName: 'أحمد محمد',
    phone: '01001234567',
    email: 'ahmed@example.com',
    governorate: 'القاهرة',
    city: 'القاهرة',
    address: 'شارع النيل',
    status: 'pending',
    paymentMethod: 'cod',
    subtotal: '5000.00',
    shippingCost: '50.00',
    taxAmount: '700.00',
    total: '5750.00',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Generate valid JWT for testing ──
export function generateTestToken(userId = '123e4567-e89b-12d3-a456-426614174000', role = 'customer') {
  return jwt.sign({ userId, email: 'test@example.com', role }, process.env.JWT_SECRET || 'test-jwt-secret-key', { expiresIn: '7d' });
}
