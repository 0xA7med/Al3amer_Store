-- Create product_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(category_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (product_id, category_id)
);

-- Create index for better performance
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
