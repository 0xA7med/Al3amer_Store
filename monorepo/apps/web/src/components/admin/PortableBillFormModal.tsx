
import { type Order } from '../../hooks/useAdmin';

interface PortableBillFormModalProps {
    order: Order;
    onClose: () => void;
}

export function PortableBillFormModal({ order, onClose }: PortableBillFormModalProps) {
    const customerName = order.user?.name || order.fullName || 'غير معروف';
    const customerPhone1 = order.phone || order.user?.phone || '';
    const customerPhone2 = (order.user as any)?.phone2 || '';
    const addressStr = [order.governorate, order.city, order.address]
        .filter(Boolean)
        .join(' - ');

    const traderBranding = order.trader?.traderBranding;
    const storeName = traderBranding?.storeName || 'مركز العامر لاجهزة الكاشير وانظمة المحاسبة';
    const storeLogo = traderBranding?.logoUrl || '/logo.png';
    const storeAddress = 'قرية سماحة - أجا - الدقهلية - برج المروة';
    const storePhone1 = traderBranding?.phone1 || '01017320430';
    const storePhone2 = traderBranding?.phone2 || '01554522434';

    const hasCost = order.paymentMethod === 'cod' && order.totalAtDelivery && parseFloat(order.totalAtDelivery) > 0;
    const amount = hasCost ? order.totalAtDelivery : '0';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-[100] p-4 overflow-y-auto no-scrollbar print:p-0 print:bg-white print:block">
            {/* Action Bar (hidden in print) */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 print:hidden pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={onClose}
                        className="size-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors backdrop-blur-md border border-white/10 shadow-xl"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
                <div className="pointer-events-auto flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="px-5 py-2.5 bg-primary text-slate-900 font-black rounded-full flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-xl">print</span>
                        طباعة البوليصة
                    </button>
                </div>
            </div>

            {/* Bill Container */}
            <div 
                className="bg-white text-black shadow-2xl rounded-xl w-full max-w-[210mm] p-6 sm:p-10 relative isolate print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-0 font-sans mt-16 sm:mt-0"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex mb-6 items-center border-b-2 border-slate-200 pb-4">
                    <h1 className="flex-1 font-black text-2xl sm:text-3xl" style={{ color: '#3258ef' }}>
                        {storeName}
                    </h1>
                    <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 ml-2">
                        <img src={storeLogo} alt="Store Logo" className="w-full h-full object-contain" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-2 border-slate-200 p-4 rounded-xl bg-slate-50 print:border-2">
                    {/* Row 1: Name */}
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 min-h-12">
                        <div className="bg-slate-100 flex items-center px-4 font-bold text-slate-700 border-l border-slate-200 w-28 shrink-0 justify-center">
                            المرسل اليه
                        </div>
                        <div className="flex-1 flex items-center px-4 font-bold text-slate-900 text-lg">
                            {customerName}
                        </div>
                    </div>

                    {/* Row 2: Address */}
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 min-h-12">
                        <div className="bg-slate-100 flex items-center px-4 font-bold text-slate-700 border-l border-slate-200 w-28 shrink-0 justify-center">
                            العنوان
                        </div>
                        <div className="flex-1 flex items-center px-4 font-bold text-slate-900 py-2 leading-relaxed">
                            {addressStr || 'غير محدد'}
                        </div>
                    </div>

                    {/* Row 3: Phones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 min-h-12">
                        <div className="flex items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <div className="bg-slate-100 flex items-center px-4 font-bold text-slate-700 border-l border-slate-200 w-28 shrink-0 justify-center">
                                تليفون اول
                            </div>
                            <div className="flex-1 flex items-center justify-center px-4 font-bold text-slate-900 text-lg" dir="ltr">
                                {customerPhone1 || 'ـــــــــــــــــ'}
                            </div>
                        </div>
                        <div className="flex items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <div className="bg-slate-100 flex items-center px-4 font-bold text-slate-700 border-l border-slate-200 w-28 shrink-0 justify-center text-sm sm:text-base">
                                تليفون ثاني
                            </div>
                            <div className="flex-1 flex items-center justify-center px-4 font-bold text-slate-900 text-lg" dir="ltr">
                                {customerPhone2 || 'ـــــــــــــــــ'}
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Pricing */}
                    <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex-1 flex items-stretch bg-white border-2 border-red-500 rounded-lg overflow-hidden min-h-14">
                            <div className="bg-red-500 text-white flex items-center px-4 font-bold border-l border-red-500 w-28 shrink-0 justify-center text-lg">
                                المبلغ
                            </div>
                            <div className="flex-1 flex items-center justify-center px-4 font-black text-red-600 text-2xl font-mono">
                                {parseInt(amount?.toString() || '0').toLocaleString('ar-EG')} ج.م
                            </div>
                        </div>
                        
                        <div className="flex gap-4 shrink-0 h-14">
                            <div className="flex items-center gap-2 px-6 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">
                                {hasCost ? (
                                    <>
                                        <span className="material-symbols-outlined text-red-500 text-[20px]">radio_button_checked</span>
                                        مقابل
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                                        بدون مقابل
                                    </>
                                )}
                            </div>
                            <div className="flex items-center px-6 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">
                                الشحن على المُستلم
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-2 border-slate-200 p-4 rounded-xl min-h-[100px] bg-slate-50 relative print:border-2">
                    <span className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-slate-500 inline-block">
                        محتويات الشحنة
                    </span>
                    <ul className="list-disc list-inside text-slate-800 font-bold space-y-2 mt-2 leading-loose whitespace-pre-wrap">
                        {order.items?.map((item: any) => (
                            <li key={item.id}>
                                {item.product?.shortNameAwb || item.product?.name || item.name} (x{item.quantity})
                            </li>
                        ))}
                    </ul>
                </div>

                {order.notes && (
                    <div className="mt-4 border-2 border-amber-200 bg-amber-50 rounded-xl p-4 print:border-2">
                        <span className="text-amber-800 font-bold flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[18px]">info</span>
                            ملاحظات الطلب:
                        </span>
                        <p className="text-amber-900 font-medium">{order.notes}</p>
                    </div>
                )}

                {/* Footer Center Name & Phones */}
                <div className="mt-8 text-center border-t-2 border-slate-200 pt-4 flex flex-col gap-2">
                    <p className="font-extrabold text-slate-800 text-lg sm:text-xl">
                        المركز: {storeAddress}
                    </p>
                    <p className="font-extrabold text-[#e53e3e] text-xl sm:text-2xl tracking-widest" dir="ltr">
                        ت: {storePhone1} / {storePhone2}
                    </p>
                </div>
            </div>

            {/* Print Styles injection */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 5mm;
                    }
                    body {
                        background: white !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    /* Ensure background colors are printed */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .fixed.inset-0, .fixed.inset-0 * {
                        visibility: visible;
                    }
                    .fixed.inset-0 {
                        position: absolute;
                        left: 0;
                        top: 0;
                        background: white !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}} />
        </div>
    );
}
