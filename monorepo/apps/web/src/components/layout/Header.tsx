import { Link, NavLink } from 'react-router-dom';

const LOGO_URL = 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png';

export function Header() {
    return (
        <nav className="sticky top-0 z-50 w-full glass-panel border-b-0 border-b-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-4">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-8 flex-1">
                        <Link to="/" className="flex items-center gap-2 group">
                            <img
                                src={LOGO_URL}
                                alt="Al3amer Logo"
                                className="h-14 object-contain brightness-110 contrast-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-all group-hover:drop-shadow-[0_0_12px_rgba(19,91,236,0.2)]"
                            />
                            <div className="flex flex-col">
                                <h2 className="text-white text-xl font-bold leading-none tracking-tight group-hover:text-primary transition-colors drop-shadow-sm">
                                    مركز العامر
                                </h2>
                                <span className="text-[10px] text-gray-300 font-medium tracking-wider mt-1 transition-colors">
                                    لأجهزة الكاشير وأنظمة المحاسبة
                                </span>
                            </div>
                        </Link>

                        {/* Search */}
                        <div className="hidden md:flex flex-1 max-w-md">
                            <div className="relative w-full group/search">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within/search:text-primary transition-colors">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full h-11 pr-10 pl-4 bg-[#1e293b]/50 border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                    placeholder="ابحث عن منتج، ماركة، أو فئة..."
                                />
                            </div>
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
                        <button className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                        <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg group">
                            <span className="material-symbols-outlined">shopping_cart</span>
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                        </Link>
                        <Link
                            to="/login"
                            className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(19,91,236,0.3)]"
                        >
                            <span className="material-symbols-outlined text-[20px]">person</span>
                            <span>دخول</span>
                        </Link>
                        <button className="lg:hidden p-2 text-gray-300 hover:text-white">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Header;
