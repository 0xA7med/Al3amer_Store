import { ShieldCheck, RefreshCw, Truck, HeadphonesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import { buildBreadcrumbSchema } from '../components/SEO/ProductSchema';

const ReturnPolicyPage = () => {
  const breadcrumbItems = [
    { name: 'الرئيسية', url: '/' },
    { name: 'سياسة الإرجاع والاستبدال', url: '/return-policy' },
  ];
  const breadcrumbJsonLd = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="bg-background-dark min-h-screen text-slate-200 font-body">
      <SEOHead
        title="سياسة الإرجاع والاستبدال"
        description="سياسة الإرجاع والاستبدال في مركز العامر — يمكنك إرجاع أو استبدال المنتجات خلال 14 يوماً من تاريخ الشراء."
        canonical="/return-policy"
        jsonLd={[breadcrumbJsonLd]}
      />

      {/* Hero */}
      <div className="py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-3xl rounded-full scale-150 pointer-events-none -translate-y-1/2" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            سياسة الإرجاع والاستبدال
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">ضمان راحتك وثقتك</h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
            في مركز العامر، رضا عميلنا هو أولويتنا القصوى. نوفر لك سياسة إرجاع واستبدال مرنة وسهلة تضمن لك تجربة تسوق آمنة.
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-8">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: RefreshCw, title: 'إرجاع خلال 14 يوماً', desc: 'يمكنك إرجاع أي منتج خلال 14 يوماً من تاريخ الاستلام' },
            { icon: Truck, title: 'الشحن على العميل', desc: 'يتم تحمل تكاليف شحن الإرجاع والاستبدال من قبل العميل' },
            { icon: HeadphonesIcon, title: 'دعم فني متواصل', desc: 'فريقنا جاهز لمساعدتك في أي استفسار على مدار الأسبوع' },
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl text-center hover:bg-white/5 transition-colors">
              <div className="flex justify-center mb-4">
                <item.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Detailed Policy */}
        <div className="glass-panel p-8 md:p-10 rounded-3xl space-y-8">
          <Section title="1. شروط الإرجاع">
            <p>نقبل إرجاع المنتجات في الحالات التالية:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mr-4">
              <li>المنتج به عيب صناعة أو خلل فني</li>
              <li>المنتج لا يطابق الوصف أو المواصفات المذكورة في الموقع</li>
              <li>تم تسليم منتج مختلف عن ما تم طلبه</li>
              <li>المنتج لم يتم استخدامه وفي حالته الأصلية مع كامل الملحقات والتغليف</li>
            </ul>
          </Section>

          <Section title="2. المنتجات غير القابلة للإرجاع">
            <ul className="list-disc list-inside space-y-2 text-slate-300 mr-4">
              <li>المنتجات التي تم استخدامها أو تركيبها</li>
              <li>المنتجات المخصصة (المصنوعة حسب الطلب)</li>
              <li>البرامج والتراخيص الرقمية بعد تفعيلها</li>
              <li>المنتجات التي مضى عليها أكثر من 14 يوماً من تاريخ الاستلام</li>
              <li>المنتجات التي بها تلف ناتج عن سوء الاستخدام</li>
            </ul>
          </Section>

          <Section title="3. آلية الإرجاع">
            <ol className="list-decimal list-inside space-y-3 text-slate-300 mr-4">
              <li>تواصل مع فريق الدعم الفني عبر <Link to="/about" className="text-primary hover:underline">صفحة اتصل بنا</Link> أو عبر الواتساب</li>
              <li>قدم رقم الطلب ووصف المشكلة</li>
              <li>سيقوم فريقنا بتقييم الطلب والرد عليك خلال 24 ساعة</li>
              <li>بعد الموافقة، يتم ترتيب شحن المنتج إلينا على نفقة العميل</li>
              <li>بعد فحص المنتج، سيتم الموافقة على الإرجاع أو الاستبدال</li>
            </ol>
          </Section>

          <Section title="4. الاستبدال">
            <p className="text-slate-300">
              نقبل استبدال المنتجات بعينها أو بقيمة مساوية. في حال كان المنتج البديل أعلى سعراً،
              يتم دفع الفرق. وإن كان أقل سعراً، يتم رد الفرق. جميع المنتجات المستبدلة تخضع
              لنفس سياسة الإرجاع المذكورة أعلاه.
            </p>
          </Section>

          <Section title="5. المبالغ المستردة">
            <p className="text-slate-300">
              يتم رد المبلغ خلال 7-14 يوم عمل من تاريخ استلامنا للمنتج المرتجع. يتم الرد
              بنفس طريقة الدفع الأصلية. في حالة الدفع عند الاستلام، سيتم تحويل المبلغ
              إلى حسابك البنكي أو محفظتك الإلكترونية.
            </p>
          </Section>
        </div>

        {/* Contact CTA */}
        <div className="text-center glass-panel p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-white mb-4">تحتاج مساعدة؟</h2>
          <p className="text-slate-400 mb-6">
            فريق دعم العامر جاهز لمساعدتك في أي استفسار بخصوص الإرجاع والاستبدال
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="tel:201012345678" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
              <HeadphonesIcon className="w-4 h-4" />
              اتصل بنا
            </a>
            <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-card text-slate-300 font-bold hover:bg-white/10 transition-colors">
              صفحة اتصل بنا
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="text-slate-300 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default ReturnPolicyPage;
