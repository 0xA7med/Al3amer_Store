-- Create domain-specific settings tables
CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settings_id" uuid NOT NULL,
	"paymob_enabled" boolean DEFAULT false,
	"paymob_api_key" text,
	"paymob_integration_card" text,
	"paymob_integration_wallet" text,
	"paymob_iframe_id" text,
	"cod_enabled" boolean DEFAULT true,
	"cod_extra_fee" numeric(10, 2) DEFAULT '0',
	"cod_advance_payment" numeric(10, 2) DEFAULT '100',
	"cod_return_shipping_base_fee" numeric(10, 2) DEFAULT '30',
	"cod_return_shipping_base_amount" numeric(10, 2) DEFAULT '1000',
	"cod_return_shipping_extra_fee" numeric(10, 2) DEFAULT '5',
	"cod_return_shipping_extra_amount" numeric(10, 2) DEFAULT '1000',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settings_id" uuid NOT NULL,
	"telegram_enabled" boolean DEFAULT false,
	"telegram_bot_token" text,
	"telegram_chat_id" text,
	"whatsapp_enabled" boolean DEFAULT false,
	"whatsapp_api_key" text,
	"whatsapp_recipient_phone" text,
	"email_enabled" boolean DEFAULT false,
	"smtp_host" text,
	"smtp_port" integer DEFAULT 587,
	"smtp_user" text,
	"smtp_pass" text,
	"email_from" text,
	"email_receiver" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settings_id" uuid NOT NULL,
	"ai_enabled" boolean DEFAULT true,
	"google_api_key" text,
	"ai_api_key" text,
	"ai_tone" text DEFAULT 'Marketing',
	"ai_language" text DEFAULT 'ar',
	"ai_description_length" text DEFAULT 'medium',
	"ai_fields" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shipping_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settings_id" uuid NOT NULL,
	"shipping_flat_rate" numeric(10, 2) DEFAULT '50',
	"free_shipping_threshold" numeric(10, 2) DEFAULT '2000',
	"custom_city_rates_enabled" boolean DEFAULT false,
	"city_shipping_rates" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);--> statement-breakpoint

-- Foreign keys for domain tables
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_settings_id_settings_id_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_settings_id_settings_id_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_settings_id_settings_id_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_settings" ADD CONSTRAINT "shipping_settings_settings_id_settings_id_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Indexes on FK columns for domain tables
CREATE INDEX IF NOT EXISTS "idx_payment_settings_settings_id" ON "payment_settings" USING btree ("settings_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_settings_settings_id" ON "notification_settings" USING btree ("settings_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_settings_settings_id" ON "ai_settings" USING btree ("settings_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipping_settings_settings_id" ON "shipping_settings" USING btree ("settings_id");--> statement-breakpoint

-- Indexes on FK columns for existing tables
CREATE INDEX IF NOT EXISTS "idx_addresses_user_id" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_brand_id" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_parent_id" ON "products" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_images_product_id" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_trader_id" ON "orders" USING btree ("trader_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_product_id" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_user_id" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_bundle_logs_user_id" ON "ai_bundle_logs" USING btree ("user_id");--> statement-breakpoint

-- Add created_at / updated_at columns to settings table
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
