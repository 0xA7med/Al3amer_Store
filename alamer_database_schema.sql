-- مركز العامر (Alamer Center) E-commerce Database Schema
-- Designed for Supabase PostgreSQL
-- Created: 2025-06-23
-- Author: MiniMax Agent

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description_ar TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products Table (Main table for all product information)
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    short_desc_ar TEXT,
    short_desc_en TEXT,
    full_desc_ar TEXT,
    full_desc_en TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10,2), -- For discount display
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_stock_alert INTEGER DEFAULT 5,
    category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    category_name VARCHAR(100), -- Denormalized for easier queries
    technical_specs_ar TEXT,
    technical_specs_en TEXT,
    image_urls TEXT[], -- Array of image URLs
    thumbnail_url TEXT, -- Main product image
    video_review_links TEXT[], -- TikTok/YouTube links
    whatsapp_message_text TEXT,
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_expiry_date DATE,
    weight NUMERIC(8,2), -- For shipping calculations
    dimensions VARCHAR(100), -- "length x width x height"
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(50),
    tags TEXT[], -- For search optimization
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customers Table (for registered customers)
CREATE TABLE IF NOT EXISTS customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    governorate VARCHAR(50), -- محافظة
    city VARCHAR(50),
    address TEXT,
    postal_code VARCHAR(10),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    is_active BOOLEAN DEFAULT true,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0,
    preferred_payment_method VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL, -- Human readable order number
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    governorate VARCHAR(50) NOT NULL, -- محافظة
    city VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(10),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'paymob_card', 'paymob_wallet', 'bank_transfer')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost NUMERIC(8,2) DEFAULT 0,
    discount_amount NUMERIC(8,2) DEFAULT 0,
    tax_amount NUMERIC(8,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'EGP',
    notes TEXT,
    admin_notes TEXT,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    paymob_transaction_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order Items Table (Products in each order)
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_title VARCHAR(255) NOT NULL, -- Snapshot of product title at time of order
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    discount_applied NUMERIC(8,2) DEFAULT 0,
    product_snapshot JSONB, -- Full product details at time of order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Shopping Cart Table (for session-based carts)
CREATE TABLE IF NOT EXISTS shopping_carts (
    cart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory Log Table (for stock tracking)
CREATE TABLE IF NOT EXISTS inventory_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('add', 'remove', 'adjust', 'sale', 'return')),
    quantity_changed INTEGER NOT NULL,
    previous_stock INTEGER,
    new_stock INTEGER,
    reason TEXT,
    admin_id UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Site Settings Table (for configuration)
CREATE TABLE IF NOT EXISTS site_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether setting can be accessed via public API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    admin_reply TEXT,
    replied_by UUID REFERENCES admin_users(admin_id) ON DELETE SET NULL,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at DESC);

-- Create Functions for Auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the function to relevant tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON shopping_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Categories
INSERT INTO categories (name_ar, name_en, description_ar, display_order) VALUES
('أجهزة كاشير', 'POS Systems', 'أجهزة نقاط البيع الحديثة والمتطورة', 1),
('طابعات', 'Printers', 'طابعات الإيصالات والباركود', 2),
('برامج محاسبة', 'Accounting Software', 'برامج وأنظمة إدارة المحاسبة', 3),
('قارئ باركود', 'Barcode Scanners', 'أجهزة قراءة الباركود المختلفة', 4);

-- Insert Default Admin User (username: admin, password: Admin@123)
-- Password hash for "Admin@123" using bcrypt
INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@alamer.com', '$2b$12$LQv3c1yqBw2fyuPiAuU4dO.1GXZXQ2nNqzr1dY8fV8GxKQjCnm.3u', 'مدير النظام', 'super_admin');

-- Insert Default Site Settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name_ar', 'مركز العامر', 'text', 'اسم الموقع باللغة العربية', true),
('site_name_en', 'Alamer Center', 'text', 'اسم الموقع باللغة الإنجليزية', true),
('site_slogan_ar', 'العامر لأجهزة الكاشير وأنظمة المحاسبة', 'text', 'شعار الموقع باللغة العربية', true),
('whatsapp_number', '+201026043165', 'text', 'رقم الواتساب للتواصل', true),
('logo_url', 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png', 'text', 'رابط شعار الموقع', true),
('primary_color', '#1e40af', 'text', 'اللون الأساسي للموقع', true),
('shipping_cost_cairo', '30', 'number', 'تكلفة الشحن في القاهرة والجيزة', false),
('shipping_cost_other', '50', 'number', 'تكلفة الشحن في باقي المحافظات', false),
('free_shipping_threshold', '1000', 'number', 'الحد الأدنى للشحن المجاني', true),
('paymob_api_key', '', 'text', 'مفتاح API لبوابة الدفع', false),
('paymob_integration_id', '', 'text', 'معرف التكامل لبوابة الدفع', false),
('maintenance_mode', 'false', 'boolean', 'وضع الصيانة', false),
('max_cart_items', '50', 'number', 'الحد الأقصى للعناصر في السلة', true);

-- Insert Sample Products for Testing
INSERT INTO products (
    title_ar, title_en, short_desc_ar, full_desc_ar, price, original_price, 
    stock, category_name, technical_specs_ar, whatsapp_message_text, 
    image_urls, thumbnail_url, is_featured, tags
) VALUES
(
    'جهاز كاشير اس ايه ار 15 بوصة', 
    'SAR POS System 15 inch', 
    'جهاز كاشير احترافي بشاشة لمس 15 بوصة مع طابعة إيصالات مدمجة',
    'جهاز كاشير متطور بتقنية اللمس بشاشة 15 بوصة عالية الدقة، يتميز بسرعة في المعالجة وسهولة في الاستخدام. يأتي مع طابعة إيصالات مدمجة وإمكانية ربط أجهزة إضافية مثل قارئ الباركود وجهاز POS. مناسب للمتاجر الصغيرة والمتوسطة.',
    8500.00, 9500.00, 15, 'أجهزة كاشير',
    'شاشة: 15 بوصة LCD تعمل باللمس\nالمعالج: Intel Celeron J1900\nالذاكرة: 4GB RAM\nالتخزين: 64GB SSD\nالطابعة: 80mm حرارية مدمجة\nالمنافذ: 4x USB, 1x RJ45, 1x VGA\nنظام التشغيل: Windows 10 IoT',
    'مرحباً، مهتم بشراء المنتج: جهاز كاشير اس ايه ار 15 بوصة - المتوفر بسعر 8500 جنيه. أريد معرفة المزيد من التفاصيل.',
    ARRAY['https://via.placeholder.com/600x400/1e40af/ffffff?text=SAR+POS+15', 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Side+View', 'https://via.placeholder.com/600x400/60a5fa/ffffff?text=Back+View'],
    'https://via.placeholder.com/600x400/1e40af/ffffff?text=SAR+POS+15',
    true,
    ARRAY['كاشير', 'POS', 'شاشة لمس', '15 بوصة', 'طابعة']
),
(
    'طابعة إيصالات حرارية 80mm', 
    'Thermal Receipt Printer 80mm', 
    'طابعة إيصالات حرارية عالية الجودة بعرض 80mm',
    'طابعة إيصالات حرارية احترافية بعرض 80mm، تتميز بسرعة طباعة عالية وجودة ممتازة. تدعم الاتصال عبر USB و Ethernet، مناسبة لجميع أنواع الأعمال التجارية.',
    850.00, 1000.00, 25, 'طابعات',
    'عرض الطباعة: 80mm\nسرعة الطباعة: 200mm/s\nدقة الطباعة: 203 DPI\nالاتصال: USB + Ethernet\nدرج الكاش: متوافق\nقطع الورق: أوتوماتيكي',
    'مرحباً، مهتم بشراء المنتج: طابعة إيصالات حرارية 80mm - المتوفر بسعر 850 جنيه.',
    ARRAY['https://via.placeholder.com/600x400/1e40af/ffffff?text=Thermal+Printer', 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Printer+Side'],
    'https://via.placeholder.com/600x400/1e40af/ffffff?text=Thermal+Printer',
    false,
    ARRAY['طابعة', 'إيصالات', 'حرارية', '80mm']
);

-- Create a function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    order_num TEXT;
BEGIN
    year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(year_suffix) + 2) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders 
    WHERE order_number LIKE year_suffix || '%';
    
    order_num := year_suffix || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Add RLS (Row Level Security) policies for Supabase
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for products and categories
CREATE POLICY "Public read access for active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for public site settings" ON site_settings FOR SELECT USING (is_public = true);

-- Allow public insert for orders and contact messages
CREATE POLICY "Public insert for orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert for order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert for contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert for customers" ON customers FOR INSERT WITH CHECK (true);

-- Admin access policies (will be implemented based on authentication)
-- These can be customized based on your authentication system

-- Insert notification for successful setup
INSERT INTO contact_messages (name, email, subject, message, status) VALUES
('System', 'system@alamer.com', 'Database Setup Complete', 'قاعدة البيانات تم إعدادها بنجاح. يمكن الآن بدء استخدام النظام.', 'read');

COMMENT ON DATABASE CURRENT_DATABASE() IS 'مركز العامر - قاعدة بيانات متجر إلكتروني - تم الإنشاء في 2025-06-23';
