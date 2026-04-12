import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminOrder } from '../../hooks/useAdmin';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export function OrderAWB() {
    const { id } = useParams<{ id: string }>();
    const { data: order, isLoading: loading } = useAdminOrder(id || '');
    const [isEditing, setIsEditing] = useState(true);
    const [localOrder, setLocalOrder] = useState<any>(null);
    const [isUpdatingShortName, setIsUpdatingShortName] = useState<string | null>(null);

    useEffect(() => {
        if (order) {
            setLocalOrder({
                ...order,
                fullName: order.fullName || order.user?.name || '',
                phone: order.phone || '',
                address: order.address || '',
                city: order.city || '',
                governorate: order.governorate || '',
                finalCodAmount: order.finalCodAmount || order.totalAtDelivery || order.total,
                items: order.items?.map((item: any) => ({
                    ...item,
                    displayName: item.product?.shortNameAwb || item.product?.name || item.name
                })) || []
            });
        }
    }, [order]);

    const handleUpdateShortName = async (productId: string, shortName: string) => {
        setIsUpdatingShortName(productId);
        try {
            await api.patch(`/products/${productId}/short-name`, { shortNameAwb: shortName });
            toast.success('تم حفظ الاختصار العالمي للمنتج');
        } catch (error) {
            toast.error('فشل حفظ الاختصار');
        } finally {
            setIsUpdatingShortName(null);
        }
    };

    const handlePrint = () => {
        setIsEditing(false);
        setTimeout(() => {
            window.print();
            setIsEditing(true);
        }, 500);
    };

    if (loading) return <div className="p-8 text-center text-lg font-bold text-white">جاري تحميل البوليصة...</div>;
    if (!order || !localOrder) return <div className="p-8 text-center text-red-500 font-bold">الطلب غير موجود</div>;

    // Determine Branding
    const traderBranding = order.trader?.traderBranding;
    const storeLogo = traderBranding?.logoUrl || '/logo.png';
    const storeName = traderBranding?.storeName || 'الـعـامـر لـأنـظـمـة الـكـاشـيـر';
    const storePhones = traderBranding ? 
        [traderBranding.phone1, traderBranding.phone2].filter(Boolean).join(' - ') : 
        '01017320430 - 01554522434';

    return (
        <div className="bg-slate-900 min-h-screen p-4 md:p-8 print:p-0 print:bg-white no-scrollbar">
            {/* Control Panel - Hidden on Print */}
            <div className="max-w-[210mm] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden bg-slate-800 p-4 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">print</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold">معاينة وتعديل البوليصة</h2>
                        <p className="text-slate-400 text-xs">راجع البيانات وحفظ الاختصارات قبل الطباعة</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${isEditing ? 'bg-primary text-white border-primary' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
                    >
                        <span className="material-symbols-outlined">{isEditing ? 'edit_off' : 'edit'}</span>
                        {isEditing ? 'إنهاء التعديل' : 'تعديل البيانات'}
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">print</span>
                        طباعة البوليصة
                    </button>
                </div>
            </div>

            {/* A5 Bill Container */}
            <div className="awb-container mx-auto bg-white text-black shadow-2xl print:shadow-none overflow-hidden relative" dir="rtl">
                {/* Header Section */}
                <div className="p-4 border-b-2 border-slate-200">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <img src={storeLogo} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-slate-100 p-1" />
                            <div>
                                <h1 className="text-xl font-black text-slate-900 leading-tight">{storeName}</h1>
                                <p className="text-sm font-bold text-slate-600">Al3amer Store Systems</p>
                            </div>
                        </div>
                        <div className="text-left" dir="ltr">
                            <div className="bg-slate-900 text-white px-4 py-1 rounded-md mb-2 font-mono text-sm">
                                ORDER #{order.orderNumber}
                            </div>
                            <p className="text-xs font-bold text-slate-500">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                        </div>
                    </div>
                </div>

                {/* Sender/Receiver Grid */}
                <div className="grid grid-cols-2">
                    <div className="p-4 border-l border-slate-200 bg-slate-50/50">
                        <h3 className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-200 pb-1">بيانات المرسل</h3>
                        <p className="font-black text-slate-800 text-sm mb-1">{storeName}</p>
                        <p className="text-xs text-slate-600">{storePhones}</p>
                        <p className="text-xs text-slate-600">فرع المنصورة - طلخا</p>
                    </div>
                    <div className="p-4 bg-primary/5">
                        <h3 className="text-[10px] font-bold text-primary/60 mb-2 border-b border-primary/20 pb-1">بيانات العميل</h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <input 
                                    className="w-full text-sm font-black border-b border-primary/30 bg-transparent outline-none focus:border-primary" 
                                    value={localOrder.fullName}
                                    onChange={e => setLocalOrder({...localOrder, fullName: e.target.value})}
                                />
                                <input 
                                    className="w-full text-xs font-bold border-b border-primary/20 bg-transparent outline-none" 
                                    value={localOrder.phone}
                                    onChange={e => setLocalOrder({...localOrder, phone: e.target.value})}
                                />
                                <textarea 
                                    className="w-full text-[11px] border-b border-primary/10 bg-transparent outline-none resize-none" 
                                    rows={2}
                                    value={localOrder.address}
                                    onChange={e => setLocalOrder({...localOrder, address: e.target.value})}
                                />
                            </div>
                        ) : (
                            <>
                                <p className="font-black text-slate-900 text-lg mb-1">{localOrder.fullName}</p>
                                <p className="text-sm font-bold text-slate-700">{localOrder.phone}</p>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    {localOrder.address}, {localOrder.city}, {localOrder.governorate}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[11px] font-bold">
                                <th className="p-2 text-right rounded-r-lg">المنتج والوصف</th>
                                <th className="p-2 text-center w-16">الكمية</th>
                                <th className="p-2 text-center w-24 rounded-l-lg">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {localOrder.items.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-slate-100 group">
                                    <td className="p-3">
                                        {isEditing ? (
                                            <input 
                                                className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-primary"
                                                value={item.displayName}
                                                onChange={e => {
                                                    const newItems = [...localOrder.items];
                                                    newItems[idx].displayName = e.target.value;
                                                    setLocalOrder({...localOrder, items: newItems});
                                                }}
                                            />
                                        ) : (
                                            <p className="text-sm font-black text-slate-800">{item.displayName}</p>
                                        )}
                                    </td>
                                    <td className="p-3 text-center text-lg font-black text-slate-900">{item.quantity}</td>
                                    <td className="p-3 text-center">
                                        {isEditing && item.product?.id && (
                                            <button 
                                                onClick={() => handleUpdateShortName(item.product.id, item.displayName)}
                                                disabled={isUpdatingShortName === item.product.id}
                                                className="text-primary hover:scale-110 transition-transform disabled:opacity-50"
                                                title="حفظ كاختصار عالمي للمنتج"
                                            >
                                                {isUpdatingShortName === item.product.id ? (
                                                    <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-xl">cloud_sync</span>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="mt-auto border-t-2 border-dashed border-slate-200 p-6 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col items-center">
                            <div className="p-2 border-2 border-black rounded mb-2">
                                <div className="text-[10px] font-bold text-center border-b border-black mb-1">SCAN QR</div>
                                <div className="size-20 bg-black flex items-center justify-center text-white text-[8px] text-center px-1">
                                    [QR: {order.orderNumber}]
                                </div>
                            </div>
                            <p className="font-mono text-[10px] font-bold">{order.id.split('-')[0].toUpperCase()}</p>
                        </div>
                        
                        <div className="text-center bg-white border-4 border-slate-900 p-4 rounded-2xl shadow-xl min-w-[200px]">
                            <p className="text-xs font-bold text-slate-500 mb-1">المبلغ المطلوب تحصيله</p>
                            {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                    <input 
                                        type="number"
                                        className="text-3xl font-black text-slate-900 w-24 text-center outline-none border-b-2 border-primary" 
                                        value={localOrder.finalCodAmount}
                                        onChange={e => setLocalOrder({...localOrder, finalCodAmount: e.target.value})}
                                    />
                                    <span className="text-xl font-bold">ج.م</span>
                                </div>
                            ) : (
                                <p className="text-4xl font-black text-slate-900 leading-none">
                                    {Number(localOrder.finalCodAmount).toLocaleString()} <span className="text-xl">ج.م</span>
                                </p>
                            )}
                            <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-0.5 rounded-full uppercase tracking-widest leading-none">
                                Paid with Cash on Delivery
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 text-slate-400">
                             <p className="text-[10px] font-bold rotate-90 origin-right translate-y-8 uppercase tracking-widest">Al3amer Store systems</p>
                             <div className="size-12 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                 <span className="material-symbols-outlined text-xl">verified</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Contact Footer */}
                <div className="bg-red-600 p-2 text-white text-center">
                    <p className="text-[11px] font-bold flex items-center justify-center gap-4">
                        <span>للدعم الفني والاستفسار:</span>
                        <span dir="ltr">{storePhones}</span>
                    </p>
                </div>

                {/* Cut Lines Indicators */}
                <div className="absolute top-0 right-0 p-1 text-[8px] font-bold text-slate-300 opacity-20 rotate-90 origin-top-right">CUT HERE</div>
                <div className="absolute bottom-0 left-0 p-1 text-[8px] font-bold text-slate-300 opacity-20 rotate-90 origin-bottom-left">CUT HERE</div>
            </div>

            <style>{`
                @media screen {
                    .awb-container {
                        width: 148mm;
                        height: 210mm;
                        border-radius: 12px;
                    }
                }
                @media print {
                    @page { 
                        size: A5; 
                        margin: 0; 
                    }
                    body { 
                        margin: 0;
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                    .awb-container {
                        width: 148mm;
                        height: 210mm;
                        border: none;
                        box-shadow: none;
                    }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}

export default OrderAWB;
