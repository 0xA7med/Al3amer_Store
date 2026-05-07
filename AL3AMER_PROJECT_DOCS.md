# توثيق مشروع مركز العامر لأنظمة الكاشير

---

## 1. نظرة عامة | Overview

**مركز العامر** هو منصة تجارة إلكترونية متكاملة (Full-Stack E-commerce) متخصصة في بيع أجهزة الكاشير (POS) وأنظمة المحاسبة في مصر. يخدم العملاء العاديين (B2C) ويوفر لوحة تحكم شاملة للإدارة.

- **الاسم الرمزي:** `al3amer-center`
- **نوع المشروع:** Monorepo (pnpm workspace)
- **اللغة:** العربية (RTL) - واجهة كاملة بالعربية
- **نظام الألوان:** Dark Mode بالكامل
- **الإصدار:** 1.0.0

---

## 2. هيكل المشروع | Project Structure

```
AL3amer_Dark_UX/
├── monorepo/                          # المشروع الرئيسي
│   ├── apps/
│   │   ├── api/                       # Backend API (Express + Node.js)
│   │   └── web/                       # Frontend (React + Vite)
│   ├── package.json                   # Root package.json
│   ├── pnpm-workspace.yaml            # تكوين monorepo
│   └── PRD.md                         # Product Requirements Document
├── admin_dashboard_-_dark_mode_*/     # تصاميم سابقة (أرشيف)
├── home_page_-_dark_mode/             # تصاميم سابقة (أرشيف)
├── ...                                # مجلدات تصاميم أخرى (أرشيف)
└── AL3AMER_PROJECT_DOCS.md            # هذا الملف
```

---

## 3. الركن التقني | Tech Stack

### Backend (API)
| التقنية | الاستخدام |
|---------|-----------|
| Node.js + Express.js | إطار العمل الرئيسي |
| TypeScript | لغة البرمجة |
| PostgreSQL | قاعدة البيانات |
| Drizzle ORM | إدارة قاعدة البيانات والهجرات |
| JWT (jsonwebtoken) | المصادقة |
| bcryptjs | تشفير كلمات المرور |
| Firebase Auth | المصادقة عبر Google |
| Paymob API | بوابة الدفع |
| Google Gemini AI | الذكاء الاصطناعي لتوليد المحتوى |
| Cloudinary | رفع الصور |
| Nodemailer | إرسال الإيميلات |
| Multer | رفع الملفات |
| xlsx | معالجة Excel لجرد المخزون |
| Zod | التحقق من صحة البيانات |
| express-rate-limit | تحديد معدل الطلبات |

### Frontend (Web)
| التقنية | الاستخدام |
|---------|-----------|
| React 19 | إطار العمل |
| TypeScript | لغة البرمجة |
| Vite 7 | أداة البناء |
| Tailwind CSS v4 | التصميم والتنسيق |
| React Router v7 | التوجيه |
| TanStack Query v5 | إدارة حالة الخادم |
| Axios | طلبات HTTP |
| Firebase SDK | المصادقة |
| Framer Motion | الحركات والأنيميشن |
| Lucide React | الأيقونات |
| Recharts | الرسوم البيانية |
| react-hot-toast | الإشعارات |
| date-fns | معالجة التواريخ |
| jwt-decode | فك توكن JWT |
| react-rnd | نوافذ قابلة للسحب والتحكم |

---

## 4. قاعدة البيانات | Database Schema

### الجداول (12 جدولاً)

| الجدول | الشرح |
|--------|-------|
| `users` | المستخدمون (عملاء - أدمن - تجار) مع صلاحيات وبيانات شاملة |
| `addresses` | عناوين المستخدمين (ربط مع users) |
| `wishlist` | قائمة الرغبات (ربط user + product) |
| `categories` | فئات المنتجات (هرمية - parentId) مع attributesSchema |
| `brands` | الماركات التجارية |
| `products` | المنتجات (مخزون، أسعار، خيارات متغيرات، باركود، مواصفات) |
| `product_images` | صور المنتجات (isPrimary, sortOrder) |
| `orders` | الطلبات (حالة، إجمالي، شحن، دفع، كوبون) |
| `order_items` | عناصر الطلب (ربط مع orders و products) |
| `ai_bundle_logs` | سجلات إنشاء الباقات الذكية |
| `settings` | إعدادات المتجر (اسم، شعار، وسائل تواصل، دفع، شحن، إخطارات) |
| `coupons` | أكواد الخصم |
| `reviews` | تقييمات المنتجات |
| `banners` | البانرات الإعلانية |

### ملاحظات على schema:
- **المنتجات** تدعم `variantOptions` (jsonb) للمتغيرات (لون، حجم..) و `salesTiers` (تسعير شرائح)
- **الطلبات** تدعم نظام COD مع حساب مقدم الدفع وتكلفة الشحن المرتجع
- **المستخدمون** يدعمون نظام التاجر (trader) مع `traderBranding` و `discountConfig` مخصص
- **الإعدادات** تشمل Paymob Integration ID، تكوين COD، شحن، ضرائب، إعدادات AI، إخطار (Telegram, WhatsApp, Email)

---

## 5. Backend API | الواجهة الخلفية

### ملف المدخل: `apps/api/src/index.ts`
يحمّل 19 موجه (router) على المسارات التالية:

| المسار | الملف |
|--------|-------|
| `/api/products` | routes/products.ts |
| `/api/brands` | routes/brands.ts |
| `/api/categories` | routes/categories.ts |
| `/api/ai-bundle` | routes/ai-bundle.ts |
| `/api/orders` | routes/orders.ts |
| `/api/settings` | routes/settings.ts |
| `/api/auth` | routes/auth.ts |
| `/api/admin` | routes/admin.ts |
| `/api/users` | routes/users.ts |
| `/api/coupons` | routes/coupons.ts |
| `/api/reviews` | routes/reviews.ts |
| `/api/addresses` | routes/addresses.ts |
| `/api/wishlist` | routes/wishlist.ts |
| `/api/webhook` | routes/webhook.ts |
| `/api/debug` | routes/debug.ts |
| `/api/metadata` | routes/metadata.ts |
| `/api/checkout` | routes/checkout.ts |
| `/api/social-preview` | routes/social-preview.ts |
| `/api/products/import/*` | routes/inventory-sync.ts (mounted nested) |
| `/health` | Health check |

### المتحكمات (Controllers) - 17 ملفاً:

| المتحكم | المهام الرئيسية |
|---------|----------------|
| `products.controller.ts` | CRUD منتجات، بحث، AI generation، Bulk actions، Validate cart |
| `categories.controller.ts` | CRUD فئات مع product counts |
| `brands.controller.ts` | قائمة الماركات |
| `orders.controller.ts` | إنشاء طلب، تحديث حالة، دفع، حذف جماعي |
| `auth.controller.ts` | تسجيل، دخول، Firebase social login، me |
| `admin.controller.ts` | إحصائيات، تقارير، AI logs، debug models |
| `settings.controller.ts` | إعدادات عامة/خاصة، تشفير/فك تشفير، اختبار Gemini/إخطار |
| `users.controller.ts` | CRUD عملاء (مسجلين + ضيوف حسب رقم الهاتف) |
| `coupons.controller.ts` | CRUD كوبونات + Validate |
| `reviews.controller.ts` | CRUD تقييمات + موافقة/رفض |
| `addresses.controller.ts` | CRUD عناوين المستخدم (Auth) |
| `wishlist.controller.ts` | قائمة الرغبات (Toggle, Check, CRUD) |
| `checkout.controller.ts` | Initiate Paymob payment + Verify |
| `webhook.controller.ts` | Paymob webhook مع HMAC verification |
| `inventory-sync.controller.ts` | رفع Excel جرد المخزون (Preview + Execute) |
| `metadata.controller.ts` | Unique specs + Delete spec value |
| `ai-bundle.controller.ts` | توليد باقة ذكية + تسجيل |

### الخدمات (Services) - 4 ملفات:

| الخدمة | الوظيفة |
|--------|---------|
| `ai.service.ts` | Google Gemini AI - توليد محتوى منتج (وصف، مواصفات، SEO) |
| `model-discovery.service.ts` | اكتشاف موديلات Gemini المتاحة تلقائياً |
| `notification.service.ts` | إخطار الطلبات عبر Telegram - WhatsApp (CallMeBot) - Email (Nodemailer) |
| `paymob.service.ts` | بوابة Paymob - مصادقة، تسجيل طلب، مفتاح دفع، دفع محفظة، تحقق |

### السكربتات (Scripts) - 18 ملفاً:
- **seed.ts**: بذر قاعدة البيانات (admin، فئات، ماركات، منتجات، إعدادات)
- **patch-categories-schema***: تعديلات attributesSchema للفئات
- **backfill-slugs.ts**: ملء slugs الفارغة
- **fix-images.ts**: إصلاح روابط الصور المكسورة
- **restore_categories.ts**: استعادة التسلسل الهرمي للفئات
- **debug-***: سكربتات تصحيح أخطاء

### ميدلوير (Middleware):
- `lib/auth.ts` - JWT verification + user attachment
- `lib/cloudinary.ts` - رفع الصور إلى Cloudinary
- `lib/crypto.utils.ts` - تشفير AES-256-CBC وفك التشفير

### هجرات Drizzle:
- `0000_brief_forgotten_one.sql` - إنشاء كل الجداول
- `0001_easy_jackpot.sql` - إضافة حقول التجار، المتغيرات، الإخطارات

---

## 6. Frontend Web | الواجهة الأمامية

### ملف المدخل: `apps/web/src/main.tsx`
```tsx
ReactDOM.createRoot(...).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### نظام التوجيه: `apps/web/src/App.tsx`

#### الصفحات العامة (Customer Routes) - 13 صفحة:

| المسار | الصفحة | الشرح |
|--------|--------|-------|
| `/` | `HomePage.tsx` | الرئيسية |
| `/shop` | `ShopPage.tsx` | متجر - عرض المنتجات مع فلترة |
| `/product/:slug` | `ProductDetailsPage.tsx` | تفاصيل المنتج |
| `/cart` | `CartPage.tsx` | سلة التسوق |
| `/checkout` | `CheckoutPage.tsx` | إتمام الطلب |
| `/order-success/:id` | `OrderSuccessPage.tsx` | نجاح الطلب |
| `/track-order/:id` | `OrderTrackingPage.tsx` | تتبع الطلب |
| `/payment/callback` | `PaymentCallbackPage.tsx` | رد الدفع |
| `/ai-builder` | `AIBundleBuilderPage.tsx` | مصمم حلول الكاشير الذكية |
| `/login` | `LoginPage.tsx` | تسجيل الدخول |
| `/account` | `AccountPage.tsx` | حسابي (محمي) |
| `/offers` | `OffersPage.tsx` | العروض |
| `/about` | `AboutUsPage.tsx` | من نحن |

#### صفحات لوحة التحكم (Admin Routes) - 14 صفحة:

| المسار | الصفحة | الشرح |
|--------|--------|-------|
| `/admin` | `DashboardOverview.tsx` | نظرة عامة وإحصائيات |
| `/admin/products` | `ProductList.tsx` | قائمة المنتجات |
| `/admin/products/add` | `AddProduct.tsx` | إضافة منتج |
| `/admin/products/:id` | `AddProduct.tsx` | تعديل منتج |
| `/admin/orders` | `OrdersManagement.tsx` | إدارة الطلبات |
| `/admin/customers` | `CustomersManagement.tsx` | إدارة العملاء |
| `/admin/customers/:phone` | `CustomerProfile.tsx` | ملف عميل |
| `/admin/categories` | `CategoriesManagement.tsx` | إدارة الفئات |
| `/admin/coupons` | `CouponsManagement.tsx` | أكواد الخصم |
| `/admin/reviews` | `ReviewsModeration.tsx` | إدارة التقييمات |
| `/admin/ai-logs` | `AIBundleLogs.tsx` | سجلات AI |
| `/admin/reports` | `AdminReportsPage.tsx` | التقارير والرسوم البيانية |
| `/admin/ai-settings` | `AdminAISettingsPage.tsx` | إعدادات AI |
| `/admin/settings` | `SettingsPage.tsx` | إعدادات المتجر |
| `/admin/metadata` | `MetadataManagement.tsx` | إدارة البيانات الوصفية |
| `/admin/orders/:id/print` | `OrderAWB.tsx` | طباعة AWB (محمي) |

### المكونات (Components):

#### `components/layout/`
| المكوّن | الشرح |
|---------|-------|
| `Header.tsx` | رأس الموقع - شعار، بحث، قائمة تنقل، سلة، زر دخول |
| `Footer.tsx` | ذيل الموقع - روابط، معلومات، وسائل تواصل |

#### `components/admin/`
| المكوّن | الشرح |
|---------|-------|
| `AdminLayout.tsx` | تخطيط لوحة التحكم (Header + Sidebar + Outlet) |
| `Sidebar.tsx` | القائمة الجانبية للوحة التحكم (12 رابطاً) |
| `BrandSelect.tsx` | اختيار الماركة |
| `InventorySyncModal.tsx` | مودال مزامنة المخزون (Excel) |
| `OrderAWB.tsx` | طباعة AWB للشحن |
| `OrderDetailsModal.tsx` | تفاصيل الطلب في مودال |
| `OrdersTable.tsx` | جدول الطلبات |
| `PortableBillFormModal.tsx` | مودال الفاتورة الجوالة |

#### `components/checkout/`
| المكوّن | الشرح |
|---------|-------|
| `CheckoutProgressBar.tsx` | شريط تقدم عملية الدفع |

#### `components/products/`
| المكوّن | الشرح |
|---------|-------|
| `ProductCard.tsx` | بطاقة منتج |

#### `components/auth/`
| المكوّن | الشرح |
|---------|-------|
| `ProtectedRoute.tsx` | حماية المسارات (تتطلب تسجيل دخول/دور أدمن) |

#### `components/account/`
| المكوّن | الشرح |
|---------|-------|
| `AddressForm.tsx` | نموذج العنوان |

#### `components/ui/`
| المكوّن | الشرح |
|---------|-------|
| `CustomSelect.tsx` | قائمة منسدلة مخصصة |

### السياقات (Contexts) - 3 ملفات:

| السياق | الشرح |
|--------|-------|
| `AuthContext.tsx` | إدارة حالة المصادقة (تسجيل، دخول، خروج، توكن) |
| `CartContext.tsx` | إدارة سلة التسوق (localStorage + sync مع السيرفر) |
| `SettingsContext.tsx` | إعدادات المتجر العامة (من API مع fallback قيم افتراضية) |

### الهوكس (Hooks) - 10 ملفات (TanStack Query):

| الهوك | الوظيفة |
|-------|---------|
| `useProducts.ts` | Queries/Mutations للمنتجات |
| `useCategories.ts` | Queries للفئات |
| `useAdmin.ts` | إحصائيات وتقارير الأدمن |
| `useAdminReports.ts` | تقارير متقدمة |
| `useOrders.ts` (مستنتج) | Queries للطلبات |
| `useCustomers.ts` | إدارة العملاء |
| `useCoupons.ts` | إدارة أكواد الخصم |
| `useReviews.ts` | إدارة التقييمات |
| `useAddresses.ts` | إدارة العناوين |
| `useWishlist.ts` | إدارة قائمة الرغبات |
| `useInventorySync.ts` | مزامنة المخزون عبر Excel |

### المكتبات (Lib):
| الملف | الشرح |
|-------|-------|
| `lib/api.ts` | Axios instance مع Bearer token interceptor ومعالجة 401 |
| `lib/firebase.ts` | Firebase init + Google Auth Provider |

### utilities:
| الملف | الشرح |
|-------|-------|
| `utils/imageUtils.ts` | ضغط الصور client-side قبل الرفع |
| `utils/videoParser.ts` | تحليل روابط الفيديو |

### التصميم:
- **Tailwind CSS v4** مع `@theme` مخصص (`index.css`)
- **Dark theme** كامل: `--color-background-dark: #101622`, `--color-primary: #135bec`
- **Glassmorphism**: `.glass-panel`, `.glass-card` مع backdrop-filter
- **Google Fonts**: Cairo (Arabic) + Manrope (Numbers)
- **Material Symbols**: أيقونات
- **أنيميشن**: Framer Motion + keyframes مخصصة

---

## 7. التكاملات الخارجية | Integrations

| الخدمة | الغرض |
|--------|-------|
| **Paymob** | بوابة الدفع (بطاقات ائتمان + محافظ إلكترونية) مع webhook HMAC |
| **Firebase Auth** | مصادقة Google OAuth |
| **Google Gemini AI** | توليد محتوى المنتجات آلياً + اكتشاف الموديلات |
| **Cloudinary** | رفع واستضافة الصور |
| **Neon PostgreSQL** | قاعدة البيانات السحابية |
| **Telegram Bot** | إخطار الطلبات |
| **CallMeBot (WhatsApp)** | إخطار الطلبات عبر واتساب |
| **SMTP (Nodemailer)** | إخطار الطلبات عبر الإيميل |

---

## 8. الإعدادات المتغيرة | Environment Variables

### API (.env):
```
DATABASE_URL=postgresql://...
JWT_SECRET=
PAYMOB_HMAC_SECRET=
ENCRYPTION_KEY=
PORT=3001
NODE_ENV=development
# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Web (.env):
```
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 9. أوامر التشغيل | Commands

```bash
# Root (monorepo)
pnpm dev              # تشغيل API + Web معاً
pnpm dev:web          # تشغيل الواجهة فقط
pnpm dev:api          # تشغيل API فقط
pnpm build            # بناء كلا التطبيقين

# API فقط
pnpm --filter @al3amer/api dev
pnpm --filter @al3amer/api db:generate   # توليد هجرات
pnpm --filter @al3amer/api db:push       # دفع الهجرات
pnpm --filter @al3amer/api db:seed       # بذر البيانات
pnpm --filter @al3amer/api db:studio     # فتح Drizzle Studio

# Web فقط
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web preview
```

---

## 10. المصادقة والأمان | Authentication & Security

- **JWT** مع مدة صلاحية 7 أيام
- **Bcryptjs** لتشفير كلمات المرور
- **AES-256-CBC** لتشفير البيانات الحساسة (Api Keys، Tokens) في الإعدادات
- **Firebase Auth** للمصادقة الاجتماعية (Google)
- **ProtectedRoute** يحمي المسارات الإدارية
- **rate limiting** على إنشاء الطلبات والدفع
- **401 Interceptor** في Axios يعيد توجيه المستخدم لتسجيل الدخول تلقائياً
- **Paymob HMAC** للتحقق من webhooks

---

## 11. صفحة مصمم الحلول الذكية | AI Bundle Builder

ميزة فريدة في المشروع - `AIBundleBuilderPage.tsx` (962 سطراً):
- **وضع AI**: يدخل المستخدم نوع النشاط التجاري والميزانية → النظام يختار المكونات المثالية
- **وضع Manual Cascading**: 6 مراحل متتالية (جهاز → طابعة إيصال → طابعة باركود → ماسح → درج → مستهلكات)
- خوارزمية ذكية لاختيار الطابعة (حرارية/باركود/2in-1) بناءً على نوع النشاط

---

## 12. إدارة المخزون | Inventory Sync

- رفع ملف Excel عبر `POST /api/products/import/preview`
- النظام يحلل الفروقات ويعرض معاينة للتغييرات
- تأكيد التنفيذ عبر `POST /api/products/import/execute`
- يدعم headers عربية (Pro_ID, name, quantity, price, cost)

---

## 13. ملاحظات إضافية

- **عدد ملفات TypeScript في API**: 46 ملفاً
- **عدد ملفات TypeScript/TSX في Web**: 48 ملفاً (بما في ذلك المكونات)
- **عدد نقاط API**: 70+ endpoint
- **تصميم Responsive**: يدعم الموبايل والتابلت والديسكتوب
- **RTL كامل**: كل النصوص والاتجاهات بالعربية
- **دعم PWA**: غير مطبق حاليًا (لكن جاهزية للإضافة)
- **الأرشيف**: المجلدات `admin_dashboard_-_dark_mode_*` تحتوي على إصدارات سابقة من التصميم
