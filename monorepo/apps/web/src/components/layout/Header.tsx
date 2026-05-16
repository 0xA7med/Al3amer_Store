import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { optimizeImage } from '../../lib/image-optimizer';

const LOGO_URL = 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png';

export function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();
    const { settings } = useSettings();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Fetch popular trending searches
    const { data: popularSearches = ['كاشير', 'طابعة', 'باركود', 'درج'] } = useQuery({
        queryKey: ['popular-searches'],
        queryFn: async () => {
            const res = await api.get('/products/popular-searches');
            return res.data;
        },
        staleTime: 60 * 60 * 1000 // 1 hour caching
    });

    // Debounce search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch suggestions using new optimized endpoint
    useEffect(() => {
        if (debouncedSearch.length < 2) {
            setSuggestions([]);
            setIsSearching(false);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const fetchSuggestions = async () => {
            setIsSearching(true);
            try {
                const response = await api.get('/products/search-suggestions', {
                    params: { q: debouncedSearch },
                    signal: controller.signal
                });
                setSuggestions(response.data);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error('Search error:', err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        };

        fetchSuggestions();

        return () => {
            controller.abort();
        };
    }, [debouncedSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (slugOrId: string) => {
        navigate(`/product/${slugOrId}`);
        setShowSuggestions(false);
        setSearchQuery('');
    };

    return (
        <>
            <nav className="sticky top-0 z-50 w-full glass-panel border-b-0 border-b-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 gap-4">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-8 flex-1">
                            <Link to="/" className="flex items-center gap-2 group shrink-0">
                                <img
                                    src={optimizeImage(settings.logoUrl || LOGO_URL, 160)}
                                    alt={`${settings.storeNameAr || 'مركز العامر'} Logo`}
                                    width="160"
                                    height="45"
                                    fetchPriority="high"
                                    decoding="async"
                                    className="h-10 sm:h-[45px] w-[120px] sm:w-[160px] object-contain brightness-110 contrast-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-all group-hover:drop-shadow-[0_0_12px_rgba(19,91,236,0.2)]"
                                />
                                <div className="flex flex-col">
                                    <h2 className="text-white text-lg sm:text-xl font-bold leading-none tracking-tight group-hover:text-primary transition-colors drop-shadow-sm">
                                        {settings.storeNameAr || 'مركز العامر'}
                                    </h2>
                                    <span className="hidden sm:block text-[10px] text-gray-300 font-medium tracking-wider mt-1 transition-colors">
                                        لأجهزة الكاشير وأنظمة المحاسبة
                                    </span>
                                </div>
                            </Link>

                            {/* Search */}
                            <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
                                <div className="relative w-full group/search">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within/search:text-primary transition-colors">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onKeyDown={handleSearch}
                                        className="block w-full h-11 pr-10 pl-10 bg-[#1e293b]/50 border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                        placeholder="ابحث عن منتج، ماركة، أو فئة..."
                                    />
                                    {isSearching && (
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Suggestions Dropdown */}
                                {showSuggestions && searchQuery.length > 1 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a2332]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المنتجات المقترحة</span>
                                            <Link
                                                to={`/shop?search=${encodeURIComponent(searchQuery)}`}
                                                onClick={() => setShowSuggestions(false)}
                                                className="text-[10px] text-primary hover:text-white transition-colors"
                                            >
                                                عرض الكل
                                            </Link>
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                            {suggestions.length > 0 ? (
                                                suggestions.map((product) => (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => handleSuggestionClick(product.slug || product.id)}
                                                        className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group/item text-right"
                                                    >
                                                        <div className="size-12 bg-white/5 rounded-lg border border-white/5 p-1 flex items-center justify-center shrink-0">
                                                            <img
                                                                src={optimizeImage(product.image, 100)}
                                                                alt={product.name}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-white truncate group-hover/item:text-primary transition-colors">
                                                                {product.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {/* Snippet from search suggestions is lightweight */}
                                                            </div>
                                                        </div>
                                                        <div className="text-left shrink-0">
                                                            <span className="text-xs font-bold text-primary">{parseFloat(product.price).toLocaleString()} ج.م</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-slate-500 text-xs">
                                                    لا توجد نتائج مطابقة
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 bg-black/20 flex flex-wrap gap-1.5">
                                            <span className="text-[9px] text-slate-500 ml-1 py-1">بحث سريع:</span>
                                            {popularSearches.map((tag: string) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => {
                                                        setSearchQuery(tag);
                                                        setShowSuggestions(true);
                                                    }}
                                                    className="text-[9px] bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/5 hover:bg-primary/20 hover:text-primary transition-colors"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    isActive ? "text-primary hover:text-primary-dark transition-colors" : "text-gray-300 hover:text-white transition-colors"
                                }
                            >
                                الرئيسية
                            </NavLink>
                            <NavLink
                                to="/shop"
                                className={({ isActive }) =>
                                    isActive ? "text-primary hover:text-primary-dark transition-colors" : "text-gray-300 hover:text-white transition-colors"
                                }
                            >
                                المنتجات
                            </NavLink>
                            <NavLink
                                to="/ai-builder"
                                className={({ isActive }) =>
                                    isActive ? "text-primary hover:text-primary-dark transition-colors relative group" : "text-gray-300 hover:text-white transition-colors relative group"
                                }
                            >
                                <span>مصمم حلول الكاشير الذكية</span>
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-right"></span>
                            </NavLink>
                            <NavLink
                                to="/offers"
                                className={({ isActive }) =>
                                    isActive ? "text-primary hover:text-primary-dark transition-colors" : "text-gray-300 hover:text-white transition-colors"
                                }
                            >
                                العروض
                            </NavLink>
                            <NavLink
                                to="/about"
                                className={({ isActive }) =>
                                    isActive ? "text-primary hover:text-primary-dark transition-colors" : "text-gray-300 hover:text-white transition-colors"
                                }
                            >
                                من نحن
                            </NavLink>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setIsMobileSearchOpen(true);
                                    setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
                                }}
                                className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="بحث"
                            >
                                <span className="material-symbols-outlined">search</span>
                            </button>
                            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg group">
                                <span className="material-symbols-outlined">shopping_cart</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                                            {cartCount}
                                        </span>
                                    </span>
                                )}
                            </Link>

                            {/* Auth Button - Dynamic based on login state */}
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(19,91,236,0.3)]"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                        <span>{user?.name?.split(' ')[0] || 'حسابي'}</span>
                                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute left-0 mt-2 w-48 bg-[#1e293b] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                                            <Link
                                                to="/account"
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-primary/20 hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">account_circle</span>
                                                حسابي
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-primary/20 hover:text-white transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                                    لوحة التحكم
                                                </Link>
                                            )}
                                            <hr className="border-gray-700" />
                                            <button
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    logout();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                تسجيل الخروج
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(19,91,236,0.3)]"
                                >
                                    <span className="material-symbols-outlined text-[20px]">person</span>
                                    <span>دخول</span>
                                </Link>
                            )}

                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 text-gray-300 hover:text-white"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            {/* Mobile Search Overlay */}
            {isMobileSearchOpen && (
                <div className="fixed inset-0 z-[110] flex flex-col" role="dialog" aria-modal="true" aria-label="البحث">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); setShowSuggestions(false); }}
                    />

                    {/* Search Panel */}
                    <div className="relative z-10 bg-[#0d121c]/95 border-b border-white/10 shadow-2xl p-4 animate-in slide-in-from-top duration-300">
                        {/* Search Input Row */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input
                                    ref={mobileSearchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                                            setIsMobileSearchOpen(false);
                                            setSearchQuery('');
                                        }
                                    }}
                                    className="block w-full h-12 pr-10 pl-4 bg-[#1e293b] border border-gray-700 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                                    placeholder="ابحث عن منتج، ماركة، أو فئة..."
                                />
                                {isSearching && (
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); setShowSuggestions(false); }}
                                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Quick Search Chips */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs text-slate-500 self-center">بحث سريع:</span>
                            {popularSearches.map((tag: string) => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        setSearchQuery(tag);
                                        setShowSuggestions(true);
                                        mobileSearchInputRef.current?.focus();
                                    }}
                                    className="text-xs bg-white/5 text-slate-300 px-3 py-1.5 rounded-full border border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Suggestions */}
                        {showSuggestions && searchQuery.length > 1 && (
                            <div className="mt-3 bg-[#101622] border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">المنتجات المقترحة</span>
                                    <button
                                        onClick={() => {
                                            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                                            setIsMobileSearchOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="text-[11px] text-primary hover:text-white transition-colors"
                                    >
                                        عرض الكل
                                    </button>
                                </div>
                                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    {suggestions.length > 0 ? (
                                        suggestions.map((product) => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                onPointerDown={(e) => {
                                                    // Prevent the active input from losing focus (which normally swallows the first tap to close the keyboard)
                                                    e.preventDefault();
                                                    // Navigate first
                                                    navigate(`/product/${product.slug || product.id}`);
                                                    // Delay closing slightly so navigation isn't cancelled by component unmount
                                                    setTimeout(() => {
                                                        setIsMobileSearchOpen(false);
                                                        setShowSuggestions(false);
                                                        setSearchQuery('');
                                                    }, 100);
                                                }}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group/item text-right"
                                            >
                                                <div className="size-14 bg-white/5 rounded-lg border border-white/5 p-1 flex items-center justify-center flex-shrink-0">
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-white truncate group-hover/item:text-primary transition-colors">{product.name}</h4>
                                                </div>
                                                <div className="text-left flex-shrink-0">
                                                    <span className="text-sm font-bold text-primary">{parseFloat(product.price).toLocaleString()} ج.م</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-500 text-sm">لا توجد نتائج مطابقة</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer (Right Side) */}
                    <div className="absolute inset-y-0 right-0 w-[80%] max-w-[300px] bg-[#0d121c] border-l border-white/10 shadow-2xl p-6 flex flex-col gap-8 animate-in slide-in-from-right duration-300">
                        {/* Close Button */}
                        <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-lg">القائمة</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Mobile Links */}
                        <div className="flex flex-col gap-4">
                            <NavLink
                                to="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`
                                }
                            >
                                <span className="material-symbols-outlined">home</span>
                                <span>الرئيسية</span>
                            </NavLink>
                            <NavLink
                                to="/shop"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`
                                }
                            >
                                <span className="material-symbols-outlined">storefront</span>
                                <span>المنتجات</span>
                            </NavLink>
                            <NavLink
                                to="/ai-builder"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`
                                }
                            >
                                <span className="material-symbols-outlined">smart_toy</span>
                                <span>مصمم الكاشير الذكي</span>
                            </NavLink>
                            <NavLink
                                to="/offers"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`
                                }
                            >
                                <span className="material-symbols-outlined">percent</span>
                                <span>العروض</span>
                            </NavLink>
                            <NavLink
                                to="/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`
                                }
                            >
                                <span className="material-symbols-outlined">info</span>
                                <span>من نحن</span>
                            </NavLink>
                        </div>

                        {/* Mobile Actions */}
                        <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/account"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 text-gray-300 hover:text-white"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {user?.name?.[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{user?.name}</span>
                                            <span className="text-xs text-slate-400">عرض حسابي</span>
                                        </div>
                                    </Link>

                                    {user?.role === 'admin' && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold"
                                        >
                                            <span className="material-symbols-outlined">admin_panel_settings</span>
                                            <span>لوحة التحكم</span>
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <span className="material-symbols-outlined">logout</span>
                                        <span>تسجيل الخروج</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-xl font-bold transition-all"
                                >
                                    <span className="material-symbols-outlined">login</span>
                                    <span>تسجيل الدخول</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;
