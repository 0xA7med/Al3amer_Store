import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ar: {
    translation: {
      // Navigation
      home: 'الصفحة الرئيسية',
      products: 'المنتجات',
      about: 'من نحن',
      contact: 'تواصل معنا',
      cart: 'السلة',
      admin: 'المشرف',
      
      // Common
      search: 'البحث',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      success: 'تم بنجاح',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      edit: 'تعديل',
      delete: 'حذف',
      add: 'إضافة',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      view: 'عرض',
      details: 'التفاصيل',
      
      // Product related
      sortBy: 'فرز حسب',
      filterByCategory: 'تصفية حسب التصنيف',
      all: 'الكل',
      price: 'السعر',
      originalPrice: 'السعر الأصلي',
      discount: 'خصم',
      inStock: 'متوفر',
      outOfStock: 'غير متوفر',
      addToCart: 'أضف للسلة',
      quantity: 'الكمية',
      category: 'الفئة',
      categories: 'الفئات',
      specifications: 'المواصفات',
      description: 'الوصف',
      reviews: 'التقييمات',
      rating: 'التقييم',
      featured: 'مميز',
      newProduct: 'جديد',
      
      // Categories
      'أجهزة كاشير': 'أجهزة كاشير',
      'طابعات': 'طابعات',
      'برامج محاسبة': 'برامج محاسبة',
      'قارئ باركود': 'قارئ باركود',
      
      // Cart and Checkout
      shoppingCart: 'سلة التسوق',
      emptyCart: 'السلة فارغة',
      subtotal: 'المجموع الفرعي',
      shipping: 'الشحن',
      total: 'المجموع الكلي',
      checkout: 'الدفع',
      order: 'الطلب',
      orderNumber: 'رقم الطلب',
      
      // Customer Information
      customerInfo: 'بيانات العميل',
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      governorate: 'المحافظة',
      city: 'المركز',
      address: 'العنوان',
      
      // Payment
      paymentMethod: 'طريقة الدفع',
      cashOnDelivery: 'الدفع عند الاستلام',
      onlinePayment: 'الدفع الإلكتروني',
      
      // Order Status
      pending: 'في الانتظار',
      confirmed: 'مؤكد',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
      
      // Company Info
      companyName: 'مركز العامر',
      companySlogan: 'العامر لأجهزة الكاشير وأنظمة المحاسبة',
      whatsappNumber: '+201026043165',
      
      // About Page
      aboutTitle: 'من نحن',
      aboutDescription: 'مركز العامر هو مؤسسة رائدة في مجال أجهزة الكاشير وأنظمة المحاسبة، نقدم أحدث التقنيات والحلول المتطورة لتلبية احتياجات الأعمال المختلفة.',
      
      // Contact Page
      contactTitle: 'تواصل معنا',
      contactDescription: 'نحن هنا لخدمتك. تواصل معنا للحصول على أفضل الحلول والدعم الفني.',
      subject: 'الموضوع',
      message: 'الرسالة',
      sendMessage: 'إرسال الرسالة',
      
      // WhatsApp Integration
      whatsappInquiry: 'استفسار عبر واتساب',
      whatsappMessage: 'مرحباً، مهتم بشراء المنتج: {{productName}}',
      
      // Notifications
      productAddedToCart: 'تم إضافة المنتج للسلة',
      orderPlacedSuccessfully: 'تم تأكيد الطلب بنجاح',
      messageSentSuccessfully: 'تم إرسال الرسالة بنجاح',
      
      // Validation Messages
      required: 'هذا الحقل مطلوب',
      invalidEmail: 'البريد الإلكتروني غير صحيح',
      invalidPhone: 'رقم الهاتف غير صحيح',
      minLength: 'يجب أن يكون النص أطول من {{min}} أحرف',
      maxLength: 'يجب أن يكون النص أقصر من {{max}} حرف',
      
      // Admin Panel
      adminPanel: 'لوحة التحكم',
      dashboard: 'الرئيسية',
      manageProducts: 'إدارة المنتجات',
      manageOrders: 'إدارة الطلبات',
      manageCategories: 'إدارة الفئات',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      
      // Pagination
      page: 'صفحة',
      of: 'من',
      perPage: 'عنصر في الصفحة',
      
      // Time
      createdAt: 'تم الإنشاء في',
      updatedAt: 'تم التحديث في',
      today: 'اليوم',
      yesterday: 'أمس',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      
      // Currency
      egp: 'ج.م',
      currency: 'العملة',
      
      // File Upload
      uploadImage: 'رفع صورة',
      selectImage: 'اختر صورة',
      dragAndDrop: 'اسحب واتركَ الصورة هنا',
      
      // Status
      active: 'نشط',
      inactive: 'غير نشط',
      status: 'الحالة',
      
      // Search and Filters
      searchProducts: 'البحث في المنتجات',
      filterByPrice: 'تصفية حسب السعر',
      priceRange: 'نطاق السعر',
      from: 'من',
      to: 'إلى',
      apply: 'تطبيق',
      clear: 'مسح',
      
      // Footer
      allRightsReserved: 'جميع الحقوق محفوظة',
      followUs: 'تابعنا',
      
      // Hero Section
      heroTitle: 'مرحباً بك في مركز العامر',
      heroSubtitle: 'أحدث أجهزة الكاشير وأنظمة المحاسبة',
      shopNow: 'تسوق الآن',
      learnMore: 'اعرف المزيد',
      
      // Features
      fastShipping: 'شحن سريع',
      technicalSupport: 'دعم فني',
      warranty: 'ضمان',
      bestPrices: 'أفضل الأسعار',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    }
  })

export default i18n
