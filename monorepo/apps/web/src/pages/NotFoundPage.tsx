import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <SEOHead title="الصفحة غير موجودة" description="عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها." noindex />
      <div className="text-center space-y-6">
        <div className="text-8xl font-black text-primary/30">404</div>
        <h1 className="text-3xl font-bold text-white">الصفحة غير موجودة</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يمكنك العودة إلى الرئيسية أو تصفح المتجر.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">home</span>
            الرئيسية
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-card text-slate-300 font-bold hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">store</span>
            المتجر
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
