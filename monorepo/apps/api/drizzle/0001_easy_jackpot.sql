ALTER TABLE "users" DROP CONSTRAINT "users_phone_unique";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "phone2" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cod_advance_payment" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cod_return_shipping" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_at_delivery" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trader_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trader_commission" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "final_cod_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_name_awb" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variant_options" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "accounting_multiplier" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sales_tiers" jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cod_advance_payment" numeric(10, 2) DEFAULT '100';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cod_return_shipping_base_fee" numeric(10, 2) DEFAULT '30';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cod_return_shipping_base_amount" numeric(10, 2) DEFAULT '1000';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cod_return_shipping_extra_fee" numeric(10, 2) DEFAULT '5';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cod_return_shipping_extra_amount" numeric(10, 2) DEFAULT '1000';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "telegram_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "telegram_bot_token" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "whatsapp_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "whatsapp_api_key" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "whatsapp_recipient_phone" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "email_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "smtp_host" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "smtp_port" integer DEFAULT 587;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "smtp_user" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "smtp_pass" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "email_from" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "email_receiver" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "bill_layout_config" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone2" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "governorate" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trader_branding" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "discount_config" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_trader_id_users_id_fk" FOREIGN KEY ("trader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;