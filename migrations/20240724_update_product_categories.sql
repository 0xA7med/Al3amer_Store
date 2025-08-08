-- Drop old category_id column and add junction table

-- First, create a backup of existing category relationships
CREATE TABLE IF NOT EXISTS product_categories_backup AS
SELECT 
    product_id,
    category_id
FROM products
WHERE category_id IS NOT NULL;

-- Drop old category_id column
ALTER TABLE products 
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS category_name;

-- Create product_categories junction table with proper constraints
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID,
    category_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Create a function to get categories for a product
CREATE OR REPLACE FUNCTION get_product_categories(p_product_id UUID)
RETURNS TABLE (
    category_id UUID,
    name_ar VARCHAR(100),
    name_en VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.category_id, c.name_ar, c.name_en
    FROM categories c
    JOIN product_categories pc ON c.category_id = pc.category_id
    WHERE pc.product_id = p_product_id
    ORDER BY c.display_order, c.name_ar;
END;
$$ LANGUAGE plpgsql;

-- Restore existing relationships from backup
INSERT INTO product_categories (product_id, category_id)
SELECT product_id, category_id
FROM product_categories_backup;

-- Drop the backup table
DROP TABLE IF EXISTS product_categories_backup;

-- Create policies for product_categories table
CREATE POLICY "Public read for product categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Public insert for product categories" ON product_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for product categories" ON product_categories FOR UPDATE USING (true);
CREATE POLICY "Public delete for product categories" ON product_categories FOR DELETE USING (true);
