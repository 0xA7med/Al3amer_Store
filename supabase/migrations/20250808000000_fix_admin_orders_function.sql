-- إسقاط الدالة إذا كانت موجودة
DROP FUNCTION IF EXISTS get_admin_orders(text, text, text, text);

-- إنشاء الدالة
CREATE OR REPLACE FUNCTION get_admin_orders(
  p_status TEXT,
  p_payment_method TEXT,
  p_sort_by TEXT,
  p_sort_order TEXT
)
RETURNS TABLE (
  order_data JSONB
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
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
      WHERE (%L = ''all'' OR o.status = %L)
        AND (%L = ''all'' OR o.payment_method = %L)
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
    ORDER BY %I %s',
    p_status, p_status,
    p_payment_method, p_payment_method,
    COALESCE(NULLIF(p_sort_by, ''''), 'created_at'),
    CASE WHEN lower(COALESCE(p_sort_order, '''')) = 'asc' THEN 'ASC' ELSE 'DESC' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION get_admin_orders(text, text, text, text) TO authenticated, anon, service_role;
        'email', email,
        'full_name', COALESCE(raw_user_meta_data->>'full_name', email),
        'phone', COALESCE(phone, raw_user_meta_data->>'phone', '')
      ) INTO user_data
      FROM auth.users
      WHERE id = order_record.user_id;
    EXCEPTION WHEN OTHERS THEN
      user_data := jsonb_build_object('error', 'فشل في جلب بيانات المستخدم');
    END;
    
    -- جلب عناصر الطلب
    order_items := '{}';
    
    FOR item_record IN 
      SELECT * FROM public.order_items 
      WHERE order_id = order_id
    LOOP
      -- جلب بيانات المنتج
      BEGIN
        SELECT jsonb_build_object(
          'title_ar', COALESCE(title_ar, 'بدون عنوان'),
          'title_en', COALESCE(title_en, 'No Title'),
          'image_urls', COALESCE(image_urls, '[]'::jsonb)
        ) INTO product_data
        FROM public.products
        WHERE id = item_record.product_id;
      EXCEPTION WHEN OTHERS THEN
        product_data := jsonb_build_object('error', 'فشل في جلب بيانات المنتج');
      END;
      
      -- إضافة عنصر الطلب إلى المصفوفة
      item_data := jsonb_build_object(
        'id', item_record.id,
        'quantity', item_record.quantity,
        'price', item_record.price,
        'product', COALESCE(product_data, jsonb_build_object('error', 'لا توجد بيانات'))
      );
      
      order_items := array_append(order_items, item_data);
    END LOOP;
    
    -- إنشاء كائن الطلب
    order_data := jsonb_build_object(
      'id', order_id,
      'created_at', order_record.created_at,
      'updated_at', order_record.updated_at,
      'user_id', order_record.user_id,
      'total_price', COALESCE(order_record.total_amount, 0),
      'total_amount', COALESCE(order_record.total_amount, 0),
      'status', COALESCE(order_record.status, 'unknown'),
      'payment_method', COALESCE(
        order_record.payment_type, 
        order_record.payment_method, 
        'cash_on_delivery'
      ),
      'shipping_address', COALESCE(order_record.shipping_address, '{}'::jsonb),
      'order_number', COALESCE(order_record.order_number, 'N/A'),
      'user', COALESCE(user_data, '{}'::jsonb),
      'order_items', COALESCE(order_items, '[]'::jsonb)
    );
    
    -- إضافة الطلب إلى المصفوفة النهائية
    order_array := array_append(order_array, order_data);
  END LOOP;
  
  -- إرجاع النتيجة
  RETURN order_array;
end;
$$;

-- منح الصلاحيات المناسبة
GRANT EXECUTE ON FUNCTION get_admin_orders(text, text, text, text) TO authenticated, anon, service_role;
