import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface BundleLog {
    id: string;
    userId: string | null;
    businessType: string;
    budget: number;
    selectedFeatures: string[];
    resultBundle: {
        name: string;
        price: number;
        products: Array<{
            productId: string;
            name: string;
            imageUrl: string;
            price: number;
            category: string;
        }>;
        matchScore: number;
        exceedsBudget: boolean;
    };
    matchScore: number | null;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

interface AILogsResponse {
    logs: BundleLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        totalRecommendations: number;
        conversionRate: number;
        avgBundleValue: number;
        popularBusinessType: { name: string; percentage: number } | null;
    };
}

const ICONS: Record<string, string> = {
    'supermarket': 'storefront',
    'restaurant': 'restaurant',
    'pharmacy': 'local_pharmacy',
    'clothing': 'checkroom',
    'custom': 'tune',
};

const COLORS: Record<string, string> = {
    'supermarket': 'text-amber-400',
    'restaurant': 'text-purple-400',
    'pharmacy': 'text-pink-400',
    'clothing': 'text-blue-400',
    'custom': 'text-slate-400',
};

const TYPE_NAMES: Record<string, string> = {
    'supermarket': 'سوبر ماركت',
    'restaurant': 'كافيه / مطعم',
    'pharmacy': 'صيدلية',
    'clothing': 'ملابس / أحذية',
    'custom': 'مخصص',
};

export function AIBundleLogs() {
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<BundleLog | null>(null);
    const limit = 10;

    const { data, isLoading, error } = useQuery<AILogsResponse>({
        queryKey: ['ai-logs', page],
        queryFn: async () => {
            const { data } = await api.get('/admin/ai-logs', {
                params: { page, limit }
            });
            return data;
        },
    });

    const logs = data?.logs || [];
    const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
    const stats = data?.stats || { totalRecommendations: 0, conversionRate: 0, avgBundleValue: 0, popularBusinessType: null };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${diffDays} يوم`;
    };

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 -mx-8 -mt-8 pt-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold tracking-tight">سجلات منشئ الحزم</h2>
                    <span className="h-6 w-px bg-white/10 mx-2"></span>
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-[#8b5cf6]">auto_awesome</span>
                        الذكاء الاصطناعي
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-[#8b5cf6]/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-[#8b5cf6]">psychology</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي التوصيات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.totalRecommendations.toLocaleString()} <span className="text-sm font-normal text-slate-500">عملية</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">shopping_cart_checkout</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">معدل التحويل للشراء</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.conversionRate}% <span className="text-sm font-normal text-slate-500">تحويل</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">attach_money</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">متوسط قيمة الحزمة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.avgBundleValue.toLocaleString()} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-amber-500">storefront</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">النشاط الأكثر طلباً</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.popularBusinessType ? TYPE_NAMES[stats.popularBusinessType.name] || stats.popularBusinessType.name : 'لا يوجد'}</h3>
                        {stats.popularBusinessType && (
                            <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                                <span>{stats.popularBusinessType.percentage}%</span>
                                <span className="text-slate-500 font-medium mr-1">من إجمالي الطلبات</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#8b5cf6]">history_edu</span>
                        سجل التوصيات التفصيلي
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center text-red-400">
                        <span className="material-symbols-outlined text-2xl mr-2">error</span>
                        حدث خطأ في تحميل البيانات
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                            <p>لا توجد سجلات بعد</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white/5 text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">الوقت</th>
                                    <th className="px-6 py-4 whitespace-nowrap">نوع النشاط</th>
                                    <th className="px-6 py-4 whitespace-nowrap">الميزانية</th>
                                    <th className="px-6 py-4 whitespace-nowrap">المنتجات المقترحة</th>
                                    <th className="px-6 py-4 whitespace-nowrap">قيمة الحزمة</th>
                                    <th className="px-6 py-4 whitespace-nowrap">نسبة التوافق</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-left">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{formatTimeAgo(log.createdAt)}</span>
                                                <span className="text-xs text-slate-500">{log.user?.name || 'زائر'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-white">
                                                <span className={`material-symbols-outlined text-[16px] ${COLORS[log.businessType] || 'text-slate-400'}`}>
                                                    {ICONS[log.businessType] || 'storefront'}
                                                </span>
                                                <span className="font-bold">{TYPE_NAMES[log.businessType] || log.businessType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white">{log.budget.toLocaleString()} ج.م</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center -space-x-3 space-x-reverse">
                                                {log.resultBundle?.products?.slice(0, 3).map((product, i) => (
                                                    <img
                                                        key={i}
                                                        alt={product.name}
                                                        className="size-8 rounded-full border border-slate-700 bg-white object-cover"
                                                        src={product.imageUrl || 'https://placehold.co/100'}
                                                        title={product.name}
                                                    />
                                                ))}
                                                {(log.resultBundle?.products?.length || 0) > 3 && (
                                                    <div className="size-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">
                                                        +{(log.resultBundle?.products?.length || 0) - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{log.resultBundle?.price?.toLocaleString() || 0} ج.م</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${(log.matchScore || 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    (log.matchScore || 0) >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {log.matchScore || 0}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1.5 rounded hover:bg-white/10 text-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between mt-auto">
                    <span className="text-xs text-slate-500">عرض {logs.length} من أصل {pagination.total} سجل</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 rounded bg-[#161b26] text-slate-400 hover:text-white border border-white/5 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            السابق
                        </button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${page === p
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-[#161b26] text-slate-400 hover:text-white border border-white/5'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        {pagination.totalPages > 5 && <span className="text-slate-600 flex items-end px-1">...</span>}
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="px-3 py-1 rounded bg-[#161b26] text-slate-400 hover:text-white border border-white/5 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="glass-panel rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1e232d]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">info</span>
                                تفاصيل التوصية
                            </h3>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            {/* Inputs Section */}
                            <div>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#8b5cf6]">input</span>
                                    مدخلات العميل
                                </h4>
                                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg">
                                    <div>
                                        <p className="text-slate-400 text-xs">نوع النشاط</p>
                                        <p className="text-white font-medium">{TYPE_NAMES[selectedLog.businessType] || selectedLog.businessType}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs">الميزانية</p>
                                        <p className="text-white font-medium">{selectedLog.budget.toLocaleString()} ج.م</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-400 text-xs mb-1">المميزات المطلوبة</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLog.selectedFeatures?.map((f, i) => (
                                                <span key={i} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Result Section */}
                            <div>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400">shopping_bag</span>
                                    الحزمة المقترحة
                                </h4>
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-white font-bold">{selectedLog.resultBundle?.name}</p>
                                        <p className="text-emerald-400 font-bold">{selectedLog.resultBundle?.price?.toLocaleString()} ج.م</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {selectedLog.resultBundle?.products?.map((product, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded">
                                                <img src={product.imageUrl || 'https://placehold.co/50'} alt={product.name} className="size-10 rounded bg-white object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-white text-sm font-medium">{product.name}</p>
                                                    <p className="text-slate-400 text-xs">{product.category}</p>
                                                </div>
                                                <p className="text-white text-sm font-bold">{product.price?.toLocaleString()} ج.م</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIBundleLogs;
