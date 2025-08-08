-- حذف الدوال القديمة
DROP FUNCTION IF EXISTS public.get_admin_orders(text, text, text, text, text);

-- إنشاء الدالة المعدلة
CREATE OR REPLACE FUNCTION public.get_admin_orders(
  p_search_term TEXT DEFAULT '',
  p_status TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all', -- معامل وهمي للحفاظ على التوافق
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  created_at TIMESTAMPTZ,
  status TEXT,
  total_amount NUMERIC,
  payment_method TEXT, -- نرجع قيمة ثابتة
  order_items JSONB,
  "user" JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_sort_by NOT IN ('created_at', 'total_amount', 'status') THEN
    p_sort_by := 'created_at';
  END IF;

  RETURN QUERY EXECUTE format(
    $query$
    SELECT
      o.order_id as id,
      UPPER(SUBSTRING(o.order_id::text FROM 1 FOR 8)) as order_number,
      o.created_at,
      o.status::text,
      o.total as total_amount,
      'N/A' as payment_method, -- قيمة ثابتة لأن العمود غير موجود
      (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'quantity', oi.quantity, 
            'price', oi.price,
            'product', jsonb_build_object(
                'id', p.id,
                'title_ar', p.title_ar, 
                'image_urls', p.images
            )
          )
        ), '[]'::jsonb)
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.order_id
      ) as order_items,
      jsonb_build_object(
        'id', o.user_id, 
        'full_name', COALESCE(u.raw_user_meta_data->>'full_name', 'عميل زائر'),
        'email', COALESCE(u.email, o.email),
        'phone', COALESCE(u.phone, o.phone)
      ) as "user"
    FROM
      orders o
      LEFT JOIN auth.users u ON o.user_id = u.id::uuid
    WHERE
      ($1 = 'all' OR o.status = $1::text)
      -- تم إزالة فلتر طريقة الدفع
      AND (
        p_search_term IS NULL OR p_search_term = '' OR
        UPPER(SUBSTRING(o.order_id::text FROM 1 FOR 8)) ILIKE '%%' || $2 || '%%' OR
        COALESCE(u.raw_user_meta_data->>'full_name', '') ILIKE '%%' || $2 || '%%' OR
        COALESCE(u.phone, o.phone, '') ILIKE '%%' || $2 || '%%' OR
        COALESCE(u.email, o.email, '') ILIKE '%%' || $2 || '%%'
      )
    ORDER BY %I %s
    $query$,
    p_sort_by,
    p_sort_order
  )
  USING p_status, p_search_term;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.get_admin_orders(text, text, text, text, text) 
TO authenticated, anon, service_role;
