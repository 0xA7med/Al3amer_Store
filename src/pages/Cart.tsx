import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageSquare, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatPrice, generateWhatsAppUrl } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const Cart: React.FC = () => {
  const { t } = useTranslation()
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)

  const shippingCost = totalPrice >= 1000 ? 0 : 50
  const finalTotal = totalPrice + shippingCost - discount

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  const handleWhatsAppOrder = () => {
    const itemsList = items.map(item => 
      `- ${item.product.title_ar} (${item.quantity}x) = ${formatPrice(item.product.price * item.quantity)}`
    ).join('\n')

    const message = `مرحباً، أريد تأكيد طلب شراء:

${itemsList}

المجموع الفرعي: ${formatPrice(totalPrice)}
الشحن: ${formatPrice(shippingCost)}
المجموع الكلي: ${formatPrice(finalTotal)}

أريد تأكيد الطلب وإرسال بياناتي للتوصيل.`

    const whatsappUrl = generateWhatsAppUrl('+201026043165', message)
    window.open(whatsappUrl, '_blank')
  }

  const applyPromoCode = () => {
    // Simple promo code logic - you can expand this
    if (promoCode.toLowerCase() === 'welcome10') {
      setDiscount(totalPrice * 0.1) // 10% discount
    } else if (promoCode.toLowerCase() === 'save50') {
      setDiscount(50) // 50 EGP discount
    } else {
      setDiscount(0)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('emptyCart')}</h2>
          <p className="text-gray-600 mb-8">
            لم تقم بإضافة أي منتجات إلى سلة التسوق بعد
          </p>
          <Link to="/products">
            <Button className="btn-alamer">
              <ShoppingBag className="ml-2" size={20} />
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('shoppingCart')}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-alamer-blue">الرئيسية</Link>
          <span>/</span>
          <span>سلة التسوق</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart size={24} />
                  عناصر السلة ({totalItems})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  مسح الكل
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product.product_id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  {/* Product Image */}
                  <Link to={`/product/${item.product.product_id}`} className="flex-shrink-0">
                    <img
                      src={item.product.thumbnail_url || item.product.image_urls?.[0] || '/images/placeholder-product.png'}
                      alt={item.product.title_ar}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.product_id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-alamer-blue transition-colors duration-200 line-clamp-2">
                        {item.product.title_ar}
                      </h3>
                    </Link>
                    
                    {item.product.category_name && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.product.category_name}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.product.product_id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.product.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="h-8 w-8 p-0"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-left">
                        <div className="text-lg font-bold text-alamer-blue">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(item.product.price)} × {item.quantity}
                        </div>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity > item.product.stock && (
                      <p className="text-red-600 text-sm mt-2">
                        المخزون المتاح: {item.product.stock} قطعة فقط
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.product.product_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link to="/products">
              <Button variant="outline" className="btn-alamer-outline">
                <ArrowLeft className="ml-2" size={16} />
                متابعة التسوق
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium mb-2">كود الخصم</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="أدخل كود الخصم"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={applyPromoCode}>
                    تطبيق
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="text-green-600 text-sm mt-1">
                    تم تطبيق خصم {formatPrice(discount)}
                  </p>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>المجموع الفرعي ({totalItems} منتج)</span>
                  <span className="font-semibold">{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    الشحن
                    {totalPrice >= 1000 && (
                      <Badge variant="secondary" className="text-xs">مجاني</Badge>
                    )}
                  </span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? 'مجاني' : formatPrice(shippingCost)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>الخصم</span>
                    <span className="font-semibold">-{formatPrice(discount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>المجموع الكلي</span>
                  <span className="text-alamer-blue">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <Separator />

              {/* Shipping Info */}
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-alamer-blue mb-1">معلومات الشحن</p>
                <p className="text-gray-600">
                  {totalPrice >= 1000 
                    ? 'تهانينا! حصلت على شحن مجاني'
                    : `أضف ${formatPrice(1000 - totalPrice)} للحصول على شحن مجاني`
                  }
                </p>
              </div>

              {/* Checkout Buttons */}
              <div className="space-y-3">
                <Link to="/checkout" className="block">
                  <Button className="w-full btn-alamer h-12 text-lg">
                    إتمام الطلب
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  onClick={handleWhatsAppOrder}
                  className="w-full h-12 text-lg whatsapp-btn border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                >
                  <MessageSquare size={20} className="ml-2" />
                  طلب عبر واتساب
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-alamer-blue text-xs font-medium">ضمان الجودة</div>
                  <div className="text-xs text-gray-600">منتجات أصلية</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-alamer-blue text-xs font-medium">دفع آمن</div>
                  <div className="text-xs text-gray-600">معاملات محمية</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Cart
