import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Globe, 
  DollarSign, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Palette,
  Shield,
  Database,
  Download,
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';

interface SiteSettings {
  // معلومات الموقع الأساسية
  site_name: string;
  site_description: string;
  site_logo?: string;
  site_favicon?: string;
  
  // معلومات الشركة
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  
  // إعدادات العملة
  currency_code: string;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  
  // إعدادات اللغة
  default_language: string;
  supported_languages: string[];
  
  // إعدادات البريد الإلكتروني
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: 'tls' | 'ssl' | 'none';
  
  // إعدادات الأمان
  enable_registration: boolean;
  require_email_verification: boolean;
  session_timeout: number;
  max_login_attempts: number;
  
  // إعدادات المتجر
  enable_reviews: boolean;
  enable_wishlist: boolean;
  enable_comparison: boolean;
  items_per_page: number;
  
  // إعدادات الشحن
  free_shipping_threshold: number;
  default_shipping_cost: number;
  enable_local_pickup: boolean;
  
  // إعدادات الضرائب
  enable_taxes: boolean;
  tax_rate: number;
  tax_included: boolean;
  
  // إعدادات الدفع
  enable_cod: boolean;
  enable_online_payment: boolean;
  payment_gateways: string[];
  
  // إعدادات الإشعارات
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_push_notifications: boolean;
  
  // إعدادات النسخ الاحتياطي
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_retention: number;
}

const SettingsAdmin: React.FC = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'متجر العامر',
    site_description: 'متجر متخصص في أجهزة الكاشير وأنظمة المحاسبة',
    site_logo: '',
    site_favicon: '',
    company_name: 'مركز العامر',
    company_address: 'العنوان هنا',
    company_phone: '+201026043165',
    company_email: 'info@al3amer.com',
    company_website: 'https://al3amer.com',
    currency_code: 'EGP',
    currency_symbol: 'ج.م',
    currency_position: 'after',
    default_language: 'ar',
    supported_languages: ['ar', 'en'],
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    enable_registration: true,
    require_email_verification: true,
    session_timeout: 24,
    max_login_attempts: 5,
    enable_reviews: true,
    enable_wishlist: true,
    enable_comparison: true,
    items_per_page: 12,
    free_shipping_threshold: 1000,
    default_shipping_cost: 50,
    enable_local_pickup: true,
    enable_taxes: false,
    tax_rate: 14,
    tax_included: false,
    enable_cod: true,
    enable_online_payment: true,
    payment_gateways: ['cod', 'credit_card'],
    enable_email_notifications: true,
    enable_sms_notifications: false,
    enable_push_notifications: false,
    auto_backup: true,
    backup_frequency: 'daily',
    backup_retention: 30,
  });

  // جلب الإعدادات
  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setSettings(prev => ({
          ...prev,
          ...settingsMap,
        }));
      }
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
      toast.error('فشل في جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  }, []);

  // حفظ الإعدادات
  const saveSettings = async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      setSaving(true);

      // تحويل الإعدادات إلى تنسيق قاعدة البيانات
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));

      // حذف الإعدادات القديمة
      const { error: deleteError } = await supabase
        .from('site_settings')
        .delete()
        .neq('setting_key', '');

      if (deleteError) throw deleteError;

      // إدراج الإعدادات الجديدة
      const { error: insertError } = await supabase
        .from('site_settings')
        .insert(settingsArray);

      if (insertError) throw insertError;

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  // تحديث إعداد واحد
  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // إعادة تعيين الإعدادات
  const resetSettings = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      fetchSettings();
      toast.success('تم إعادة تعيين الإعدادات');
    }
  };

  // تصدير الإعدادات
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `site_settings_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // استيراد الإعدادات
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(prev => ({
          ...prev,
          ...importedSettings,
        }));
        toast.success('تم استيراد الإعدادات بنجاح');
      } catch (error) {
        toast.error('فشل في استيراد الإعدادات - ملف غير صالح');
      }
    };
    reader.readAsText(file);
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات الموقع</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة إعدادات الموقع والمتجر
          </p>
        </div>
                 <div className="flex gap-2">
           <Button
             variant="outline"
             onClick={exportSettings}
             className="flex items-center gap-2"
           >
             <Download className="h-4 w-4" />
             تصدير
           </Button>
           <Button
             variant="outline"
             onClick={resetSettings}
             className="flex items-center gap-2"
           >
             <RefreshCw className="h-4 w-4" />
             إعادة تعيين
           </Button>

           <Button
             onClick={saveSettings}
             disabled={saving}
             className="flex items-center gap-2"
           >
             <Save className="h-4 w-4" />
             {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
           </Button>
         </div>
      </div>

               {/* التبويبات */}
         <Tabs defaultValue="general" className="w-full">
           <TabsList className="grid w-full grid-cols-6">
             <TabsTrigger value="general" className="flex items-center gap-2">
               <Globe className="h-4 w-4" />
               عام
             </TabsTrigger>
             <TabsTrigger value="company" className="flex items-center gap-2">
               <MapPin className="h-4 w-4" />
               الشركة
             </TabsTrigger>
             <TabsTrigger value="store" className="flex items-center gap-2">
               <Settings className="h-4 w-4" />
               المتجر
             </TabsTrigger>
             <TabsTrigger value="payment" className="flex items-center gap-2">
               <DollarSign className="h-4 w-4" />
               الدفع
             </TabsTrigger>
             <TabsTrigger value="email" className="flex items-center gap-2">
               <Mail className="h-4 w-4" />
               البريد
             </TabsTrigger>
             <TabsTrigger value="security" className="flex items-center gap-2">
               <Shield className="h-4 w-4" />
               الأمان
             </TabsTrigger>
           </TabsList>
           
           

        {/* التبويب العام */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إعدادات الموقع الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الموقع</Label>
                  <Input
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    placeholder="اسم الموقع"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط الشعار</Label>
                  <Input
                    value={settings.site_logo}
                    onChange={(e) => updateSetting('site_logo', e.target.value)}
                    placeholder="رابط شعار الموقع"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>وصف الموقع</Label>
                <Textarea
                  value={settings.site_description}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  placeholder="وصف الموقع"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                إعدادات اللغة والعملة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>اللغة الافتراضية</Label>
                  <Select value={settings.default_language} onValueChange={(value) => updateSetting('default_language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>رمز العملة</Label>
                  <Input
                    value={settings.currency_symbol}
                    onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                    placeholder="ج.م"
                  />
                </div>
                <div className="space-y-2">
                  <Label>موضع العملة</Label>
                  <Select value={settings.currency_position} onValueChange={(value: 'before' | 'after') => updateSetting('currency_position', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">قبل الرقم</SelectItem>
                      <SelectItem value="after">بعد الرقم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب معلومات الشركة */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                معلومات الشركة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشركة</Label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    placeholder="اسم الشركة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={settings.company_phone}
                    onChange={(e) => updateSetting('company_phone', e.target.value)}
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    value={settings.company_email}
                    onChange={(e) => updateSetting('company_email', e.target.value)}
                    placeholder="البريد الإلكتروني"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الموقع الإلكتروني</Label>
                  <Input
                    value={settings.company_website}
                    onChange={(e) => updateSetting('company_website', e.target.value)}
                    placeholder="الموقع الإلكتروني"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>عنوان الشركة</Label>
                <Textarea
                  value={settings.company_address}
                  onChange={(e) => updateSetting('company_address', e.target.value)}
                  placeholder="عنوان الشركة"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات المتجر */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات المتجر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_reviews"
                    checked={settings.enable_reviews}
                    onCheckedChange={(checked) => updateSetting('enable_reviews', checked)}
                  />
                  <Label htmlFor="enable_reviews">تفعيل التقييمات</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_wishlist"
                    checked={settings.enable_wishlist}
                    onCheckedChange={(checked) => updateSetting('enable_wishlist', checked)}
                  />
                  <Label htmlFor="enable_wishlist">تفعيل قائمة الأمنيات</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عدد العناصر في الصفحة</Label>
                  <Input
                    type="number"
                    value={settings.items_per_page}
                    onChange={(e) => updateSetting('items_per_page', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>حد الشحن المجاني</Label>
                  <Input
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => updateSetting('free_shipping_threshold', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات الدفع */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إعدادات الدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_cod"
                    checked={settings.enable_cod}
                    onCheckedChange={(checked) => updateSetting('enable_cod', checked)}
                  />
                  <Label htmlFor="enable_cod">الدفع عند الاستلام</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_online_payment"
                    checked={settings.enable_online_payment}
                    onCheckedChange={(checked) => updateSetting('enable_online_payment', checked)}
                  />
                  <Label htmlFor="enable_online_payment">الدفع الإلكتروني</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تكلفة الشحن الافتراضية</Label>
                  <Input
                    type="number"
                    value={settings.default_shipping_cost}
                    onChange={(e) => updateSetting('default_shipping_cost', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>معدل الضريبة (%)</Label>
                  <Input
                    type="number"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات البريد */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                إعدادات البريد الإلكتروني
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>خادم SMTP</Label>
                  <Input
                    value={settings.smtp_host}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>منفذ SMTP</Label>
                  <Input
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  <Input
                    value={settings.smtp_username}
                    onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    placeholder="البريد الإلكتروني"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    value={settings.smtp_password}
                    onChange={(e) => updateSetting('smtp_password', e.target.value)}
                    placeholder="كلمة المرور"
                    type="password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>نوع التشفير</Label>
                <Select value={settings.smtp_encryption} onValueChange={(value: 'tls' | 'ssl' | 'none') => updateSetting('smtp_encryption', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">بدون تشفير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات الأمان */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_registration"
                    checked={settings.enable_registration}
                    onCheckedChange={(checked) => updateSetting('enable_registration', checked)}
                  />
                  <Label htmlFor="enable_registration">تفعيل التسجيل</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_email_verification"
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
                  />
                  <Label htmlFor="require_email_verification">التحقق من البريد</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>مهلة الجلسة (ساعات)</Label>
                  <Input
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                    min="1"
                    max="168"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى لمحاولات تسجيل الدخول</Label>
                  <Input
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

             {/* قسم النسخ الاحتياطي */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Database className="h-5 w-5" />
             النسخ الاحتياطي والاستيراد
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>استيراد الإعدادات</Label>
               <Input
                 type="file"
                 accept=".json"
                 onChange={importSettings}
                 className="cursor-pointer"
               />
               <p className="text-sm text-gray-500">
                 اختر ملف JSON يحتوي على الإعدادات
               </p>
             </div>
             <div className="space-y-2">
               <Label>النسخ الاحتياطي التلقائي</Label>
               <div className="flex items-center space-x-2">
                 <Switch
                   id="auto_backup"
                   checked={settings.auto_backup}
                   onCheckedChange={(checked) => updateSetting('auto_backup', checked)}
                 />
                 <Label htmlFor="auto_backup">تفعيل النسخ الاحتياطي التلقائي</Label>
               </div>
               {settings.auto_backup && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                   <Select value={settings.backup_frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => updateSetting('backup_frequency', value)}>
                     <SelectTrigger className="w-full">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="daily">يومياً</SelectItem>
                       <SelectItem value="weekly">أسبوعياً</SelectItem>
                       <SelectItem value="monthly">شهرياً</SelectItem>
                     </SelectContent>
                   </Select>
                   <Input
                     type="number"
                     value={settings.backup_retention}
                     onChange={(e) => updateSetting('backup_retention', parseInt(e.target.value))}
                     placeholder="عدد النسخ المحتفظ بها"
                     min="1"
                     max="365"
                     className="w-full"
                   />
                 </div>
               )}
             </div>
           </div>
           
           {/* زر النسخ الاحتياطي اليدوي */}
           <div className="pt-4 border-t">
             <Button
               variant="outline"
               onClick={exportSettings}
               className="flex items-center gap-2"
             >
               <Download className="h-4 w-4" />
               نسخ احتياطي يدوي
             </Button>
           </div>
         </CardContent>
       </Card>
    </div>
  );
};

export default SettingsAdmin; 