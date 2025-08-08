import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin-login');
  };

  const navigationItems = [
    { path: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
    { path: '/admin/products', label: 'إدارة المنتجات', icon: Package },
    { path: '/admin/orders', label: 'إدارة الطلبات', icon: ShoppingCart },
    { path: '/admin/reports', label: 'التقارير', icon: BarChart3 },
    { path: '/admin/settings', label: 'الإعدادات', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar - Fixed on the left */}
      <div className={`fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:relative lg:z-0 lg:translate-x-0 lg:h-auto`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b">
            {/* <h2 className="text-xl font-bold text-gray-900">لوحة تحكم المدير</h2> */}
            <p className="text-sm text-gray-600 mt-1">مرحباً، المدير</p>
          </div>
          
          {/* Navigation */}
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
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
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
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t space-y-2">
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4 z-30 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <h1 className="text-xl font-bold text-gray-900">لوحة تحكم المدير</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout; 