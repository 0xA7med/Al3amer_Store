import multer from 'multer';
import * as XLSX from 'xlsx';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream'
        ];
        if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});
// Column mapping from Arabic Excel headers to DB fields
const COLUMN_MAP = {
    'Pro_ID': 'externalId',
    'اسم المنتج': 'name',
    'الكمية': 'stock',
    'سعر البيع': 'price',
    'اخر سعر شراء': 'cost',
};
export class InventorySyncController {
    /**
     * POST /api/products/import/preview
     * Parse Excel and compare with database, return diff report
     */
    static async preview(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            // Parse Excel file from buffer
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet);
            if (!rawData || rawData.length === 0) {
                return res.status(400).json({ error: 'Excel file is empty or has no data' });
            }
            // Map Excel columns to DB fields
            const excelRows = rawData.map((row) => {
                const mapped = {};
                for (const [excelHeader, dbField] of Object.entries(COLUMN_MAP)) {
                    const value = row[excelHeader];
                    if (dbField === 'stock' || dbField === 'price' || dbField === 'cost') {
                        mapped[dbField] = parseFloat(value) || 0;
                    }
                    else {
                        mapped[dbField] = value?.toString()?.trim() || '';
                    }
                }
                return mapped;
            }).filter(row => row.externalId); // Filter out rows without Pro_ID
            if (excelRows.length === 0) {
                return res.status(400).json({
                    error: 'No valid data found. Please ensure the Excel file has a "Pro_ID" column.'
                });
            }
            // Get all external IDs from Excel
            const externalIds = excelRows.map(r => r.externalId);
            // Fetch existing products from DB by externalId
            const existingProducts = await db.query.products.findMany({
                where: inArray(products.externalId, externalIds),
                columns: {
                    id: true,
                    externalId: true,
                    name: true,
                    price: true,
                    stock: true,
                    cost: true,
                }
            });
            // Create a map for quick lookup
            const productMap = new Map(existingProducts.map(p => [p.externalId, p]));
            // Compare and generate diff
            const diffItems = [];
            let newCount = 0;
            let updateCount = 0;
            let matchCount = 0;
            for (const excelRow of excelRows) {
                const existing = productMap.get(excelRow.externalId);
                if (!existing) {
                    // New product
                    diffItems.push({
                        externalId: excelRow.externalId,
                        name: excelRow.name,
                        status: 'new',
                        newData: {
                            name: excelRow.name,
                            price: excelRow.price,
                            stock: excelRow.stock,
                            cost: excelRow.cost,
                        }
                    });
                    newCount++;
                }
                else {
                    // Existing product - check for changes
                    const changes = {};
                    const existingPrice = parseFloat(existing.price?.toString() || '0');
                    const existingStock = existing.stock || 0;
                    const existingCost = parseFloat(existing.cost?.toString() || '0');
                    if (Math.abs(existingPrice - excelRow.price) > 0.01) {
                        changes.price = { old: existingPrice, new: excelRow.price };
                    }
                    if (existingStock !== excelRow.stock) {
                        changes.stock = { old: existingStock, new: excelRow.stock };
                    }
                    if (Math.abs(existingCost - excelRow.cost) > 0.01) {
                        changes.cost = { old: existingCost, new: excelRow.cost };
                    }
                    if (Object.keys(changes).length > 0) {
                        // Has updates
                        diffItems.push({
                            externalId: excelRow.externalId,
                            name: existing.name,
                            status: 'update',
                            existingProductId: existing.id,
                            changes,
                        });
                        updateCount++;
                    }
                    else {
                        // No changes
                        matchCount++;
                    }
                }
            }
            // Return only items requiring action (new or update), sorted by status
            const actionableItems = diffItems
                .filter(item => item.status !== 'match')
                .sort((a, b) => {
                if (a.status === 'new' && b.status === 'update')
                    return -1;
                if (a.status === 'update' && b.status === 'new')
                    return 1;
                return 0;
            });
            return res.json({
                items: actionableItems,
                summary: {
                    total: excelRows.length,
                    new: newCount,
                    updates: updateCount,
                    unchanged: matchCount,
                }
            });
        }
        catch (error) {
            console.error('Preview import error:', error);
            return res.status(500).json({
                error: 'Failed to parse Excel file',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/products/import/execute
     * Execute approved changes from preview
     */
    static async execute(req, res) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'No items to process' });
            }
            const results = {
                updated: 0,
                created: 0,
                errors: [],
            };
            // Use transaction for atomicity
            await db.transaction(async (tx) => {
                for (const item of items) {
                    try {
                        if (item.status === 'update' && item.existingProductId && item.changes) {
                            // Update existing product
                            const updateData = {
                                updatedAt: new Date(),
                            };
                            if (item.changes.price) {
                                updateData.price = item.changes.price.new.toString();
                            }
                            if (item.changes.stock !== undefined) {
                                updateData.stock = item.changes.stock.new;
                            }
                            if (item.changes.cost) {
                                updateData.cost = item.changes.cost.new.toString();
                            }
                            await tx.update(products)
                                .set(updateData)
                                .where(eq(products.id, item.existingProductId));
                            results.updated++;
                        }
                        else if (item.status === 'new' && item.newData) {
                            // Insert new product with draft status
                            const slug = item.newData.name
                                .toLowerCase()
                                .trim()
                                .replace(/\s+/g, '-')
                                .replace(/[^\w\u0621-\u064A-]+/g, '')
                                .replace(/--+/g, '-')
                                + '-' + Date.now().toString(36);
                            await tx.insert(products).values({
                                externalId: item.externalId,
                                name: item.newData.name,
                                price: item.newData.price.toString(),
                                stock: item.newData.stock,
                                cost: item.newData.cost.toString(),
                                slug: slug,
                                status: 'draft', // New products are drafts so admin can add images
                            });
                            results.created++;
                        }
                    }
                    catch (itemError) {
                        const errorMsg = `Error processing ${item.externalId}: ${itemError instanceof Error ? itemError.message : 'Unknown'}`;
                        results.errors.push(errorMsg);
                        console.error(errorMsg);
                    }
                }
            });
            return res.json({
                success: true,
                message: `تم تحديث ${results.updated} منتج وإضافة ${results.created} منتج جديد`,
                results,
            });
        }
        catch (error) {
            console.error('Execute import error:', error);
            return res.status(500).json({
                error: 'Failed to execute import',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
//# sourceMappingURL=inventory-sync.controller.js.map