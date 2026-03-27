import multer from 'multer';
import * as XLSX from 'xlsx';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
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
/**
 * Convert Arabic numerals (٠١٢٣...) to English numerals (0123...)
 */
function convertArabicToEnglishNumbers(str) {
    if (!str)
        return str;
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = str.toString();
    for (let i = 0; i < arabicNumbers.length; i++) {
        result = result.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
    }
    return result;
}
export class InventorySyncController {
    /**
     * Get or create "Uncategorized" category for imported products
     */
    static async getDefaultCategory(tx) {
        // Query using db instead of tx to avoid nested transaction issues
        const uncategorized = await db.query.categories.findFirst({
            where: eq(categories.slug, 'uncategorized')
        });
        if (uncategorized) {
            return uncategorized.id;
        }
        // Create if doesn't exist using db
        const [newCategory] = await db.insert(categories).values({
            name: 'غير مصنف',
            slug: 'uncategorized',
            isActive: true
        }).returning();
        return newCategory.id;
    }
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
                    if (dbField === 'stock') {
                        mapped[dbField] = parseInt(value) || 0;
                    }
                    else if (dbField === 'price' || dbField === 'cost') {
                        mapped[dbField] = parseFloat(value) || 0;
                    }
                    else if (dbField === 'externalId') {
                        // Convert Arabic numerals to English for external_id
                        mapped[dbField] = convertArabicToEnglishNumbers(value?.toString()?.trim() || '');
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
            console.log('🔍 [INVENTORY SYNC] Existing Products found:', existingProducts.length);
            // Log first 3 existing products for debugging
            if (existingProducts.length > 0) {
                console.log('🔍 [INVENTORY SYNC] Sample Existing Data:', JSON.stringify(existingProducts.slice(0, 3), null, 2));
            }
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
                    // Ensure we handle null/undefined from DB as 0
                    const existingPrice = parseFloat(existing.price?.toString() || '0');
                    const existingStock = existing.stock || 0;
                    const existingCost = parseFloat(existing.cost?.toString() || '0');
                    if (existing.name !== excelRow.name) {
                        changes.name = { old: existing.name, new: excelRow.name };
                    }
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
                            currentData: {
                                price: existingPrice,
                                stock: existingStock,
                                cost: existingCost,
                            }
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
            try {
                await db.transaction(async (tx) => {
                    for (const item of items) {
                        try {
                            if (item.status === 'update' && item.existingProductId && item.changes) {
                                // Verify product exists before updating
                                const existing = await tx.query.products.findFirst({
                                    where: eq(products.id, item.existingProductId)
                                });
                                if (!existing) {
                                    throw new Error(`Product with ID ${item.existingProductId} (external_id: ${item.externalId}) not found in database`);
                                }
                                // Update existing product
                                const updateData = {
                                    updatedAt: new Date(),
                                };
                                if (item.changes.name !== undefined && item.changes.name !== null) {
                                    updateData.name = item.changes.name.new;
                                }
                                if (item.changes.price !== undefined && item.changes.price !== null) {
                                    updateData.price = item.changes.price.new.toString();
                                }
                                if (item.changes.stock !== undefined && item.changes.stock !== null) {
                                    updateData.stock = item.changes.stock.new;
                                }
                                if (item.changes.cost !== undefined && item.changes.cost !== null) {
                                    updateData.cost = item.changes.cost.new.toString();
                                }
                                await tx.update(products)
                                    .set(updateData)
                                    .where(eq(products.id, item.existingProductId));
                                results.updated++;
                            }
                            else if (item.status === 'new' && item.newData) {
                                // Get default category for imported products
                                const defaultCategoryId = await InventorySyncController.getDefaultCategory(tx);
                                // Generate unique slug
                                const baseSlug = item.newData.name
                                    .toLowerCase()
                                    .trim()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^\w\u0621-\u064A-]+/g, '')
                                    .replace(/--+/g, '-');
                                const slug = `${baseSlug}-${Date.now().toString(36)}`;
                                // Insert new product with all required defaults
                                await tx.insert(products).values({
                                    externalId: item.externalId,
                                    name: item.newData.name,
                                    description: 'مستورد من ملف Excel', // Default description
                                    price: item.newData.price.toString(),
                                    stock: item.newData.stock || 0,
                                    cost: item.newData.cost?.toString() || '0',
                                    slug: slug,
                                    categoryId: defaultCategoryId,
                                    status: 'draft', // Products imported from Excel are hidden by default
                                    isFeatured: false,
                                });
                                results.created++;
                            }
                        }
                        catch (itemError) {
                            let errorMsg = `Error processing ${item.externalId} (${item.name}): `;
                            // Handle specific database errors
                            if (itemError.code === '23505') { // PostgreSQL unique violation
                                errorMsg += 'Duplicate product ID or slug';
                            }
                            else if (itemError.code === '23503') { // Foreign key violation
                                errorMsg += 'Invalid category or brand reference';
                            }
                            else {
                                errorMsg += itemError instanceof Error ? itemError.message : 'Unknown';
                            }
                            console.error('❌ [INVENTORY SYNC] Item Error:', {
                                externalId: item.externalId,
                                name: item.name,
                                status: item.status,
                                errorCode: itemError.code,
                                error: itemError instanceof Error ? itemError.stack : itemError
                            });
                            results.errors.push(errorMsg);
                        }
                    }
                });
            }
            catch (transactionError) {
                console.error('❌ [INVENTORY SYNC] Transaction failed:', transactionError);
                throw transactionError; // Re-throw to be caught by outer handler
            }
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