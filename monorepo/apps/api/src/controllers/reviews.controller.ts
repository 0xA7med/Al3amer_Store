import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { reviews, products, users, productImages } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class ReviewsController {
    // GET /api/reviews - List all reviews (Admin gets all, includes pending)
    static async list(req: Request, res: Response) {
        try {
            const { status, productId } = req.query;

            let reviewsList = await db.query.reviews.findMany({
                with: {
                    product: {
                        with: {
                            images: {
                                where: eq(productImages.isPrimary, true),
                                limit: 1,
                            },
                        },
                    },
                    user: true,
                },
                orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
            });

            // Filter by status if provided
            if (status) {
                reviewsList = reviewsList.filter(r => r.status === status);
            }

            // Filter by product if provided
            if (productId) {
                reviewsList = reviewsList.filter(r => r.productId === productId);
            }

            // Format response
            const formattedReviews = reviewsList.map(review => ({
                id: review.id,
                rating: review.rating,
                text: review.text,
                status: review.status,
                isApproved: review.isApproved,
                date: review.createdAt,
                product: {
                    id: review.product?.id,
                    name: review.product?.name || 'منتج محذوف',
                    sku: review.product?.sku || 'N/A',
                    image: review.product?.images?.[0]?.url || 'https://placehold.co/100',
                },
                customer: {
                    id: review.user?.id,
                    name: review.user?.name || review.customerName || 'زائر',
                    type: review.user ? 'عميل مسجل' : 'زائر',
                    avatar: `https://i.pravatar.cc/150?u=${review.userId || review.id}`,
                },
            }));

            res.json(formattedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    }

    // GET /api/reviews/:id - Get single review
    static async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const review = await db.query.reviews.findFirst({
                where: eq(reviews.id, id),
                with: {
                    product: true,
                    user: true,
                },
            });

            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            res.json(review);
        } catch (error) {
            console.error('Error fetching review:', error);
            res.status(500).json({ error: 'Failed to fetch review' });
        }
    }

    // POST /api/reviews - Create review (Customer)
    static async create(req: Request, res: Response) {
        try {
            const {
                productId,
                userId,
                customerName,
                rating,
                text,
            } = req.body;

            if (!productId || !rating) {
                return res.status(400).json({ error: 'Product ID and rating are required' });
            }

            const [newReview] = await db.insert(reviews).values({
                productId,
                userId: userId || null,
                customerName: customerName || null,
                rating,
                text,
                status: 'pending',
                isApproved: false,
            }).returning();

            res.status(201).json(newReview);
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({ error: 'Failed to create review' });
        }
    }

    // PATCH /api/reviews/:id/approve - Toggle approval status (Admin)
    static async approve(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'approved' | 'rejected'

            if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
                return res.status(400).json({ error: 'Valid status is required (approved/rejected/pending)' });
            }

            await db.update(reviews)
                .set({
                    status,
                    isApproved: status === 'approved',
                    updatedAt: new Date(),
                })
                .where(eq(reviews.id, id));

            const updatedReview = await db.query.reviews.findFirst({
                where: eq(reviews.id, id),
            });

            res.json(updatedReview);
        } catch (error) {
            console.error('Error updating review status:', error);
            res.status(500).json({ error: 'Failed to update review status' });
        }
    }

    // DELETE /api/reviews/:id - Delete review (Admin)
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await db.delete(reviews).where(eq(reviews.id, id));

            res.json({ message: 'Review deleted successfully' });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({ error: 'Failed to delete review' });
        }
    }
}
