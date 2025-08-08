import React from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Target, Award, Clock, Phone, MapPin, Mail, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const About: React.FC = () => {
  const { t } = useTranslation()

  const stats = [
    { label: 'سنوات الخبرة', value: '15+', icon: Clock },
    { label: 'عميل راضي', value: '1000+', icon: Users },
    { label: 'منتج متنوع', value: '200+', icon: Award },
    { label: 'محافظة نخدمها', value: '27', icon: MapPin },
  ]

  const values = [
    {
      title: 'الجودة',
      description: 'نحرص على تقديم منتجات عالية الجودة من أفضل الماركات العالمية',
      icon: Award
    },
    {
      title: 'الدعم الفني',
      description: 'فريق دعم فني متخصص متاح دائماً لمساعدة عملائنا',
      icon: Users
    },
    {
      title: 'الأسعار التنافسية',
      description: 'نقدم أفضل الأسعار في السوق مع ضمان الجودة',
      icon: Target
    }
  ]

  const team = [
    {
      name: 'أحمد العامر',
      position: 'المدير العام',
      image: '/images/team-photo.jpg',
      description: 'خبرة أكثر من 15 عامًا في مجال أنظمة نقاط البيع'
    },
    {
      name: 'سارة محمد',
      position: 'مدير المبيعات',
      image: '/images/team-photo.jpg',
      description: 'متخصصة في حلول الأعمال والأنظمة المحاسبية'
    },
    {
      name: 'محمد حسن',
      position: 'رئيس الدعم الفني',
      image: '/images/team-photo.jpg',
      description: 'خبير في صيانة وتطوير أنظمة POS والطابعات'
    }
  ]

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('مرحباً، أريد معرفة المزيد عن خدماتكم')
    window.open(`https://wa.me/201026043165?text=${message}`, '_blank')
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-alamer-blue to-alamer-blue-light text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('aboutTitle')}</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            {t('companySlogan')}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-alamer-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="text-alamer-blue" size={32} />
                </div>
                <div className="text-3xl font-bold text-alamer-blue mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">قصة مركز العامر</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  بدأ مركز العامر رحلته في عام 2010 كشركة صغيرة متخصصة في أجهزة الكاشير، 
                  ومع مرور السنين نمت الشركة لتصبح واحدة من الرواد في مجال أنظمة نقاط البيع 
                  وحلول المحاسبة في مصر.
                </p>
                <p>
                  نحن نؤمن بأن التكنولوجيا يجب أن تكون في خدمة الأعمال، لذلك نحرص على 
                  تقديم حلول مبتكرة وعملية تساعد عملاءنا على تطوير أعمالهم وزيادة كفاءتهم.
                </p>
                <p>
                  اليوم، نخدم أكثر من 1000 عميل في جميع أنحاء مصر، من المتاجر الصغيرة 
                  إلى السلاسل التجارية الكبيرة، ونقدم لهم أفضل المنتجات والخدمات.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/business-office.jpg"
                alt="مركز العامر"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-alamer-gold text-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold">2010</div>
                <div className="text-sm">تأسس في</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">قيمنا</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              القيم التي نؤمن بها وتوجه عملنا اليومي في خدمة عملائنا
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-alamer-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="text-alamer-blue" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">فريق العمل</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              تعرف على الفريق المتخصص الذي يعمل بجد لخدمتك
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-alamer-blue font-medium mb-3">{member.position}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-alamer-blue mb-4">رؤيتنا</h3>
              <p className="text-gray-700 leading-relaxed">
                أن نكون الشركة الرائدة في مصر والشرق الأوسط في مجال حلول نقاط البيع 
                والأنظمة المحاسبية، ونساهم في تطوير الأعمال من خلال التكنولوجيا المتقدمة.
              </p>
            </Card>
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-alamer-blue mb-4">مهمتنا</h3>
              <p className="text-gray-700 leading-relaxed">
                تقديم حلول تقنية مبتكرة وعملية لأصحاب الأعمال، مع ضمان أعلى مستويات 
                الجودة والدعم الفني، لمساعدتهم في تحقيق النجاح والنمو المستدام.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-alamer-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">هل لديك أسئلة؟</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار الحل المناسب لعملك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-alamer-secondary"
              onClick={handleWhatsAppContact}
            >
              <MessageSquare className="ml-2" size={20} />
              تواصل عبر واتساب
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-alamer-blue"
            >
              <Phone className="ml-2" size={20} />
              اتصل بنا
            </Button>
          </div>
          
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-blue-400">
            <div className="flex items-center justify-center gap-3">
              <Phone className="text-alamer-gold" size={24} />
              <div>
                <div className="font-medium">اتصل بنا</div>
                <div className="text-blue-100 ltr-content">+20 102 604 3165</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mail className="text-alamer-gold" size={24} />
              <div>
                <div className="font-medium">راسلنا</div>
                <div className="text-blue-100 ltr-content">info@alamer.com</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="text-alamer-gold" size={24} />
              <div>
                <div className="font-medium">زورنا</div>
                <div className="text-blue-100">القاهرة، مصر</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
