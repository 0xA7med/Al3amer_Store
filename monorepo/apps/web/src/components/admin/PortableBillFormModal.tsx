import { useState } from 'react';
import { createPortal } from 'react-dom';
import { type Order } from '../../hooks/useAdmin';
import api from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PortableBillFormModalProps {
    orders: Order | Order[];
    onClose: () => void;
}

interface BillData {
    fullName: string;
    phone: string;
    phone2: string;
    address: string;
    governorate: string;
    amount: string;
    shippingOption: string;
    productDesc: string;
    items: { productId: string; name: string; quantity: number; shortName?: string }[];
}

export function PortableBillFormModal({ orders: inputOrders, onClose }: PortableBillFormModalProps) {
    const queryClient = useQueryClient();
    const ordersArray = Array.isArray(inputOrders) ? inputOrders : [inputOrders];

    const [bills, setBills] = useState<Record<string, BillData>>(() => {
        const initial: Record<string, BillData> = {};
        ordersArray.forEach(order => {
            const items = (order.items || []).map(item => ({
                productId: item.product?.id || '',
                name: item.name || item.product?.name || 'منتج',
                quantity: item.quantity,
                shortName: (item.product as any)?.shortNameAwb || ''
            }));

            const generatedDesc = items.map(it => `\u200F(${it.quantity}) ${it.shortName || it.name}`).join(' - ');
            
            // Logic: Amount = Product Price - Advance Paid (Shipping is separate)
            const subtotal = parseFloat(order.subtotal || '0');
            const advance = parseFloat(order.codAdvancePayment || '0');
            const remainingBalance = Math.max(0, subtotal - advance);

            // Default Shipping Logic
            const defaultShipping = remainingBalance > 0 
                ? "ذهاب وعودة على المستلم" 
                : "على المستلم";

            initial[order.id] = {
                fullName: order.fullName || order.user?.name || '',
                phone: order.phone || order.user?.phone || '',
                phone2: order.phone2 || order.user?.phone2 || '',
                address: order.address || '',
                governorate: order.governorate || '',
                amount: remainingBalance.toString(),
                shippingOption: defaultShipping,
                productDesc: generatedDesc,
                items
            };
        });
        return initial;
    });

    const [savingItem, setSavingItem] = useState<string | null>(null);

    const updateShortName = useMutation({
        mutationFn: async ({ productId, shortName }: { productId: string, shortName: string }) => {
            const { data } = await api.patch(`/products/${productId}/short-name`, { shortNameAwb: shortName });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setSavingItem(null);
        },
        onError: () => setSavingItem(null)
    });

    const handleShortNameChange = (orderId: string, itemIdx: number, newShortName: string) => {
        const bill = bills[orderId];
        const newItems = [...bill.items];
        newItems[itemIdx] = { ...newItems[itemIdx], shortName: newShortName };
        const newDesc = newItems.map(it => `\u200F(${it.quantity}) ${it.shortName || it.name}`).join(' - ');
        
        setBills(prev => ({
            ...prev,
            [orderId]: { ...bill, items: newItems, productDesc: newDesc }
        }));
    };

    const saveShortName = (orderId: string, itemIdx: number) => {
        const item = bills[orderId].items[itemIdx];
        if (!item.productId) return;
        setSavingItem(`${orderId}-${itemIdx}`);
        updateShortName.mutate({ productId: item.productId, shortName: item.shortName || '' });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const storeName = "مركز العامر لاجهزة الكاشير وانظمة المحاسبة";
        const logoUrl = "https://i.ibb.co/KkCv1LF/Logo-Al3amer.png";
        const storePhones = "01026043165 - 01555883536";
        const footerTitle = "مركز العامر";

        const content = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>طباعة البوليصة</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #d32f2f;
            --header-color: #1a56db;
            --border-color: #e2e8f0;
            --label-bg: #f8fafc;
            --font-main: 'Cairo', sans-serif;
        }
        @page { size: A4 portrait; margin: 0 !important; padding: 0 !important; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: #fff; 
            font-family: var(--font-main);
            width: 210mm;
        }
        .print-container { 
            width: 210mm; 
            margin: 0; 
            padding: 0;
            display: block;
        }
        .bill-page { 
            width: 210mm; 
            height: 148.5mm; 
            position: relative; 
            overflow: hidden; 
            box-sizing: border-box;
            display: flex;
            align-items: center; 
            justify-content: center;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .bill-page:nth-child(even) { page-break-after: always; border-top: 1px dashed #eee; }
        .bill-page:nth-child(odd) { page-break-after: avoid; }

        .bill-container { 
            border: 3.5px solid #000; 
            border-radius: 20px; 
            padding: 15px; 
            width: 198mm; 
            height: 139mm; 
            display: flex; 
            flex-direction: column; 
            background: #fff; 
            margin: auto;
        }
        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
        .logo { height: 130px; width: auto; object-fit: contain; margin: -15px -20px -15px -10px !important; padding: 0 !important; }
        .store-name { flex: 1; font-size: 23px; font-weight: 900; color: var(--header-color); margin: 0; text-align: right; line-height: 1.2; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 10px; flex: 1; }
        .row { display: flex; align-items: stretch; border: 2.8px solid var(--border-color); border-radius: 12px; overflow: hidden; background: #fff; min-height: 40px; }
        .label { background: var(--label-bg); padding: 5px 15px; font-weight: 900; font-size: 18px; border-right: 2.8px solid var(--border-color); display: flex; align-items: center; min-width: 120px; justify-content: flex-end; color: #1e293b; }
        .value { flex: 1; padding: 5px 15px; font-size: 20px; font-weight: 900; display: flex; align-items: center; color: #000; }
        .row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .phone-container { display: flex; flex: 1; }
        .phone-box { flex: 1; text-align: center; padding: 5px; font-weight: 900; font-size: 20px; display: flex; align-items: center; justify-content: center; }
        .phone-divider { width: 2.8px; background: var(--border-color); }
        .footer-contact { text-align: center; margin-top: 10px; margin-bottom: 5px; color: var(--primary-color); font-weight: 950; font-size: 21px; border-top: 1px solid #eee; padding-top: 5px; }
        .product-desc-box { background: #fafafa; border: 2.5px solid #eee; border-radius: 12px; padding: 12px; text-align: center; font-size: 19px; font-weight: 800; color: #888; min-height: 55px; display: flex; align-items: center; justify-content: center; line-height: 1.4; }
    </style>
</head>
<body>
    <div class="print-container">
    ${Object.entries(bills).map(([_id, data]) => `
        <div class="bill-page">
            <div class="bill-container">
                <div class="header">
                    <img src="${logoUrl}" class="logo">
                    <h1 class="store-name">${storeName}</h1>
                </div>
                <div class="form-grid">
                    <div class="row">
                        <div class="label">الاسم:</div>
                        <div class="value">${data.fullName}</div>
                    </div>
                    <div class="row">
                        <div class="label">العنوان:</div>
                        <div class="value">${data.governorate} - ${data.address}</div>
                    </div>
                    <div class="row">
                        <div class="label">الهاتف:</div>
                        <div class="phone-container">
                            <div class="phone-box">${data.phone}</div>
                            <div class="phone-divider"></div>
                            <div class="phone-box">${data.phone2 || ''}</div>
                        </div>
                    </div>
                    <div class="row-split">
                        <div class="row">
                            <div class="label">مقابل:</div>
                            <div class="value" style="justify-content: center; font-weight: 950; font-size: 24px;">
                                ${data.amount === '0' || !data.amount ? 'بدون مقابل' : data.amount + ' ج.م'}
                            </div>
                        </div>
                        <div class="row">
                            <div class="label">الشحن:</div>
                            <div class="value" style="justify-content: center; font-size: 16px; text-align: center;">${data.shippingOption}</div>
                        </div>
                    </div>
                </div>
                <div class="footer-contact">${footerTitle} :: ${storePhones}</div>
                <div class="product-desc-box">${data.productDesc}</div>
            </div>
        </div>`).join('')}
    </div>
    <script>
        window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 700); };
    </script>
</body>
</html>`;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto ltr">
            <div className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <span className="material-symbols-outlined text-blue-400">print</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">معاينة وتعديل البوليصات المجمعة</h2>
                            <p className="text-sm text-gray-400">راجع واضبط بيانات {ordersArray.length} بوليصة قبل البدء</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
                    <style>{`
                        .live-bill-card { background: white; color: black; direction: rtl; font-family: 'Cairo', sans-serif; border-radius: 20px; padding: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); width: 100%; max-width: 650px; margin: 0 auto; border: 3.5px solid #000; }
                        .live-bill-card .header { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
                        .live-bill-card .logo { height: 130px; width: auto; object-fit: contain; margin: -15px -20px -15px -10px !important; padding: 0 !important; }
                        .live-bill-card .store-name { flex: 1; font-size: 20px; font-weight: 900; color: #1a56db; margin: 0; text-align: right; line-height: 1.2; }
                        .live-bill-card .row { display: flex; align-items: stretch; border: 3px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: #fff; min-height: 40px; }
                        .live-bill-card .label { background: #f8fafc; padding: 10px 15px; font-weight: 900; font-size: 16px; border-left: 3px solid #e2e8f0; min-width: 120px; display: flex; align-items: center; justify-content: flex-end; color: #1e293b; }
                        .live-bill-card input, .live-bill-card textarea, .live-bill-card select { flex: 1; padding: 10px 15px; font-size: 18px; font-weight: 700; background: transparent; border: none; outline: none; color: #1e293b; width: 100%; text-align: right; }
                        .live-bill-card .row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                        .live-bill-card .phone-group { display: flex; flex: 1; }
                        .live-bill-card .phone-group input { text-align: center; font-size: 17px; font-weight: 900; color: #2D3748; }
                        .live-bill-card .divider { width: 3px; background: #e2e8f0; }
                        .live-bill-card .footer-red { color: #d32f2f; text-align: center; font-weight: 950; font-size: 18px; margin: 10px 0 5px; line-height: 1.2; border-top: 1px solid #eee; padding-top: 5px; }
                        .live-bill-card .desc-box { background: #fafafa; border: 2.5px solid #eee; border-radius: 12px; padding: 12px; margin-top: 5px; }
                        .live-bill-card .desc-box textarea { text-align: center; font-size: 17px; min-height: 55px; resize: none; color: #888; line-height: 1.4; display: block; font-weight: 800; }
                        .live-bill-card .short-names-editor { margin-top: 30px; border-top: 2px dashed #edf2f7; padding-top: 25px; }
                        .live-bill-card .short-item { background: #f8fafc; border: 1px solid #edf2f7; border-radius: 15px; padding: 15px; margin-bottom: 20px; transition: all 0.2s; }
                        .live-bill-card .short-item:hover { border-color: #3b82f6; background: #f0f7ff; }
                        .live-bill-card .short-item-name { display: block; font-size: 14px; font-weight: 900; color: #1e293b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                    `}</style>

                    {ordersArray.map((order) => {
                        const data = bills[order.id];
                        if (!data) return null;
                        return (
                            <div key={order.id} className="live-bill-card">
                                <div className="header">
                                    <img src="https://i.ibb.co/KkCv1LF/Logo-Al3amer.png" className="logo" alt="logo" />
                                    <h1 className="store-name">مركز العامر لاجهزة الكاشير وانظمة المحاسبة</h1>
                                </div>

                                <div className="row">
                                    <div className="label">الاسم:</div>
                                    <input 
                                        value={data.fullName} 
                                        onChange={e => setBills(prev => ({...prev, [order.id]: {...data, fullName: e.target.value}}))} 
                                        placeholder="اسم العميل..."
                                    />
                                </div>

                                <div className="row">
                                    <div className="label">العنوان:</div>
                                    <input 
                                        value={`${data.governorate} - ${data.address}`} 
                                        onChange={e => {
                                            const parts = e.target.value.split(' - ');
                                            setBills(prev => ({...prev, [order.id]: {...data, governorate: parts[0]||'', address: parts.slice(1).join(' - ')||''}}));
                                        }} 
                                        placeholder="المحافظة - العنوان..."
                                    />
                                </div>

                                <div className="row">
                                    <div className="label">الهاتف:</div>
                                    <div className="phone-group">
                                        <input 
                                            value={data.phone} 
                                            onChange={e => setBills(prev => ({...prev, [order.id]: {...data, phone: e.target.value}}))} 
                                            placeholder="الرقم الأساسي"
                                        />
                                        <div className="divider" />
                                        <input 
                                            placeholder="رقم إضافي" 
                                            value={data.phone2} 
                                            onChange={e => setBills(prev => ({...prev, [order.id]: {...data, phone2: e.target.value}}))} 
                                        />
                                    </div>
                                </div>

                                <div className="row-split">
                                    <div className="row">
                                        <div className="label">مقابل:</div>
                                        <div className="flex-1 flex items-center justify-center font-black text-xl text-blue-700">
                                            <input 
                                                className="!text-center !font-black !text-2xl" 
                                                value={data.amount} 
                                                onChange={e => setBills(prev => ({...prev, [order.id]: {...data, amount: e.target.value}}))} 
                                            />
                                            <span className="ml-2 text-sm font-bold text-gray-500">ج.م</span>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="label">الشحن:</div>
                                        <select 
                                            className="!text-center text-sm" 
                                            value={data.shippingOption} 
                                            onChange={e => setBills(prev => ({...prev, [order.id]: {...data, shippingOption: e.target.value}}))}
                                        >
                                            <option value="ذهاب وعودة على المستلم">ذهاب وعودة على المستلم</option>
                                            <option value="على المستلم">على المستلم</option>
                                            <option value="شحن مجاني">شحن مجاني</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="footer-red">مركز العامر :: 01026043165 - 01555883536</div>
                                
                                <div className="desc-box">
                                    <textarea 
                                        value={data.productDesc} 
                                        onChange={e => setBills(prev => ({...prev, [order.id]: {...data, productDesc: e.target.value}}))}
                                        placeholder="وصف المنتجات سيظهر هنا..."
                                    />
                                </div>

                                {/* Redesigned Short Name Editor: Vertical, Headed, and Labeled */}
                                <div className="short-names-editor">
                                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                                        <span className="material-symbols-outlined text-blue-600">edit_note</span>
                                        <p className="text-sm text-slate-800 font-black">تعديل اختصار المنتجات (للمعاينة):</p>
                                    </div>
                                    {data.items.map((item, idx) => {
                                        const isSaving = savingItem === `${order.id}-${idx}`;
                                        return (
                                            <div key={idx} className="short-item">
                                                <span className="short-item-name">
                                                    {item.name} <span className="text-blue-600">(الكمية: {item.quantity})</span>
                                                </span>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 focus-within:border-blue-500 transition-all">
                                                        <span className="text-[10px] text-slate-400 font-bold ml-2 whitespace-nowrap">الاختصار:</span>
                                                        <input 
                                                            className="!px-1 !py-2 !text-sm !font-black !text-blue-800" 
                                                            placeholder="مثال: طابعة إيصالات..."
                                                            value={item.shortName}
                                                            onChange={e => handleShortNameChange(order.id, idx, e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && saveShortName(order.id, idx)}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => saveShortName(order.id, idx)}
                                                        disabled={isSaving}
                                                        className={`size-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isSaving ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'}`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[20px] ${isSaving ? 'animate-spin' : ''}`}>
                                                            {isSaving ? 'sync' : 'save'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between bg-black/60">
                    <p className="text-sm text-gray-500 font-medium italic">
                        * سيتم طباعة بوليصتين في كل صفحة A4 (بالطول)
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all font-bold">إلغاء</button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                            <span className="material-symbols-outlined">print</span>
                            تأكيد وطباعة
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
