import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminOrder } from '../../hooks/useAdmin';

export function OrderAWB() {
    const { id } = useParams<{ id: string }>();
    const { data: order, isLoading: loading } = useAdminOrder(id || '');

    useEffect(() => {
        if (order) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [order]);

    if (loading) return <div className="p-8 text-center text-lg font-bold">جاري تحميل البوليصة...</div>;
    if (!order) return <div className="p-8 text-center text-red-500 font-bold">الطلب غير موجود</div>;

    // Helper to format address
    const fullAddress = [order.address, order.city, order.governorate].filter(Boolean).join(', ');

    return (
        <div className="bg-white text-black p-8 max-w-[210mm] mx-auto min-h-screen font-mono text-sm leading-tight" dir="ltr">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">AMAZING STORE</h1>
                    <p>Cairo, Egypt</p>
                    <p>Support: +20 123 456 7890</p>
                </div>
                <div className="text-left">
                    <div className="border-2 border-black p-2 mb-2 inline-block">
                        <p className="font-bold text-xl">AWB: {order.paymobOrderId ? `PM-${order.paymobOrderId}` : `TRK-${order.orderNumber}`}</p>
                    </div>
                    <p className="font-bold">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-8 mb-8 border-b-2 border-black pb-6">
                <div>
                    <h3 className="font-bold border-b border-black mb-2 uppercase text-gray-600">From (Sender)</h3>
                    <p className="font-bold text-lg">AL3AMER STORE</p>
                    <p>Warehouse 13, Industrial Zone</p>
                    <p>New Cairo, Cairo</p>
                    <p>Egypt</p>
                </div>
                <div>
                    <h3 className="font-bold border-b border-black mb-2 uppercase text-gray-600">To (Receiver)</h3>
                    <p className="font-bold text-lg">{order.fullName || order.user?.name || 'Guest'}</p>
                    <p>{fullAddress}</p>
                    <p className="font-bold mt-2">Tel: {order.phone}</p>
                </div>
            </div>

            {/* Order Details */}
            <div className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-2 text-right">Item</th>
                            <th className="py-2 text-center w-20">Qty</th>
                            <th className="py-2 text-left w-32">SKU</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-300">
                                <td className="py-2">{item.product?.name || item.name}</td>
                                <td className="py-2 text-center font-bold">{item.quantity}</td>
                                <td className="py-2 text-left">{item.product?.sku || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Barcode */}
            <div className="flex flex-col items-center justify-center mt-12 gap-4">
                <div className="w-64 h-16 bg-black text-white flex items-center justify-center text-xs">
                    {/* Placeholder for actual barcode rendering */}
                    [ BARCODE: {order.orderNumber} ]
                </div>
                <p className="font-bold text-xl">Order #: {order.orderNumber}</p>

                <div className="mt-8 border-t border-black pt-4 w-full flex justify-between text-xs">
                    <p>Signature: __________________________</p>
                    <p>Date: _____/_____/_______</p>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}

export default OrderAWB;
