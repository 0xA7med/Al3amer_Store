import React, { useState } from 'react';

export default function AdminReportsPage() {
    const [dateRange, setDateRange] = useState('month');

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl font-bold leading-tight">التقارير والتحليلات</h1>
                        <p className="text-slate-400 text-base font-normal">
                            نظرة شاملة على أداء متجرك ومبيعاتك.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-[#1e232d] border border-white/10 text-white text-sm rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="week">آخر 7 أيام</option>
                            <option value="month">الشهر الحالي</option>
                            <option value="year">السنة الحالية</option>
                        </select>
                        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>تصدير تقرير</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'إجمالي الإيرادات', value: '150,240', unit: 'ج.م', change: '+12.5%', icon: 'payments', color: 'primary' },
                        { title: 'إجمالي الطلبات', value: '1,250', unit: 'طلب', change: '+5.2%', icon: 'shopping_cart', color: 'blue-400' },
                        { title: 'متوسط قيمة الطلب', value: '450', unit: 'ج.م', change: '-2.1%', icon: 'analytics', color: 'purple-400' },
                        { title: 'العملاء الجدد', value: '120', unit: 'عميل', change: '+15.3%', icon: 'group_add', color: 'emerald-400' },
                    ].map((stat, index) => (
                        <div key={index} className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/20 transition-all">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}`}>
                                <span className="material-symbols-outlined text-6xl">{stat.icon}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{stat.value} <span className="text-xs font-normal text-slate-500">{stat.unit}</span></h3>
                                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                    <span className="material-symbols-outlined text-[16px]">
                                        {stat.change.startsWith('+') ? 'trending_up' : 'trending_down'}
                                    </span>
                                    <span>{stat.change}</span>
                                    <span className="text-slate-500 font-medium mr-1">مقارنة بالفترة السابقة</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Revenue Chart */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6">تحليل الإيرادات</h3>
                        <div className="flex-1 min-h-[300px] w-full relative">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300">
                                <defs>
                                    <linearGradient id="chartGradientReport" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#135bec" stopOpacity="0.5"></stop>
                                        <stop offset="100%" stopColor="#135bec" stopOpacity="0"></stop>
                                    </linearGradient>
                                </defs>
                                {/* Grid Lines */}
                                {[0, 75, 150, 225, 300].map(y => (
                                    <line key={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1={y} y2={y}></line>
                                ))}
                                {/* Data Path */}
                                <path d="M0,280 C100,200 200,250 300,150 C400,100 500,180 600,80 C700,50 800,20 V300 H0 Z" fill="url(#chartGradientReport)"></path>
                                <path d="M0,280 C100,200 200,250 300,150 C400,100 500,180 600,80 C700,50 800,20" fill="none" stroke="#135bec" strokeLinecap="round" strokeWidth="3"></path>
                                {/* X Axis Labels */}
                            </svg>
                            <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium px-2">
                                <span>الأسبوع 1</span>
                                <span>الأسبوع 2</span>
                                <span>الأسبوع 3</span>
                                <span>الأسبوع 4</span>
                            </div>
                        </div>
                    </div>

                    {/* Sales by Category (Bar Chart Simulation) */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-6">المبيعات حسب القسم</h3>
                        <div className="flex flex-col gap-6">
                            {[
                                { name: 'أجهزة الكاشير', value: 75, color: 'bg-primary' },
                                { name: 'الطابعات', value: 45, color: 'bg-emerald-500' },
                                { name: 'الماسحات الضوئية', value: 30, color: 'bg-blue-500' },
                                { name: 'الموازين', value: 60, color: 'bg-purple-500' },
                                { name: 'اكسسوارات', value: 20, color: 'bg-yellow-500' },
                            ].map((cat, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white">{cat.name}</span>
                                        <span className="text-slate-400">{cat.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.value}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products Table */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">المنتجات الأكثر مبيعاً</h3>
                        <button className="text-primary text-sm font-bold hover:underline">عرض الكل</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white/5 text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">المنتج</th>
                                    <th className="px-6 py-4">القسم</th>
                                    <th className="px-6 py-4">عدد القطع المباعة</th>
                                    <th className="px-6 py-4">الإيرادات</th>
                                    <th className="px-6 py-4">المخزون المتبقي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">طابعة فواتير حرارية T80</td>
                                    <td className="px-6 py-4">الطابعات</td>
                                    <td className="px-6 py-4">1,204</td>
                                    <td className="px-6 py-4 text-emerald-400 font-bold">450,200 ج.م</td>
                                    <td className="px-6 py-4 text-yellow-400">45</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">جهاز كاشير لمس 15 بوصة</td>
                                    <td className="px-6 py-4">أجهزة الكاشير</td>
                                    <td className="px-6 py-4">850</td>
                                    <td className="px-6 py-4 text-emerald-400 font-bold">850,000 ج.م</td>
                                    <td className="px-6 py-4 text-emerald-400">120</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">قارئ باركود لاسلكي</td>
                                    <td className="px-6 py-4">الماسحات الضوئية</td>
                                    <td className="px-6 py-4">620</td>
                                    <td className="px-6 py-4 text-emerald-400 font-bold">124,000 ج.م</td>
                                    <td className="px-6 py-4 text-emerald-400">80</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
