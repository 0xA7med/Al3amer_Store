
import { Award, ShieldCheck, Truck, Users } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';

const AboutUsPage = () => {
    return (
        <div className="bg-background-dark min-h-screen text-slate-200 font-body">
            <SEOHead title="عن مركز العامر" description="تعرف على مركز العامر - أكبر متخصص في أجهزة الكاشير وأنظمة المحاسبة في مصر. خبرة +10 سنوات وأكثر من 5000 عميل سعيد." canonical="/about" />
            {/* Hero */}
            <div className="py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-3xl rounded-full scale-150 pointer-events-none -translate-y-1/2" />
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">من نحن؟</h1>
                <p className="max-w-3xl mx-auto text-lg text-slate-400 leading-relaxed relative z-10">
                    متجر العامر هو وجهتك الأولى لحلول نقاط البيع المتكاملة. نحن نجمع بين التقنية الحديثة والخدمة الموثوقة لتمكين أعمالك من النمو والازدهار.
                </p>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
                {[
                    { icon: Users, label: 'عميل سعيد', value: '+5000' },
                    { icon: Award, label: 'خبرة سنوات', value: '+10' },
                    { icon: Truck, label: 'طلب تم توصيله', value: '+15k' },
                    { icon: ShieldCheck, label: 'منتج أصلي', value: '100%' },
                ].map((stat, idx) => (
                    <div key={idx} className="glass-panel p-8 rounded-2xl text-center group hover:border-primary/50 transition-colors">
                        <div className="flex justify-center mb-4">
                            <stat.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                        <p className="text-slate-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Story Section */}
            <div className="max-w-7xl mx-auto px-4 mb-20">
                <div className="glass-panel p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-bold text-white">قصتنا</h2>
                        <p className="text-slate-300 leading-relaxed">
                            بدأت رحلتنا في عام 2015 برؤية بسيطة: توفير أحدث تقنيات الكاشير ونقاط البيع للسوق المحلي بأسعار تنافسية ودعم فني لا يضاهى. اليوم، نفخر بكوننا الشريك الموثوق لآلاف المطاعم، المقاهي، ومتاجر التجزئة في جميع أنحاء مصر.
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                            فريقنا مكون من خبراء تقنيين شغوفين بمساعدة أصحاب الأعمال على أتمتة عملياتهم وتحسين كفاءتهم. نحن لا نبيع مجرد أجهزة، بل نقدم حلولاً متكاملة.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="aspect-video rounded-2xl overflow-hidden relative group">
                            <img
                                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80"
                                alt="Our Team"
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-7xl mx-auto px-4 pb-20">
                <h2 className="text-3xl font-bold text-white text-center mb-12">لماذا تختار العامر؟</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'دعم فني متواصل', desc: 'فريق دعم متخصص جاهز لمساعدتك لضمان استمرار عمل نشاطك التجاري بكل كفاءة.' },
                        { title: 'ضمان العامر ستور', desc: 'نقدم حلولاً موثوقة ودعماً فنياً لجميع أجهزتنا لضمان استمرارية عملك.' },
                        { title: 'شحن سريع لحد الباب', desc: 'توصيل سريع وموثوق لجميع محافظات مصر، مع خيارات الدفع عند الاستلام.' },
                    ].map((feature, idx) => (
                        <div key={idx} className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;
