import { useState } from 'react';
import { useReviews } from '../../hooks/useReviews';

export function ReviewsModeration() {
    const { reviews, isLoading, updateReviewStatus } = useReviews();
    const [filterStatus, setFilterStatus] = useState('all');
    const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);

    const handleAction = (id: string | number, action: 'approve' | 'reject') => {
        updateReviewStatus(id, action === 'approve' ? 'approved' : 'rejected');
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

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
                    <button
                        onClick={() => setIsAddReviewOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        إضافة تقييم
                    </button>
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
                        <h3 className="text-3xl font-bold text-white mt-1">{reviews.length}</h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>{reviews.filter(r => r.status === 'approved').length}</span>
                            <span className="text-slate-500 font-medium mr-1">معتمدة</span>
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
                            <h3 className="text-3xl font-bold text-white mt-1">
                                {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                            </h3>
                            <div className="flex text-yellow-500 mt-1">
                                {Array.from({ length: 5 }, (_, i) => {
                                    const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
                                    return (
                                        <span key={i} className={`material-symbols-outlined text-[20px] ${i < Math.floor(avg) ? 'filled' : ''}`}>
                                            {i < Math.floor(avg) ? 'star' : i < avg ? 'star_half' : 'star'}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span>{reviews.filter(r => r.status === 'rejected').length}</span>
                            <span className="text-slate-500 font-medium mr-1">مرفوضة</span>
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

            {isAddReviewOpen && (
                <AddReviewModal onClose={() => setIsAddReviewOpen(false)} />
            )}
        </div>
    );
}


function AddReviewModal({ onClose }: { onClose: () => void }) {
    const [formData, setFormData] = useState({
        productId: '',
        rating: 5,
        text: '',
        customerName: 'Admin', // Temporary, ideally select user
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // In a real app we need to search products and users
    // For now, we will use simple inputs

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Need to import api. Assuming it's available or use axios. 
            // Better to use hooks but for speed:
            await import('../../lib/api').then(({ default: api }) =>
                api.post('/reviews', formData)
            );
            // import toast?
            onClose();
            window.location.reload(); // Simple refresh
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">إضافة تقييم يدوي</h3>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-400 hover:text-white">close</span></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">معرف المنتج</label>
                        <input required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} placeholder="Product ID" className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">التقييم (1-5)</label>
                        <select value={formData.rating} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10">
                            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} نجوم</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">التعليق</label>
                        <textarea required value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 h-24" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 font-bold text-sm">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm flex items-center gap-2">
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقييم'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReviewsModeration;
