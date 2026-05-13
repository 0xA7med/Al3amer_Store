import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { aiBundleLogs, products, categories, productImages } from '../db/schema.js';
import { eq, and, lte, gte, inArray } from 'drizzle-orm';

// Feature to category mapping
const FEATURE_CATEGORIES: Record<string, string> = {
    scanner: 'barcode-scanners',
    printer: 'printers',
    scale: 'electronic-scales',
    drawer: 'cash-drawers',
    touch: 'pos-systems',
};

export class AIBundleController {
    static async generate(req: Request, res: Response) {
        try {
            const { businessType, budget, selectedFeatures, osPreference } = req.body;

            if (!businessType || !budget || !selectedFeatures) {
                return res.status(400).json({
                    error: 'Missing required fields: businessType, budget, selectedFeatures'
                });
            }

            const requiredCategorySlugs = new Set<string>();
            requiredCategorySlugs.add('pos-systems');
            requiredCategorySlugs.add('pos-software');

            if (Array.isArray(selectedFeatures)) {
                selectedFeatures.forEach((featureId: string) => {
                    const slug = FEATURE_CATEGORIES[featureId];
                    if (slug) requiredCategorySlugs.add(slug);
                });
            }

            // Determine if the business type implicitly needs Barcode printing
            const needsBarcodePrinter = ['supermarket', 'clothing', 'pharmacy'].includes(businessType);
            const needsReceiptPrinter = requiredCategorySlugs.has('printers');

            // Add consumables categories so we can query them
            const fetchCategories = new Set(requiredCategorySlugs);
            fetchCategories.add('thermal-paper');
            fetchCategories.add('barcode-labels');
            
            // If they need barcode printing, make sure we fetch printers category
            if (needsBarcodePrinter) fetchCategories.add('printers');

            console.log(`[AI Bundle] Generating... OS Pref: ${osPreference}, BarcodeReq: ${needsBarcodePrinter}`);

            const categoryRecords = await db.query.categories.findMany({
                where: inArray(categories.slug, Array.from(fetchCategories)),
            });

            const categoryIds = categoryRecords.map(c => c.id);
            const slugToId = Object.fromEntries(categoryRecords.map(c => [c.slug, c.id]));
            const idToSlug = Object.fromEntries(categoryRecords.map(c => [c.id, c.slug]));

            const budgetNum = parseInt(budget);
            const availableProducts = await db.query.products.findMany({
                where: and(
                    eq(products.status, 'active'),
                    inArray(products.categoryId, categoryIds)
                ),
                with: {
                    category: true,
                    images: {
                        where: eq(productImages.isPrimary, true),
                        limit: 1,
                    },
                    relationships: true,
                },
            });

            // Filter OS & Group by Category
            const productsByCat: Record<string, any[]> = {};
            
            availableProducts.forEach(p => {
                const slug = p.category?.slug;
                if (!slug) return;
                
                // OS preference filtering for POS Systems
                if (slug === 'pos-systems' && osPreference && osPreference !== 'any') {
                    const productOS = p.dynamicAttributes?.['نظام التشغيل'] as string;
                    if (productOS && productOS.toLowerCase() !== osPreference.toLowerCase()) {
                        return; // Skip incompatible OS
                    }
                }

                if (!productsByCat[slug]) productsByCat[slug] = [];
                productsByCat[slug].push(p);
            });

            const bundleProducts: any[] = [];
            let currentTotal = 0;
            const selectedPerCat: Record<string, any> = {};

            // ---------------------------------------------------------
            // 1. SELECT MAIN POS SYSTEM FIRST (For Smart Deductions)
            // ---------------------------------------------------------
            if (productsByCat['pos-systems'] && productsByCat['pos-systems'].length > 0) {
                const sortedPOS = productsByCat['pos-systems'].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                selectedPerCat['pos-systems'] = sortedPOS[0];
                currentTotal += parseFloat(sortedPOS[0].price);
            }

            const selectedPOS = selectedPerCat['pos-systems'];
            
            // Safe JSONB include check
            const checkAttr = (item: any, key: string, val: string) => {
                const attr = item?.dynamicAttributes?.[key];
                if (Array.isArray(attr)) return attr.includes(val);
                if (typeof attr === 'string') return attr.includes(val);
                return false;
            };

            const hasBuiltInPrinter = checkAttr(selectedPOS, 'طابعة مدمجة', 'نعم');
            const hasBuiltInScanner = checkAttr(selectedPOS, 'قارئ باركود مدمج', 'نعم');

            // ---------------------------------------------------------
            // 2. SMART PRINTER LOGIC (Receipt vs Barcode vs 2-in-1)
            // ---------------------------------------------------------
            let selectedPrinterCapabilities = { receipt: false, barcode: false };
            
            if (productsByCat['printers'] && productsByCat['printers'].length > 0) {
                const allPrinters = productsByCat['printers'].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                
                const receiptPrinters = allPrinters.filter(p => checkAttr(p, 'نوع الطباعة', 'فواتير'));
                const barcodePrinters = allPrinters.filter(p => checkAttr(p, 'نوع الطباعة', 'باركود'));

                // Adjusted needs based on integrated hardware deduction
                const finalNeedsReceipt = needsReceiptPrinter && !hasBuiltInPrinter;
                const finalNeedsBarcode = needsBarcodePrinter; // Usually POS built-ins don't print barcode labels
                
                // --- Printer Selection & Smart Linkage ---
                const twoInOnePrinters = allPrinters.filter(p => checkAttr(p, 'نوع الطباعة', 'فواتير') && checkAttr(p, 'نوع الطباعة', 'باركود'));
                const cheapestReceipt = receiptPrinters.find(p => !twoInOnePrinters.includes(p));
                const cheapestBarcode = barcodePrinters.find(p => !twoInOnePrinters.includes(p));
                
                const linkedAccessories = selectedPOS.relationships?.filter((r: any) => r.type === 'accessory') || [];
                const linkedPrinter = allPrinters.find(p => linkedAccessories.some((r: any) => r.relatedProductId === p.id));
                
                const cheapest2In1 = linkedPrinter && checkAttr(linkedPrinter, 'نوع الطباعة', 'فواتير') && checkAttr(linkedPrinter, 'نوع الطباعة', 'باركود')
                    ? linkedPrinter
                    : twoInOnePrinters[0];
                // ----------------------------------------

                if (finalNeedsReceipt && finalNeedsBarcode) {
                    const priceSeparate = (cheapestReceipt ? parseFloat(cheapestReceipt.price) : Infinity) + 
                                          (cheapestBarcode ? parseFloat(cheapestBarcode.price) : Infinity);
                    const price2In1 = cheapest2In1 ? parseFloat(cheapest2In1.price) : Infinity;

                    if (price2In1 <= priceSeparate && price2In1 !== Infinity) {
                        selectedPerCat['printers_2in1'] = cheapest2In1;
                        currentTotal += parseFloat(cheapest2In1.price);
                        selectedPrinterCapabilities.receipt = true;
                        selectedPrinterCapabilities.barcode = true;
                    } else if (cheapestReceipt && cheapestBarcode) {
                        selectedPerCat['printers_receipt'] = cheapestReceipt;
                        selectedPerCat['printers_barcode'] = cheapestBarcode;
                        currentTotal += priceSeparate;
                        selectedPrinterCapabilities.receipt = true;
                        selectedPrinterCapabilities.barcode = true;
                    } else if (cheapestReceipt) {
                        selectedPerCat['printers_receipt'] = cheapestReceipt;
                        currentTotal += parseFloat(cheapestReceipt.price);
                        selectedPrinterCapabilities.receipt = true;
                    }
                } else if (finalNeedsReceipt) {
                    const cheapestReceipt = receiptPrinters[0];
                    if (cheapestReceipt) {
                        selectedPerCat['printers_receipt'] = cheapestReceipt;
                        currentTotal += parseFloat(cheapestReceipt.price);
                        selectedPrinterCapabilities.receipt = true;
                        if (checkAttr(cheapestReceipt, 'نوع الطباعة', 'باركود')) {
                            selectedPrinterCapabilities.barcode = true;
                        }
                    }
                } else if (finalNeedsBarcode) {
                    const cheapestBarcode = barcodePrinters[0];
                    if (cheapestBarcode) {
                        selectedPerCat['printers_barcode'] = cheapestBarcode;
                        currentTotal += parseFloat(cheapestBarcode.price);
                        selectedPrinterCapabilities.barcode = true;
                    }
                }
            }

            // Remove handled categories
            requiredCategorySlugs.delete('printers');
            requiredCategorySlugs.delete('pos-systems');

            // ---------------------------------------------------------
            // 3. FILL OTHER CATEGORIES (Scanners, Drawers)
            // ---------------------------------------------------------
            for (const slug of Array.from(requiredCategorySlugs)) {
                const catProducts = productsByCat[slug] || [];
                if (catProducts.length === 0) continue;

                const sorted = catProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                
                if (slug === 'barcode-scanners' && hasBuiltInScanner) {
                    continue; // Smart deduction: skip buying a scanner
                }

                selectedPerCat[slug] = sorted[0];
                currentTotal += parseFloat(sorted[0].price);
            }

            // ---------------------------------------------------------
            // 3. UPGRADES (if budget allows)
            // ---------------------------------------------------------
            let remainingBudget = budgetNum - currentTotal;
            const upgradePriority = ['pos-systems', 'printers_receipt', 'barcode-scanners'];

            if (remainingBudget > 0) {
                for (const key of upgradePriority) {
                    const currentItem = selectedPerCat[key];
                    if (!currentItem) continue;
                    
                    const slug = currentItem.category.slug;
                    const catProducts = productsByCat[slug] || [];
                    
                    const currentItemPrice = parseFloat(currentItem.price);
                    // Find highest priced item we can afford
                    const possibleUpgrades = catProducts
                        .filter(p => parseFloat(p.price) > currentItemPrice && (parseFloat(p.price) - currentItemPrice) <= remainingBudget)
                        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); 

                    if (possibleUpgrades.length > 0) {
                        // Keep capabilities valid
                        const upgrade = possibleUpgrades[0];
                        if (key === 'printers_receipt') {
                            const newTypes = upgrade.dynamicAttributes?.['نوع الطباعة'] as string[] || [];
                            if (!newTypes.includes('فواتير')) continue;
                        }
                        
                        const priceDiff = parseFloat(upgrade.price) - currentItemPrice;
                        selectedPerCat[key] = upgrade;
                        currentTotal += priceDiff;
                        remainingBudget -= priceDiff;
                    }
                }
            }

            // ---------------------------------------------------------
            // 4. ADD CONSUMABLES (Smart Injection)
            // ---------------------------------------------------------
            if (remainingBudget > 0) {
                if (selectedPrinterCapabilities.receipt && productsByCat['thermal-paper']?.length > 0) {
                    const paper = productsByCat['thermal-paper'][0];
                    if (parseFloat(paper.price) <= remainingBudget) {
                        selectedPerCat['consumables_paper'] = paper;
                        currentTotal += parseFloat(paper.price);
                        remainingBudget -= parseFloat(paper.price);
                    }
                }
                
                if (selectedPrinterCapabilities.barcode && productsByCat['barcode-labels']?.length > 0) {
                    const label = productsByCat['barcode-labels'][0];
                    if (parseFloat(label.price) <= remainingBudget) {
                        selectedPerCat['consumables_label'] = label;
                        currentTotal += parseFloat(label.price);
                        remainingBudget -= parseFloat(label.price);
                    }
                }
            }

            // Finalize bundleProducts array
            for (const key in selectedPerCat) {
                const selected = selectedPerCat[key];
                bundleProducts.push({
                    productId: selected.id,
                    name: selected.name,
                    desc: selected.description ? selected.description.substring(0, 100) : '',
                    price: parseFloat(selected.price),
                    imageUrl: selected.images[0]?.url || '',
                    category: selected.category.slug
                });
            }

            const totalPrice = currentTotal;
            const exceedsBudget = totalPrice > budgetNum;
            const originalCatCount = fetchCategories.size - 2; // don't count consumables against score strictly
            const matchScore = Math.min(100, Math.round((bundleProducts.length / (originalCatCount || 1)) * 100));

            const result = {
                name: exceedsBudget ? 'حزمة مخصصة (تحتاج ميزانية أعلى)' : `حزمة كاشير ${businessType} الاحترافية`,
                description: exceedsBudget
                    ? 'تم اختيار أفضل المكونات المطلوبة، ولكن التكلفة تتجاوز الميزانية قليلاً لضمان الجودة.'
                    : 'حزمة كاملة تلبي جميع متطلباتك وضمن ميزانيتك المقترحة.',
                originalPrice: Math.round(totalPrice * 1.15),
                price: Math.round(totalPrice),
                savings: Math.round(totalPrice * 0.15),
                savingsPercentage: 15,
                matchScore: matchScore > 100 ? 100 : matchScore,
                products: bundleProducts,
                exceedsBudget
            };

            res.json(result);
        } catch (error) {
            console.error('Error generating bundle:', error);
            res.status(500).json({ error: 'Failed to generate bundle' });
        }
    }

    static async log(req: Request, res: Response) {
        try {
            const { userId, businessType, budget, selectedFeatures, resultBundle, matchScore } = req.body;
            const [log] = await db.insert(aiBundleLogs).values({
                userId: userId || null,
                businessType,
                budget: parseInt(budget),
                selectedFeatures,
                resultBundle,
                matchScore,
            }).returning();

            res.status(201).json(log);
        } catch (error) {
            console.error('Error saving bundle log:', error);
            res.status(500).json({ error: 'Failed to save bundle log' });
        }
    }
}
