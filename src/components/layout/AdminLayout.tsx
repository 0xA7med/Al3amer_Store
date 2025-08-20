import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Header from './Header';
import { SearchProvider } from '@/contexts/SearchContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login');
  };

  const navigationItems = [
    { path: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { path: '/admin/products', label: 'إدارة المنتجات', icon: Package },
    { path: '/admin/orders', label: 'إدارة الطلبات', icon: ShoppingCart },
    { path: '/admin/reports', label: 'التقارير', icon: BarChart3 },
    { path: '/admin/settings', label: 'الإعدادات', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path || (location.pathname === '/admin' && path === '/admin/dashboard');

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">لوحة التحكم</h2>
      </div>
      <div className="p-2">
        <p className="text-sm text-gray-600 px-4 py-2">مرحباً, {user?.email}</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-alamer-blue text-white'
                    : 'text-gray-700 hover:text-alamer-blue hover:bg-alamer-blue/10'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t space-y-2 mt-auto">
        <Link to="/">
          <Button variant="outline" className="w-full">
            <LogOut size={16} className="ml-2" />
            العودة للموقع
          </Button>
        </Link>
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut size={16} className="ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <SearchProvider>
      <div className="min-h-screen bg-gray-50 font-arabic rtl">
        <Header />

        <div className="lg:hidden p-4 flex justify-between items-center bg-white border-b sticky top-0 z-30">
            <h1 className="text-lg font-bold">
                {navigationItems.find(item => isActive(item.path))?.label || "القائمة"}
            </h1>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-700"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
        </div>

        <div className="flex">
          <aside className="hidden lg:block w-64 h-screen sticky top-0">
            <SidebarContent />
          </aside>

          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>

          {/* Mobile Sidebar (Drawer) */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 flex justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-700"
                >
                    <X size={24} />
                </Button>
              </div>
              <SidebarContent />
          </div>
        </div>
      </div>
    </SearchProvider>
  );
};

export default AdminLayout; 