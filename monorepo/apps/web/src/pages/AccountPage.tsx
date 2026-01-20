import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAddresses, type Address } from '../hooks/useAddresses';
import { useWishlist } from '../hooks/useWishlist';
import { AddressForm } from '../components/account/AddressForm';
import api from '../lib/api';

type AccountTab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'profile';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد الانتظار' },
    processing: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'جاري التحضير' },
    shipping: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'قيد التوصيل' },
    delivered: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'تم التسليم' },
    cancelled: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'ملغي' },
};

export function AccountPage() {
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AccountTab>('overview');

    // Hooks
    const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, isLoading: addressLoading } = useAddresses();
    const { wishlist, fetchWishlist, removeFromWishlist, isLoading: wishlistLoading } = useWishlist();

    // Local state
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar: '',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Initial data loading
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user) {
            setProfileData({
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar || '',
            });
            fetchAddresses();
            fetchWishlist();
            fetchOrders();
        }
    }, [user, authLoading, isAuthenticated, navigate]);

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            if (user?.id) {
                // Fetch user orders. Assuming we can get them from user details or a specific endpoint
                // Since UsersController.getOne returns orders, we use that.
                const response = await api.get(`/users/${user.id}`);
                setOrders(response.data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            await api.put('/users/profile', {
                name: profileData.name,
                phone: profileData.phone,
                avatar: profileData.avatar,
            });
            alert('تم تحديث الملف الشخصي بنجاح');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('فشل تحديث الملف الشخصي');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleAddressSubmit = async (data: any) => {
        try {
            if (editingAddress) {
                await updateAddress(editingAddress.id, data);
            } else {
                await addAddress(data);
            }
            setIsAddressModalOpen(false);
            setEditingAddress(null);
        } catch (error) {
            console.error('Failed to save address:', error);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white">جاري التحميل...</div>;
    }

    if (!user) return null;

    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
        { id: 'orders', label: 'طلباتي', icon: 'shopping_bag' },
        { id: 'wishlist', label: 'المفضلة', icon: 'favorite' },
        { id: 'addresses', label: 'العناوين', icon: 'location_on' },
        { id: 'profile', label: 'الملف الشخصي', icon: 'person' },
    ];

    const stats = [
        { label: 'إجمالي الطلبات', value: orders.length, icon: 'inventory_2', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'في المفضلة', value: wishlist.length, icon: 'favorite', color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'نقاط الولاء', value: user.loyaltyPoints || 0, icon: 'loyalty', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">أهلاً بك، {user.name.split(' ')[0]} 👋</h1>
                    <p className="text-gray-400">إليك نظرة عامة على حسابك وطلباتك</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                        تسوق الآن
                    </Link>
                    <button onClick={logout} className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10 hover:border-red-500/30">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AccountTab)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white/5 text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="flex flex-col gap-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -mr-10 -mt-10`}></div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className={`p-3 ${stat.bg} rounded-xl ${stat.color}`}>
                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">{stat.label}</p>
                                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Orders */}
                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">أحدث الطلبات</h3>
                            <button onClick={() => setActiveTab('orders')} className="text-primary text-sm hover:underline">عرض الكل</button>
                        </div>
                        {ordersLoading ? (
                            <div className="p-8 text-center text-gray-400">جاري تحميل الطلبات...</div>
                        ) : orders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="text-right px-6 py-4">رقم الطلب</th>
                                            <th className="text-right px-6 py-4">التاريخ</th>
                                            <th className="text-right px-6 py-4">الحالة</th>
                                            <th className="text-right px-6 py-4">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.slice(0, 3).map((order) => (
                                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link
                                                        to={`/track-order/${order.id}`}
                                                        className="text-white font-medium hover:text-primary transition-colors underline decoration-white/20 underline-offset-4"
                                                    >
                                                        {order.orderNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">
                                                    {new Date(order.createdAt).toLocaleString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[order.status]?.color || 'text-gray-400'}`}>
                                                        {STATUS_CONFIG[order.status]?.label || order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-white font-bold">{Number(order.total).toLocaleString()} ج.م</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400">لا توجد طلبات سابقة</div>
                        )}
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white">سجل الطلبات</h3>
                    </div>
                    {ordersLoading ? (
                        <div className="p-8 text-center text-gray-400">جاري تحميل الطلبات...</div>
                    ) : orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="text-right px-6 py-4">رقم الطلب</th>
                                        <th className="text-right px-6 py-4">التاريخ</th>
                                        <th className="text-right px-6 py-4">الحالة</th>
                                        <th className="text-right px-6 py-4">الإجمالي</th>
                                        <th className="text-right px-6 py-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link
                                                    to={`/track-order/${order.id}`}
                                                    className="text-primary font-bold hover:text-primary-dark transition-colors hover:underline underline-offset-4"
                                                >
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(order.createdAt).toLocaleString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[order.status]?.color || 'text-gray-400'}`}>
                                                    {STATUS_CONFIG[order.status]?.label || order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-bold">{Number(order.total).toLocaleString()} ج.م</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="text-gray-400 hover:text-primary transition-colors p-1"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                    <Link
                                                        to={`/track-order/${order.id}`}
                                                        className="text-gray-400 hover:text-emerald-400 transition-colors p-1"
                                                        title="تتبع الطلب"
                                                    >
                                                        <span className="material-symbols-outlined">local_shipping</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">لا توجد طلبات سابقة</div>
                    )}
                </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">المنتجات المفضلة ({wishlist.length})</h3>
                    {wishlistLoading ? (
                        <div className="text-center text-gray-400">جاري التحميل...</div>
                    ) : wishlist.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {wishlist.map((item) => (
                                <div key={item.id} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 group hover:border-primary/50 transition-all">
                                    <div className="relative aspect-video bg-black/20">
                                        {item.product.images?.[0]?.url ? (
                                            <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <span className="material-symbols-outlined text-4xl">image</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeFromWishlist(item.productId)}
                                            className="absolute top-2 left-2 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-white font-bold mb-1 truncate">{item.product.name}</h4>
                                        <p className="text-primary font-bold mb-3">{Number(item.product.discountPrice || item.product.price).toLocaleString()} ج.م</p>
                                        <Link to={`/product/${item.product.slug}`} className="block w-full text-center bg-white/10 hover:bg-primary text-white py-2 rounded-lg transition-colors text-sm font-medium">
                                            عرض المنتج
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">favorite_border</span>
                            <p className="text-gray-400">قائمة المفضلة فارغة</p>
                        </div>
                    )}
                </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
                <div className="space-y-6">
                    {!isAddressModalOpen ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">عناويني</h3>
                                <button
                                    onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    عنوان جديد
                                </button>
                            </div>

                            {addressLoading ? (
                                <div className="text-center text-gray-400">جاري التحميل...</div>
                            ) : addresses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((address) => (
                                        <div key={address.id} className={`glass-panel rounded-xl p-5 border ${address.isDefault ? 'border-primary' : 'border-white/10 hover:border-white/30'} transition-all relative group`}>
                                            {address.isDefault && (
                                                <span className="absolute top-4 left-4 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full border border-primary/20">
                                                    الافتراضي
                                                </span>
                                            )}

                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="p-3 bg-white/5 rounded-lg text-gray-400">
                                                    <span className="material-symbols-outlined">{address.title.includes('منزل') ? 'home' : 'location_on'}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-lg mb-1">{address.title}</h4>
                                                    <p className="text-gray-400 text-sm">{address.fullName} - {address.phone}</p>
                                                </div>
                                            </div>

                                            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                                                {address.address}، {address.city}، {address.governorate}
                                            </p>

                                            <div className="flex gap-2 pt-4 border-t border-white/5">
                                                <button
                                                    onClick={() => { setEditingAddress(address); setIsAddressModalOpen(true); }}
                                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                    تعديل
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('هل أنت متأكد من حذف هذا العنوان؟')) deleteAddress(address.id);
                                                    }}
                                                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                                {!address.isDefault && (
                                                    <button
                                                        onClick={() => setDefaultAddress(address.id)}
                                                        className="py-2 px-3 bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary rounded-lg transition-colors"
                                                        title="تعيين كافتراضي"
                                                    >
                                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 glass-panel rounded-2xl">
                                    <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">location_off</span>
                                    <p className="text-gray-400">لم تضف أي عناوين بعد</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="glass-panel rounded-2xl p-6 max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                {editingAddress ? 'تعديل العنوان' : 'إضافة العنوان'}
                            </h3>
                            <AddressForm
                                initialData={editingAddress}
                                onSubmit={handleAddressSubmit}
                                onCancel={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
                                isLoading={addressLoading}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="glass-panel rounded-2xl p-6 max-w-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        تعديل الملف الشخصي
                    </h3>

                    {/* Avatar Selection */}
                    <div className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">account_circle</span>
                            اختر صورة حسابك
                        </h4>
                        <div className="grid grid-cols-6 md:grid-cols-10 gap-3 mb-4">
                            {[
                                'adventurer', 'adventurer-neutral', 'avataaars', 'avataaars-neutral', 'big-ears',
                                'big-ears-neutral', 'big-smile', 'bottts', 'bottts-neutral', 'croodles',
                                'croodles-neutral', 'fun-emoji', 'icons', 'identicon', 'initials',
                                'lorelei', 'lorelei-neutral', 'micah', 'miniavs', 'notionists',
                                'notionists-neutral', 'open-peeps', 'personas', 'pixel-art', 'pixel-art-neutral'
                            ].map((style) => {
                                const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${user?.email || 'default'}`;
                                const isSelected = profileData.avatar === avatarUrl;
                                return (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => setProfileData({ ...profileData, avatar: avatarUrl })}
                                        className={`size-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${isSelected ? 'border-primary ring-2 ring-primary/50 scale-110' : 'border-white/20'
                                            }`}
                                        title={style}
                                    >
                                        <img src={avatarUrl} alt={style} className="w-full h-full object-cover" />
                                    </button>
                                );
                            })}
                        </div>
                        {profileData.avatar && (
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <img src={profileData.avatar} alt="Selected" className="size-16 rounded-full" />
                                <div className="flex-1">
                                    <p className="text-white font-medium">الصورة المختارة</p>
                                    <p className="text-gray-400 text-sm">سيتم عرضها في حسابك</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setProfileData({ ...profileData, avatar: '' })}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <form className="space-y-4" onSubmit={handleProfileUpdate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">الاسم بالكامل</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-left dir-ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني (لا يمكن تغييره)</label>
                            <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className="w-full h-12 bg-[#181a20]/50 border border-white/5 rounded-xl px-4 text-gray-400 cursor-not-allowed dir-ltr text-left"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {profileLoading && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>}
                                حفظ التغييرات
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#181a20] w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    تفاصيل الطلب
                                    <span className="text-primary font-mono">#{selectedOrder.orderNumber}</span>
                                </h3>
                                <div className="flex items-center gap-3 mt-2 text-sm">
                                    <span className="text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedOrder.status]?.color}`}>
                                        {STATUS_CONFIG[selectedOrder.status]?.label}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                            {/* Items */}
                            <div className="space-y-4">
                                <h4 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">shopping_bag</span>
                                    المنتجات
                                </h4>
                                {selectedOrder.items?.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="size-16 bg-black/20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                            {item.product?.images?.[0]?.url ? (
                                                <img src={item.product.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 bg-[#121212]">
                                                    <span className="material-symbols-outlined">image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-white font-medium truncate" title={item.name}>{item.name}</h5>
                                            <div className="flex gap-3 text-sm mt-1">
                                                <span className="text-gray-400">{Number(item.price).toLocaleString()} ج.م</span>
                                                <span className="text-gray-500">×</span>
                                                <span className="text-white font-medium">{item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="text-primary font-bold whitespace-nowrap">
                                            {Number(item.price * item.quantity).toLocaleString()} ج.م
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Shipping Info */}
                                <div className="space-y-4">
                                    <h4 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                                        بيانات الشحن
                                    </h4>
                                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5 text-sm">
                                        <div>
                                            <span className="text-gray-400 block mb-1">المستلم</span>
                                            <span className="text-white font-medium">{selectedOrder.fullName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block mb-1">رقم الهاتف</span>
                                            <span className="text-white font-medium dir-ltr text-right">{selectedOrder.phone}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block mb-1">العنوان</span>
                                            <span className="text-white">{selectedOrder.address}</span>
                                            <span className="block text-gray-400 text-xs mt-1">{selectedOrder.city}، {selectedOrder.governorate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Summary */}
                                <div className="space-y-4">
                                    <h4 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">payments</span>
                                        تفاصيل الدفع
                                    </h4>
                                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                                        <div className="flex justify-between text-gray-400 text-sm">
                                            <span>طريقة الدفع</span>
                                            <span className="text-white font-medium">{selectedOrder.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان'}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400 text-sm">
                                            <span>المجموع الفرعي</span>
                                            <span>{Number(selectedOrder.subtotal || selectedOrder.total - (selectedOrder.shippingCost || 0)).toLocaleString()} ج.م</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400 text-sm">
                                            <span>الشحن</span>
                                            <span>{Number(selectedOrder.shippingCost || 0) === 0 ? 'مجاني' : `${Number(selectedOrder.shippingCost).toLocaleString()} ج.م`}</span>
                                        </div>
                                        <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/10 mt-2">
                                            <span>الإجمالي</span>
                                            <span className="text-primary">{Number(selectedOrder.total).toLocaleString()} ج.م</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-bold"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

export default AccountPage;
