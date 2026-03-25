import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const SIDEBAR_LINKS = [
    { path: '/admin', icon: 'dashboard', label: 'لوحة التحكم', exact: true },
    { path: '/admin/products', icon: 'inventory_2', label: 'المنتجات' },
    { path: '/admin/categories', icon: 'account_tree', label: 'الفئات' },
    { path: '/admin/orders', icon: 'receipt_long', label: 'الطلبات' },
    { path: '/admin/customers', icon: 'people', label: 'العملاء' },
    { path: '/admin/coupons', icon: 'confirmation_number', label: 'أكواد الخصم' },
    { path: '/admin/reviews', icon: 'reviews', label: 'التقييمات' },
    { path: '/admin/reports', icon: 'bar_chart', label: 'التقارير' },
    { path: '/admin/metadata', icon: 'database', label: 'إدارة البيانات' },
    { path: '/admin/ai-logs', icon: 'auto_awesome', label: 'سجلات AI' },
    { path: '/admin/ai-settings', icon: 'psychology', label: 'إعدادات AI' },
    { path: '/admin/settings', icon: 'settings', label: 'الإعدادات' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();

    const isActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed top-0 right-0 z-50 h-[100dvh] w-64 bg-[#0d121c] border-l border-white/5 
                flex flex-col transition-transform duration-300 ease-in-out shadow-2xl
                lg:translate-x-0 lg:static lg:h-[calc(100vh-80px)] lg:shadow-none lg:z-0
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Admin Label */}
                <div className="p-6 border-b border-white/5 bg-surface-dark/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold leading-none">لوحة الإدارة</h2>
                            <p className="text-[10px] text-gray-400 mt-1">Al3amer Admin</p>
                        </div>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button
                        onClick={onClose}
                        className="lg:hidden text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1">
                        {SIDEBAR_LINKS.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${isActive(link.path, link.exact)
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${isActive(link.path, link.exact) ? 'symbol-filled' : ''}`}>
                                        {link.icon}
                                    </span>
                                    <span className="font-medium text-sm">{link.label}</span>

                                    {/* Active Indicator Strip */}
                                    {isActive(link.path, link.exact) && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white/20 rounded-l-full" />
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer / Quick Link */}
                <div className="p-4 border-t border-white/5 bg-[#0a0e16]">
                    <Link to="/" className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white text-xs font-medium border border-transparent hover:border-white/5">
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        <span>العودة للمتجر</span>
                        <span className="material-symbols-outlined text-sm mr-auto rotate-180">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </>
    );
}
