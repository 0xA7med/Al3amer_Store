import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import './lib/i18n'

// Lazy load admin components
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ProductsAdmin = lazy(() => import('./pages/admin/ProductsAdmin'))
const CategoriesAdmin = lazy(() => import('./pages/admin/CategoriesAdmin'))
const OrdersAdmin = lazy(() => import('./pages/admin/OrdersAdmin'))
const ReportsAdmin = lazy(() => import('./pages/admin/ReportsAdmin'))
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'))
const AuthLogin = lazy(() => import('./pages/AuthLogin'))
const AdminIndex = lazy(() => import('./pages/admin'))

// Wrapper component for Layout
const LayoutWrapper: React.FC = () => (
  <Layout>
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Outlet />
    </Suspense>
  </Layout>
);

// Wrapper component for Admin pages with auth protection
const AdminWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!session) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }

  return (
    <AdminLayout>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </AdminLayout>
  )
}

// Public route wrapper
const PublicRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { session, loading } = useAuth()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin/dashboard'

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  // If user is already logged in, redirect to admin dashboard
  if (session) {
    return <Navigate to={from} replace />
  }

  return <>{element}</>
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LayoutWrapper />}>
              <Route index element={<Suspense fallback={<LoadingSpinner />}><Home /></Suspense>} />
              <Route path="products" element={<Suspense fallback={<LoadingSpinner />}><Products /></Suspense>} />
              <Route path="product/:id" element={<Suspense fallback={<LoadingSpinner />}><ProductDetails /></Suspense>} />
              <Route path="cart" element={<Suspense fallback={<LoadingSpinner />}><Cart /></Suspense>} />
              <Route path="checkout" element={<Suspense fallback={<LoadingSpinner />}><Checkout /></Suspense>} />
              <Route path="order-success" element={<Suspense fallback={<LoadingSpinner />}><OrderSuccess /></Suspense>} />
              <Route path="about" element={<Suspense fallback={<LoadingSpinner />}><About /></Suspense>} />
              <Route path="contact" element={<Suspense fallback={<LoadingSpinner />}><Contact /></Suspense>} />
            </Route>
            
            {/* Admin Login Route */}
            <Route 
              path="/admin-login" 
              element={
                <PublicRoute 
                  element={
                    <Suspense fallback={<LoadingSpinner fullScreen />}>
                      <AuthLogin />
                    </Suspense>
                  } 
                />
              } 
            />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminWrapper>
                  <AdminIndex />
                </AdminWrapper>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="reports" element={<ReportsAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
            </Route>
            
            {/* Fallback route */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center p-8 max-w-md w-full">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - الصفحة غير موجودة</h1>
                    <p className="text-lg text-gray-600 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة</p>
                    <a 
                      href="/" 
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      العودة للرئيسية
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
