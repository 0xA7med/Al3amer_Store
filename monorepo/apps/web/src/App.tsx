import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header, Footer } from './components/layout';
import { AdminLayout } from './components/admin';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { WhatsAppFloatingButton } from './components/ui/WhatsAppFloatingButton';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function PageSkeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-slate-400 text-sm font-body">جاري التحميل...</p>
      </div>
    </div>
  );
}

// Lazy-loaded Customer Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AIBundleBuilderPage = lazy(() => import('./pages/AIBundleBuilderPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const PaymentCallbackPage = lazy(() => import('./pages/PaymentCallbackPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage'));

// Lazy-loaded Admin Pages
const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview'));
const ProductList = lazy(() => import('./pages/admin/ProductList'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const OrdersManagement = lazy(() => import('./pages/admin/OrdersManagement'));
const CustomersManagement = lazy(() => import('./pages/admin/CustomersManagement'));
const CustomerProfile = lazy(() => import('./pages/admin/CustomerProfile'));
const CategoriesManagement = lazy(() => import('./pages/admin/CategoriesManagement'));
const CouponsManagement = lazy(() => import('./pages/admin/CouponsManagement'));
const ReviewsModeration = lazy(() => import('./pages/admin/ReviewsModeration'));
const AIBundleLogs = lazy(() => import('./pages/admin/AIBundleLogs'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const AdminAISettingsPage = lazy(() => import('./pages/admin/AdminAISettingsPage'));
const MetadataManagement = lazy(() => import('./pages/admin/MetadataManagement'));
const OrderAWB = lazy(() => import('./components/admin/OrderAWB'));

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Customer Routes - with Header & Footer */}
              <Route
                path="/*"
                element={
                  <div className="min-h-screen flex flex-col overflow-x-hidden">
                    <Header />
                    <main className="flex-grow flex flex-col">
                      <ErrorBoundary>
                      <Suspense fallback={<PageSkeleton />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/product/:slug" element={<ProductDetailsPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order-success/:id" element={<OrderSuccessPage />} />
                        <Route path="/track-order/:id" element={<OrderTrackingPage />} />
                        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                        <Route path="/ai-builder" element={<AIBundleBuilderPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/account"
                          element={
                            <ProtectedRoute>
                              <AccountPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/offers" element={<OffersPage />} />
                        <Route path="/about" element={<AboutUsPage />} />
                        <Route path="/return-policy" element={<ReturnPolicyPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                      </Suspense>
                      </ErrorBoundary>
                    </main>
                    <Footer />
                    <WhatsAppFloatingButton />
                  </div>
                }
              />

              {/* Admin Routes - Protected with Admin Role */}
              <Route
                path="/admin/orders/:id/print"
                element={
                  <ProtectedRoute requireAdmin>
                    <ErrorBoundary>
                      <Suspense fallback={<PageSkeleton />}>
                        <OrderAWB />
                      </Suspense>
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/add" element={<AddProduct />} />
                <Route path="products/:id" element={<AddProduct />} />
                <Route path="orders" element={<OrdersManagement />} />
                <Route path="customers" element={<CustomersManagement />} />
                <Route path="customers/:phone" element={<CustomerProfile />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="coupons" element={<CouponsManagement />} />
                <Route path="reviews" element={<ReviewsModeration />} />
                <Route path="ai-logs" element={<AIBundleLogs />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="ai-settings" element={<AdminAISettingsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="metadata" element={<MetadataManagement />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
