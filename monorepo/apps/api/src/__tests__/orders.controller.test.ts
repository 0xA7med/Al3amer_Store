import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersController } from '../controllers/orders.controller.js';
import { db } from '../db/index.js';
import { mockReq, mockRes, buildProduct, buildOrder } from '../test-utils/mocks.js';

// Mock external services
vi.mock('../services/paymob.service.js', () => ({
  PaymobService: {
    authenticate: vi.fn().mockResolvedValue('mocked-token'),
    registerOrder: vi.fn().mockResolvedValue({ id: 'paymob-order-1' }),
    getPaymentKey: vi.fn().mockResolvedValue({ token: 'payment-key-123', orderId: 'paymob-order-1' }),
    generatePaymentKey: vi.fn().mockResolvedValue({ token: 'payment-key-123', orderId: 'paymob-order-1' }),
    getTransactionStatus: vi.fn().mockResolvedValue(true),
    getOrderIdByMerchantOrderId: vi.fn().mockResolvedValue('paymob-order-legacy'),
    payWithWallet: vi.fn().mockResolvedValue('https://wallet.paymob.com/pay'),
  },
}));

vi.mock('../services/notification.service.js', () => ({
  NotificationService: {
    sendNewOrderNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../lib/crypto.utils.js', () => ({
  decryptText: vi.fn().mockReturnValue('decrypted-api-key'),
}));

describe('OrdersController', () => {
  let res: ReturnType<typeof mockRes>;

  beforeEach(() => {
    res = mockRes();
    vi.clearAllMocks();
  });

  // ═══════════════ CREATE ORDER (Critical Path) ═══════════════
  describe('create', () => {
    const validCreateBody = {
      fullName: 'أحمد محمد',
      phone: '01001234567',
      governorate: 'القاهرة',
      city: 'القاهرة',
      address: 'شارع النيل',
      paymentMethod: 'cod',
      items: [{ productId: '223e4567-e89b-12d3-a456-426614174001', price: '5000', quantity: 1 }],
      shippingCost: 50,
      taxAmount: 700,
    };

    it('[TDD-RED] should return 400 when required fields missing', async () => {
      const req = mockReq({ body: {} });

      await OrdersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('الاسم') });
    });

    it('[TDD-RED] should return 400 when no items', async () => {
      const req = mockReq({ body: { fullName: 'أحمد', governorate: 'القاهرة', city: 'القاهرة', address: 'شارع', items: [] } });

      await OrdersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('منتج') });
    });

    it('[TDD-RED] should return 400 when product not found or inactive', async () => {
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([]);
      const req = mockReq({ body: validCreateBody });

      await OrdersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('غير متوفر') });
    });

    it('[TDD-RED] should return 400 when stock insufficient', async () => {
      const product = buildProduct({ stock: 0 });
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([product]);
      const req = mockReq({ body: validCreateBody });

      await OrdersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('غير متوفر') });
    });

    it('[TDD-GREEN] should deduct stock and create order successfully for COD', async () => {
      const product = buildProduct({ stock: 10 });
      const order = buildOrder({ status: 'pending' });

      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([product]);
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: product.id }]),
          }),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([order]),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce(undefined),
      });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce({ ...order, items: [], user: null, trader: null });

      const req = mockReq({ body: validCreateBody });

      await OrdersController.create(req, res);

      // Assert stock was deducted
      expect(db.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ orderNumber: expect.stringContaining('ORD-') })
      );
    });

    it('[TDD-GREEN] should NOT trigger notification for online payment', async () => {
      const product = buildProduct({ stock: 10 });
      const order = buildOrder({ status: 'pending', paymentMethod: 'paymob' });
      const { NotificationService } = await import('../services/notification.service.js');

      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([product]);
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: product.id }]),
          }),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([order]),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce(undefined),
      });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce({ ...order, items: [], user: null, trader: null });

      const req = mockReq({ body: { ...validCreateBody, paymentMethod: 'paymob' } });

      await OrdersController.create(req, res);

      expect(NotificationService.sendNewOrderNotification).not.toHaveBeenCalled();
    });

    it('[TDD-GREEN] should trigger notification for COD payment', async () => {
      const product = buildProduct({ stock: 10 });
      const order = buildOrder({ status: 'pending', paymentMethod: 'cod' });
      const { NotificationService } = await import('../services/notification.service.js');

      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([product]);
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: product.id }]),
          }),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([order]),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce(undefined),
      });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce({ ...order, items: [], user: null, trader: null });

      const req = mockReq({ body: validCreateBody });

      await OrdersController.create(req, res);

      expect(NotificationService.sendNewOrderNotification).toHaveBeenCalledOnce();
    });

    it('[TDD-RED] should not create order if server error occurs', async () => {
      vi.mocked(db.query.products.findMany).mockRejectedValueOnce(new Error('DB connection lost'));
      const req = mockReq({ body: validCreateBody });

      await OrdersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to create order' })
      );
    });
  });

  // ═══════════════ COUPON INTEGRATION ═══════════════
  describe('create with coupon', () => {
    const baseBody = {
      fullName: 'أحمد محمد',
      phone: '01001234567',
      governorate: 'القاهرة',
      city: 'القاهرة',
      address: 'شارع النيل',
      paymentMethod: 'cod',
      items: [{ productId: '223e4567-e89b-12d3-a456-426614174001', price: '5000', quantity: 1 }],
      shippingCost: 50,
      taxAmount: 700,
    };

    it('[TDD-GREEN] should apply percentage coupon correctly', async () => {
      const product = buildProduct({ stock: 10 });
      const coupon = {
        id: 'coupon-1',
        code: 'SAVE10',
        type: 'percentage',
        discount: '10',
        minOrder: '100',
        usageCount: 0,
        usageLimit: 100,
        startDate: new Date('2025-01-01'),
        expiryDate: new Date('2030-12-31'),
      };
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([product]);
      vi.mocked(db.query.coupons.findFirst).mockResolvedValueOnce(coupon as any);
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: product.id }]),
          }),
        }),
      });
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([buildOrder()]),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce(undefined),
      });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce({ ...buildOrder(), items: [], user: null, trader: null });

      const req = mockReq({ body: { ...baseBody, couponCode: 'SAVE10' } });

      await OrdersController.create(req, res);

      // 10% of 5000 = 500 discount, subtotal 5000 + shipping 50 + tax 700 - 500 = 5250
      expect(db.update).toHaveBeenCalledTimes(2); // stock + coupon usage
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('[TDD-RED] should reject expired coupon', async () => {
      const product = buildProduct({ stock: 10 });
      const expiredCoupon = {
        id: 'coupon-expired',
        code: 'EXPIRED',
        type: 'percentage',
        discount: '20',
        minOrder: null,
        usageCount: 0,
        usageLimit: 100,
        startDate: new Date('2020-01-01'),
        expiryDate: new Date('2020-12-31'),
      };
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([product]);
      vi.mocked(db.query.coupons.findFirst).mockResolvedValueOnce(expiredCoupon as any);
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: product.id }]),
          }),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([buildOrder()]),
        }),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce(undefined),
      });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce({ ...buildOrder(), total: '5750.00', items: [], user: null, trader: null });

      const req = mockReq({ body: { ...baseBody, couponCode: 'EXPIRED' } });

      await OrdersController.create(req, res);

      // Total should be without discount = 5000 + 50 + 700 = 5750
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ total: '5750.00' })
      );
    });
  });

  // ═══════════════ UPDATE STATUS ═══════════════
  describe('updateStatus', () => {
    it('[TDD-RED] should return 400 when no status provided', async () => {
      const req = mockReq({ params: { id: 'order-1' }, body: {} });

      await OrdersController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Status is required' });
    });

    it('[TDD-GREEN] should update order status', async () => {
      const order = buildOrder();
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce({ ...order, items: [] });
      const req = mockReq({ params: { id: order.id }, body: { status: 'processing' } });

      await OrdersController.updateStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: order.id })
      );
    });
  });

  // ═══════════════ GET ONE ═══════════════
  describe('getOne', () => {
    it('[TDD-GREEN] should return order by ID', async () => {
      const order = buildOrder({ items: [], user: null, trader: null });
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce(order);
      const req = mockReq({ params: { id: order.id } });

      await OrdersController.getOne(req, res);

      expect(res.json).toHaveBeenCalledWith(order);
    });

    it('[TDD-RED] should return 404 when order not found', async () => {
      vi.mocked(db.query.orders.findFirst).mockResolvedValueOnce(undefined);
      const req = mockReq({ params: { id: 'nonexistent' } });

      await OrdersController.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });
  });
});
