-- الخطوة 1: عرض الدوال الحالية
SELECT proname, oidvectortypes(proargtypes) AS arg_types
FROM pg_proc
WHERE proname = 'get_admin_orders';

-- الخطوة 2: حذف جميع الإصدارات القديمة
DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text);
DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text, text, date, date);
DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text, text, date, date, text);

-- الخطوة 3: إنشاء الدالة النهائية
CREATE OR REPLACE FUNCTION public.get_admin_orders(
  p_status TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_user_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (order_data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    $sql$
    WITH order_with_items AS (
      SELECT 
        o.*,
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'product_name', p.name,
              'product_image', p.image_url
            )
          )
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = o.order_id
        ) as items
      FROM orders o
      LEFT JOIN auth.users u ON o.user_id = u.id
      LEFT JOIN order_items oi2 ON o.order_id = oi2.order_id
      LEFT JOIN products p2 ON oi2.product_id = p2.product_id
      WHERE ($1 = 'all' OR o.status = $1)
        AND ($2 = 'all' OR o.payment_method = $2)
        AND ($5 IS NULL OR o.user_id::text = $5)
        AND ($6 IS NULL OR o.created_at::date >= $6)
        AND ($7 IS NULL OR o.created_at::date <= $7)
        AND (
          $8 IS NULL OR
          o.order_id::text ILIKE '%%' || $8 || '%%' OR
          COALESCE(u.email, '') ILIKE '%%' || $8 || '%%' OR
          COALESCE(u.phone, '') ILIKE '%%' || $8 || '%%' OR
          COALESCE(p2.name, '') ILIKE '%%' || $8 || '%%'
        )
    )
    SELECT jsonb_build_object(
      'order_id', owi.order_id,
      'status', owi.status,
      'payment_method', owi.payment_method,
      'created_at', owi.created_at,
      'updated_at', owi.updated_at,
      'user_id', owi.user_id,
      'total', owi.total,
      'items', owi.items
    )
    FROM order_with_items owi
    ORDER BY %I %s
    $sql$,
    -- معالجة عمود الترتيب
    CASE 
      WHEN p_sort_by = 'created_at' THEN 'created_at'
      WHEN p_sort_by = 'total' THEN 'total'
      WHEN p_sort_by = 'status' THEN 'status'
      ELSE 'created_at'
    END,
    -- معالجة اتجاه الترتيب
    CASE WHEN lower(coalesce(p_sort_order, 'desc')) = 'asc' THEN 'ASC' ELSE 'DESC' END
  );
END;
$$;

-- الخطوة 4: منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.get_admin_orders(
  text, text, text, text, text, date, date, text
) TO authenticated, anon, service_role;
