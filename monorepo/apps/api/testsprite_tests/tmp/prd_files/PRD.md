# Al3amer Store - Product Requirements Document (PRD)

## Project Overview
Al3amer Store is a full-stack e-commerce platform specializing in POS (Point of Sale) systems and hardware in Egypt. It serves both B2C customers and provides a comprehensive Admin Dashboard for management.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Firebase (Google/Phone) & JWT
- **Payment:** Paymob Integration (Cards & Mobile Wallets)

## Core API Features (Backend)

### 1. Public Storefront APIs
- **Products:** GET /api/products (List with filters), GET /api/products/:slug (Details).
- **Categories:** GET /api/categories (Tree structure).
- **Cart/Orders:** POST /api/orders (Create order with validation).
- **Settings:** GET /api/settings/public (Store info, logo, shipping rates).

### 2. Authentication
- **Social Login:** POST /api/auth/social (Syncs Firebase user with Postgres DB).
- **Admin Auth:** Protected routes requiring Bearer Token.

### 3. Payment Integration (Paymob)
- **Initiate:** Handles Card and Wallet payments.
- **Callbacks:** POST /api/webhook/paymob (HMAC secured) to update order status.

### 4. Admin Dashboard APIs (Protected)
- **Analytics:** GET /api/admin/reports (Sales charts, Top products).
- **Inventory Sync:** POST /api/products/import (Excel bulk update).
- **AI Features:** POST /api/products/ai-generate (Gemini integration for descriptions).
- **Management:** CRUD for Products, Orders, Customers, Coupons.

## Testing Focus
Please verify:
1.  API Health: All GET endpoints return 200 OK.
2.  Error Handling: Invalid IDs return 404 or 400.
3.  Business Logic: Order creation calculates totals correctly (Subtotal + Shipping - Discount).