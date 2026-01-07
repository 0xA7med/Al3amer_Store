import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components/layout';
import { AdminLayout, AdminRoute } from './components/admin';

// Customer Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AIBundleBuilderPage from './pages/AIBundleBuilderPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import OffersPage from './pages/OffersPage';
import AboutUsPage from './pages/AboutUsPage';

// Admin Pages
import DashboardOverview from './pages/admin/DashboardOverview';
import ProductList from './pages/admin/ProductList';
import AddProduct from './pages/admin/AddProduct';
import OrdersManagement from './pages/admin/OrdersManagement';
import CustomersManagement from './pages/admin/CustomersManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import CouponsManagement from './pages/admin/CouponsManagement';
import ReviewsModeration from './pages/admin/ReviewsModeration';
import AIBundleLogs from './pages/admin/AIBundleLogs';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminAISettingsPage from './pages/admin/AdminAISettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes - with Header & Footer */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen flex flex-col overflow-x-hidden">
              <Header />
              <main className="flex-grow flex flex-col">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/ai-builder" element={<AIBundleBuilderPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/about" element={<AboutUsPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />

        {/* Admin Routes - with AdminLayout */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/:id" element={<AddProduct />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<CustomersManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="coupons" element={<CouponsManagement />} />
          <Route path="reviews" element={<ReviewsModeration />} />
          <Route path="ai-logs" element={<AIBundleLogs />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="ai-settings" element={<AdminAISettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
