# PROJECT_MAP.md — Al3amer Center (مركز العامر)

```
┌──────────────────────────────────────────────────────────────────┐
│ [🔬 التشخيص: توثيق | مشروع قائم بدون PROJECT_MAP | كبير (>50)]  │
│ [🧬 البروتوكولات: P4 (توثيق) + P7 (مراجعة)]                     │
│ [⚡ الوضع: Documentation Mode]                                   │
├──────────────────────────────────────────────────────────────────┤
│ 🎯 الحالة: مكتمل — المشروع في مرحلة الاستعداد للنشر             │
│ ⚠️ ملاحظة: يوجد مجلدات أرشيفية (تصاميم سابقة) خارج monorepo/   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ آخر التعديلات (Latest Fixes)
- **إصلاح خطأ البناء (TS6133):** تم حذف الاستيراد غير المستخدم `useSuggestRelatedProducts` في `AddProduct.tsx`.
- **أتمتة الذكاء الاصطناعي:** تم دمج زر "توليد الكل" مع نظام "الربط الذكي" ليعمل بضغطة واحدة.
- **دعم السياق للمسودات:** تم تمكين الحصول على روابط مقترحة للمنتجات قبل حفظها في قاعدة البيانات.
```

---

## [TECH_STACK] الركن التقني

### Backend — `apps/api/`

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Node.js | ^20.x | بيئة التشغيل |
| Express.js | ^4.18.2 | إطار العمل الرئيسي |
| TypeScript | ^5.3.3 | لغة البرمجة |
| PostgreSQL | (Neon) | قاعدة البيانات |
| Drizzle ORM | ^0.45.1 | ORM والهجرات |
| Drizzle Kit | ^0.31.8 | أدوات الهجرة |
| tsx | ^4.7.0 | تشغيل TypeScript |
| jsonwebtoken | ^9.0.2 | JWT المصادقة |
| bcryptjs | ^2.4.3 | تشفير كلمات المرور |
| @google/genai | ^1.38.0 | Gemini AI |
| cloudinary | ^2.8.0 | رفع الصور |
| axios | ^1.15.0 | HTTP client |
| multer | ^2.0.2 | رفع الملفات |
| xlsx | ^0.18.5 | معالجة Excel |
| nodemailer | ^8.0.5 | إرسال الإيميلات |
| zod | ^3.22.4 | التحقق من الصحة |
| helmet | ^8.1.0 | رؤوس الأمان (HTTP Security Headers) |
| express-rate-limit | ^8.3.2 | تحديد المعدل |
| postgres | ^3.4.3 | PostgreSQL driver |
| dotenv | ^16.3.1 | البيئة المتغيرة |

### Frontend — `apps/web/`

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| React | ^19.2.0 | إطار العمل |
| TypeScript | ~5.9.3 | لغة البرمجة |
| Vite | ^7.2.4 | أداة البناء |
| Tailwind CSS | ^4.1.18 | التصميم |
| React Router | ^7.11.0 | التوجيه |
| TanStack Query | ^5.90.16 | إدارة حالة الخادم |
| Axios | ^1.13.2 | HTTP client |
| Firebase | ^12.8.0 | المصادقة |
| Framer Motion | ^12.26.2 | الأنيميشن |
| Lucide React | ^0.562.0 | الأيقونات |
| Recharts | ^3.6.0 | الرسوم البيانية |
| react-hot-toast | ^2.6.0 | الإشعارات |
| date-fns | ^4.1.0 | التواريخ |
| jwt-decode | ^4.0.0 | فك JWT |
| react-rnd | ^10.5.3 | نوافذ قابلة للسحب |
| @tailwindcss/vite | ^4.1.18 | Tailwind Vite plugin |

### Monorepo

| التقنية | الإصدار |
|---------|---------|
| pnpm | (workspace) |
| Node.js | ^20.x |

---

## [SYSTEM_FLOW] تدفق النظام

### 1️⃣ تدفق المتجر (B2C Customer Flow)

```
المستخدم → المتجر (Web)
    │
    ├─ تصفح /shop ← API: GET /api/products?filters
    ├─ بحث ← API: GET /api/products/search-suggestions?q=
    ├─ تفاصيل منتج ← API: GET /api/products/:slug
    ├─ مصمم الباقات ← API: POST /api/ai-bundle/generate
    │
    ├─ سلة التسوق (CartContext — localStorage + sync)
    │   └─ Validate ← API: POST /api/products/validate-cart
    │
    ├─ إتمام الطلب (CheckoutPage)
    │   ├─ مصادقة ← API: POST /api/auth/login أو social
    │   ├─ كود خصم ← API: POST /api/coupons/validate
    │   ├─ دفع Paymob ← API: POST /api/checkout/initiate-payment
    │   └─ إنشاء طلب ← API: POST /api/orders
    │       └─ إخطار ← NotificationService (Telegram/WhatsApp/Email)
    │
    └─ تتبع الطلب ← API: GET /api/orders/:id
```

### 2️⃣ تدفق الدفع (Paymob Payment Flow)

```
1. Web: POST /api/checkout/initiate-payment
   └─ API: PaymobService.authenticate() → registerOrder() → getPaymentKey()
   └─ Return: payment_key → Web يفتح iframe Paymob

2. المستخدم يدخل بيانات الدفع في iframe Paymob

3. Paymob -> Webhook: POST /api/webhook/paymob
   └─ API: HMAC verification → updateOrderStatus()

4. Web: /payment/callback ← OrderSuccessPage
```

### 3️⃣ تدفق لوحة التحكم (Admin Flow)

```
Admin → /admin (ProtectedRoute + AdminLayout + Sidebar)
    │
    ├─ Dashboard ← API: GET /api/admin/stats + /api/admin/reports
    ├─ إدارة منتجات ← CRUD /api/products
    │   ├─ إضافة/تعديل ← AddProduct.tsx
    │   ├─ AI توليد ← POST /api/products/ai-generate
    │   └─ مزامنة مخزون ← POST /api/products/import/{preview,execute}
    ├─ إدارة طلبات ← CRUD /api/orders
    │   └─ طباعة AWB ← /admin/orders/:id/print
    ├─ إدارة عملاء ← GET /api/users (مسجلين + ضيوف)
    ├─ إدارة فئات ← CRUD /api/categories
    ├─ إدارة كوبونات ← CRUD /api/coupons
    ├─ إدارة تقييمات ← CRUD /api/reviews
    ├─ تقارير ← GET /api/admin/reports (Recharts)
    ├─ إعدادات ← CRUD /api/settings
    └─ إعدادات AI ← اختبار Gemini + إعدادات النماذج
```

### 4️⃣ تدفق المصادقة (Auth Flow)

```
تسجيل: POST /api/auth/register → bcrypt(password) → JWT → {token, user}
دخول: POST /api/auth/login → bcrypt.compare → JWT → {token, user}
Google: Firebase Auth → POST /api/auth/social → JWT → {token, user}
تحقق: GET /api/auth/me ← Bearer token → JWT verify → user (بدون password)
```

### 5️⃣ تدفق AI Bundle Builder

```
AIBundleBuilderPage.tsx
    │
    ├─ وضع AI:
    │   نوع النشاط + الميزانية + ميزات → API → Gemini/Algorithm
    │   ← باقة مقترحة (جهاز + طابعة + ماسح + درج + مستهلكات)
    │
    └─ وضع Manual (Cascading):
        6 مراحل: جهاز → طابعة إيصال → طابعة باركود → ماسح → درج → مستهلكات
        كل مرحلة تفتح بناءً على اختيار المرحلة السابقة
```

---

## [ARCHITECTURE] الهيكل المعماري

### Monorepo Structure

```
monorepo/
├── apps/
│   ├── api/          # Express.js API server
│   │   ├── src/
│   │   │   ├── index.ts                 # Entry point — 19 routers + helmet + error handler
│   │   │   ├── controllers/             # 17 controllers
│   │   │   ├── routes/                  # 19 route files
│   │   │   ├── db/                      # Schema + DB connection
│   │   │   │   ├── schema.ts            # 12 tables + relations
│   │   │   │   └── index.ts             # postgres + drizzle instance
│   │   │   ├── services/               # 4 services (AI, Paymob, Notification, Model)
│   │   │           ├── lib/                    # 4 utilities (Auth, Cloudinary, Crypto, Validate)
│           ├── schemas/                # Zod validation schemas (index.ts — all domains)
│   │   │   └── scripts/                # 16 utility scripts (seed, patch, debug...)
│   │   ├── drizzle/                    # Migration files (2 migrations)
│   │   └── scripts/                    # 2 top-level scripts
│   │
│   └── web/          # React + Vite SPA
│       └── src/
│           ├── main.tsx                 # Entry point (QueryClient)
│           ├── App.tsx                  # Router + Providers
│           ├── pages/                   # 13 customer + 14 admin pages
│           │   ├── admin/              # 14 admin pages
│           │   └── *.tsx               # 13 customer pages
│           ├── components/
│           │   ├── layout/             # Header, Footer
│           │   ├── admin/              # AdminLayout, Sidebar, Tables, Modals
│           │           ├── products/           # ProductCard, ProductGallery, ProductTabs, RelatedProducts, ProductLightbox, StickyMobileCart, index
│           │   ├── checkout/           # CheckoutProgressBar
│           │   ├── auth/               # ProtectedRoute
│           │   ├── account/            # AddressForm
│           │   └── ui/                 # CustomSelect
│           ├── context/                # AuthContext, CartContext, SettingsContext
│           ├── hooks/                  # 10 TanStack Query hooks
│           ├── lib/                    # api.ts (Axios), firebase.ts
│           └── utils/                  # imageUtils.ts, videoParser.ts
│
├── package.json       # Root workspace
├── pnpm-workspace.yaml
└── PRD.md             # Product Requirements Document
```

### طبقات العمارة (Layers)

```
[Frontend Web]
    React Pages ← Components ← Contexts/Hooks
         │
         │ HTTP (Axios + JWT)
         ▼
[Backend API]
    Routes ← Controllers ← Services
         │                    │
         │                    ├─ AI Service (Gemini)
         │                    ├─ Paymob Service
         │                    ├─ Notification Service
         │                    └─ Model Discovery Service
         │
         ▼
    Drizzle ORM → PostgreSQL (Neon)
         │
         └─ Migrations (drizzle/)
```

### نمط التصميم (Design Patterns)

- **Controller-Service-Routes**: فصل المسؤوليات في Backend
- **Context + Hooks**: إدارة الحالة في Frontend (Auth, Cart, Settings)
- **TanStack Query**: فصل حالة الخادم عن حالة العميل
- **ProtectedRoute**: حماية المسارات بنمط Wrapper
- **Axios Interceptors**: إدارة JWT تلقائياً ومعالجة 401

---

## [ORPHANS & PENDING] الملفات اليتيمة والمهام المعلقة

### 📂 مجلدات أرشيفية (خارج monorepo — غير مستخدمة في الكود الحالي)

| المسار | المحتوى |
|--------|---------|
| `admin_dashboard_-_dark_mode_1` إلى `14` | تصاميم سابقة للوحة التحكم |
| `home_page_-_dark_mode/` | تصميم سابق للصفحة الرئيسية |
| `customer_account_-_dark_mode/` | تصميم سابق لحساب العميل |
| `product_details_page_-_dark_mode_1/`, `_2/` | تصميم سابق لتفاصيل المنتج |
| `product_listing_page_-_dark_mode/` | تصميم سابق لقائمة المنتجات |
| `order_review_-_dark_mode/` | تصميم سابق لمراجعة الطلب |
| `payment_method_-_dark_mode/` | تصميم سابق لطرق الدفع |
| `shipping_information_-_dark_mode/` | تصميم سابق لمعلومات الشحن |
| `login/` | تصميم سابق لتسجيل الدخول |
| `admin__ai_auto-fill_settings/` | تصميم سابق لإعدادات AI |
| `ai_bundle_builder_page/` | تصميم سابق لمصمم الباقات |
| `ai_bundle_builder/` | تصميم سابق آخر |

### 🗂️ ملفات قديمة/مؤقتة في الجذر

| الملف | الحالة |
|-------|--------|
| `list_brands.js` | سكربت قديم غير مستخدم |
| `tmp_check_prices.ts` | سكربت مؤقت لفحص الأسعار |
| `tmp/` | مجلد مؤقت |
| `PAYMOB_README.md` | وثيقة قديمة لـ Paymob |

### 🧹 ملفات قديمة في `apps/web/`

| الملف | الحالة |
|-------|--------|
| `reorder.cjs` | سكربت إعادة ترتيب قديم (قابل للحذف) |
| `dist/` | مخرجات البناء (تتجدد مع كل build) |

### 🧪 ملفات اختبارات TestSprite

| المسار | المحتوى |
|--------|---------|
| `apps/api/testsprite_tests/` | ملفات اختبارات آلية من TestSprite (Python + JSON) |

### ✅ المنجز حديثاً

| المهمة | الحالة |
|--------|--------|
| إضافة Zod validation middleware لجميع API routes | ✅ مكتمل |
| إنشاء `src/lib/validate.ts` (middleware عام) | ✅ |
| إنشاء `src/schemas/index.ts` (15 دومين schema) | ✅ |
| تطبيق `validate()` على 17 ملف route (POST/PUT/PATCH) | ✅ |
| كل الاختبارات 62/62 ناجحة بدون regressions | ✅ |
| إضافة Helmet middleware (رؤوس أمان HTTP) | ✅ |
| إخفاء تفاصيل الـ stack trace في الـ error handler بـ production | ✅ |
| استخدام `err.status` في middleware الخطأ للحفاظ على أكواد الحالة المخصصة | ✅ |
| أتمتة الربط الذكي ودعم اقتراحات العلاقات للمنتجات الجديدة (Unsaved) | ✅ |
| إصلاح أخطاء البناء الناتجة عن المتغيرات غير المستخدمة واستيراد API | ✅ |

### 🔲 مهام معلقة (Pending)

| الأولوية | المهمة | الملاحظات |
|----------|--------|------------|
| 🔴 عالية | نشر API على Vercel | يتطلب متغيرات البيئة في Production |
| 🔴 عالية | ربط Frontend بـ API الإنتاجي | تغيير `VITE_API_URL` |
| 🔴 عالية | تشغيل Drizzle migrations على DB الإنتاج | `db:push` أو `db:migrate` |
| 🟡 متوسطة | تكوين Paymob: IP whitelist + webhook | `POST /api/webhook/paymob` |
| 🟡 متوسطة | إضافة domain الإنتاج لـ Firebase Auth | قائمة النطاقات المسموحة |
| 🟡 متوسطة | بذر قاعدة البيانات | منتجات أولية عبر `db:seed` أو Excel |
| 🟢 منخفضة | تنظيف مجلدات الأرشيف | نقل أو حذف `admin_dashboard_-_dark_mode_*` |
| 🟢 منخفضة | إضافة PWA (Service Worker) | غير مطبقة حاليًا |
| 🟢 منخفضة | إضافة i18n للغة الإنجليزية | حاليًا عربي فقط |

### 🧪 أنظمة الاختبارات (Testing)

| الأداة | القيمة |
|--------|--------|
| الإطار | Vitest v4 |
| الموقع | `apps/api/src/__tests__/` |
| اختبارات المصادقة (Auth) | 16 ✅ |
| اختبارات المنتجات (Products) | 17 ✅ |
| اختبارات الطلبات (Orders) | 14 ✅ |
| اختبارات الدفع (Checkout) | 8 ✅ |
| اختبارات Middleware | 6 ✅ |
| الإجمالي | **62 اختبار ✅** |
| التغطية المستهدفة | 80% عبارات, 75% Branches |
| نمط التسمية | `[TDD-RED]` للمسارات الفاشلة, `[TDD-GREEN]` للمسارات الناجحة |

### 📋 إحصائيات المشروع

| المقياس | القيمة |
|---------|--------|
| إجمالي ملفات TypeScript (API) | 48 |
| إجمالي ملفات TypeScript/TSX (Web) | 48 |
| نقاط API | 70+ |
| جداول قاعدة البيانات | 12 |
| المتحكمات (Controllers) | 17 |
| صفحات المستخدم | 13 |
| صفحات الإدارة | 14 |
| المكونات | 21 |
| السياقات (Contexts) | 3 |
| الهوكس (Hooks) | 10 |
| Schemas التحقق | 15 domain schemas |
| Middleware مخصصة | 3 (Auth JWT + Zod Validation + Helmet Security Headers) |
| الخدمات (Services) | 4 |
| السكربتات (Scripts) | 18 |
| هجرات Drizzle | 2 |
| اختبارات وحدة | 62 |

---

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎯 الخلاصة النهائية                                              │
│ المشروع: Full-Stack E-commerce (POS Systems)                     │
│ الحالة: ✅ Development complete — جاهز للنشر بعد الخطوات أعلاه  │
│                                                                  │
│ ⚠️ المخاطر والتحذيرات                                            │
│ • مفاتيح Paymob و Firebase تحتاج تكوين في Production             │
│ • بيانات DB الإنتاج تحتاج Migration آمن                          │
│ • مجلدات الأرشيف تحتاج تنظيف قبل النشر                           │
│                                                                  │
│ 📌 الخطوات التالية                                               │
│ 1. نشر API → 2. ربط Frontend → 3. تكوين Paymob/Firebase →       │
│ 4. بذر البيانات → 5. اختبار شامل → 6. تنظيف الملفات القديمة     │
│                                                                  │
│ 📋 PROJECT_MAP: ✅ تم الإنشاء والتوثيق                           │
└──────────────────────────────────────────────────────────────────┘
```
