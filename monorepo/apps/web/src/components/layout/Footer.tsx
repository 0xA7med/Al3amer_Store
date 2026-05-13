import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const LOGO_URL = 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png';

export function Footer() {
    const { settings } = useSettings();

    return (
        <footer className="bg-[#0b0f17] border-t border-white/5 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 group min-h-[40px]">
                            <img
                                src={settings.logoUrl || LOGO_URL}
                                alt={`${settings.storeNameAr || 'مركز العامر'} Logo`}
                                width="120"
                                height="34"
                                className="h-10 w-[120px] object-contain brightness-110 contrast-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-all group-hover:drop-shadow-[0_0_12px_rgba(19,91,236,0.2)]"
                            />
                            <h2 className="text-white text-xl font-bold group-hover:text-primary transition-colors">{settings.storeNameAr || 'مركز العامر'}</h2>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {settings.metaDescription || 'وجهتك الأولى في مصر لأحدث أنظمة الكاشير والباركود. نساعدك في إدارة نشاطك التجاري بكفاءة عالية.'}
                        </p>
                        <div className="flex gap-4 mt-2">
                            {settings.facebook && (
                                <a
                                    href={settings.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary hover:text-white flex items-center justify-center transition-all text-gray-400"
                                >
                                    <span className="font-bold">f</span>
                                </a>
                            )}
                            {settings.instagram && (
                                <a
                                    href={settings.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary hover:text-white flex items-center justify-center transition-all text-gray-400"
                                >
                                    <span className="font-bold">in</span>
                                </a>
                            )}
                            {settings.whatsapp && (
                                <a
                                    href={settings.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary hover:text-white flex items-center justify-center transition-all text-gray-400"
                                >
                                    <span className="material-symbols-outlined text-lg">chat</span>
                                </a>
                            )}
                            {settings.twitterX && (
                                <a
                                    href={settings.twitterX}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary hover:text-white flex items-center justify-center transition-all text-gray-400"
                                >
                                    <span className="font-bold">𝕏</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">روابط سريعة</h3>
                        <ul className="flex flex-col gap-3 text-sm text-gray-400">
                            <li><Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">عن الشركة</Link></li>
                            <li><Link to="/warranty" className="hover:text-primary transition-colors">سياسة الضمان</Link></li>
                            <li><Link to="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link></li>
                            <li><Link to="/blog" className="hover:text-primary transition-colors">مدونة التقنية</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">الأقسام</h3>
                        <ul className="flex flex-col gap-3 text-sm text-gray-400">
                            <li><Link to="/shop?category=barcode-printers" className="hover:text-primary transition-colors">طابعات الباركود</Link></li>
                            <li><Link to="/shop?category=receipt-printers" className="hover:text-primary transition-colors">طابعات الإيصالات</Link></li>
                            <li><Link to="/shop?category=barcode-readers" className="hover:text-primary transition-colors">قارئ الباركود</Link></li>
                            <li><Link to="/shop?category=touch-screens" className="hover:text-primary transition-colors">شاشات اللمس</Link></li>
                            <li><Link to="/shop?category=scales" className="hover:text-primary transition-colors">موازين إلكترونية</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">تواصل معنا</h3>
                        <ul className="flex flex-col gap-4 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-1">location_on</span>
                                <span>{settings.address || '—'}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">phone_in_talk</span>
                                <span className="dir-ltr text-right">{settings.supportPhone || '—'}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">mail</span>
                                <span>{settings.supportEmail || '—'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-400 text-sm">© ٢٠٢٤ مركز العامر. جميع الحقوق محفوظة.</p>
                    <div className="flex gap-4">
                        <div className="w-10 h-6 bg-white/10 rounded"></div>
                        <div className="w-10 h-6 bg-white/10 rounded"></div>
                        <div className="w-10 h-6 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
