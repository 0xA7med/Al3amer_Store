import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, CheckCircle } from 'lucide-react'
import { createContactMessage } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSiteSettings } from '@/lib/supabase';

const contactSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  subject: z.string().min(5, 'الموضوع يجب أن يكون أكثر من 5 أحرف'),
  message: z.string().min(10, 'الرسالة يجب أن تكون أكثر من 10 أحرف'),
})

type ContactFormData = z.infer<typeof contactSchema>

const Contact: React.FC = () => {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>({});

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        const mapped: any = {};
        data.forEach((s: any) => {
          mapped[s.setting_key] = s.setting_value;
        });
        setSettings(mapped);
      } catch (e) {
        // تجاهل الخطأ هنا
      }
    };
    fetchSettings();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      await createContactMessage({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        status: 'unread'
      })

      setIsSubmitted(true)
      reset()
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setError('فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const phone = settings.contact_phone || '+20 102 604 3165';
  const whatsapp = settings.whatsapp_number || '+20 102 604 3165';
  const whatsappDigits = whatsapp.replace(/[^\d]/g, '');

  const contactInfo = [
    {
      icon: Phone,
      title: 'اتصل بنا',
      content: phone,
      description: 'من السبت إلى الخميس، 9 ص - 6 م',
      action: () => window.open(`tel:${phone}`)
    },
    {
      icon: MessageSquare,
      title: 'واتساب',
      content: whatsapp,
      description: 'متاح 24/7 للرد السريع',
      action: () => {
        const message = encodeURIComponent('مرحباً، أريد الاستفسار عن منتجاتكم');
        window.open(`https://wa.me/${whatsappDigits}?text=${message}`, '_blank');
      }
    },
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      content: settings.contact_email || 'info@alamer.com',
      description: 'سنرد خلال 24 ساعة',
      action: () => window.open(`mailto:${settings.contact_email || 'info@alamer.com'}`)
    },
    {
      icon: MapPin,
      title: 'العنوان',
      content: settings.site_address || 'القاهرة، مصر',
      description: 'نخدم جميع محافظات مصر',
      action: () => {}
    }
  ]

  const workingHours = [
    { day: 'السبت - الخميس', hours: '9:00 ص - 6:00 م' },
    { day: 'الجمعة', hours: 'مغلق' },
    { day: 'الطوارئ', hours: 'واتساب 24/7' }
  ]

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('مرحباً، أريد الاستفسار عن منتجاتكم');
    window.open(`https://wa.me/${whatsappDigits}?text=${message}`, '_blank');
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-alamer-blue to-alamer-blue-light text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('contactTitle')}</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            {t('contactDescription')}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-alamer-blue">أرسل لنا رسالة</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('fullName')} *
                        </label>
                        <Input
                          {...register('name')}
                          placeholder="أدخل اسمك الكامل"
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('phone')} *
                        </label>
                        <Input
                          {...register('phone')}
                          placeholder="أدخل رقم هاتفك"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('email')}
                      </label>
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="أدخل بريدك الإلكتروني (اختياري)"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('subject')} *
                      </label>
                      <Input
                        {...register('subject')}
                        placeholder="موضوع الرسالة"
                        className={errors.subject ? 'border-red-500' : ''}
                      />
                      {errors.subject && (
                        <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('message')} *
                      </label>
                      <Textarea
                        {...register('message')}
                        placeholder="اكتب رسالتك هنا..."
                        rows={6}
                        className={errors.message ? 'border-red-500' : ''}
                      />
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-alamer h-12 text-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="loading-spinner w-5 h-5"></div>
                          <span>جاري الإرسال...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send size={20} />
                          <span>{t('sendMessage')}</span>
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer hover:shadow-lg transition-shadow duration-300 ${
                    info.action ? 'hover:bg-gray-50' : ''
                  }`}
                  onClick={info.action}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-alamer-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <info.icon className="text-alamer-blue" size={24} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                    <p className="text-alamer-blue font-medium mb-1">{info.content}</p>
                    <p className="text-gray-600 text-sm">{info.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-alamer-blue" size={24} />
                  ساعات العمل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workingHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-900">{schedule.day}</span>
                      <span className="text-gray-600">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <MessageSquare className="text-green-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">تحتاج رد سريع؟</h3>
                <p className="text-gray-600 mb-4">
                  تواصل معنا عبر واتساب للحصول على رد فوري
                </p>
                <Button
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <MessageSquare className="ml-2" size={20} />
                  فتح واتساب
                </Button>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>الأسئلة الشائعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">ما هي طرق الدفع المتاحة؟</h4>
                    <p className="text-gray-600 text-sm">الدفع عند الاستلام أو الدفع الإلكتروني</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">كم تستغرق مدة التوصيل؟</h4>
                    <p className="text-gray-600 text-sm">2-5 أيام عمل حسب المحافظة</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">هل تقدمون دعم فني؟</h4>
                    <p className="text-gray-600 text-sm">نعم، دعم فني مجاني لمدة سنة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">موقعنا</h2>
            <p className="text-lg text-gray-600">نخدم جميع محافظات جمهورية مصر العربية</p>
          </div>
          <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="text-alamer-blue mx-auto mb-4" size={48} />
              <p className="text-gray-600">خريطة الموقع</p>
              <p className="text-sm text-gray-500">القاهرة، مصر</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
