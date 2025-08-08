create or replace function get_admin_orders(
  p_status text,
  p_payment_method text,
  p_sort_by text,
  p_sort_order text
) 
returns table (
    id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    user_id uuid,
    total_price numeric,
    status text,
    payment_method text,
    shipping_address jsonb,
    order_number text,
    "user" json,
    order_items json[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    o.id,
    o.created_at,
    o.updated_at,
    o.user_id,
    o.total_price,
    o.status,
    o.payment_method,
    o.shipping_address,
    o.order_number,
    json_build_object(
      'id', u.id,
      'full_name', u.full_name,
      'email', u.email,
      'phone', u.phone
    ) as "user",
    array(
      select json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'price', oi.price,
        'product', json_build_object(
          'title_ar', p.title_ar,
          'title_en', p.title_en,
          'image_urls', p.image_urls
        )
      )
      from order_items oi
      join products p on oi.product_id = p.id
      where oi.order_id = o.id
    ) as order_items
  from
    orders o
    left join profiles u on o.user_id = u.id
  where
    (p_status = 'all' or o.status = p_status)
    and (p_payment_method = 'all' or o.payment_method = p_payment_method)
  order by
    case when p_sort_by = 'created_at' and p_sort_order = 'asc' then o.created_at end asc,
    case when p_sort_by = 'created_at' and p_sort_order = 'desc' then o.created_at end desc,
    case when p_sort_by = 'total_price' and p_sort_order = 'asc' then o.total_price end asc,
    case when p_sort_by = 'total_price' and p_sort_order = 'desc' then o.total_price end desc;
end; 
$$;
