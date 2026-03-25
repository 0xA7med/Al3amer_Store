/**
 * patch-categories-schema-full.ts
 *
 * Comprehensive one-time script that sets a tailored attributesSchema
 * for EVERY category and sub-category in the database.
 *
 * Run: npx tsx src/scripts/patch-categories-schema-full.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

type AttrBlock = { name: string; type: 'single-select' | 'multi-select'; options: string[] };

// ─── Per-slug schema definitions ────────────────────────────────────────────
// Each slug maps to its own tailored list of filter blocks.
// Categories without meaningful filterable attributes are left empty ([]).

const SCHEMAS: Record<string, AttrBlock[]> = {

    // ══════════════════════════════════════════════════════════
    //  POS DEVICES
    // ══════════════════════════════════════════════════════════
    'pos-systems': [
        { name: 'نظام التشغيل', type: 'single-select', options: ['Windows', 'Android'] },
        { name: 'حجم الشاشة', type: 'single-select', options: ['11"', '15"', '17"', '21"'] },
        { name: 'ذاكرة RAM', type: 'single-select', options: ['2GB', '4GB', '8GB', '16GB'] },
        { name: 'طابعة مدمجة', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'قارئ باركود مدمج', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'LAN', 'Wi-Fi', 'Bluetooth', '4G'] },
    ],
    'windows-pos': [
        { name: 'المعالج', type: 'single-select', options: ['Intel Celeron J4125', 'Intel Core i3', 'Intel Core i5'] },
        { name: 'ذاكرة RAM', type: 'single-select', options: ['4GB', '8GB', '16GB'] },
        { name: 'التخزين', type: 'single-select', options: ['128GB SSD', '256GB SSD', '500GB HDD'] },
        { name: 'حجم الشاشة', type: 'single-select', options: ['15"', '17"', '21"'] },
        { name: 'شاشة لمسية', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'LAN', 'Wi-Fi', 'Bluetooth'] },
    ],
    'android-pos': [
        { name: 'إصدار أندرويد', type: 'single-select', options: ['Android 7.1', 'Android 10', 'Android 11', 'Android 13'] },
        { name: 'ذاكرة RAM', type: 'single-select', options: ['2GB', '4GB', '6GB'] },
        { name: 'التخزين', type: 'single-select', options: ['32GB', '64GB'] },
        { name: 'حجم الشاشة', type: 'single-select', options: ['5.5"', '7"', '10.1"', '15.6"'] },
        { name: 'طابعة مدمجة', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'قارئ باركود مدمج', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'Wi-Fi', 'Bluetooth', '4G/SIM'] },
    ],
    'handheld-pos': [
        { name: 'نظام التشغيل', type: 'single-select', options: ['Android', 'Windows'] },
        { name: 'حجم الشاشة', type: 'single-select', options: ['4"', '5.5"', '7"'] },
        { name: 'البطارية', type: 'single-select', options: ['3000mAh', '4000mAh', '5000mAh'] },
        { name: 'طابعة مدمجة', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'الاتصال', type: 'multi-select', options: ['Wi-Fi', 'Bluetooth', '4G/SIM'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  PRINTERS
    // ══════════════════════════════════════════════════════════
    'printers': [
        { name: 'عرض الورق', type: 'single-select', options: ['58mm', '80mm', '100mm'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'LAN', 'Bluetooth', 'Wi-Fi'] },
        { name: 'نوع الطباعة', type: 'single-select', options: ['حرارية مباشرة', 'حرارية عكسية (Ribbon)'] },
    ],
    'receipt-printers': [
        { name: 'عرض الورق', type: 'single-select', options: ['58mm', '80mm'] },
        { name: 'سرعة الطباعة', type: 'single-select', options: ['150mm/s', '200mm/s', '250mm/s', '300mm/s'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'LAN', 'Bluetooth', 'Wi-Fi'] },
        { name: 'قاطع تلقائي', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'التوافق', type: 'multi-select', options: ['Windows', 'Android', 'iOS'] },
    ],
    'barcode-printers': [
        { name: 'عرض الليبل', type: 'single-select', options: ['58mm', '80mm', '100mm'] },
        { name: 'الدقة', type: 'single-select', options: ['203dpi', '300dpi'] },
        { name: 'نوع الطباعة', type: 'single-select', options: ['Direct Thermal', 'Thermal Transfer'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'LAN', 'Bluetooth'] },
        { name: 'السرعة القصوى', type: 'single-select', options: ['100mm/s', '150mm/s', '200mm/s'] },
    ],
    'mobile-printers': [
        { name: 'عرض الورق', type: 'single-select', options: ['58mm', '80mm'] },
        { name: 'البطارية', type: 'single-select', options: ['مدمجة', 'خارجية'] },
        { name: 'الاتصال', type: 'multi-select', options: ['Bluetooth', 'Wi-Fi', 'USB'] },
        { name: 'التوافق', type: 'multi-select', options: ['Android', 'iOS', 'Windows'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  SCANNERS
    // ══════════════════════════════════════════════════════════
    'barcode-scanners': [
        { name: 'نوع الباركود', type: 'single-select', options: ['1D', '2D', '1D & 2D'] },
        { name: 'الاتصال', type: 'single-select', options: ['Wired (USB)', 'Wireless (2.4GHz)', 'Bluetooth'] },
        { name: 'حامل مرفق', type: 'single-select', options: ['نعم', 'لا'] },
    ],
    'wireless-scanners': [
        { name: 'نوع الباركود', type: 'single-select', options: ['1D', '2D', '1D & 2D'] },
        { name: 'التردد', type: 'single-select', options: ['2.4GHz', 'Bluetooth', 'كلاهما'] },
        { name: 'المدى', type: 'single-select', options: ['10m', '50m', '100m'] },
        { name: 'البطارية', type: 'single-select', options: ['8 ساعات', '16 ساعة', '24 ساعة'] },
    ],
    'desktop-scanners': [
        { name: 'نوع الباركود', type: 'single-select', options: ['1D', '2D', '1D & 2D'] },
        { name: 'وضع التشغيل', type: 'single-select', options: ['يدوي', 'تلقائي (Hands-Free)'] },
        { name: 'الاتصال', type: 'single-select', options: ['USB'] },
    ],
    '1d-scanners': [
        { name: 'نوع الباركود', type: 'single-select', options: ['1D', '2D', '1D & 2D'] },
        { name: 'الاتصال', type: 'single-select', options: ['USB', 'RS232'] },
        { name: 'تقنية القراءة', type: 'single-select', options: ['Laser', 'CCD', 'Imager'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  CASH DRAWERS
    // ══════════════════════════════════════════════════════════
    'cash-drawers': [
        { name: 'عدد أقسام العملات', type: 'single-select', options: ['4 أقسام', '5 أقسام'] },
        { name: 'عدد أقسام الفراطة', type: 'single-select', options: ['8 أقسام', '9 أقسام'] },
        { name: 'طريقة الفتح', type: 'single-select', options: ['RJ11 (طابعة)', 'USB', 'يدوي'] },
        { name: 'اللون', type: 'single-select', options: ['أسود', 'أبيض', 'رمادي'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  SCALES
    // ══════════════════════════════════════════════════════════
    'electronic-scales': [
        { name: 'الحمل الأقصى', type: 'single-select', options: ['5kg', '15kg', '30kg', '60kg', '150kg'] },
        { name: 'النوع', type: 'single-select', options: ['موازين عادية', 'موازين باركود', 'موازين كاشير'] },
        { name: 'شاشة العميل', type: 'single-select', options: ['نعم (مزدوجة)', 'لا'] },
    ],
    'barcode-scales': [
        { name: 'الحمل الأقصى', type: 'single-select', options: ['15kg', '30kg'] },
        { name: 'شاشة العميل', type: 'single-select', options: ['نعم (مزدوجة)', 'لا'] },
        { name: 'طابعة ليبل مدمجة', type: 'single-select', options: ['نعم', 'لا'] },
        { name: 'الاتصال', type: 'multi-select', options: ['USB', 'LAN', 'Wi-Fi'] },
    ],
    'standard-scales': [
        { name: 'الحمل الأقصى', type: 'single-select', options: ['5kg', '15kg', '30kg', '60kg', '150kg'] },
        { name: 'نوع الشاشة', type: 'single-select', options: ['LCD', 'LED'] },
        { name: 'مصدر الطاقة', type: 'multi-select', options: ['بطارية', 'كهرباء', 'كلاهما'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  CUSTOMER DISPLAYS
    // ══════════════════════════════════════════════════════════
    'customer-displays': [
        { name: 'حجم الشاشة', type: 'single-select', options: ['7"', '10"', '15"'] },
        { name: 'نوع الشاشة', type: 'single-select', options: ['LCD', 'LED'] },
        { name: 'الاتصال', type: 'single-select', options: ['USB', 'Serial (RS232)', 'HDMI'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  POS SUPPLIES
    // ══════════════════════════════════════════════════════════
    'pos-supplies': [
        { name: 'النوع', type: 'single-select', options: ['ورق حراري', 'ليبل باركود', 'ريبون حبر'] },
    ],
    'thermal-paper': [
        { name: 'العرض', type: 'single-select', options: ['57mm', '80mm'] },
        { name: 'الطول', type: 'single-select', options: ['30m', '50m', '80m'] },
        { name: 'كمية العبوة', type: 'single-select', options: ['1 بكرة', '5 بكرات', '10 بكرات', '50 بكرة'] },
    ],
    'barcode-labels': [
        { name: 'العرض', type: 'single-select', options: ['40mm', '58mm', '80mm', '100mm'] },
        { name: 'حجم الكور الداخلي', type: 'single-select', options: ['25mm', '40mm'] },
        { name: 'كمية العبوة', type: 'single-select', options: ['1 رول', '5 رولات', '10 رولات'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  POS SOFTWARE
    // ══════════════════════════════════════════════════════════
    'pos-software': [
        { name: 'نظام التشغيل', type: 'single-select', options: ['Windows', 'Android', 'متعدد الأنظمة'] },
        { name: 'نوع الترخيص', type: 'single-select', options: ['شهري', 'سنوي', 'دائم (One-Time)'] },
        { name: 'عدد المستخدمين', type: 'single-select', options: ['1 جهاز', '3 أجهزة', '5 أجهزة', 'غير محدود'] },
    ],
    'windows-software': [
        { name: 'نوع الترخيص', type: 'single-select', options: ['شهري', 'سنوي', 'دائم'] },
        { name: 'عدد المستخدمين', type: 'single-select', options: ['1 مستخدم', '3 مستخدمين', '5 مستخدمين', 'غير محدود'] },
        { name: 'الدعم الفني', type: 'single-select', options: ['أونلاين', 'زيارة ميدانية', 'كلاهما'] },
    ],
    'android-software': [
        { name: 'نوع الترخيص', type: 'single-select', options: ['شهري', 'سنوي', 'دائم'] },
        { name: 'عدد المستخدمين', type: 'single-select', options: ['1 مستخدم', '3 مستخدمين', '5 مستخدمين', 'غير محدود'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  CABLES & ACCESSORIES
    // ══════════════════════════════════════════════════════════
    'cables': [
        { name: 'نوع الكابل', type: 'single-select', options: ['USB-A to USB-B', 'USB-A to USB-A', 'RJ11', 'RJ45', 'RS232 (Serial)', 'HDMI', 'DC Power'] },
        { name: 'الطول', type: 'single-select', options: ['0.5m', '1m', '1.8m', '3m', '5m'] },
    ],
    'battery': [
        { name: 'السعة', type: 'single-select', options: ['3000mAh', '4000mAh', '5000mAh'] },
        { name: 'الجهد', type: 'single-select', options: ['3.7V', '7.4V'] },
        { name: 'التوافق مع جهاز', type: 'single-select', options: ['Sunmi V2', 'Sunmi V2 Pro', 'Sunmi T2', 'عام'] },
    ],
    'accessories-others': [
        { name: 'نوع الاكسسوار', type: 'single-select', options: ['حامل', 'غطاء حماية', 'وحدة تركيب', 'أخرى'] },
        { name: 'يتوافق مع', type: 'multi-select', options: ['أجهزة كاشير', 'طابعات', 'ماسحات باركود', 'موازين'] },
    ],

    // ══════════════════════════════════════════════════════════
    //  OTHER / NO SCHEMA
    // ══════════════════════════════════════════════════════════
    'other': [],
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function patchAll() {
    console.log('🚀 Full category schema patch starting...\n');

    const allCats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories);
    const catMap = new Map(allCats.map(c => [c.slug, c]));

    let updated = 0;
    let skipped = 0;

    for (const [slug, schema] of Object.entries(SCHEMAS)) {
        const cat = catMap.get(slug);
        if (!cat) {
            console.log(`  ⚠️  Not found in DB: "${slug}" — skipping`);
            skipped++;
            continue;
        }

        await db
            .update(categories)
            .set({ attributesSchema: schema.length > 0 ? schema as any : null })
            .where(eq(categories.id, cat.id));

        const blockCount = schema.length;
        console.log(`  ✅ "${cat.name}" → ${blockCount > 0 ? `${blockCount} filter blocks` : 'no schema (cleared)'}`);
        updated++;
    }

    console.log(`\n✨ Done! Updated: ${updated} categories, Not found: ${skipped}`);
    await migrationClient.end();
}

patchAll().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
