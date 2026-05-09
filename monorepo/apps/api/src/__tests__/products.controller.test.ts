import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsController } from '../controllers/products.controller.js';
import { db } from '../db/index.js';
import { mockReq, mockRes, buildProduct } from '../test-utils/mocks.js';
import { getMergedSettings } from '../lib/settings-helper.js';

vi.mock('../lib/settings-helper.js', () => ({
  getMergedSettings: vi.fn(),
}));

describe('ProductsController', () => {
  let res: ReturnType<typeof mockRes>;

  beforeEach(() => {
    res = mockRes();
    vi.clearAllMocks();
  });

  // ═══════════════ SLUGIFY (Pure Logic) ═══════════════
  describe('slugify', () => {
    it('[TDD-GREEN] should convert Arabic text to slug', () => {
      expect(ProductsController.slugify('كاشير Z900')).toBe('كاشير-z900');
    });

    it('[TDD-GREEN] should handle multiple spaces', () => {
      expect(ProductsController.slugify('  hello   world  ')).toBe('hello-world');
    });

    it('[TDD-GREEN] should trim leading/trailing hyphens', () => {
      expect(ProductsController.slugify('--hello--')).toBe('hello');
    });

    it('[TDD-GREEN] should remove special characters', () => {
      expect(ProductsController.slugify('hello!@#world$%^')).toBe('helloworld');
    });
  });

  // ═══════════════ LIST ═══════════════
  describe('list', () => {
    it('[TDD-GREEN] should return paginated products', async () => {
      const products = [buildProduct(), buildProduct({ id: '2', name: 'طابعة' })];
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce(products);
      const req = mockReq({ query: { page: '1', limit: '10' } });

      await ProductsController.list(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({ page: 1, limit: 10 }),
        })
      );
    });

    it('[TDD-RED] should filter by search query', async () => {
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([]);
      const req = mockReq({ query: { search: 'كاشير', page: '1', limit: '10' } });

      await ProductsController.list(req, res);

      expect(db.query.products.findMany).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ═══════════════ GET ONE ═══════════════
  describe('getOne', () => {
    it('[TDD-GREEN] should get product by UUID', async () => {
      const product = buildProduct({
        reviews: [],
        orderItems: [],
        category: null,
        brand: null,
        images: [],
      });
      vi.mocked(db.query.products.findFirst).mockResolvedValueOnce(product);
      vi.mocked(getMergedSettings).mockResolvedValueOnce({ supportPhone: '201234567890' });
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([]);
      const req = mockReq({ params: { id: '223e4567-e89b-12d3-a456-426614174001' } });

      await ProductsController.getOne(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: product.id,
          name: 'كاشير Z900',
        })
      );
    });

    it('[TDD-GREEN] should get product by slug', async () => {
      const product = buildProduct({
        reviews: [],
        orderItems: [],
        category: null,
        brand: null,
        images: [],
      });
      vi.mocked(db.query.products.findFirst).mockResolvedValueOnce(product);
      vi.mocked(getMergedSettings).mockResolvedValueOnce({ supportPhone: '201234567890' });
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([]);
      const req = mockReq({ params: { id: 'kashier-z900' } });

      await ProductsController.getOne(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'كاشير Z900' })
      );
    });

    it('[TDD-RED] should return 404 when product not found', async () => {
      vi.mocked(db.query.products.findFirst).mockResolvedValueOnce(undefined);
      const req = mockReq({ params: { id: '223e4567-e89b-12d3-a456-426614174999' } });

      await ProductsController.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
  });

  // ═══════════════ VALIDATE CART ═══════════════
  describe('validateCart', () => {
    it('[TDD-RED] should return 400 when no items provided', async () => {
      const req = mockReq({ body: {} });

      await ProductsController.validateCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'items must be a non-empty array' });
    });

    it('[TDD-GREEN] should return valid and invalid product IDs', async () => {
      const validProduct = buildProduct({ stock: 10, images: [{ url: 'img.jpg', isPrimary: true }] });
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([validProduct]);
      const req = mockReq({ body: { items: [{ id: validProduct.id }, { id: 'missing-id' }] } });

      await ProductsController.validateCart(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          validProducts: expect.arrayContaining([
            expect.objectContaining({ id: validProduct.id }),
          ]),
          invalidIds: expect.arrayContaining(['missing-id']),
        })
      );
    });

    it('[TDD-RED] should mark inactive products as invalid', async () => {
      const draftProduct = buildProduct({ status: 'draft', images: [] });
      vi.mocked(db.query.products.findMany).mockResolvedValueOnce([draftProduct]);
      const req = mockReq({ body: { items: [{ id: draftProduct.id }] } });

      await ProductsController.validateCart(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          validProducts: [],
          invalidIds: [draftProduct.id],
        })
      );
    });
  });

  // ═══════════════ CREATE ═══════════════
  describe('create', () => {
    it('[TDD-GREEN] should create product with auto-generated slug', async () => {
      const newProduct = buildProduct();
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([newProduct]),
        }),
      });
      vi.mocked(db.query.products.findFirst).mockResolvedValueOnce({
        ...newProduct,
        category: null,
        brand: null,
        images: [],
      });
      const req = mockReq({ body: { name: 'كاشير Z900', price: '5000', slug: 'kashier-z900' } });

      await ProductsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'كاشير Z900' })
      );
    });

    it('[TDD-GREEN] should auto-resolve brand name to brand ID', async () => {
      const newProduct = buildProduct({ brandId: 'brand-uuid-1' });
      vi.mocked(db.query.brands.findFirst).mockResolvedValueOnce({ id: 'brand-uuid-1', name: 'إيبسون' });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([newProduct]),
        }),
      });
      vi.mocked(db.query.products.findFirst).mockResolvedValueOnce({
        ...newProduct, category: null, brand: { id: 'brand-uuid-1', name: 'إيبسون' }, images: [],
      });
      const req = mockReq({ body: { name: 'طابعة', price: '3000', brand: 'إيبسون' } });

      await ProductsController.create(req, res);

      expect(db.query.brands.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.anything() })
      );
    });
  });

  // ═══════════════ BULK ACTION (Stock/Price) ═══════════════
  describe('bulkAction', () => {
    it('[TDD-RED] should return 400 when no IDs provided', async () => {
      const req = mockReq({ body: { action: 'delete' } });

      await ProductsController.bulkAction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No product IDs provided' });
    });

    it('[TDD-GREEN] should delete products in bulk', async () => {
      vi.mocked(db.delete).mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce(undefined),
      });
      const req = mockReq({ body: { ids: ['id-1', 'id-2'], action: 'delete' } });

      await ProductsController.bulkAction(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, affected: 2 })
      );
    });

    it('[TDD-GREEN] should bulk update prices by percentage', async () => {
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });
      const req = mockReq({ body: { ids: ['id-1'], action: 'price', payload: { priceMode: 'add_percent', priceValue: 10 } } });

      await ProductsController.bulkAction(req, res);

      expect(db.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
