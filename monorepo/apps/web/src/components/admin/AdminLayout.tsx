import { Link, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../layout/Header';



const SIDEBAR_LINKS = [
    { path: '/admin', icon: 'dashboard', label: 'لوحة التحكم', exact: true },
    { path: '/admin/products', icon: 'inventory_2', label: 'المنتجات' },
    { path: '/admin/orders', icon: 'receipt_long', label: 'الطلبات' },
    { path: '/admin/customers', icon: 'people', label: 'العملاء' },
    { path: '/admin/categories', icon: 'account_tree', label: 'الفئات' },
    { path: '/admin/coupons', icon: 'confirmation_number', label: 'أكواد الخصم' },
    { path: '/admin/reviews', icon: 'reviews', label: 'التقييمات' },
    { path: '/admin/reports', icon: 'bar_chart', label: 'التقارير' },
    { path: '/admin/ai-logs', icon: 'auto_awesome', label: 'سجلات AI' },
    { path: '/admin/ai-settings', icon: 'psychology', label: 'إعدادات AI' },
    { path: '/admin/settings', icon: 'settings', label: 'الإعدادات' },
];

export function AdminLayout() {
    const location = useLocation();

    const isActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Global Header */}
            <div className="sticky top-0 z-50">
                <Header />
            </div>

            <div className="flex flex-1 relative">
                {/* Sidebar */}
                <aside className="w-64 bg-[#0d121c] border-l border-white/5 flex flex-col sticky top-20 h-[calc(100vh-80px)] overflow-hidden hidden md:flex shrink-0">

                    {/* Admin Label */}
                    <div className="p-6 border-b border-white/5 bg-surface-dark/50">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">admin_panel_settings</span>
                            </div>
                            <div>
                                <h2 className="text-white font-bold leading-none">لوحة الإدارة</h2>
                                <p className="text-[10px] text-gray-400 mt-1">Al3amer Admin</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 overflow-y-auto">
                        <ul className="space-y-1">
                            {SIDEBAR_LINKS.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive(link.path, link.exact)
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-xl ${isActive(link.path, link.exact) ? 'symbol-filled' : ''}`}>
                                            {link.icon}
                                        </span>
                                        <span className="font-medium text-sm">{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer / Quick Link */}
                    <div className="p-4 border-t border-white/5">
                        <Link to="/" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white text-xs">
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            <span>العودة للمتجر</span>
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#0f1115]">
                    {/* You can restore a simpler TopBar here if needed for breadcrumbs, but user asked to remove specific Admin TopBar */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

// Dummy AdminRoute wrapper for simulating protected routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
    // In a real app, this would check authentication
    const isAuthenticated = true; // Simulated auth

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">غير مصرح</h1>
                    <Link to="/login" className="text-primary hover:underline">تسجيل الدخول</Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

export default AdminLayout;
