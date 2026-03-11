import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { categories } from '../db/schema.js';

interface CategoryInit {
    name: string;
    slug: string;
    icon: string;
    isFeatured?: boolean;
    children?: { name: string; slug: string; icon: string }[];
}

const categoriesData: CategoryInit[] = [
    {
        name: 'أجهزة كاشير (POS)',
        slug: 'pos-systems',
        icon: 'point_of_sale',
        isFeatured: true,
        children: [
            { name: 'أجهزة ويندوز', slug: 'windows-pos', icon: 'desktop_windows' },
            { name: 'أجهزة أندرويد', slug: 'android-pos', icon: 'smartphone' },
            { name: 'أجهزة محمولة (Handheld)', slug: 'handheld-pos', icon: 'aod' }
        ]
    },
    {
        name: 'طابعات',
        slug: 'printers',
        icon: 'print',
        isFeatured: true,
        children: [
            { name: 'طابعات فواتير', slug: 'receipt-printers', icon: 'receipt_long' },
            { name: 'طابعات باركود', slug: 'barcode-printers', icon: 'qr_code_2' },
            { name: 'طابعات محمولة', slug: 'mobile-printers', icon: 'print_connect' }
        ]
    },
    {
        name: 'قارئات باركود (Scanners)',
        slug: 'barcode-scanners',
        icon: 'qr_code_scanner',
        isFeatured: true,
        children: [
            { name: 'سكانر 1D', slug: '1d-scanners', icon: 'barcode' },
            { name: 'سكانر 2D', slug: '2d-scanners', icon: 'qr_code' },
            { name: 'سكانر لاسلكي', slug: 'wireless-scanners', icon: 'wifi' },
            { name: 'سكانر مكتبي ثابت', slug: 'desktop-scanners', icon: 'document_scanner' }
        ]
    },
    {
        name: 'أدراج نقدية',
        slug: 'cash-drawers',
        icon: 'payments',
        isFeatured: true,
    },
    {
        name: 'موازين إلكترونية',
        slug: 'electronic-scales',
        icon: 'scale',
        isFeatured: true,
        children: [
            { name: 'موازين باركود', slug: 'barcode-scales', icon: 'qr_code_2' },
            { name: 'موازين عادية', slug: 'standard-scales', icon: 'weight' }
        ]
    },
    {
        name: 'برامج محاسبة وكاشير',
        slug: 'pos-software',
        icon: 'terminal',
        isFeatured: false,
        children: [
            { name: 'أنظمة ويندوز', slug: 'windows-software', icon: 'window' },
            { name: 'أنظمة أندرويد', slug: 'android-software', icon: 'android' }
        ]
    },
    {
        name: 'مستلزمات كاشير',
        slug: 'pos-supplies',
        icon: 'inventory_2',
        isFeatured: false,
        children: [
            { name: 'بكر كاشير (ورق حراري)', slug: 'thermal-paper', icon: 'receipt' },
            { name: 'ورق باركود (ليبل)', slug: 'barcode-labels', icon: 'label' },
            { name: 'ريبون طابعات (Ribbon)', slug: 'printer-ribbons', icon: 'format_paint' }
        ]
    },
    {
        name: 'إكسسوارات وأخرى',
        slug: 'accessories-others',
        icon: 'cable',
        isFeatured: false,
        children: [
            { name: 'شاشات عملاء', slug: 'customer-displays', icon: 'monitor' },
            { name: 'كابلات وتوصيلات', slug: 'cables', icon: 'settings_input_hdmi' }
        ]
    }
];

async function run() {
    try {
        console.log('🚀 Starting Category Restoration...\n');

        let totalInserted = 0;

        for (const parent of categoriesData) {
            // Insert parent
            const [insertedParent] = await db.insert(categories).values({
                name: parent.name,
                slug: parent.slug,
                icon: parent.icon,
                isActive: true,
                isFeatured: parent.isFeatured ?? false,
                parentId: null
            }).returning({ id: categories.id, name: categories.name });

            console.log(`✅ Parent Created: ${insertedParent.name}`);
            totalInserted++;

            // Insert children if any
            if (parent.children && parent.children.length > 0) {
                const childrenData = parent.children.map(child => ({
                    name: child.name,
                    slug: child.slug,
                    icon: child.icon,
                    isActive: true,
                    isFeatured: false,
                    parentId: insertedParent.id
                }));

                await db.insert(categories).values(childrenData);
                console.log(`   └─ Created ${childrenData.length} sub-categories for ${insertedParent.name}`);
                totalInserted += childrenData.length;
            }
        }

        console.log(`\n🎉 Success! Inserted ${totalInserted} categories (Parents & Children).`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error restoring categories:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

run();
