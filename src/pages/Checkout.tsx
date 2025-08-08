import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/contexts/CartContext'
import { CreditCard, Truck, MapPin, Phone, Mail, User, Building, CreditCard as PaymentIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const Checkout: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, clearCart } = useCart()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phone2: '',
    governorate: '',
    city: '',
    address: '',
    notes: '',
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardName: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '').replace(/\D/g, '')
      processedValue = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19)
    }
    
    // Format card expiry
    if (field === 'cardExpiry') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length >= 2) {
        processedValue = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
      } else {
        processedValue = cleaned
      }
    }
    
    // Format phone number
    if (field === 'phone') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.startsWith('20')) {
        processedValue = '+' + cleaned
      } else if (cleaned.startsWith('0')) {
        processedValue = '+20' + cleaned.substring(1)
      } else if (cleaned.startsWith('1')) {
        processedValue = '+20' + cleaned
      } else {
        processedValue = value
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Validation functions
  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      newErrors.firstName = 'الاسم الكامل مطلوب'
      newErrors.lastName = 'الاسم الكامل مطلوب'
    }
    
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب'
    } else if (!/^(\+20|0)?1[0125][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صحيح'
    }
    
    if (!formData.governorate.trim()) {
      newErrors.governorate = 'المحافظة مطلوبة'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'المركز مطلوبة'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    if (formData.paymentMethod === 'credit-card') {
      const newErrors: {[key: string]: string} = {}
      
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber = 'رقم البطاقة مطلوب'
      } else if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(formData.cardNumber)) {
        newErrors.cardNumber = 'رقم البطاقة غير صحيح (يجب أن يكون 16 رقم)'
      }
      
      if (!formData.cardExpiry.trim()) {
        newErrors.cardExpiry = 'تاريخ الانتهاء مطلوب'
      } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.cardExpiry)) {
        newErrors.cardExpiry = 'تاريخ الانتهاء غير صحيح (MM/YY)'
      }
      
      if (!formData.cardCVC.trim()) {
        newErrors.cardCVC = 'رمز الأمان مطلوب'
      } else if (!/^\d{3,4}$/.test(formData.cardCVC)) {
        newErrors.cardCVC = 'رمز الأمان غير صحيح'
      }
      
      if (!formData.cardName.trim()) {
        newErrors.cardName = 'اسم حامل البطاقة مطلوب'
      }
      
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }
    return true
  }

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const calculateShipping = () => {
    return 50 // Fixed shipping cost
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.14 // 14% tax
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax()
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(step + 1)
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(step + 1)
      }
    } else if (step < 3) {
      setStep(step + 1)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmitOrder = async () => {
    setLoading(true)
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clear cart and redirect to success page
    clearCart()
    navigate('/order-success')
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-gray-400 mb-4">
            <Truck size={64} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">عربة التسوق فارغة</h1>
          <p className="text-gray-600 mb-8">لا توجد منتجات في عربة التسوق</p>
          <Button onClick={() => navigate('/products')} className="btn-alamer">
            تصفح المنتجات
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إتمام الطلب</h1>
        <p className="text-lg text-gray-600">أكمل معلومات الشحن والدفع</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${step >= 1 ? 'text-alamer-blue' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-alamer-blue bg-alamer-blue text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="mr-2">معلومات الشحن</span>
          </div>
          <div className={`w-16 h-0.5 mx-4 ${step >= 2 ? 'bg-alamer-blue' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-alamer-blue' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-alamer-blue bg-alamer-blue text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="mr-2">طريقة الدفع</span>
          </div>
          <div className={`w-16 h-0.5 mx-4 ${step >= 3 ? 'bg-alamer-blue' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 3 ? 'text-alamer-blue' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-alamer-blue bg-alamer-blue text-white' : 'border-gray-300'}`}>
              3
            </div>
            <span className="mr-2">مراجعة الطلب</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary - Now on top */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.product_id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        <img
                          src={item.product.thumbnail_url || (item.product.image_urls && item.product.image_urls[0]) || '/images/placeholder-product.png'}
                          alt={item.product.title_ar}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.title_ar}</p>
                        <p className="text-gray-600 text-sm">الكمية: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(item.product.price * item.quantity).toLocaleString()} ج.م</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي</span>
                    <span>{calculateSubtotal().toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن</span>
                    <span>{calculateShipping().toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة (14%)</span>
                    <span>{calculateTax().toLocaleString()} ج.م</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span>{calculateTotal().toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form - Now below */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {step === 1 && <MapPin className="ml-2" size={20} />}
                {step === 2 && <PaymentIcon className="ml-2" size={20} />}
                {step === 3 && <CreditCard className="ml-2" size={20} />}
                {step === 1 && 'معلومات الشحن'}
                {step === 2 && 'طريقة الدفع'}
                {step === 3 && 'مراجعة الطلب'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-6">
                  {/* Personal & Contact Information Section */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                        <User className="ml-2" size={20} />
                        المعلومات الشخصية ومعلومات الاتصال
                      </h3>
                      <span className="text-sm text-yellow-800 bg-yellow-50 px-2 py-1 rounded"><span className="text-red-500">*</span> الحقول المطلوبة</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* الاسم الكامل */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          الاسم الكامل <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={`${formData.firstName} ${formData.lastName}`.trim()}
                          onChange={(e) => {
                            const names = e.target.value.split(' ')
                            handleInputChange('firstName', names[0] || '')
                            handleInputChange('lastName', names.slice(1).join(' ') || '')
                          }}
                          placeholder="الاسم الأول والاسم الأخير"
                          className={(errors.firstName || errors.lastName) ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {(errors.firstName || errors.lastName) && (
                          <p className="text-red-500 text-sm mt-1">الاسم الكامل مطلوب</p>
                        )}
                      </div>
                      {/* البريد الإلكتروني */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          البريد الإلكتروني (اختياري)
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="example@email.com"
                          className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                      {/* رقم الهاتف */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          رقم الهاتف <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+20 123 456 7890"
                          className={errors.phone ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                      {/* رقم هاتف إضافي */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          رقم هاتف إضافي (اختياري)
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone2}
                          onChange={(e) => handleInputChange('phone2', e.target.value)}
                          placeholder="+20 123 456 7890"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Section */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                      <MapPin className="ml-2" size={20} />
                      عنوان الشحن
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            المحافظة <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={formData.governorate}
                            onChange={(e) => handleInputChange('governorate', e.target.value)}
                            placeholder="القاهرة"
                            className={errors.governorate ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          {errors.governorate && (
                            <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            المركز <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="مدينة نصر"
                            className={errors.city ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          العنوان التفصيلي <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="الشارع والرقم والحي"
                          className={errors.address ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          ملاحظات إضافية (اختياري)
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="أي ملاحظات إضافية للشحن..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Required Fields Note */}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <PaymentIcon className="ml-2" size={20} />
                      اختر طريقة الدفع
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit-card"
                          checked={formData.paymentMethod === 'credit-card'}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          className="text-alamer-blue"
                        />
                        <CreditCard size={20} className="text-purple-600" />
                        <span className="font-medium">بطاقة ائتمان</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={formData.paymentMethod === 'cash'}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          className="text-alamer-blue"
                        />
                        <Truck size={20} className="text-green-600" />
                        <span className="font-medium">الدفع عند الاستلام</span>
                      </label>
                    </div>
                  </div>

                  {/* Credit Card Information */}
                  {formData.paymentMethod === 'credit-card' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <CreditCard className="ml-2" size={20} />
                        معلومات البطاقة
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            رقم البطاقة <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={formData.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                            placeholder="1234 5678 9012 3456"
                            className={errors.cardNumber ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          {errors.cardNumber && (
                            <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              تاريخ الانتهاء <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={formData.cardExpiry}
                              onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                              placeholder="MM/YY"
                              className={errors.cardExpiry ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            {errors.cardExpiry && (
                              <p className="text-red-500 text-sm mt-1">{errors.cardExpiry}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              رمز الأمان <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={formData.cardCVC}
                              onChange={(e) => handleInputChange('cardCVC', e.target.value)}
                              placeholder="123"
                              className={errors.cardCVC ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            {errors.cardCVC && (
                              <p className="text-red-500 text-sm mt-1">{errors.cardCVC}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              اسم حامل البطاقة <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={formData.cardName}
                              onChange={(e) => handleInputChange('cardName', e.target.value)}
                              placeholder="اسم حامل البطاقة"
                              className={errors.cardName ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            {errors.cardName && (
                              <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cash on Delivery Note */}
                  {formData.paymentMethod === 'cash' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
                        <Truck className="ml-2" size={20} />
                        الدفع عند الاستلام
                      </h3>
                      <p className="text-green-700 text-sm">
                        سيتم الدفع عند استلام الطلب. تأكد من توفر المبلغ المطلوب.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">معلومات الشحن</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                      <p className="text-gray-600">{formData.phone}</p>
                      {formData.phone2 && <p className="text-gray-600">هاتف إضافي: {formData.phone2}</p>}
                      {formData.email && <p className="text-gray-600">{formData.email}</p>}
                      <p className="text-gray-600">{formData.address}</p>
                      <p className="text-gray-600">{formData.governorate}, {formData.city}</p>
                      {formData.notes && <p className="text-gray-600">ملاحظات: {formData.notes}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">طريقة الدفع</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">
                        {formData.paymentMethod === 'credit-card' ? 'بطاقة ائتمان' : 'الدفع عند الاستلام'}
                      </p>
                      {formData.paymentMethod === 'credit-card' && (
                        <p className="text-gray-600">**** **** **** {formData.cardNumber.slice(-4)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <Button variant="outline" onClick={handlePrevStep}>
                    السابق
                  </Button>
                )}
                <div className="flex-1"></div>
                {step < 3 ? (
                  <Button 
                    onClick={handleNextStep} 
                    className="btn-alamer"
                    disabled={
                      (step === 1 && (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.governorate.trim() || !formData.city.trim() || !formData.address.trim())) ||
                      (step === 2 && formData.paymentMethod === 'credit-card' && (!formData.cardNumber.trim() || !formData.cardExpiry.trim() || !formData.cardCVC.trim() || !formData.cardName.trim()))
                    }
                  >
                    التالي
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitOrder} 
                    className="btn-alamer"
                    disabled={loading}
                  >
                    {loading ? 'جاري إتمام الطلب...' : 'إتمام الطلب'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  )
}

export default Checkout 