import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, MessageSquare, Facebook, Instagram, Twitter } from 'lucide-react'
import { getSiteSettings } from '@/lib/supabase';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = React.useState<any>({});

  React.useEffect(() => {
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

  const phone = settings.contact_phone || '+20 102 604 3165';
  const email = settings.contact_email || 'info@alamer.com';
  const address = settings.site_address || 'القاهرة، مصر';
  const whatsapp = settings.whatsapp_number || '+20 102 604 3165';
  const whatsappDigits = whatsapp.replace(/[^\d]/g, '');

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('مرحباً، أريد الاستفسار عن منتجاتكم');
    window.open(`https://wa.me/${whatsappDigits}?text=${message}`, '_blank');
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="https://i.ibb.co/KkCv1LF/Logo-Al3amer.png"
                alt={t('companyName')}
                className="h-12 w-auto"
              />
              <div>
                <h3 className="text-xl font-bold text-white">{t('companyName')}</h3>
                <p className="text-sm text-gray-300">{t('companySlogan')}</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {t('aboutDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  {t('products')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Categories */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">{t('categories')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=أجهزة كاشير" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  أجهزة كاشير
                </Link>
              </li>
              <li>
                <Link to="/products?category=طابعات" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  طابعات
                </Link>
              </li>
              <li>
                <Link to="/products?category=برامج محاسبة" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  برامج محاسبة
                </Link>
              </li>
              <li>
                <Link to="/products?category=قارئ باركود" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                  قارئ باركود
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">{t('contactTitle')}</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-alamer-gold" />
                <span className="text-gray-300 ltr-content">{phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-alamer-gold" />
                <span className="text-gray-300 ltr-content">{email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-alamer-gold" />
                <span className="text-gray-300">{address}</span>
              </div>
            </div>

            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsAppContact}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 mt-4"
            >
              <MessageSquare size={20} />
              <span>تواصل عبر واتساب</span>
            </button>

            {/* Social Media */}
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-300 hover:text-alamer-gold transition-colors duration-200">
                <Twitter size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © 2025 {t('companyName')}. {t('allRightsReserved')}.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                سياسة الخصوصية
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                شروط الاستخدام
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
