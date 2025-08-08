-- This script will help us view the structure of the orders table
-- Run this in your Supabase SQL editor to see the actual column names

-- View table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders';

-- Or view a sample of the data (first row)
SELECT * FROM public.orders LIMIT 1;
