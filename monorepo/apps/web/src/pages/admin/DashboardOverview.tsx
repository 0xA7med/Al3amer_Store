import { Link } from 'react-router-dom';

const RECENT_ORDERS = [
    { id: '#ORD-00124', customer: 'محمود سعيد', total: '1,250 ج.م', status: 'completed', date: '24 أكتوبر، 10:30 ص', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgAio9WZdWpygXZ0pvf6CB-qjKUwk5AFiG4P2AyARjdCwqBAPX7TNe7ju3FM45hN1Tr8LfqMDSAlBrqqvZOfckkzPwKJiwwMhL0Jkt1NgNSxJLlD-CG8qQjkGQu-gzGbUgh_e4gP4UCZ-34eV0qekQGuYCUjaBMmgwEXy_y2fHLQh1ENa-RF-8a7GlIel0u0-BFK9iRb2yBXXw0OerBnatwWkqDxQDapcQ5_3pfVhkgDiRMJKzlCTjl77AjlIjEoeaC3l-6yvmDtg' },
    { id: '#ORD-00123', customer: 'سارة أحمد', total: '450 ج.م', status: 'processing', date: '24 أكتوبر، 09:15 ص', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjkYRJTnV2pzsyXk09eZySG1G827jTPc7_xF6FPOf3gkDYGTLVx9H218x69mMFoxHYVh07NRPd-LKQBMTYLDglli0vo8kRn7iUr3jI8nCFngJj5scwf0oqop8XAQY0iDDZmwy4isQalE4CvVXJR7u6uZYmgwtAtty3cL4pPvcm_HPtTIa0SKgfU74sKZ4duDu_yY3ybq8S4xnVUMJhSuHVd9kQLdIK0Tra7XTq6kmipMpc2-lo6wufPtFdOVlG1oIqrXndL-1l0w4' },
    { id: '#ORD-00122', customer: 'كريم مصطفى', total: '3,200 ج.م', status: 'shipped', date: '23 أكتوبر، 04:45 م', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHorC67-ouSQuqsY6DFlVBKgWVWll7HtD4TQDrO1r1IGd6XFTmkA5F59k0iw-J9blun_Wx2LbI0Fp_aQCc7QhqhXmWwDTifcdhHl74zoBNx18LWz6nnHxdETeaR_euMBu38VQa9HTDEdpj6q_8LxRXvgDc8Ugj0h2uKS71vQMsuG_m1YZGKw-U7S6TGYFr-ESN6Io5mZqTYr0qaQFoKGHwSI6ib-2tn7BT_IXUMPNP0fPD7Hh3asrWjqoo6A_rcD9PPnuj8xbNm48' },
    { id: '#ORD-00121', customer: 'عمر خالد', total: '850 ج.م', status: 'cancelled', date: '23 أكتوبر، 02:20 م', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfidwKcn805bpiqvElSfPBUGPftdtGOr1A0gYIv2s-HdQLDce9ri3HDPhgMMsmJx--jZ2YR6Ic1NooNY1_AEhXbPfHjZjProBfmSIOAREPuAQ1GJfaQdgj8THz-2NIXucN9sWzOQs-Fem047xXu1WnwtVhLRGMi41TOUYGvjxnAdvA5ri4Kv_IP_SmLiLQarDFJh-7Jp6sI0aZh5oshfy87r5GS8S4fTCP9gK52ZROddzbhekxrS1a6l_nRnKFlujjHivqa65ef-s' },
];

const TOP_PRODUCTS = [
    { name: 'ميزان باركود إلكتروني', sales: '54 عملية بيع', price: '12,500 ج.م', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB53AfAdYSVNGB5oYFzfLzNBiSHgxDobxm6eMuU04gox73Dek_5_bgFD2-g2-TUNNxbCrFx1JCtNJvhz9iO_KPbN2II8puGy8ON-PORvD67gnwscRmerEECb2p-NXJOFEzfOPA8sJpnPiQFhadp1njp5toF1Qq5ohLGGkfnXkJatXjtagEez_cEq1lqrOX4D2iaW_TAGqaPHkEmyqpzSJUKNfsO4qGUczLnyJHPXvKwxhHh4WZhvJaCF6O2LUBXNSDJxHqndnh-Q38' },
    { name: 'جهاز كاشير لمس', sales: '32 عملية بيع', price: '8,200 ج.م', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsk0P7H4thcEFU3j2-Z5bZbAV_rFQwPg5XMjBGCzXbXam3gzru2Sz_b_Cszro7q_gUGVYu2JtBua8bN4EpeGzq-3a4gEg34xJftGdxqGk14gzwM8QxIoIjDDpgpojUNf4FIrqQAjJnot855f68YgGKFcGRdwiyl-UQO5Jk32BkdWHeIgyQv0fxclBzKXJ11bymOJUwzi7kkcxLoKYjVnXJ0MsvNTF0q3X2w6nfZ0pEOCEzLcfQ6bps5DVnRBdDj6hGeyZ2x8tDmHA' },
    { name: 'قارئ باركود لاسلكي', sales: '28 عملية بيع', price: '1,400 ج.م', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyvfnrjHmwZCnKNXNKAPjHJfXLDSqkh3I_QO5_VqbPby1SbIEYg5mYF0Vmzgh7o0Pwbd8vyH42fZ-aSElu1f3B4JJ3UyGhxC6kFE9V09yBeLBrKn5K000Te71DNIJ4ock1C5-rV_0Rf7a6jNXWB9-9Nr2lB-o59GMX8SHnZHbHfdkfmP236JgAEVzhTrye8myK7a859M3NTFMB9t0Xs-ZhoXj-geVkFA2gvhWB3vMUYslwhCOHwto2N8Lz0njeSU9s2QK57RKQmv8' },
];

export function DashboardOverview() {
    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat 1 */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">payments</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي المبيعات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">50,240 <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>+12.5%</span>
                            <span className="text-slate-500 font-medium mr-1">مقارنة بالشهر الماضي</span>
                        </div>
                    </div>
                </div>
                {/* Stat 2 */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-blue-400">shopping_cart</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">الطلبات الجديدة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">128 <span className="text-sm font-normal text-slate-500">طلب</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>+5.2%</span>
                            <span className="text-slate-500 font-medium mr-1">مقارنة بالأسبوع الماضي</span>
                        </div>
                    </div>
                </div>
                {/* Stat 3 */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-purple-400">group</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">العملاء النشطين</p>
                        <h3 className="text-2xl font-bold text-white mt-1">850 <span className="text-sm font-normal text-slate-500">عميل</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>+8.1%</span>
                            <span className="text-slate-500 font-medium mr-1">معدل نمو جيد</span>
                        </div>
                    </div>
                </div>
                {/* Stat 4 */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all border-l-4 border-l-secondary">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">warning</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">تنبيهات المخزون</p>
                        <h3 className="text-2xl font-bold text-white mt-1">5 <span className="text-sm font-normal text-slate-500">منتجات</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-secondary text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                            <span>مخزون منخفض</span>
                            <span className="text-slate-500 font-medium mr-1">يجب مراجعته</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Container */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">إيرادات الشهر الحالي</h3>
                            <p className="text-slate-400 text-sm">مقارنة بالفترة السابقة</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#161b26] rounded-lg p-1 border border-white/5">
                            <button className="px-3 py-1 rounded text-xs font-medium text-white bg-primary shadow-sm">شهري</button>
                            <button className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-white">أسبوعي</button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full relative">
                        {/* Simulated Chart with SVG */}
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#135bec" stopOpacity="0.5"></stop>
                                    <stop offset="100%" stopColor="#135bec" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="0" y2="0"></line>
                            <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="75" y2="75"></line>
                            <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                            <line stroke="rgba(255,255,255,0.05)" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="225" y2="225"></line>
                            <line stroke="rgba(255,255,255,0.1)" strokeWidth="1" x1="0" x2="800" y1="300" y2="300"></line>
                            {/* Data Path */}
                            <path d="M0,250 C100,240 150,150 200,180 C250,210 300,100 400,120 C500,140 550,60 600,80 C650,100 700,40 800,20 V300 H0 Z" fill="url(#chartGradient)"></path>
                            <path d="M0,250 C100,240 150,150 200,180 C250,210 300,100 400,120 C500,140 550,60 600,80 C650,100 700,40 800,20" fill="none" stroke="#135bec" strokeLinecap="round" strokeWidth="3"></path>
                            {/* Dots */}
                            <circle cx="200" cy="180" fill="#0f1115" r="4" stroke="#135bec" strokeWidth="2"></circle>
                            <circle cx="400" cy="120" fill="#0f1115" r="4" stroke="#135bec" strokeWidth="2"></circle>
                            <circle cx="600" cy="80" fill="white" r="4" stroke="#135bec" strokeWidth="2"></circle>
                            {/* Tooltip simulation */}
                            <g transform="translate(560, 30)">
                                <rect fill="#135bec" height="30" rx="4" width="80"></rect>
                                <text fill="white" fontFamily="Manrope" fontSize="12" fontWeight="bold" textAnchor="middle" x="40" y="20">٢,٤٥٠ ج.م</text>
                                <path d="M40 30 L35 35 L45 35 Z" fill="#135bec"></path>
                            </g>
                        </svg>
                        {/* X Axis Labels */}
                        <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium">
                            <span>1 أكتوبر</span>
                            <span>5 أكتوبر</span>
                            <span>10 أكتوبر</span>
                            <span>15 أكتوبر</span>
                            <span>20 أكتوبر</span>
                            <span>25 أكتوبر</span>
                            <span>30 أكتوبر</span>
                        </div>
                    </div>
                </div>

                {/* Top Selling / Quick Actions */}
                <div className="flex flex-col gap-6">
                    {/* Quick Actions */}
                    <div className="glass-panel rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">إجراءات سريعة</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/admin/products/add" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined">add_box</span>
                                <span className="text-xs font-bold">إضافة منتج</span>
                            </Link>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#161b26] text-slate-300 hover:text-white hover:bg-[#1e2736] transition-colors border border-white/5">
                                <span className="material-symbols-outlined">receipt_long</span>
                                <span className="text-xs font-bold">إنشاء فاتورة</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#161b26] text-slate-300 hover:text-white hover:bg-[#1e2736] transition-colors border border-white/5">
                                <span className="material-symbols-outlined">person_add</span>
                                <span className="text-xs font-bold">عميل جديد</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#161b26] text-slate-300 hover:text-white hover:bg-[#1e2736] transition-colors border border-white/5">
                                <span className="material-symbols-outlined">inventory</span>
                                <span className="text-xs font-bold">جرد المخزون</span>
                            </button>
                        </div>
                    </div>
                    {/* Top Product Widget */}
                    <div className="glass-panel rounded-xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-white mb-4">الأكثر مبيعاً</h3>
                        <div className="flex flex-col gap-4">
                            {TOP_PRODUCTS.map((product, index) => (
                                <div key={index} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="size-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white truncate">{product.name}</p>
                                        <p className="text-xs text-slate-400">{product.sales}</p>
                                    </div>
                                    <p className="text-sm font-bold text-emerald-400">{product.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white">الطلبات الأخيرة</h3>
                    <Link to="/admin/orders" className="text-sm text-primary font-bold hover:underline">عرض كل الطلبات</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">رقم الطلب</th>
                                <th className="px-6 py-4 whitespace-nowrap">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap">التاريخ</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap">الإجمالي</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {RECENT_ORDERS.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-white">{order.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-700 bg-cover bg-center" style={{ backgroundImage: `url('${order.image}')` }}></div>
                                            <span>{order.customer}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{order.date}</td>
                                    <td className="px-6 py-4">
                                        {order.status === 'completed' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <span className="size-1.5 rounded-full bg-emerald-400"></span>
                                                مكتمل
                                            </span>
                                        )}
                                        {order.status === 'processing' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                                قيد المعالجة
                                            </span>
                                        )}
                                        {order.status === 'shipped' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                <span className="size-1.5 rounded-full bg-blue-400"></span>
                                                تم الشحن
                                            </span>
                                        )}
                                        {order.status === 'cancelled' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                <span className="size-1.5 rounded-full bg-red-400"></span>
                                                ملغي
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">{order.total}</td>
                                    <td className="px-6 py-4 text-left">
                                        <button className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DashboardOverview;
