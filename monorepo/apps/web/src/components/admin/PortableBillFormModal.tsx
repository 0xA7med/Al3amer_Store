
import { useState, useRef } from 'react';
import { type Order } from '../../hooks/useAdmin';

interface PortableBillFormModalProps {
    order: Order;
    onClose: () => void;
}

export function PortableBillFormModal({ order, onClose }: PortableBillFormModalProps) {
    const hasCost = order.paymentMethod === 'cod' && order.totalAtDelivery && parseFloat(order.totalAtDelivery) > 0;
    const initialAmount = hasCost ? order.totalAtDelivery : '0';

    const [name, setName] = useState(order.fullName || order.user?.name || '');
    // Address format: Governorate - Delivery details (No City as requested)
    const [address, setAddress] = useState([order.governorate, order.address].filter(Boolean).join(' - '));
    const [phone1, setPhone1] = useState(order.phone || order.user?.phone || '');
    const [phone2, setPhone2] = useState((order.user as any)?.phone2 || '');
    
    const [shippingOption, setShippingOption] = useState('مصاريف الشحن: على المرسل');
    const [paymentOption, setPaymentOption] = useState(hasCost ? `مقابل: ${parseInt(initialAmount?.toString() || '0').toLocaleString('ar-EG')} ج.م` : 'مقابل: بدون مقابل');
    
    const [itemsStr, setItemsStr] = useState(
        order.items?.map((i: any) => `• ${(i.product as any)?.shortNameAwb || i.product?.name || i.name} (x${i.quantity})`).join('\n') || ''
    );

    const traderBranding = order.trader?.traderBranding;
    const storeName = traderBranding?.storeName || 'مركز العامر لاجهزة الكاشير وانظمة المحاسبة';
    const storeLogo = traderBranding?.logoUrl || '/logo.png';

    // Print specific styling overrides
    const printRef = useRef<HTMLDivElement>(null);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-[100] p-4 sm:p-8 overflow-y-auto no-scrollbar print:p-0 print:bg-white print:block">
            {/* Action Bar (hidden in print) */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 print:hidden pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={onClose}
                        className="size-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors backdrop-blur-md border border-white/10 shadow-xl"
                        title="إغلاق"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
                <div className="pointer-events-auto flex items-center gap-2 bg-black/50 p-2 rounded-2xl backdrop-blur-md border border-white/10">
                    <p className="text-white text-xs px-2 font-medium hidden sm:block">يمكنك النقر على أي نص لتعديله قبل الطباعة</p>
                    <button
                        onClick={() => window.print()}
                        className="px-5 py-2 bg-primary text-slate-900 font-black rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-xl">print</span>
                        طباعة البوليصة
                    </button>
                </div>
            </div>

            {/* Bill Container - A5 Dimensions */}
            <div 
                ref={printRef}
                className="bg-white text-black w-full max-w-[210mm] min-h-[148mm] relative isolate print:shadow-none print:w-[210mm] print:min-h-[148mm] print:m-0 font-sans mt-16 sm:mt-0 mx-auto rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden print:rounded-none"
                style={{ direction: 'rtl' }}
            >
                {/* Header Container */}
                <div className="px-6 py-4 flex items-center justify-between pointer-events-none">
                    <img src={storeLogo} alt="Logo" className="w-24 h-12 sm:h-14 object-contain" />
                    <h1 className="font-bold text-2xl sm:text-[26px] tracking-tight" style={{ color: '#1a4edd' }}>
                        {storeName}
                    </h1>
                </div>

                {/* Form Body Layout */}
                <div className="px-6 pb-6 flex flex-col gap-3">
                    {/* Name Row */}
                    <div className="flex border border-slate-300 rounded-lg h-11 sm:h-12 bg-white overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <label className="font-bold text-black px-4 flex items-center shrink-0 border-l border-slate-300 bg-slate-50/50 w-24">الاسم:</label>
                        <input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="flex-1 w-full h-full px-4 outline-none font-bold text-slate-900 bg-transparent text-sm sm:text-base placeholder:text-slate-400"
                            placeholder="اسم المستلم"
                        />
                    </div>

                    {/* Address Row */}
                    <div className="flex border border-slate-300 rounded-lg min-h-11 sm:min-h-12 bg-white overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <label className="font-bold text-black px-4 flex items-center shrink-0 border-l border-slate-300 bg-slate-50/50 w-24">العنوان:</label>
                        <textarea 
                            value={address} 
                            onChange={e => setAddress(e.target.value)} 
                            className="flex-1 w-full p-3 outline-none font-bold text-slate-900 bg-transparent resize-none text-sm sm:text-base leading-snug placeholder:text-slate-400"
                            rows={2}
                            placeholder="محافظة - تفاصيل العنوان..."
                        />
                    </div>

                    {/* Phones Row */}
                    <div className="flex flex-col sm:flex-row border border-slate-300 rounded-lg min-h-11 sm:h-12 bg-white sm:overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <label className="hidden sm:flex font-bold text-black px-4 items-center shrink-0 border-l border-slate-300 bg-slate-50/50 w-24">الهاتف:</label>
                        
                        <div className="flex-1 flex items-center relative border-b sm:border-b-0 border-slate-200">
                            <input 
                                value={phone1} 
                                onChange={e => setPhone1(e.target.value)} 
                                className="w-full h-11 sm:h-full px-4 outline-none font-bold text-slate-900 bg-transparent text-center text-sm sm:text-base placeholder:text-slate-400"
                                placeholder="رقم الهاتف الأول" 
                                dir="ltr"
                            />
                        </div>
                        
                        <div className="w-px bg-slate-300 hidden sm:block"></div>
                        
                        <div className="flex-1 flex items-center relative">
                            <input 
                                value={phone2} 
                                onChange={e => setPhone2(e.target.value)} 
                                className="w-full h-11 sm:h-full px-4 outline-none font-bold text-slate-900 bg-transparent text-center text-sm sm:text-base placeholder:text-slate-400"
                                placeholder="رقم الهاتف الثاني" 
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Shipping & Payment Options Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 border border-slate-300 rounded-lg h-11 sm:h-12 bg-white flex items-center overflow-hidden focus-within:border-primary transition-all">
                            <input 
                                value={shippingOption} 
                                onChange={e => setShippingOption(e.target.value)} 
                                className="w-full h-full text-center outline-none font-bold text-slate-900 bg-transparent px-2 text-sm sm:text-base"
                            />
                        </div>
                        <div className="flex-1 border border-slate-300 rounded-lg h-11 sm:h-12 bg-white flex items-center overflow-hidden focus-within:border-primary transition-all">
                            <input 
                                value={paymentOption} 
                                onChange={e => setPaymentOption(e.target.value)} 
                                className="w-full h-full text-center outline-none font-bold text-slate-900 bg-transparent px-2 text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Red Footer Contact Details */}
                    <div className="mt-2 sm:mt-4 mb-2 flex justify-center items-center">
                        <input
                            defaultValue="مركز العامر :: 01555883536 - 01026043165"
                            className="text-center font-bold text-red-600 text-base sm:text-lg w-full max-w-lg outline-none cursor-text hover:bg-red-50 focus:bg-red-50 rounded px-2 py-1 transition-colors"
                            dir="auto"
                        />
                    </div>

                    {/* Product Descriptions Area */}
                    <div className="border border-slate-200 bg-slate-50 rounded-lg flex flex-col relative focus-within:border-slate-300 transition-all">
                        <div className="text-center text-slate-500 font-bold text-[13px] sm:text-sm py-2 px-4 select-none">
                            وصف المنتج المشحون
                        </div>
                        <textarea 
                            value={itemsStr} 
                            onChange={e => setItemsStr(e.target.value)} 
                            className="w-full bg-transparent p-4 pt-0 outline-none font-extrabold text-slate-800 resize-none text-[13px] sm:text-sm text-center leading-loose"
                            rows={3}
                            placeholder="اكتب وصف المنتجات هنا..."
                        />
                    </div>
                </div>
            </div>

            {/* A5 Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 210mm;
                        height: 148mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .fixed.inset-0, .fixed.inset-0 * {
                        visibility: visible;
                    }
                    .fixed.inset-0 {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 0;
                        background: white !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    /* Force borders and colors in print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Hide placeholder text in print if empty */
                    ::-webkit-input-placeholder { color: transparent !important; }
                    :-moz-placeholder { color: transparent !important; }
                    ::-moz-placeholder { color: transparent !important; }
                    :-ms-input-placeholder { color: transparent !important; }
                    
                    textarea { resize: none !important; }
                }
            `}} />
        </div>
    );
}
