import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { coupons } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class CouponsController {
    // GET /api/coupons - List all coupons
    static async list(_req: Request, res: Response) {
        try {
            const couponsList = await db.query.coupons.findMany({
                orderBy: (coupons, { desc }) => [desc(coupons.createdAt)],
            });

            // Update status based on dates
            const now = new Date();
            const updatedCoupons = couponsList.map(coupon => {
                let status = coupon.status;
                if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
                    status = 'expired';
                } else if (coupon.startDate && new Date(coupon.startDate) > now) {
                    status = 'scheduled';
                } else if (coupon.usageCount && coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
                    status = 'expired';
                } else {
                    status = 'active';
                }
                return { ...coupon, status };
            });

            res.json(updatedCoupons);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({ error: 'Failed to fetch coupons' });
        }
    }

    // GET /api/coupons/:id - Get single coupon
    static async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, id),
            });

            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            res.json(coupon);
        } catch (error) {
            console.error('Error fetching coupon:', error);
            res.status(500).json({ error: 'Failed to fetch coupon' });
        }
    }

    // POST /api/coupons - Create coupon
    static async create(req: Request, res: Response) {
        try {
            const {
                code,
                discount,
                type,
                usageLimit,
                minOrder,
                startDate,
                expiryDate,
            } = req.body;

            if (!code || discount === undefined || discount === null || !type || !usageLimit || !expiryDate) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // For free_shipping type, discount can be 0
            if (type !== 'free_shipping' && !discount) {
                return res.status(400).json({ error: 'Discount is required for percentage and fixed types' });
            }

            const [newCoupon] = await db.insert(coupons).values({
                code: code.toUpperCase(),
                discount: discount.toString(),
                type,
                usageLimit,
                minOrder: minOrder?.toString(),
                startDate: startDate ? new Date(startDate) : null,
                expiryDate: new Date(expiryDate),
                status: 'active',
            }).returning();

            res.status(201).json(newCoupon);
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'Coupon code already exists' });
            }
            res.status(500).json({ error: 'Failed to create coupon' });
        }
    }

    // PUT /api/coupons/:id - Update coupon
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = { ...req.body, updatedAt: new Date() };

            // Convert dates if provided
            if (updateData.startDate) {
                updateData.startDate = new Date(updateData.startDate);
            }
            if (updateData.expiryDate) {
                updateData.expiryDate = new Date(updateData.expiryDate);
            }
            if (updateData.discount) {
                updateData.discount = updateData.discount.toString();
            }
            if (updateData.minOrder) {
                updateData.minOrder = updateData.minOrder.toString();
            }
            if (updateData.code) {
                updateData.code = updateData.code.toUpperCase();
            }

            await db.update(coupons)
                .set(updateData)
                .where(eq(coupons.id, id));

            const updatedCoupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, id),
            });

            res.json(updatedCoupon);
        } catch (error) {
            console.error('Error updating coupon:', error);
            res.status(500).json({ error: 'Failed to update coupon' });
        }
    }

    // DELETE /api/coupons/:id - Delete coupon
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await db.delete(coupons).where(eq(coupons.id, id));

            res.json({ message: 'Coupon deleted successfully' });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ error: 'Failed to delete coupon' });
        }
    }

    // POST /api/coupons/validate - Validate coupon code
    static async validate(req: Request, res: Response) {
        try {
            const { code, orderTotal } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'Coupon code is required' });
            }

            const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.code, code.toUpperCase()),
            });

            if (!coupon) {
                return res.status(404).json({ valid: false, error: 'رمز الكوبون غير صحيح' });
            }

            const now = new Date();

            // Check expiry
            if (new Date(coupon.expiryDate) < now) {
                return res.status(400).json({ valid: false, error: 'هذا الكوبون منتهي الصلاحية' });
            }

            // Check start date
            if (coupon.startDate && new Date(coupon.startDate) > now) {
                return res.status(400).json({ valid: false, error: 'هذا الكوبون غير مفعل بعد' });
            }

            // Check usage limit
            if (coupon.usageCount && coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
                return res.status(400).json({ valid: false, error: 'تم استنفاد عدد مرات استخدام هذا الكوبون' });
            }

            // Check minimum order
            if (coupon.minOrder && orderTotal && parseFloat(orderTotal) < parseFloat(coupon.minOrder)) {
                return res.status(400).json({
                    valid: false,
                    error: `الحد الأدنى للطلب ${coupon.minOrder} ج.م`
                });
            }

            res.json({
                valid: true,
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    discount: coupon.discount,
                    type: coupon.type,
                },
            });
        } catch (error) {
            console.error('Error validating coupon:', error);
            res.status(500).json({ error: 'Failed to validate coupon' });
        }
    }
}
