import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { type Order } from '../../hooks/useAdmin';
import api from '../../lib/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

interface BillLayoutConfig {
    logo?: { x: number; y: number; height: number; width?: number; marginRight?: number; marginTop?: number; marginBottom?: number; marginLeft?: number };
    title?: { x: number; y: number; fontSize: number; text?: string; color?: string; xOffset?: number; yOffset?: number };
    footer?: { x: number; y: number; fontSize: number; text?: string; marginTop?: number; yOffset?: number };
    container?: { padding?: number; borderSize?: number; marginTop?: number; marginBottom?: number };
}

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
            
            const subtotal = parseFloat(order.subtotal || '0');
            const advance = parseFloat(order.codAdvancePayment || '0');
            const shipping = parseFloat(order.shippingCost || '0');
            const returnFee = parseFloat(order.codReturnShipping || '0');
            
            const remainingBalance = Math.max(0, subtotal - advance);
            const totalCodAmount = remainingBalance + shipping + returnFee;

            const defaultShipping = returnFee > 0 
                ? `ذهاب (${shipping}) + عودة (${returnFee})` 
                : "على المستلم";

            initial[order.id] = {
                fullName: order.fullName || order.user?.name || '',
                phone: order.phone || order.user?.phone || '',
                phone2: order.phone2 || order.user?.phone2 || '',
                address: order.address || '',
                governorate: order.governorate || '',
                amount: totalCodAmount.toString(),
                shippingOption: defaultShipping,
                productDesc: generatedDesc,
                items
            };
        });
        return initial;
    });

    const [isDesignMode, setIsDesignMode] = useState(false);
    const { data: settings } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings');
            return data;
        }
    });

    const [layout, setLayout] = useState<BillLayoutConfig>({});
    const layoutLoadedRef = useRef(false);

    // ✅ FIX: Load saved layout from DB when settings arrive (was wrong useState before)
    useEffect(() => {
        if (settings?.billLayoutConfig && !layoutLoadedRef.current) {
            setLayout(settings.billLayoutConfig);
            layoutLoadedRef.current = true;
        }
    }, [settings]);

    const [isShortNamesOpen, setIsShortNamesOpen] = useState(false);
    const [shortNamesSaved, setShortNamesSaved] = useState<Record<string, boolean>>({});

    // ═══ Self-contained toast (renders inside portal, always visible above modal) ═══
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    }, []);

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: any) => {
            const { data } = await api.patch('/settings', newSettings);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            showToast('✅ تم حفظ تنسيق البوليصة للجميع', 'success');
        },
        onError: () => {
            showToast('❌ فشل الحفظ، تحقق من الاتصال', 'error');
        }
    });

    const saveLayout = () => {
        updateSettingsMutation.mutate({ billLayoutConfig: layout });
    };

    const [savingItem, setSavingItem] = useState<string | null>(null);

    const updateShortName = useMutation({
        mutationFn: async ({ productId, shortName }: { productId: string, shortName: string }) => {
            const { data } = await api.patch(`/products/${productId}/short-name`, { shortNameAwb: shortName });
            return data;
        },
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setSavingItem(null);
            setShortNamesSaved(prev => ({ ...prev, [vars.productId]: true }));
            showToast('✅ تم حفظ الاختصار بنجاح', 'success');
            setTimeout(() => setShortNamesSaved(prev => ({ ...prev, [vars.productId]: false })), 2000);
        },
        onError: () => {
            setSavingItem(null);
            showToast('❌ فشل حفظ الاختصار', 'error');
        }
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

        const storeName = layout.title?.text || settings?.storeNameAr || "مركز العامر لاجهزة الكاشير وانظمة المحاسبة";
        const logoUrl = settings?.logoUrl || "https://i.ibb.co/KkCv1LF/Logo-Al3amer.png";
        const storePhones = layout.footer?.text || "مركز العامر :: 01026043165 - 01555883536";

        const l = layout;

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
            padding: ${l.container?.padding || 15}px; 
            width: 198mm; 
            height: 139mm; 
            display: flex; 
            flex-direction: column; 
            background: #fff; 
            margin: auto;
            margin-top: ${l.container?.marginTop || 0}px;
            margin-bottom: ${l.container?.marginBottom || 0}px;
        }
        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; position: relative; }
        .logo { 
            height: ${l.logo?.height || 120}px; 
            width: auto; 
            object-fit: contain; 
            margin: ${l.logo?.marginTop ?? -5}px ${l.logo?.marginRight ?? 0}px ${l.logo?.marginBottom ?? -5}px ${l.logo?.marginLeft ?? 0}px !important; 
            padding: 0 !important;
            transform: translate(${l.logo?.x || 0}px, ${l.logo?.y || 0}px);
            z-index: 2;
        }
        .store-name { 
            flex: 1; 
            font-size: ${l.title?.fontSize || 23}px; 
            font-weight: 900; 
            color: var(--header-color); 
            margin: 0; 
            text-align: right; 
            line-height: 1.2; 
            transform: translate(${l.title?.x || 0}px, ${l.title?.y || 0}px);
            z-index: 2;
        }
        .form-grid { display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: flex-start; }
        .row { display: flex; align-items: stretch; border: 2.8px solid var(--border-color); border-radius: 12px; overflow: hidden; background: #fff; min-height: 40px; flex-shrink: 0; }
        .label { background: var(--label-bg); padding: 5px 15px; font-weight: 900; font-size: 18px; border-right: 2.8px solid var(--border-color); display: flex; align-items: center; min-width: 120px; justify-content: flex-end; color: #1e293b; }
        .value { flex: 1; padding: 5px 15px; font-size: 20px; font-weight: 900; display: flex; align-items: center; color: #000; }
        .row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex-shrink: 0; }
        .phone-container { display: flex; flex: 1; }
        .phone-box { flex: 1; text-align: center; padding: 5px; font-weight: 900; font-size: 20px; display: flex; align-items: center; justify-content: center; }
        .phone-divider { width: 2.8px; background: var(--border-color); }
        .footer-contact { 
            text-align: center; 
            margin-top: ${l.footer?.marginTop || 10}px; 
            margin-bottom: 5px; 
            color: var(--primary-color); 
            font-weight: 950; 
            font-size: ${l.footer?.fontSize || 21}px; 
            border-top: 1px solid #eee; 
            padding-top: 5px; 
            transform: translate(${l.footer?.x || 0}px, ${l.footer?.y || 0}px);
            z-index: 2;
        }
        .product-desc-box { background: #fafafa; border: 2.5px solid #eee; border-radius: 12px; padding: 12px; text-align: center; font-size: 19px; font-weight: 800; color: #888; min-height: 55px; display: flex; align-items: center; justify-content: center; line-height: 1.4; flex-shrink: 0; }
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
                <div class="footer-contact">${storePhones}</div>
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

            {/* ═══ INTERNAL TOAST — always on top of the modal ═══ */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl font-bold text-white text-sm animate-in slide-in-from-top-4 duration-300 ${
                    toast.type === 'success' ? 'bg-green-600 border border-green-400/30' :
                    toast.type === 'error'   ? 'bg-red-600 border border-red-400/30' :
                    'bg-slate-700 border border-white/10'
                }`}>
                    <span className="material-symbols-outlined text-[20px]">
                        {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                    </span>
                    {toast.msg}
                </div>
            )}
            <div className="relative w-full max-w-5xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <span className="material-symbols-outlined text-blue-400">print</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">معاينة وتعديل البوليصات المجمعة</h2>
                            <p className="text-sm text-gray-400">تطابق تام مع الطباعة - اسحب العناصر واضبطها كما ترغب</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar bg-black/50">
                    <style>{`
                        /* Exact replication of Print Container */
                        .live-bill-card { 
                            background: white; color: black; direction: rtl; font-family: 'Cairo', sans-serif; 
                            border-radius: 20px; 
                            padding: ${layout.container?.padding ?? 15}px; 
                            width: 198mm; height: 139mm; /* EXACT A4 HALF-PAGE DIMENSIONS */
                            box-shadow: 0 10px 40px rgba(0,0,0,0.6); 
                            margin: 0 auto; 
                            border: 3.5px solid #000; 
                            position: relative; 
                            display: flex; flex-direction: column; flex-shrink: 0;
                            overflow: hidden;
                        }
                        .live-bill-card .header { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; position: relative; }
                        .live-bill-card .logo { 
                            height: ${layout.logo?.height || 120}px; width: auto; object-fit: contain; 
                            margin: ${layout.logo?.marginTop ?? -5}px ${layout.logo?.marginRight ?? 0}px ${layout.logo?.marginBottom ?? -5}px ${layout.logo?.marginLeft ?? 0}px !important; padding: 0 !important; 
                            cursor: ${isDesignMode ? 'move' : 'default'}; 
                            user-select: none;
                        }
                        .live-bill-card .store-name { 
                            flex: 1; font-size: ${layout.title?.fontSize || 23}px; font-weight: 900; color: #1a56db; margin: 0; text-align: right; line-height: 1.2; 
                            cursor: ${isDesignMode ? 'move' : 'default'}; 
                            user-select: none;
                        }
                        
                        /* Layout Flex Magic */
                        .live-bill-card .form-grid { display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: flex-start; }
                        
                        .live-bill-card .row { display: flex; align-items: stretch; border: 2.8px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; min-height: 40px; flex-shrink: 0; }
                        .live-bill-card .label { background: #f8fafc; padding: 5px 15px; font-weight: 900; font-size: 18px; border-left: 2.8px solid #e2e8f0; min-width: 120px; display: flex; align-items: center; justify-content: flex-end; color: #1e293b; }
                        .live-bill-card textarea { flex: 1; padding: 5px 15px; font-size: 19px; font-weight: 900; background: transparent; border: none; outline: none; color: #000; width: 100%; text-align: right; resize: none; overflow: hidden; line-height: 1.3; }
                        .live-bill-card .row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex-shrink: 0; }
                        .live-bill-card .phone-group { display: flex; flex: 1; }
                        .live-bill-card .phone-group input { text-align: center; font-size: 20px; font-weight: 900; color: #000; }
                        .live-bill-card .divider { width: 2.8px; background: #e2e8f0; }
                        .live-bill-card .footer-red { 
                            color: #d32f2f; text-align: center; font-weight: 950; font-size: ${layout.footer?.fontSize || 21}px; 
                            margin: ${layout.footer?.marginTop ?? 10}px 0 5px; line-height: 1.2; border-top: 1px solid #eee; padding-top: 5px; 
                            cursor: ${isDesignMode ? 'move' : 'default'}; 
                        }
                        
                        .live-bill-card .resize-handle { position: absolute; width: 14px; height: 14px; background: #fff; border: 3px solid #d32f2f; border-radius: 50%; bottom: -7px; left: -7px; cursor: nwse-resize; z-index: 100; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: ${isDesignMode ? 'block' : 'none'}; }
                        .live-bill-card .design-overlay { position: absolute; inset: -5px; border: 2px dashed #d32f2f; border-radius: 8px; pointer-events: none; display: ${isDesignMode ? 'block' : 'none'}; z-index: 10; }
                        
                        .live-bill-card .desc-box { background: #fafafa; border: 2.5px solid #eee; border-radius: 12px; padding: 12px; margin-top: 5px; flex-shrink: 0; }
                        .live-bill-card .desc-box textarea { text-align: center; font-size: 19px; min-height: 55px; resize: none; color: #888; line-height: 1.4; display: block; font-weight: 800; }

                        /* Short Editor Moved OUTSIDE the layout */
                        .short-names-editor { margin-top: 10px; }
                        .short-item { background: #f8fafc; border: 1px solid #edf2f7; border-radius: 15px; padding: 15px; margin-bottom: 15px; transition: all 0.2s; direction: rtl; }
                        .short-item:hover { border-color: #3b82f6; background: #f0f7ff; }
                        .short-item-name { display: block; font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                    `}</style>
                    
                    <div className="flex flex-col gap-16">
                        {ordersArray.map((order) => {
                            const data = bills[order.id];
                            if (!data) return null;
                            return (
                                <div key={order.id} className="relative w-full flex flex-col items-center gap-6">
                                    
                                    {/* The Print Mirror Container Area */}
                                    <div className="w-full overflow-x-auto pb-4 flex justify-center custom-scrollbar">
                                        <div className="live-bill-card" style={{ transformOrigin: 'top center' }}>
                                            <div className="header">
                                                {/* LOGO */}
                                                <motion.div 
                                                    drag={isDesignMode}
                                                    dragMomentum={false}
                                                    onDragEnd={(_, info) => setLayout(prev => ({
                                                        ...prev, 
                                                        logo: { ...prev.logo, x: (prev.logo?.x || 0) + info.offset.x, y: (prev.logo?.y || 0) + info.offset.y, height: prev.logo?.height || 120 }
                                                    }))}
                                                    style={{ x: layout.logo?.x || 0, y: layout.logo?.y || 0, position: 'relative', zIndex: isDesignMode ? 50 : 2 }}
                                                >
                                                    <img src={settings?.logoUrl || "https://i.ibb.co/KkCv1LF/Logo-Al3amer.png"} className="logo pointer-events-none" alt="logo" />
                                                    {isDesignMode && (
                                                        <>
                                                            <div className="design-overlay" />
                                                            <div 
                                                                className="resize-handle" 
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    const startY = e.clientY;
                                                                    const startH = layout.logo?.height || 120;
                                                                    const onMove = (me: MouseEvent) => {
                                                                        const delta = me.clientY - startY;
                                                                        setLayout(prev => ({ ...prev, logo: { ...prev.logo!, height: Math.max(50, startH + delta), x: prev.logo?.x || 0, y: prev.logo?.y || 0 } }));
                                                                    };
                                                                    const onUp = () => {
                                                                        window.removeEventListener('mousemove', onMove);
                                                                        window.removeEventListener('mouseup', onUp);
                                                                    };
                                                                    window.addEventListener('mousemove', onMove);
                                                                    window.addEventListener('mouseup', onUp);
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                </motion.div>

                                                {/* STORE NAME */}
                                                <motion.div 
                                                    className="flex-1 text-right"
                                                    drag={isDesignMode}
                                                    dragMomentum={false}
                                                    onDragEnd={(_, info) => setLayout(prev => ({
                                                        ...prev, 
                                                        title: { ...prev.title, x: (prev.title?.x || 0) + info.offset.x, y: (prev.title?.y || 0) + info.offset.y, fontSize: prev.title?.fontSize || 23 }
                                                    }))}
                                                    style={{ x: layout.title?.x || 0, y: layout.title?.y || 0, position: 'relative', zIndex: isDesignMode ? 50 : 2 }}
                                                >
                                                    {isDesignMode ? (
                                                        <input 
                                                            className="store-name px-2 !bg-transparent w-full border-none outline-none"
                                                            value={layout.title?.text || settings?.storeNameAr || "مركز العامر لاجهزة الكاشير وانظمة المحاسبة"}
                                                            onChange={e => setLayout(prev => ({ ...prev, title: { ...prev.title!, text: e.target.value, x: prev.title?.x || 0, y: prev.title?.y || 0, fontSize: prev.title?.fontSize || 23 } }))}
                                                        />
                                                    ) : (
                                                        <h1 className="store-name px-2 pointer-events-none">{layout.title?.text || settings?.storeNameAr || "مركز العامر لاجهزة الكاشير وانظمة المحاسبة"}</h1>
                                                    )}
                                                    {isDesignMode && (
                                                        <>
                                                            <div className="design-overlay" />
                                                            <div 
                                                                className="resize-handle" 
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    const startX = e.clientX;
                                                                    const startSize = layout.title?.fontSize || 23;
                                                                    const onMove = (me: MouseEvent) => {
                                                                        const delta = startX - me.clientX; // RTL resize
                                                                        setLayout(prev => ({ ...prev, title: { ...prev.title!, fontSize: Math.max(10, startSize + delta/10), x: prev.title?.x || 0, y: prev.title?.y || 0 } }));
                                                                    };
                                                                    const onUp = () => {
                                                                        window.removeEventListener('mousemove', onMove);
                                                                        window.removeEventListener('mouseup', onUp);
                                                                    };
                                                                    window.addEventListener('mousemove', onMove);
                                                                    window.addEventListener('mouseup', onUp);
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                </motion.div>
                                            </div>

                                            {/* BODY FIELDS */}
                                            <div className="form-grid">
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
                                                    <textarea 
                                                        rows={2}
                                                        value={`${data.governorate}${data.address ? ' - ' + data.address : ''}`} 
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
                                                            className="!text-center text-[15px]" 
                                                            value={data.shippingOption} 
                                                            onChange={e => setBills(prev => ({...prev, [order.id]: {...data, shippingOption: e.target.value}}))}
                                                        >
                                                            <option value="ذهاب وعودة على المستلم">ذهاب وعودة على المستلم</option>
                                                            <option value="على المستلم">على المستلم</option>
                                                            <option value="شحن مجاني">شحن مجاني</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* FOOTER */}
                                            <motion.div 
                                                drag={isDesignMode}
                                                dragMomentum={false}
                                                onDragEnd={(_, info) => setLayout(prev => ({
                                                    ...prev, 
                                                    footer: { ...prev.footer, x: (prev.footer?.x || 0) + info.offset.x, y: (prev.footer?.y || 0) + info.offset.y, fontSize: prev.footer?.fontSize || 21 }
                                                }))}
                                                style={{ x: layout.footer?.x || 0, y: layout.footer?.y || 0, position: 'relative', zIndex: isDesignMode ? 50 : 2 }}
                                            >
                                                <div className="footer-red">
                                                    {isDesignMode ? (
                                                        <input 
                                                            className="!text-center !text-red-600 !p-0 !m-0 !w-full !bg-transparent"
                                                            value={layout.footer?.text || "مركز العامر :: 01026043165 - 01555883536"}
                                                            onChange={e => setLayout(prev => ({ ...prev, footer: { ...prev.footer!, text: e.target.value, x: prev.footer?.x || 0, y: prev.footer?.y || 0, fontSize: prev.footer?.fontSize || 21 } }))}
                                                        />
                                                    ) : (
                                                        layout.footer?.text || "مركز العامر :: 01026043165 - 01555883536"
                                                    )}
                                                </div>
                                                {isDesignMode && (
                                                    <>
                                                        <div className="design-overlay" />
                                                        <div 
                                                            className="resize-handle" 
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                const startX = e.clientX;
                                                                const startSize = layout.footer?.fontSize || 21;
                                                                const onMove = (me: MouseEvent) => {
                                                                    const delta = startX - me.clientX;
                                                                    setLayout(prev => ({ ...prev, footer: { ...prev.footer!, fontSize: Math.max(10, startSize + delta/10), x: prev.footer?.x || 0, y: prev.footer?.y || 0 } }));
                                                                };
                                                                const onUp = () => {
                                                                    window.removeEventListener('mousemove', onMove);
                                                                    window.removeEventListener('mouseup', onUp);
                                                                };
                                                                window.addEventListener('mousemove', onMove);
                                                                window.addEventListener('mouseup', onUp);
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </motion.div>
                                            
                                            <div className="desc-box">
                                                <textarea 
                                                    value={data.productDesc} 
                                                    onChange={e => setBills(prev => ({...prev, [order.id]: {...data, productDesc: e.target.value}}))}
                                                    placeholder="وصف المنتجات سيظهر هنا..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Design Mode Extended Tools */}
                                    {isDesignMode && (
                                        <div className="w-full max-w-[198mm] bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                                            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
                                                <span className="material-symbols-outlined text-blue-400">crop</span>
                                                <p className="text-[15px] text-white font-black">قص وإزالة المساحات الفارغة للوجو (إعطاء إحداثيات سالبة لسحب المساحات):</p>
                                            </div>
                                            <div className="grid grid-cols-4 gap-6">
                                                {['Top', 'Bottom', 'Right', 'Left'].map(margin => (
                                                    <div key={margin} className="flex flex-col bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner hover:border-blue-500/30 transition-all">
                                                        <label className="text-[11px] text-gray-400 font-bold mb-3 text-center">{margin === 'Top' ? 'قص من الأعلى' : margin === 'Bottom' ? 'قص من الأسفل' : margin === 'Right' ? 'يمين' : 'يسار'}</label>
                                                        <div className="flex items-center mx-auto">
                                                            <input 
                                                                type="number" 
                                                                dir="ltr"
                                                                className="w-[70px] bg-black text-white rounded-lg px-2 py-2 text-[16px] font-black text-center border-2 border-white/10 focus:border-blue-500 outline-none transition-all" 
                                                                value={layout.logo?.[`margin${margin}` as keyof typeof layout.logo] ?? (margin === 'Top' || margin === 'Bottom' ? -5 : 0)}
                                                                onChange={e => setLayout(prev => ({ ...prev, logo: { ...prev.logo!, [`margin${margin}`]: parseInt(e.target.value) || 0, height: prev.logo?.height || 120, x: prev.logo?.x || 0, y: prev.logo?.y || 0 } }))}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}



                                </div>
                            );
                        })}
                    </div>

                    {/* ═══ UNIFIED Short Names Editor (all bills/products at once) ═══ */}
                    <div className="w-full bg-[#0d1117] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                        {/* Accordion Header */}
                        <button
                            onClick={() => setIsShortNamesOpen(p => !p)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-yellow-400">edit_note</span>
                                <div className="text-right">
                                    <p className="text-white font-black text-[15px]">✏️ تعديل اختصارات المنتجات للبوليصة</p>
                                    <p className="text-gray-500 text-xs mt-0.5">اضغط لفتح — الاختصار هو اسم المنتج المختصر اللي بيظهر في خانة الوصف أسفل البوليصة</p>
                                </div>
                            </div>
                            <span className={`material-symbols-outlined text-gray-400 transition-transform duration-300 ${isShortNamesOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {/* Accordion Body */}
                        {isShortNamesOpen && (
                            <div className="px-6 pb-6 border-t border-white/5">
                                <div className="mt-4 space-y-3">
                                    {ordersArray.flatMap((order) => {
                                        const data = bills[order.id];
                                        if (!data) return [];
                                        return data.items.map((item, idx) => {
                                            const isSaving = savingItem === `${order.id}-${idx}`;
                                            const isSaved = shortNamesSaved[item.productId];
                                            return (
                                                <div key={`${order.id}-${idx}`} className="flex items-center gap-4 bg-black/40 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-300 text-sm font-bold truncate">{item.name}</p>
                                                        <p className="text-gray-600 text-xs mt-0.5">الكمية: {item.quantity} — طلب #{order.id.slice(-6)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="flex items-center bg-black/60 border border-white/10 rounded-xl px-3 focus-within:border-blue-500 transition-all">
                                                            <span className="text-[10px] text-gray-500 font-bold ml-2 whitespace-nowrap">الاختصار:</span>
                                                            <input 
                                                                className="bg-transparent text-white text-sm font-black text-right w-40 py-2 outline-none border-none" 
                                                                placeholder="مثال: طابعة حرارية..."
                                                                value={item.shortName || ''}
                                                                onChange={e => handleShortNameChange(order.id, idx, e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && saveShortName(order.id, idx)}
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => saveShortName(order.id, idx)}
                                                            disabled={isSaving}
                                                            title="حفظ الاختصار في قاعدة البيانات"
                                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                                                isSaved ? 'bg-green-600 text-white' :
                                                                isSaving ? 'bg-slate-700 text-slate-400 cursor-wait' : 
                                                                'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                                                            }`}
                                                        >
                                                            <span className={`material-symbols-outlined text-[18px] ${isSaving ? 'animate-spin' : ''}`}>
                                                                {isSaved ? 'check_circle' : isSaving ? 'sync' : 'save'}
                                                            </span>
                                                            {isSaved ? 'تم' : isSaving ? 'جاري...' : 'حفظ'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/60 gap-3 flex-wrap">
                    <p className="text-xs text-gray-500 italic">* مقاس A4 نص صفحة — التعديلات تنعكس فوراً على الطباعة</p>
                    <div className="flex gap-3 flex-wrap">

                        {/* Design Mode Toggle */}
                        <button 
                            onClick={() => {
                                const next = !isDesignMode;
                                setIsDesignMode(next);
                                import('react-hot-toast').then(t => t.default(
                                    next ? '🎨 وضع التصميم — اسحب وعدّل العناصر' : '👁️ وضع المعاينة — التصميم جاهز للطباعة',
                                    { duration: 2500 }
                                ));
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                                isDesignMode 
                                ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/30' 
                                : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isDesignMode ? 'visibility' : 'design_services'}</span>
                            {isDesignMode ? '👁️ معاينة فقط' : '🎨 تعديل التصميم'}
                        </button>

                        {/* Save Layout — only in design mode */}
                        {isDesignMode && (
                            <button 
                                onClick={saveLayout}
                                disabled={updateSettingsMutation.isPending}
                                title="يحفظ مواضع اللوجو والعنوان والتذييل لكل الجهاز"
                                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-60"
                            >
                                <span className={`material-symbols-outlined text-[18px] ${updateSettingsMutation.isPending ? 'animate-spin' : ''}`}>
                                    {updateSettingsMutation.isPending ? 'sync' : 'save'}
                                </span>
                                {updateSettingsMutation.isPending ? 'جاري الحفظ...' : '💾 حفظ التصميم للجميع'}
                            </button>
                        )}

                        {/* Close */}
                        <button 
                            onClick={onClose} 
                            className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                        >✕ إغلاق</button>

                        {/* Print */}
                        <button 
                            onClick={() => {
                                showToast('🖨️ جاري فتح نافذة الطباعة...', 'info');
                                handlePrint();
                            }} 
                            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                            🖨️ طباعة الآن
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
