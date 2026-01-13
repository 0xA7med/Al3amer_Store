# Al3amer Store API

Backend API for Al3amer Store built with Express.js, Drizzle ORM, and PostgreSQL.

## Features

- ✅ RESTful API with Express.js
- ✅ Drizzle ORM for type-safe database queries
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ Product management with images and specifications
- ✅ AI-powered bundle builder
- ✅ Order management
- ✅ Global settings configuration

## Setup

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` with your PostgreSQL connection string.

### 3. Generate and Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

### 4. Seed the Database

```bash
npm run db:seed
```

This will create:
- 1 Admin user (`admin@al3amer.com` / `admin`)
- 5 Categories (POS, Scanners, Printers, Scales, Drawers)
- 4 Brands (Sunmi, Epson, Zebra, Honeywell)
- 5 Sample products with images
- Default store settings

### 5. Start the Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Products

- `GET /api/products` - List products (with pagination & filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### AI Bundle

- `POST /api/ai-bundle/generate` - Generate AI bundle
- `POST /api/ai-bundle/log` - Save bundle generation log

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status

### Settings

- `GET /api/settings` - Get global settings
- `PUT /api/settings` - Update settings

## Database Schema

The database schema is defined using Drizzle ORM in `src/db/schema.ts`. It includes:

- **users** - User accounts (customers & admins)
- **categories** - Product categories
- **brands** - Product brands
- **products** - Products with specifications, tags, and metadata
- **product_images** - Product images (multiple per product)
- **orders** - Customer orders
- **order_items** - Order line items
- **ai_bundle_logs** - AI bundle generation logs
- **settings** - Global store settings
- **banners** - Homepage banners

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
apps/api/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # Express routes
│   ├── db/              # Database configuration and schema
│   ├── scripts/         # Utility scripts (seed, etc.)
│   └── index.ts         # Express app entry point
├── drizzle/             # Generated migration files
├── package.json
├── tsconfig.json
└── drizzle.config.ts    # Drizzle configuration
```

## Admin Credentials

After seeding, you can login with:
- **Email:** `admin@al3amer.com`
- **Password:** `admin`

**⚠️ Important:** Change these credentials in production!
