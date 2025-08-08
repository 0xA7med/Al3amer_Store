-- إسقاط الدالة إذا كانت موجودة
DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text);

-- إنشاء الدالة النهائية
CREATE OR REPLACE FUNCTION get_admin_orders(
  p_status TEXT,
  p_payment_method TEXT,
  p_sort_by TEXT,
  p_sort_order TEXT
)
RETURNS TABLE (order_data JSONB) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE '
    WITH order_with_items AS (
      SELECT 
        o.*,
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              ''product_id'', oi.product_id,
              ''quantity'', oi.quantity,
              ''price'', oi.price,
              ''product_name'', p.name,
              ''product_image'', p.image_url
            )
          )
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = o.order_id
        ) as items
      FROM orders o
      WHERE ($1 = ''all'' OR o.status = $1)
        AND ($2 = ''all'' OR o.payment_method = $2)
    )
    SELECT 
      jsonb_build_object(
        ''order_id'', owi.order_id,
        ''status'', owi.status,
        ''payment_method'', owi.payment_method,
        ''created_at'', owi.created_at,
        ''updated_at'', owi.updated_at,
        ''user_id'', owi.user_id,
        ''total'', owi.total,
        ''items'', owi.items
      )
    FROM order_with_items owi
    ORDER BY ' || 
    CASE 
      WHEN p_sort_by = 'created_at' THEN 'owi.created_at'
      WHEN p_sort_by = 'total' THEN 'owi.total'
      WHEN p_sort_by = 'status' THEN 'owi.status'
      ELSE 'owi.created_at'
    END || ' ' ||
    CASE 
      WHEN lower(p_sort_order) = 'asc' THEN 'ASC'
      ELSE 'DESC'
    END
  '
  USING p_status, p_payment_method;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION get_admin_orders(text, text, text, text) TO authenticated, anon, service_role;
