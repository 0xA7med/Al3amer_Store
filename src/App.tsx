import React from 'react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { CartProvider } from '@/contexts/CartContext'
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/layout/AdminLayout'
import Home from '@/pages/Home'
import Products from '@/pages/Products'
import ProductDetails from '@/pages/ProductDetails'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderSuccess from '@/pages/OrderSuccess'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ProductsAdmin from '@/pages/admin/ProductsAdmin';
import CategoriesAdmin from '@/pages/admin/CategoriesAdmin';
import OrdersAdmin from '@/pages/admin/OrdersAdmin';
import ReportsAdmin from '@/pages/admin/ReportsAdmin';
import SettingsAdmin from '@/pages/admin/SettingsAdmin';
import AuthLogin from '@/pages/AuthLogin';
import AdminIndex from '@/pages/admin';
import './lib/i18n'

// Wrapper component for Layout
const LayoutWrapper: React.FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);

// Wrapper component for Admin pages
const AdminWrapper: React.FC = () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
);

import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LayoutWrapper />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success" element={<OrderSuccess />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>
          
          {/* Admin Routes - Inside main layout but with admin sidebar */}
          <Route path="/admin" element={<AdminIndex />}>
            <Route element={<AdminWrapper/>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="reports" element={<ReportsAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
            </Route>
          </Route>
          {/* Admin Login Route */}
          <Route path="/admin-login" element={<AuthLogin />} />
          
          {/* Fallback route */}
          <Route path="*" element={
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - الصفحة غير موجودة</h1>
              <p className="text-lg text-gray-600 mb-8">الصفحة التي تبحث عنها غير موجودة</p>
              <a href="/" className="btn-alamer inline-block px-6 py-3 bg-alamer-blue text-white rounded-lg hover:bg-alamer-blue-dark">
                العودة للرئيسية
              </a>
            </div>
          } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
