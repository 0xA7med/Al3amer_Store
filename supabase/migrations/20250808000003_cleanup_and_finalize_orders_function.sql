-- الخطوة 1: حذف جميع الإصدارات القديمة من الدالة
DO $$
BEGIN
  -- حذف جميع الدوال المتضاربة
  DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text);
  DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text, text, date, date);
  DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text, text, date, date, text);
  
  -- التأكد من حذف جميع الدوال
  RAISE NOTICE 'تم حذف جميع الإصدارات القديمة من الدالة';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'حدث خطأ أثناء حذف الدوال القديمة: %', SQLERRM;
END $$;

-- الخطوة 2: إنشاء الدالة النهائية
CREATE OR REPLACE FUNCTION public.get_admin_orders(
  p_status TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
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
              'product_name', COALESCE(p.name, 'غير معروف'),
              'product_image', COALESCE(p.image_url, '')
            )
          )
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = o.order_id
        ) as items
      FROM orders o
      WHERE ($1 = 'all' OR o.status = $1)
        AND ($2 = 'all' OR o.payment_method = $2)
    )
    SELECT jsonb_build_object(
      'order_id', owi.order_id,
      'status', owi.status,
      'payment_method', owi.payment_method,
      'created_at', owi.created_at,
      'updated_at', owi.updated_at,
      'user_id', owi.user_id,
      'total', owi.total,
      'items', COALESCE(owi.items, '[]'::jsonb)
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

-- الخطوة 3: منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.get_admin_orders(text, text, text, text) 
TO authenticated, anon, service_role;

-- الخطوة 4: التأكد من إنشاء الدالة بنجاح
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname = 'get_admin_orders';
  
  IF func_count > 0 THEN
    RAISE NOTICE 'تم إنشاء الدالة بنجاح. عدد الإصدارات الحالي: %', func_count;
  ELSE
    RAISE WARNING 'فشل في إنشاء الدالة';
  END IF;
END $$;
