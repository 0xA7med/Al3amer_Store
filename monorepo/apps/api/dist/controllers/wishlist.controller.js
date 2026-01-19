import { db } from '../db/index.js';
import { wishlist, products, productImages } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
export class WishlistController {
    // GET /api/wishlist - Get all wishlist items with product details
    static async list(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const wishlistItems = await db.query.wishlist.findMany({
                where: eq(wishlist.userId, userId),
                with: {
                    product: {
                        with: {
                            images: {
                                where: eq(productImages.isPrimary, true),
                                limit: 1,
                            },
                            category: true,
                            brand: true,
                        },
                    },
                },
                orderBy: (wishlist, { desc }) => [desc(wishlist.createdAt)],
            });
            res.json(wishlistItems);
        }
        catch (error) {
            console.error('Error fetching wishlist:', error);
            res.status(500).json({ error: 'Failed to fetch wishlist' });
        }
    }
    // POST /api/wishlist - Add product to wishlist
    static async add(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { productId } = req.body;
            if (!productId) {
                return res.status(400).json({ error: 'Product ID is required' });
            }
            // Check if product exists
            const product = await db.query.products.findFirst({
                where: eq(products.id, productId),
            });
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            // Check if already in wishlist
            const existing = await db.query.wishlist.findFirst({
                where: and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)),
            });
            if (existing) {
                return res.status(409).json({ error: 'Product already in wishlist' });
            }
            const [newWishlistItem] = await db.insert(wishlist).values({
                userId,
                productId,
            }).returning();
            res.status(201).json(newWishlistItem);
        }
        catch (error) {
            console.error('Error adding to wishlist:', error);
            res.status(500).json({ error: 'Failed to add to wishlist' });
        }
    }
    // DELETE /api/wishlist/:productId - Remove product from wishlist
    static async remove(req, res) {
        try {
            const userId = req.user?.id;
            const { productId } = req.params;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const existing = await db.query.wishlist.findFirst({
                where: and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)),
            });
            if (!existing) {
                return res.status(404).json({ error: 'Product not in wishlist' });
            }
            await db.delete(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
            res.json({ message: 'Product removed from wishlist' });
        }
        catch (error) {
            console.error('Error removing from wishlist:', error);
            res.status(500).json({ error: 'Failed to remove from wishlist' });
        }
    }
    // POST /api/wishlist/toggle - Toggle product in wishlist (add if not exists, remove if exists)
    static async toggle(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { productId } = req.body;
            if (!productId) {
                return res.status(400).json({ error: 'Product ID is required' });
            }
            // Check if already in wishlist
            const existing = await db.query.wishlist.findFirst({
                where: and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)),
            });
            if (existing) {
                // Remove from wishlist
                await db.delete(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
                return res.json({ message: 'Product removed from wishlist', inWishlist: false });
            }
            else {
                // Check if product exists
                const product = await db.query.products.findFirst({
                    where: eq(products.id, productId),
                });
                if (!product) {
                    return res.status(404).json({ error: 'Product not found' });
                }
                // Add to wishlist
                await db.insert(wishlist).values({
                    userId,
                    productId,
                });
                return res.json({ message: 'Product added to wishlist', inWishlist: true });
            }
        }
        catch (error) {
            console.error('Error toggling wishlist:', error);
            res.status(500).json({ error: 'Failed to toggle wishlist' });
        }
    }
    // GET /api/wishlist/check/:productId - Check if product is in wishlist
    static async check(req, res) {
        try {
            const userId = req.user?.id;
            const { productId } = req.params;
            if (!userId) {
                return res.json({ inWishlist: false });
            }
            const existing = await db.query.wishlist.findFirst({
                where: and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)),
            });
            res.json({ inWishlist: !!existing });
        }
        catch (error) {
            console.error('Error checking wishlist:', error);
            res.status(500).json({ error: 'Failed to check wishlist' });
        }
    }
}
//# sourceMappingURL=wishlist.controller.js.map