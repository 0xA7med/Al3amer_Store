import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import aiBundleRouter from './routes/ai-bundle.js';
import ordersRouter from './routes/orders.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import adminRouter from './routes/admin.js';
import usersRouter from './routes/users.js';
import couponsRouter from './routes/coupons.js';
import reviewsRouter from './routes/reviews.js';
import addressesRouter from './routes/addresses.js';
import wishlistRouter from './routes/wishlist.js';
import brandsRouter from './routes/brands.js';
import webhookRouter from './routes/webhook.js';
import debugRouter from './routes/debug.js';
import metadataRouter from './routes/metadata.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes

app.use('/api/products', productsRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/ai-bundle', aiBundleRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/debug', debugRouter);
app.use('/api/metadata', metadataRouter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Al3amer API is running' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// الكود القديم (امسحه أو خليه في تعليق)
// app.listen(PORT, () => {
//     console.log(`🚀 API server running on http://localhost:${PORT}`);
// });

// الكود الجديد (Compatible with Vercel)
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;
