import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Global Header */}
            <div className="sticky top-0 z-50">
                <Header />
            </div>

            <div className="flex flex-1 relative">
                {/* Responsive Sidebar */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#0f1115]">
                    {/* Mobile Menu Toggle Bar */}
                    <div className="lg:hidden p-3 border-b border-white/5 bg-[#0d121c]/80 backdrop-blur-md flex items-center justify-between sticky top-[64px] z-40 transition-all shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            </div>
                            <span className="text-white font-black text-xs tracking-tight">لوحة التحكم</span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-90"
                        >
                            <span className="material-symbols-outlined text-[20px]">menu</span>
                        </button>
                    </div>

                    <div className="flex-1 p-3 md:p-6 lg:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto scroll-smooth">
                        <ErrorBoundary>
                            <Outlet />
                        </ErrorBoundary>
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
