import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import api from '../lib/api';
import SEOHead from '../components/SEO/SEOHead';

type AuthMode = 'login' | 'register';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login: appLogin, loginWithToken, register, isAuthenticated } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    if (isAuthenticated) return null;

    const handleSocialLoginSuccess = async (userData: any) => {
        try {
            setLoading(true);
            const { token, user } = await api.post('/auth/social', userData).then(res => res.data);
            loginWithToken(token, user);
        } catch (err: any) {
            console.error('Social Backend Error:', err);
            setError('فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await handleSocialLoginSuccess({
                email: user.email,
                name: user.displayName,
                uid: user.uid,
                providerId: 'google.com'
            });
        } catch (err: any) {
            console.error('Google Auth Error:', err);
            setError('فشل تسجيل الدخول عبر جوجل.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'login') {
                await appLogin(emailOrPhone, password, rememberMe);
                const from = (location.state as any)?.from?.pathname || '/';
                navigate(from, { replace: true });
            } else {
                await register({
                    name,
                    email: registerEmail,
                    phone: emailOrPhone,
                    password,
                });
                navigate('/', { replace: true });
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'حدث خطأ أثناء العملية. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
            <SEOHead title="تسجيل الدخول" description="تسجيل الدخول إلى حسابك في مركز العامر" noindex />
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent-red/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-[440px] relative z-10">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <Link to="/" className="flex flex-col items-center group transition-all">
                        <img
                            src="https://i.ibb.co/KkCv1LF/Logo-Al3amer.png"
                            alt="Al3amer Logo"
                            className="h-20 object-contain brightness-110 contrast-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_20px_rgba(19,91,236,0.3)] transition-all duration-300 transform group-hover:scale-110"
                        />
                        <div className="flex flex-col items-center mt-4">
                            <span className="text-3xl font-bold text-white leading-none tracking-tight group-hover:text-primary transition-colors drop-shadow-sm">مركز العامر</span>
                            <span className="text-xs text-primary/80 font-bold tracking-[0.2em] uppercase mt-2">لأجهزة الكاشير وأنظمة المحاسبة</span>
                        </div>
                    </Link>
                </div>

                <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden">
                    {/* Glow Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {mode === 'login' ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {mode === 'login' ? 'سجل الدخول لمتابعة طلباتك وسلة المشتريات' : 'انضم إلينا واستمتع بمزايا التسوق الحصرية'}
                        </p>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="bg-[#0b101e] p-1 rounded-xl flex mb-8 border border-white/5">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-[#1e293b] text-white shadow-md border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            دخول الأعضاء
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-[#1e293b] text-white shadow-md border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            مستخدم جديد
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">الاسم بالكامل</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">person</span>
                                    <input
                                        type="text"
                                        className="w-full h-12 bg-[#020617]/40 border border-white/10 rounded-xl pr-10 pl-4 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-gray-500 transition-all"
                                        placeholder="أحمد محمد"
                                        required={mode === 'register'}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {mode === 'login' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                                    {mode === 'login' ? 'mail' : 'phone'}
                                </span>
                                <input
                                    type={mode === 'login' ? 'email' : 'tel'}
                                    className="w-full h-12 bg-[#020617]/40 border border-white/10 rounded-xl pr-10 pl-4 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-gray-500 transition-all text-left dir-ltr"
                                    placeholder={mode === 'login' ? 'email@example.com' : '01xxxxxxxxx'}
                                    required
                                    value={emailOrPhone}
                                    onChange={(e) => setEmailOrPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">mail</span>
                                    <input
                                        type="email"
                                        className="w-full h-12 bg-[#020617]/40 border border-white/10 rounded-xl pr-10 pl-4 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-gray-500 transition-all text-left dir-ltr"
                                        placeholder="email@example.com"
                                        required={mode === 'register'}
                                        value={registerEmail}
                                        onChange={(e) => setRegisterEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">lock</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full h-12 bg-[#020617]/40 border border-white/10 rounded-xl pr-10 pl-12 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-gray-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                </button>
                            </div>
                        </div>

                        {mode === 'login' && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <div className="size-5 border border-gray-600 rounded bg-[#0a0f18] peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-all">
                                        <span className="material-symbols-outlined text-white text-sm opacity-0 peer-checked:opacity-100">check</span>
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-gray-300">تذكرني</span>
                                </label>
                                <Link to="#" className="text-sm font-medium text-primary hover:text-blue-300 transition-colors">نسيت كلمة المرور؟</Link>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-lg">{mode === 'login' ? 'متابعة التسوق' : 'إنشاء الحساب'}</span>
                                    <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                                        {mode === 'login' ? 'shopping_bag' : 'arrow_forward'}
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Social Login Divider */}
                    <div className="relative flex py-8 items-center">
                        <div className="flex-grow border-t border-gray-700/50"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-medium">أو سجل الدخول عبر</span>
                        <div className="flex-grow border-t border-gray-700/50"></div>
                    </div>

                    {/* Google Only */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-[#0f172a] hover:bg-[#1e293b] border border-gray-700/50 rounded-xl py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                            <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
                            <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                            <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-medium text-gray-300">المتابعة عبر جوجل</span>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-400">
                        {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-primary hover:text-white font-bold transition-colors">
                            {mode === 'login' ? 'أنشئ حساب مجانًا' : 'سجل الدخول'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
