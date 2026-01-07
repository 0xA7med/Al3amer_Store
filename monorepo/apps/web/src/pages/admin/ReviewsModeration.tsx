import { useState } from 'react';

const REVIEWS = [
    {
        id: 1,
        product: { name: 'ميزان باركود إلكتروني حساس', sku: 'BAR-2023-X', image: 'https://placehold.co/100' },
        customer: { name: 'محمود سعيد', type: 'عميل جديد', avatar: 'https://i.pravatar.cc/150?u=1' },
        rating: 5,
        text: 'المنتج ممتاز جداً والتوصيل كان سريع في نفس اليوم. التغليف محكم والجهاز يعمل بكفاءة عالية مع البرنامج. شكراً لكم!',
        date: '24 أكتوبر، 10:30 ص',
        status: 'pending'
    },
    {
        id: 2,
        product: { name: 'جهاز كاشير لمس 15 بوصة', sku: 'POS-T15', image: 'https://placehold.co/100' },
        customer: { name: 'عمر خالد', type: 'عميل VIP', avatar: 'https://i.pravatar.cc/150?u=2' },
        rating: 4,
        text: 'الجهاز جيد لكن الشاشة تحتاج ضبط ألوان. السعر مرتفع قليلاً مقارنة بالمواصفات.',
        date: '23 أكتوبر، 04:15 م',
        status: 'pending'
    },
    {
        id: 3,
        product: { name: 'قارئ باركود لاسلكي 2D', sku: 'SCAN-W2', image: 'https://placehold.co/100' },
        customer: { name: 'سارة أحمد', type: 'عميل متكرر', avatar: 'https://i.pravatar.cc/150?u=3' },
        rating: 5,
        text: 'عملي جداً والبطارية تدوم طويلاً.',
        date: '22 أكتوبر، 09:20 ص',
        status: 'approved'
    },
    {
        id: 4,
        product: { name: 'ميزان باركود إلكتروني حساس', sku: 'BAR-2023-X', image: 'https://placehold.co/100' },
        customer: { name: 'كريم مصطفى', type: 'عميل', avatar: 'https://i.pravatar.cc/150?u=4' },
        rating: 1,
        text: '[تم حذف المحتوى لمخالفته الشروط - دعاية خارجية]',
        date: '20 أكتوبر، 11:00 ص',
        status: 'rejected'
    },
];

export function ReviewsModeration() {
    const [reviews, setReviews] = useState(REVIEWS);
    const [filterStatus, setFilterStatus] = useState('all');

    const handleAction = (id: number, action: 'approve' | 'reject') => {
        setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r))
        );
    };

    const filteredReviews = filterStatus === 'all' ? reviews : reviews.filter((r) => r.status === filterStatus);

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-yellow-500 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[18px] ${i < rating ? 'filled' : ''}`}>
                        star
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 -mx-8 -mt-8 pt-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold tracking-tight">إدارة التقييمات</h2>
                    <span className="h-6 w-px bg-white/10 mx-2"></span>
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">home</span>
                        / التقييمات
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative hidden md:block w-80">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full h-10 pr-10 pl-4 rounded-lg bg-[#161b26] border-none text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary transition-all"
                            placeholder="بحث في التقييمات..."
                            type="text"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">reviews</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي التقييمات</p>
                        <h3 className="text-3xl font-bold text-white mt-1">1,248</h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>+24</span>
                            <span className="text-slate-500 font-medium mr-1">هذا الأسبوع</span>
                        </div>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all border-l-4 border-l-secondary">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">pending_actions</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">في انتظار المراجعة</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{reviews.filter(r => r.status === 'pending').length}</h3>
                        <div className="flex items-center gap-1 mt-2 text-secondary text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">priority_high</span>
                            <span>يتطلب إجراء</span>
                        </div>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-yellow-500">star</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">متوسط التقييم</p>
                        <div className="flex items-center gap-3">
                            <h3 className="text-3xl font-bold text-white mt-1">4.8</h3>
                            <div className="flex text-yellow-500 mt-1">
                                <span className="material-symbols-outlined filled text-[20px]">star</span>
                                <span className="material-symbols-outlined filled text-[20px]">star</span>
                                <span className="material-symbols-outlined filled text-[20px]">star</span>
                                <span className="material-symbols-outlined filled text-[20px]">star</span>
                                <span className="material-symbols-outlined text-[20px]">star_half</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span>ممتاز</span>
                            <span className="text-slate-500 font-medium mr-1">بناءً على آخر 100 تقييم</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex bg-[#161b26] p-1 rounded-lg">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${filterStatus === 'pending' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            قيد المراجعة
                            <span className="bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded-full">{reviews.filter(r => r.status === 'pending').length}</span>
                        </button>
                        <button
                            onClick={() => setFilterStatus('approved')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'approved' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            تم النشر
                        </button>
                        <button
                            onClick={() => setFilterStatus('rejected')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'rejected' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            مرفوض
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select className="pl-3 pr-8 py-1.5 bg-[#161b26] border border-white/10 rounded-lg text-sm text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer">
                                <option>الأحدث أولاً</option>
                                <option>الأعلى تقييماً</option>
                                <option>الأقل تقييماً</option>
                            </select>
                            <span className="absolute left-2 top-1.5 pointer-events-none text-slate-500 material-symbols-outlined text-[18px]">expand_more</span>
                        </div>
                        <button className="p-1.5 bg-[#161b26] border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                    </div>
                </div>

                {/* Reviews Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap w-[25%]">المنتج</th>
                                <th className="px-6 py-4 whitespace-nowrap w-[20%]">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap w-[15%]">التقييم</th>
                                <th className="px-6 py-4 whitespace-nowrap w-[25%]">التعليق</th>
                                <th className="px-6 py-4 whitespace-nowrap w-[15%]">الحالة / إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredReviews.map((review) => (
                                <tr key={review.id} className={`hover:bg-white/5 transition-colors group ${review.status === 'pending' ? 'bg-secondary/5' : ''}`}>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className="size-12 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden border border-white/10">
                                                <img src={review.product.image} alt={review.product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white line-clamp-2">{review.product.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">SKU: {review.product.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-700 bg-cover bg-center" style={{ backgroundImage: `url('${review.customer.avatar}')` }}></div>
                                            <div>
                                                <p className="font-medium text-white">{review.customer.name}</p>
                                                <p className="text-xs text-slate-500">{review.customer.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {renderStars(review.rating)}
                                        <p className="text-xs text-slate-400">{review.date}</p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className={`text-slate-300 leading-relaxed text-sm ${review.status === 'rejected' ? 'italic' : ''}`}>
                                            {review.text}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-3 items-start">
                                            {review.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                    <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                                    قيد المراجعة
                                                </span>
                                            )}
                                            {review.status === 'approved' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <span className="size-1.5 rounded-full bg-emerald-400"></span>
                                                    تم النشر
                                                </span>
                                            )}
                                            {review.status === 'rejected' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <span className="size-1.5 rounded-full bg-red-400"></span>
                                                    مرفوض
                                                </span>
                                            )}

                                            {review.status === 'pending' && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button onClick={() => handleAction(review.id, 'approve')} className="flex items-center justify-center size-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all" title="قبول">
                                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                                    </button>
                                                    <button onClick={() => handleAction(review.id, 'reject')} className="flex items-center justify-center size-8 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all" title="رفض">
                                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                                    </button>
                                                    <button className="flex items-center justify-center size-8 rounded-full bg-white/5 text-slate-400 border border-white/10 hover:bg-white/20 hover:text-white transition-all" title="تعديل">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                </div>
                                            )}
                                            {review.status !== 'pending' && (
                                                <button className="text-xs text-slate-400 hover:text-white underline">عرض التفاصيل</button>
                                            )}
                                        </div>
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

export default ReviewsModeration;
