import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { users, categories, brands, products, productImages, settings } from '../db/schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Create Admin User
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin', 10);

        const [admin] = await db.insert(users).values({
            name: 'Admin',
            email: 'admin@al3amer.com',
            phone: '01000000000',
            password: hashedPassword,
            role: 'admin',
            address: 'القاهرة، مدينة نصر',
            loyaltyPoints: 0,
        }).returning();

        console.log('✅ Admin user created:', admin.email);

        // 2. Create Categories
        console.log('Creating categories...');
        const categoriesData = [
            { name: 'أجهزة نقاط البيع', slug: 'pos-systems' },
            { name: 'طابعات الباركود', slug: 'printers' },
            { name: 'ماسحات الباركود', slug: 'scanners' },
            { name: 'أدراج النقدية', slug: 'drawers' },
            { name: 'الموازين الإلكترونية', slug: 'scales' },
        ];

        const createdCategories = await db.insert(categories).values(categoriesData).returning();
        console.log('✅ Categories created:', createdCategories.length);

        // 3. Create Brands
        console.log('Creating brands...');
        const brandsData = [
            { name: 'Sunmi', logo: null },
            { name: 'Epson', logo: null },
            { name: 'Zebra', logo: null },
            { name: 'Honeywell', logo: null },
        ];

        const createdBrands = await db.insert(brands).values(brandsData).returning();
        console.log('✅ Brands created:', createdBrands.length);

        // Get category and brand IDs for product creation
        const posCategory = createdCategories.find(c => c.slug === 'pos-systems')!;
        const scannerCategory = createdCategories.find(c => c.slug === 'scanners')!;
        const printerCategory = createdCategories.find(c => c.slug === 'printers')!;
        const scaleCategory = createdCategories.find(c => c.slug === 'scales')!;

        const sunmiBrand = createdBrands.find(b => b.name === 'Sunmi')!;
        const epsonBrand = createdBrands.find(b => b.name === 'Epson')!;
        const zebraBrand = createdBrands.find(b => b.name === 'Zebra')!;

        // 4. Create Sample Products
        console.log('Creating products...');
        const productsData = [
            {
                name: 'Sunmi V2 Pro جهاز كاشير ذكي',
                description: 'جهاز كاشير ذكي بنظام أندرويد، شاشة 5.5 بوصة، طابعة حرارية مدمجة، قارئ باركود 1D/2D مدمج. مثالي للمحلات الصغيرة والمتوسطة.',
                price: '5500',
                discountPrice: null,
                cost: '4800',
                sku: 'SUNMI-V2-PRO',
                stock: 15,
                barcode: '6923912345001',
                categoryId: posCategory.id,
                brandId: sunmiBrand.id,
                status: 'active',
                isFeatured: true,
                specifications: [
                    { key: 'نظام التشغيل', value: 'Android 7.1' },
                    { key: 'الشاشة', value: '5.5" HD' },
                    { key: 'الطابعة', value: '58mm حرارية' },
                    { key: 'البطارية', value: '3500mAh' },
                ],
                tags: ['جديد', 'الأكثر مبيعاً', 'محمول'],
                videoUrl: null,
                metaTitle: 'Sunmi V2 Pro - جهاز كاشير ذكي محمول',
                metaDescription: 'جهاز كاشير Sunmi V2 Pro بنظام أندرويد وطابعة مدمجة',
            },
            {
                name: 'قارئ باركود Zebra DS2208 ليزر 2D',
                description: 'قارئ باركود احترافي يقرأ من الشاشات والورق، سرعة قراءة عالية، متين وموثوق. يدعم جميع أنواع الباركود 1D و 2D.',
                price: '2200',
                discountPrice: '1950',
                cost: '1750',
                sku: 'ZEBRA-DS2208',
                stock: 25,
                barcode: '6923912345002',
                categoryId: scannerCategory.id,
                brandId: zebraBrand.id,
                status: 'active',
                isFeatured: true,
                specifications: [
                    { key: 'النوع', value: '2D Imager' },
                    { key: 'الاتصال', value: 'USB' },
                    { key: 'المدى', value: 'حتى 50 سم' },
                    { key: 'الضمان', value: 'سنتان' },
                ],
                tags: ['عرض خاص', '2D', 'احترافي'],
                videoUrl: null,
                metaTitle: 'Zebra DS2208 - قارئ باركود 2D احترافي',
                metaDescription: 'قارئ باركود Zebra DS2208 يقرأ من الشاشات والورق بسرعة عالية',
            },
            {
                name: 'طابعة فواتير Epson TM-T20III حرارية 80مم',
                description: 'طابعة فواتير سريعة وموثوقة، قص آلي، سرعة طباعة 250مم/ثانية. اتصال USB وشبكة Ethernet. مثالية للمحلات والمطاعم.',
                price: '4800',
                discountPrice: null,
                cost: '4200',
                sku: 'EPSON-TM-T20III',
                stock: 12,
                barcode: '6923912345003',
                categoryId: printerCategory.id,
                brandId: epsonBrand.id,
                status: 'active',
                isFeatured: false,
                specifications: [
                    { key: 'عرض الورق', value: '80mm' },
                    { key: 'السرعة', value: '250mm/sec' },
                    { key: 'القص', value: 'قص آلي' },
                    { key: 'الاتصال', value: 'USB + Ethernet' },
                ],
                tags: ['طابعة', 'سريعة'],
                videoUrl: null,
                metaTitle: 'Epson TM-T20III - طابعة فواتير حرارية',
                metaDescription: 'طابعة فواتير Epson TM-T20III حرارية بقص آلي وسرعة عالية',
            },
            {
                name: 'ميزان باركود إلكتروني 30 كجم طباعة ملصقات',
                description: 'ميزان باركود إلكتروني بطابعة ملصقات مدمجة، دقة عالية، شاشة LCD كبيرة، مثالي للسوبر ماركت وتجارة الخضار.',
                price: '8500',
                discountPrice: '7900',
                cost: '6800',
                sku: 'SCALE-BC-30KG',
                stock: 8,
                barcode: '6923912345004',
                categoryId: scaleCategory.id,
                brandId: null,
                status: 'active',
                isFeatured: true,
                specifications: [
                    { key: 'السعة', value: '30 كجم' },
                    { key: 'الدقة', value: '5 جرام' },
                    { key: 'الطباعة', value: 'ملصقات باركود حرارية' },
                    { key: 'الشاشة', value: 'LCD مزدوجة' },
                ],
                tags: ['ميزان', 'باركود', 'طباعة'],
                videoUrl: null,
                metaTitle: 'ميزان باركود 30 كجم مع طابعة ملصقات',
                metaDescription: 'ميزان باركود إلكتروني بطابعة ملصقات مدمجة للسوبر ماركت',
            },
            {
                name: 'شاشة لمس POS 15 بوصة Capacitive للكاشير',
                description: 'شاشة لمس احترافية 15 بوصة، تقنية Capacitive سريعة الاستجابة، مقاومة للسوائل، تصميم نحيف، HDMI + VGA.',
                price: '9800',
                discountPrice: null,
                cost: '8500',
                sku: 'TOUCH-15-CAP',
                stock: 10,
                barcode: '6923912345005',
                categoryId: posCategory.id,
                brandId: null,
                status: 'active',
                isFeatured: false,
                specifications: [
                    { key: 'الحجم', value: '15 بوصة' },
                    { key: 'التقنية', value: 'Capacitive Touch' },
                    { key: 'الدقة', value: '1024x768' },
                    { key: 'الاتصال', value: 'HDMI + VGA + USB' },
                ],
                tags: ['شاشة', 'لمس', 'احترافي'],
                videoUrl: null,
                metaTitle: 'شاشة لمس POS 15 بوصة Capacitive',
                metaDescription: 'شاشة لمس احترافية للكاشير 15 بوصة بتقنية Capacitive',
            },
        ];

        const createdProducts = await db.insert(products).values(productsData).returning();
        console.log('✅ Products created:', createdProducts.length);

        // 5. Add Product Images
        console.log('Adding product images...');
        const imagesData = [
            // Sunmi V2 Pro
            {
                productId: createdProducts[0].id,
                url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsk0P7H4thcEFU3j2-Z5bZbAV_rFQwPg5XMjBGCzXbXam3gzru2Sz_b_Cszro7q_gUGVYu2JtBua8bN4EpeGzq-3a4gEg34xJftGdxqGk14gzwM8QxIoIjDDpgpojUNf4FIrqQAjJnot855f68YgGKFcGRdwiyl-UQO5Jk32BkdWHeIgyQv0fxclBzKXJ11bymOJUwzi7kkcxLoKYjVnXJ0MsvNTF0q3X2w6nfZ0pEOCEzLcfQ6bps5DVnRBdDj6hGeyZ2x8tDmHA',
                isPrimary: true,
                sortOrder: 0,
            },
            // Zebra Scanner
            {
                productId: createdProducts[1].id,
                url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyvfnrjHmwZCnKNXNKAPjHJfXLDSqkh3I_QO5_VqbPby1SbIEYg5mYF0Vmzgh7o0Pwbd8vyH42fZ-aSElu1f3B4JJ3UyGhxC6kFE9V09yBeLBrKn5K000Te71DNIJ4ock1C5-rV_0Rf7a6jNXWB9-9Nr2lB-o59GMX8SHnZHbHfdkfmP236JgAEVzhTrye8myK7a859M3NTFMB9t0Xs-ZhoXj-geVkFA2gvhWB3vMUYslwhCOHwto2N8Lz0njeSU9s2QK57RKQmv8',
                isPrimary: true,
                sortOrder: 0,
            },
            // Epson Printer
            {
                productId: createdProducts[2].id,
                url: 'https://placehold.co/600x400/png?text=Printer',
                isPrimary: true,
                sortOrder: 0,
            },
            // Scale
            {
                productId: createdProducts[3].id,
                url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB53AfAdYSVNGB5oYFzfLzNBiSHgxDobxm6eMuU04gox73Dek_5_bgFD2-g2-TUNNxbCrFx1JCtNJvhz9iO_KPbN2II8puGy8ON-PORvD67gnwscRmerEECb2p-NXJOFEzfOPA8sJpnPiQFhadp1njp5toF1Qq5ohLGGkfnXkJatXjtagEez_cEq1lqrOX4D2iaW_TAGqaPHkEmyqpzSJUKNfsO4qGUczLnyJHPXvKwxhHh4WZhvJaCF6O2LUBXNSDJxHqndnh-Q38',
                isPrimary: true,
                sortOrder: 0,
            },
            // Touch Screen
            {
                productId: createdProducts[4].id,
                url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsk0P7H4thcEFU3j2-Z5bZbAV_rFQwPg5XMjBGCzXbXam3gzru2Sz_b_Cszro7q_gUGVYu2JtBua8bN4EpeGzq-3a4gEg34xJftGdxqGk14gzwM8QxIoIjDDpgpojUNf4FIrqQAjJnot855f68YgGKFcGRdwiyl-UQO5Jk32BkdWHeIgyQv0fxclBzKXJ11bymOJUwzi7kkcxLoKYjVnXJ0MsvNTF0q3X2w6nfZ0pEOCEzLcfQ6bps5DVnRBdDj6hGeyZ2x8tDmHA',
                isPrimary: true,
                sortOrder: 0,
            },
        ];

        await db.insert(productImages).values(imagesData);
        console.log('✅ Product images added');

        // 6. Create Default Settings
        console.log('Creating default settings...');
        await db.insert(settings).values({
            storeNameAr: 'مركز العامر لأنظمة الكاشير',
            storeNameEn: 'Al3amer POS Systems',
            supportPhone: '+20 101 234 5678',
            supportEmail: 'support@al3amer.com',
            address: 'القاهرة، مدينة نصر، شارع عباس العقاد',
            logoUrl: 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png',
            codEnabled: true,
            codExtraFee: '10',
            shippingFlatRate: '50',
            freeShippingThreshold: '2000',
            vatEnabled: true,
            taxPercentage: '14',
            taxRegistrationNumber: '123-456-789',
            pricesIncludeTax: true,
            metaTitle: 'مركز العامر | أفضل معدات الكاشير ونقاط البيع في مصر',
            metaDescription: 'متجر مركز العامر يوفر أحدث أجهزة الباركود، طابعات الفواتير، موازين إلكترونية، وأنظمة الكاشير الكاملة بأسعار منافسة',
            metaKeywords: 'كاشير, باركود, طابعة فواتير, ميزان الكتروني, نقاط بيع, POS Egypt',
        });

        console.log('✅ Default settings created');

        console.log('\n🎉 Database seeding completed successfully!\n');
        console.log('📧 Admin credentials:');
        console.log('   Email: admin@al3amer.com');
        console.log('   Password: admin\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

seed();
