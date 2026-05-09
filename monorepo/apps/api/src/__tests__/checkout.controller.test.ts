import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutController } from '../controllers/checkout.controller.js';
import { db } from '../db/index.js';
import { mockReq, mockRes } from '../test-utils/mocks.js';
import { PaymobService } from '../services/paymob.service.js';
import { getMergedSettings } from '../lib/settings-helper.js';

vi.mock('../services/paymob.service.js', () => ({
  PaymobService: {
    generatePaymentKey: vi.fn().mockResolvedValue({ token: 'payment-key-123', orderId: 'paymob-order-1' }),
    getTransactionStatus: vi.fn().mockResolvedValue(true),
    payWithWallet: vi.fn().mockResolvedValue('https://wallet.paymob.com/pay'),
  },
}));

vi.mock('../lib/crypto.utils.js', () => ({
  decryptText: vi.fn().mockReturnValue('decrypted-paymob-api-key'),
}));

vi.mock('../lib/settings-helper.js', () => ({
  getMergedSettings: vi.fn(),
}));

describe('CheckoutController', () => {
  let res: ReturnType<typeof mockRes>;

  beforeEach(() => {
    res = mockRes();
    vi.clearAllMocks();
  });

  // ═══════════════ INITIATE PAYMENT ═══════════════
  describe('initiatePayment', () => {
    const validBody = {
      orderId: '323e4567-e89b-12d3-a456-426614174002',
      amount: '5000.00',
      paymentMethod: 'paymob',
      fullName: 'أحمد محمد',
      phone: '01001234567',
      email: 'ahmed@example.com',
      city: 'القاهرة',
      governorate: 'القاهرة',
      address: 'شارع النيل',
    };

    it('[TDD-RED] should return 400 when required fields missing', async () => {
      const req = mockReq({ body: {} });

      await CheckoutController.initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Missing required fields') });
    });

    it('[TDD-GREEN] should initiate card payment and return payment URL', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobEnabled: true,
        paymobApiKey: 'encrypted-key',
        paymobIntegrationCard: 'integration-card-id',
        paymobIframeId: 'iframe-123',
        paymobIntegrationWallet: null,
      });
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      const req = mockReq({ body: validBody });

      await CheckoutController.initiatePayment(req, res);

      expect(PaymobService.generatePaymentKey).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentUrl: expect.stringContaining('accept.paymob.com'),
          paymobOrderId: expect.any(String),
        })
      );
    });

    it('[TDD-GREEN] should initiate wallet payment', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobEnabled: true,
        paymobApiKey: 'encrypted-key',
        paymobIntegrationCard: null,
        paymobIntegrationWallet: 'integration-wallet-id',
        paymobIframeId: null,
      });
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      const req = mockReq({ body: { ...validBody, paymentMethod: 'paymob_wallet' } });

      await CheckoutController.initiatePayment(req, res);

      expect(PaymobService.payWithWallet).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentUrl: expect.any(String),
          paymobOrderId: expect.any(String),
        })
      );
    });

    it('[TDD-RED] should return 500 when Paymob not enabled', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobEnabled: false,
        paymobApiKey: null,
      });
      const req = mockReq({ body: validBody });

      await CheckoutController.initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('غير مُفعّل') });
    });

    it('[TDD-RED] should return 400 when integration not configured', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobEnabled: true,
        paymobApiKey: 'encrypted-key',
        paymobIntegrationCard: null,
        paymobIframeId: null,
        paymobIntegrationWallet: null,
      });
      const req = mockReq({ body: validBody });

      await CheckoutController.initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('[TDD-RED] should return 500 when Paymob API call fails', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobEnabled: true,
        paymobApiKey: 'encrypted-key',
        paymobIntegrationCard: 'integration-card-id',
        paymobIframeId: 'iframe-123',
        paymobIntegrationWallet: null,
      });
      vi.mocked(PaymobService.generatePaymentKey).mockRejectedValueOnce(new Error('Paymob API error'));

      const req = mockReq({ body: validBody });

      await CheckoutController.initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });

  // ═══════════════ VERIFY PAYMENT ═══════════════
  describe('verifyPayment', () => {
    it('[TDD-RED] should return 400 when paymobOrderId missing', async () => {
      const req = mockReq({ body: {} });

      await CheckoutController.verifyPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'paymobOrderId is required' });
    });

    it('[TDD-GREEN] should return payment status when verified', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobApiKey: 'encrypted-key',
      });

      const req = mockReq({ body: { paymobOrderId: 'paymob-order-1' } });

      await CheckoutController.verifyPayment(req, res);

      expect(PaymobService.getTransactionStatus).toHaveBeenCalledWith('decrypted-paymob-api-key', 'paymob-order-1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ paid: true, paymobOrderId: 'paymob-order-1' })
      );
    });

    it('[TDD-RED] should return 500 when Paymob not configured', async () => {
      vi.mocked(getMergedSettings).mockResolvedValueOnce({
        paymobApiKey: null,
      });
      const req = mockReq({ body: { paymobOrderId: 'paymob-order-1' } });

      await CheckoutController.verifyPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paymob not configured' });
    });
  });
});
