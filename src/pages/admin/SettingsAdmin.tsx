import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSiteSettings, updateSiteSetting } from '@/lib/supabase';

const settingsMap = {
  siteName: 'site_name_ar',
  siteDescription: 'site_slogan_ar',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
  siteAddress: 'site_address', // جديد
  whatsappNumber: 'whatsapp_number', // جديد
  workingHours: 'working_hours', // جديد
  showWorkingHours: 'show_working_hours', // جديد
  currency: 'currency',
  language: 'language',
  notifications: 'notifications',
  maintenance: 'maintenance_mode',
};

const currencies = [
  { value: 'ج.م', label: 'جنيه مصري (ج.م)' },
  { value: '$', label: 'دولار أمريكي ($)' },
  { value: '€', label: 'يورو (€)' },
];

const languages = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const SettingsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('isAdminLoggedIn')) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // نقل دالة fetchSettings هنا لتكون متاحة في كل مكان داخل الكومبوننت
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSiteSettings();
      const mapped: any = {};
      Object.entries(settingsMap).forEach(([key, dbKey]) => {
        const found = data.find((s: any) => s.setting_key === dbKey);
        mapped[key] = found ? found.setting_value : '';
      });
      setSettings(mapped);
    } catch (e) {
      setError('فشل في تحميل الإعدادات');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      for (const [key, dbKey] of Object.entries(settingsMap)) {
        let value = settings[key];
        // إذا كان الإعداد notifications أو maintenance_mode، حول القيمة إلى نص
        if (dbKey === 'notifications' || dbKey === 'maintenance_mode') {
          value = value ? 'true' : 'false';
        }
        await updateSiteSetting(dbKey, value);
      }
      setSuccess('تم حفظ الإعدادات بنجاح');
      await fetchSettings(); // إعادة جلب الإعدادات بعد الحفظ
    } catch (e) {
      setError('فشل في حفظ الإعدادات');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <>
          {success && <div className="text-center text-green-600 mb-4">{success}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* إعدادات الموقع */}
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الموقع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">اسم الموقع</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName || ''}
                    onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription">وصف الموقع</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription || ''}
                    onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">البريد الإلكتروني</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">رقم الهاتف</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone || ''}
                    onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="siteAddress">العنوان</Label>
                  <Input
                    id="siteAddress"
                    value={settings.siteAddress || ''}
                    onChange={e => setSettings({ ...settings, siteAddress: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappNumber">رقم الواتساب</Label>
                  <Input
                    id="whatsappNumber"
                    value={settings.whatsappNumber || ''}
                    onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="workingHours">ساعات العمل (اكتب كل سطر بالشكل: اليوم: الوقت)</Label>
                  <textarea
                    id="workingHours"
                    className="w-full border rounded p-2 min-h-[80px]"
                    value={settings.workingHours || ''}
                    onChange={e => setSettings({ ...settings, workingHours: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="showWorkingHours"
                    checked={!!settings.showWorkingHours}
                    onCheckedChange={checked => setSettings({ ...settings, showWorkingHours: checked })}
                  />
                  <Label htmlFor="showWorkingHours">إظهار قسم ساعات العمل في الموقع</Label>
                </div>
              </CardContent>
            </Card>

            {/* إعدادات عامة */}
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات العامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="currency">العملة</Label>
                  <div className="relative">
                    <Input
                      id="currency"
                      value={currencies.find(c => c.value === settings.currency)?.label || ''}
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      placeholder="اختر العملة"
                      readOnly
                      className="cursor-pointer"
                    />
                    <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {showCurrencyDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {currencies.map((currency) => (
                        <div
                          key={currency.value}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSettings({ ...settings, currency: currency.value });
                            setShowCurrencyDropdown(false);
                          }}
                        >
                          {currency.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Label htmlFor="language">اللغة</Label>
                  <div className="relative">
                    <Input
                      id="language"
                      value={languages.find(l => l.value === settings.language)?.label || ''}
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      placeholder="اختر اللغة"
                      readOnly
                      className="cursor-pointer"
                    />
                    <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {showLanguageDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {languages.map((language) => (
                        <div
                          key={language.value}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSettings({ ...settings, language: language.value });
                            setShowLanguageDropdown(false);
                          }}
                        >
                          {language.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">تفعيل الإشعارات</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="notifications"
                      checked={!!settings.notifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                      className={settings.notifications ? 'bg-green-500' : 'bg-gray-300'}
                      style={{ width: 48, height: 28 }}
                    />
                    <span className={`text-sm font-bold ${settings.notifications ? 'text-green-600' : 'text-gray-500'}`}>
                      {settings.notifications ? 'مفعّل' : 'غير مفعّل'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance">وضع الصيانة</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="maintenance"
                      checked={!!settings.maintenance}
                      onCheckedChange={(checked) => setSettings({ ...settings, maintenance: checked })}
                      className={settings.maintenance ? 'bg-red-500' : 'bg-gray-300'}
                      style={{ width: 48, height: 28 }}
                    />
                    <span className={`text-sm font-bold ${settings.maintenance ? 'text-red-600' : 'text-gray-500'}`}>
                      {settings.maintenance ? 'مفعّل' : 'غير مفعّل'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Button onClick={handleSave} className="w-full lg:w-auto">
              حفظ الإعدادات
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsAdmin; 