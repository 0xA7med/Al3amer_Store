import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { addresses } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class AddressesController {
    // GET /api/addresses - Get all addresses for logged-in user
    static async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userAddresses = await db.query.addresses.findMany({
                where: eq(addresses.userId, userId),
                orderBy: (addresses, { desc }) => [desc(addresses.isDefault), desc(addresses.createdAt)],
            });

            res.json(userAddresses);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).json({ error: 'Failed to fetch addresses' });
        }
    }

    // POST /api/addresses - Create new address
    static async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { title, fullName, phone, phone2, governorate, address, isDefault } = req.body;

            if (!title || !fullName || !phone || !governorate || !address) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // If this is set as default, unset all other defaults
            if (isDefault) {
                await db.update(addresses)
                    .set({ isDefault: false })
                    .where(eq(addresses.userId, userId));
            }

            const [newAddress] = await db.insert(addresses).values({
                userId,
                title,
                fullName,
                phone,
                governorate,
                address,
                phone2,
                isDefault: isDefault || false,
            }).returning();

            res.status(201).json(newAddress);
        } catch (error) {
            console.error('Error creating address:', error);
            res.status(500).json({ error: 'Failed to create address' });
        }
    }

    // PUT /api/addresses/:id - Update address
    static async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { title, fullName, phone, phone2, governorate, address, isDefault } = req.body;

            // Check if address belongs to user
            const existingAddress = await db.query.addresses.findFirst({
                where: and(
                    eq(addresses.id, id),
                    eq(addresses.userId, userId)
                ),
            });

            if (!existingAddress) {
                return res.status(404).json({ error: 'Address not found' });
            }

            // If this is set as default, unset all other defaults
            if (isDefault) {
                await db.update(addresses)
                    .set({ isDefault: false })
                    .where(eq(addresses.userId, userId));
            }

            const [updatedAddress] = await db.update(addresses)
                .set({
                    title,
                    fullName,
                    phone,
                    governorate,
                    address,
                    phone2,
                    isDefault,
                    updatedAt: new Date(),
                })
                .where(eq(addresses.id, id))
                .returning();

            res.json(updatedAddress);
        } catch (error) {
            console.error('Error updating address:', error);
            res.status(500).json({ error: 'Failed to update address' });
        }
    }

    // DELETE /api/addresses/:id - Delete address
    static async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Check if address belongs to user
            const existingAddress = await db.query.addresses.findFirst({
                where: and(
                    eq(addresses.id, id),
                    eq(addresses.userId, userId)
                ),
            });

            if (!existingAddress) {
                return res.status(404).json({ error: 'Address not found' });
            }

            await db.delete(addresses).where(eq(addresses.id, id));

            res.json({ message: 'Address deleted successfully' });
        } catch (error) {
            console.error('Error deleting address:', error);
            res.status(500).json({ error: 'Failed to delete address' });
        }
    }

    // PATCH /api/addresses/:id/default - Set address as default
    static async setDefault(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Check if address belongs to user
            const existingAddress = await db.query.addresses.findFirst({
                where: and(
                    eq(addresses.id, id),
                    eq(addresses.userId, userId)
                ),
            });

            if (!existingAddress) {
                return res.status(404).json({ error: 'Address not found' });
            }

            // Unset all defaults
            await db.update(addresses)
                .set({ isDefault: false })
                .where(eq(addresses.userId, userId));

            // Set this as default
            const [updatedAddress] = await db.update(addresses)
                .set({ isDefault: true, updatedAt: new Date() })
                .where(eq(addresses.id, id))
                .returning();

            res.json(updatedAddress);
        } catch (error) {
            console.error('Error setting default address:', error);
            res.status(500).json({ error: 'Failed to set default address' });
        }
    }
}
