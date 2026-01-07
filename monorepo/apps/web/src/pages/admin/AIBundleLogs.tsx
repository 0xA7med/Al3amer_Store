import { useState } from 'react';

const AI_LOGS = [
    {
        id: 'LOG-8832',
        time: 'منذ 15 دقيقة',
        user: { name: 'زائر', type: 'visitor' },
        inputs: { type: 'سوبر ماركت', budget: '25 ألف', details: 'مساحة متوسطة' },
        recommendation: {
            name: 'حزمة السوبر ماركت الاحترافية',
            items: [
                { name: 'ميزان باركود', image: 'https://placehold.co/100' },
                { name: 'شاشة لمس', image: 'https://placehold.co/100' },
                { name: 'قارئ باركود', image: 'https://placehold.co/100' },
            ],
            extraCount: 2
        },
        price: 24500,
        status: 'purchased'
    },
    {
        id: 'LOG-8831',
        time: 'منذ 45 دقيقة',
        user: { name: 'أحمد محمد', type: 'registered' },
        inputs: { type: 'كافيه / مطعم', budget: '15 ألف', details: 'فرع واحد' },
        recommendation: {
            name: 'حزمة الكافيه الأساسية',
            items: [
                { name: 'جهاز كاشير', image: 'https://placehold.co/100' },
            ],
            extraCount: 1
        },
        price: 12200,
        status: 'added_to_cart'
    },
    {
        id: 'LOG-8830',
        time: 'ساعتين',
        user: { name: 'زائر', type: 'visitor' },
        inputs: { type: 'ملابس / أحذية', budget: 'مفتوحة', details: 'سلسلة فروع' },
        recommendation: {
            name: 'نظام إدارة المخزون المتقدم',
            items: [
                { name: 'قارئ باركود', image: 'https://placehold.co/100' },
            ],
            extraCount: 4
        },
        price: 45000,
        status: 'viewed'
    },
    {
        id: 'LOG-8829',
        time: '3 ساعات',
        user: { name: 'زائر', type: 'visitor' },
        inputs: { type: 'صيدلية', budget: 'محدودة', details: 'مساحة صغيرة' },
        recommendation: {
            name: 'عرض الصيدليات الاقتصادي',
            items: [
                { name: 'قارئ باركود', image: 'https://placehold.co/100' },
                { name: 'جهاز كمبيوتر', image: 'https://placehold.co/100' },
            ],
            extraCount: 0
        },
        price: 8500,
        status: 'viewed'
    },
    {
        id: 'LOG-8828',
        time: '5 ساعات',
        user: { name: 'زائر', type: 'visitor' },
        inputs: { type: 'سوبر ماركت', budget: 'هايبر ماركت', details: 'مساحة كبيرة' },
        recommendation: {
            name: 'تجهيز كامل هايبر ماركت',
            items: [
                { name: 'ميزان باركود', image: 'https://placehold.co/100' },
                { name: 'شاشة لمس', image: 'https://placehold.co/100' },
            ],
            extraCount: 8
        },
        price: 85000,
        status: 'purchased'
    },
];

const ICONS: Record<string, string> = {
    'سوبر ماركت': 'storefront',
    'كافيه / مطعم': 'restaurant',
    'صيدلية': 'local_pharmacy',
    'ملابس / أحذية': 'checkroom',
};

const COLORS: Record<string, string> = {
    'سوبر ماركت': 'text-amber-400',
    'كافيه / مطعم': 'text-purple-400',
    'صيدلية': 'text-pink-400',
    'ملابس / أحذية': 'text-blue-400',
};

export function AIBundleLogs() {
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
                <div className="flex items-center gap-6">
                    <div className="relative hidden md:block w-80">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full h-10 pr-10 pl-4 rounded-lg bg-[#161b26] border-none text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary transition-all"
                            placeholder="بحث في السجلات..."
                            type="text"
                        />
                    </div>
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
                        <h3 className="text-2xl font-bold text-white mt-1">3,450 <span className="text-sm font-normal text-slate-500">عملية</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-[#8b5cf6] text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">auto_graph</span>
                            <span>+24%</span>
                            <span className="text-slate-500 font-medium mr-1">استخدام متزايد</span>
                        </div>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">shopping_cart_checkout</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">معدل التحويل للشراء</p>
                        <h3 className="text-2xl font-bold text-white mt-1">18.5% <span className="text-sm font-normal text-slate-500">تحويل</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>+2.1%</span>
                            <span className="text-slate-500 font-medium mr-1">أعلى من المتوسط</span>
                        </div>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">attach_money</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">متوسط قيمة الحزمة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">22,100 <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-primary text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">monetization_on</span>
                            <span>قيمة عالية</span>
                        </div>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-amber-500">storefront</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">النشاط الأكثر طلباً</p>
                        <h3 className="text-2xl font-bold text-white mt-1">سوبر ماركت</h3>
                        <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                            <span>45%</span>
                            <span className="text-slate-500 font-medium mr-1">من إجمالي الطلبات</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        </span>
                        <select className="block w-full h-10 pr-10 pl-4 rounded-lg bg-[#161b26] border border-white/5 text-sm text-white focus:ring-1 focus:ring-primary outline-none">
                            <option>آخر 7 أيام</option>
                            <option>آخر 30 يوم</option>
                            <option>هذا الشهر</option>
                            <option>نطاق مخصص</option>
                        </select>
                    </div>
                    <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                        </span>
                        <select className="block w-full h-10 pr-10 pl-4 rounded-lg bg-[#161b26] border border-white/5 text-sm text-white focus:ring-1 focus:ring-primary outline-none">
                            <option>جميع الحالات</option>
                            <option>تم الشراء (Purchased)</option>
                            <option>أضيف للسلة (Add to Cart)</option>
                            <option>تم العرض (Viewed)</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        تصدير CSV
                    </button>
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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">رقم المعرف / الوقت</th>
                                <th className="px-6 py-4 whitespace-nowrap">مدخلات العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap">التوصية المقترحة</th>
                                <th className="px-6 py-4 whitespace-nowrap">الإجراء المتخذ</th>
                                <th className="px-6 py-4 whitespace-nowrap">قيمة الحزمة</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {AI_LOGS.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs text-slate-500">#{log.id}</span>
                                            <span className="text-white font-medium">{log.time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-white">
                                                <span className={`material-symbols-outlined text-[16px] ${COLORS[log.inputs.type]}`}>{ICONS[log.inputs.type]}</span>
                                                <span className="font-bold">{log.inputs.type}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">{log.inputs.details} • ميزانية {log.inputs.budget}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center -space-x-3 space-x-reverse">
                                            {log.recommendation.items.map((item, i) => (
                                                <img
                                                    key={i}
                                                    alt={item.name}
                                                    className="size-8 rounded-full border border-slate-700 bg-white object-cover"
                                                    src={item.image}
                                                    title={item.name}
                                                />
                                            ))}
                                            {log.recommendation.extraCount > 0 && (
                                                <div className="size-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">
                                                    +{log.recommendation.extraCount}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{log.recommendation.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.status === 'purchased' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <span className="size-1.5 rounded-full bg-emerald-400"></span>
                                                تم الشراء
                                            </span>
                                        )}
                                        {log.status === 'added_to_cart' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                                أضيف للسلة
                                            </span>
                                        )}
                                        {log.status === 'viewed' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400 border border-slate-600/30">
                                                تم العرض
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">{log.price.toLocaleString()} ج.م</td>
                                    <td className="px-6 py-4 text-left">
                                        <button className="p-1.5 rounded hover:bg-white/10 text-primary hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">عرض 5 من أصل 1,240 سجل</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 rounded bg-[#161b26] text-slate-400 hover:text-white border border-white/5 text-xs font-medium transition-colors">السابق</button>
                        <button className="px-3 py-1 rounded bg-primary text-white text-xs font-medium shadow-lg shadow-primary/20">1</button>
                        <button className="px-3 py-1 rounded bg-[#161b26] text-slate-400 hover:text-white border border-white/5 text-xs font-medium transition-colors">2</button>
                        <button className="px-3 py-1 rounded bg-[#161b26] text-slate-400 hover:text-white border border-white/5 text-xs font-medium transition-colors">3</button>
                        <span className="text-slate-600 flex items-end px-1">...</span>
                        <button className="px-3 py-1 rounded bg-[#161b26] text-slate-400 hover:text-white border border-white/5 text-xs font-medium transition-colors">التالي</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIBundleLogs;
