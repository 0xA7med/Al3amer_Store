import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Search, Menu, X, Phone, MessageSquare } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useSearch } from '@/contexts/SearchContext'
import { getSiteSettings } from '@/lib/supabase';

const Header: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { totalItems } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const [showDropdown, setShowDropdown] = useState(false)
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        const mapped: any = {};
        data.forEach((s: any) => {
          mapped[s.setting_key] = s.setting_value;
        });
        setSettings(mapped);
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isSupabaseConfigured) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }
      setLoadingProducts(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      setProducts(data || []);
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);
  const filteredProducts = searchQuery
    ? products.filter(product =>
        (product.title_ar || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-search-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const isActive = (path: string) => location.pathname === path

  const navigationItems = [
    { path: '/', label: t('home') },
    { path: '/products', label: t('products') },
    { path: '/about', label: t('about') },
    { path: '/contact', label: t('contact') },
  ]

  const phone = settings.contact_phone || '+20 102 604 3165';
  const whatsapp = settings.whatsapp_number || '+20 102 604 3165';
  const whatsappDigits = whatsapp.replace(/[^\d]/g, '');

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('مرحباً، أريد الاستفسار عن منتجاتكم');
    window.open(`https://wa.me/${whatsappDigits}?text=${message}`, '_blank');
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
      {/* Top Bar */}
      <div className="bg-alamer-blue text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span className="ltr-content">{phone}</span>
              </div>
              <button
                onClick={handleWhatsAppContact}
                className="flex items-center gap-2 hover:text-alamer-gold transition-colors"
              >
                <MessageSquare size={16} />
                <span>واتساب</span>
              </button>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span>{t('companySlogan')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/KkCv1LF/Logo-Al3amer.png"
              alt={t('companyName')}
              className="h-12 w-auto"
            />
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-alamer-blue">{t('companyName')}</h1>
              <p className="text-sm text-gray-600">{t('companySlogan')}</p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder={t('searchProducts')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(!!e.target.value);
                }}
                className="pr-10 rtl:pr-4 rtl:pl-10"
                onFocus={() => searchQuery && setShowDropdown(true)}
              />
              <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              {showDropdown && (
                <div className="header-search-dropdown absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 z-50 max-h-96 overflow-auto">
                  {loadingProducts ? (
                    <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <Link
                        to={`/product/${product.product_id}`}
                        key={product.product_id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors border-b last:border-b-0"
                        onClick={() => setShowDropdown(false)}
                      >
                        <img
                          src={product.thumbnail_url || '/images/placeholder-product.png'}
                          alt={product.title_ar}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.title_ar}</div>
                          <div className="text-sm text-gray-500">{product.price} ج.م</div>
                        </div>
                      </Link>
                    ))
                  ) : searchQuery ? (
                    <div className="p-4 text-center text-gray-500">لا توجد نتائج مطابقة</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-alamer-gold text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center justify-center mt-4 border-t pt-4">
          <ul className="flex items-center gap-8">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-alamer-blue text-white'
                      : 'text-gray-700 hover:text-alamer-blue hover:bg-alamer-blue/10'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Search */}
        <div className="lg:hidden mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('searchProducts')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(!!e.target.value);
              }}
              className="pr-10 rtl:pr-4 rtl:pl-10"
              onFocus={() => searchQuery && setShowDropdown(true)}
            />
            <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            {showDropdown && (
              <div className="header-search-dropdown absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 z-50 max-h-96 overflow-auto">
                {loadingProducts ? (
                  <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <Link
                      to={`/product/${product.product_id}`}
                      key={product.product_id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors border-b last:border-b-0"
                      onClick={() => setShowDropdown(false)}
                    >
                      <img
                        src={product.thumbnail_url || '/images/placeholder-product.png'}
                        alt={product.title_ar}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.title_ar}</div>
                        <div className="text-sm text-gray-500">{product.price} ج.م</div>
                      </div>
                    </Link>
                  ))
                ) : searchQuery ? (
                  <div className="p-4 text-center text-gray-500">لا توجد نتائج مطابقة</div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-alamer-blue text-white'
                        : 'text-gray-700 hover:text-alamer-blue hover:bg-alamer-blue/10'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
