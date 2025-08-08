import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, MessageSquare, Minus, Plus, Star, Eye, Truck, Shield, ArrowLeft, Heart } from 'lucide-react'
import { Product, formatPrice, generateWhatsAppUrl } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

const ProductDetails: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { addItem, updateQuantity, getItemQuantity, isInCart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', id)
        .single();
      if (error || !data) {
        setError('المنتج غير موجود');
        setProduct(null);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
    }
  }

  const handleUpdateQuantity = (newQuantity: number) => {
    if (product && newQuantity > 0 && newQuantity <= product.stock) {
      if (isInCart(product.product_id)) {
        updateQuantity(product.product_id, newQuantity)
      }
      setQuantity(newQuantity)
    }
  }

  const handleWhatsAppInquiry = () => {
    if (product) {
      const message = product.whatsapp_message_text || 
        `مرحباً، مهتم بشراء المنتج: ${product.title_ar} - المتوفر بسعر ${formatPrice(product.price)}`
      const whatsappUrl = generateWhatsAppUrl('+201026043165', message)
      window.open(whatsappUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500 mb-4">
          <h2 className="text-2xl font-bold">خطأ في تحميل المنتج</h2>
          <p>{error || 'المنتج غير موجود'}</p>
        </div>
        <Link to="/products">
          <Button variant="outline">العودة للمنتجات</Button>
        </Link>
      </div>
    )
  }

  const discountAmount = product.original_price ? product.original_price - product.price : 0
  const discountPercentage = product.original_price 
    ? Math.round((discountAmount / product.original_price) * 100)
    : 0

  const images = product.image_urls || []
  const cartQuantity = getItemQuantity(product.product_id)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/" className="hover:text-alamer-blue">الرئيسية</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-alamer-blue">المنتجات</Link>
        <span>/</span>
        {product.category_name && (
          <>
            <Link to={`/products?category=${encodeURIComponent(product.category_name)}`} className="hover:text-alamer-blue">
              {product.category_name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-500">{product.title_ar}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={images[selectedImage] || product.thumbnail_url || '/images/placeholder-product.png'}
              alt={product.title_ar}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors duration-200 ${
                    selectedImage === index ? 'border-alamer-blue' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title_ar} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-center text-alamer-blue mb-2">
                <Eye size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{product.view_count}</div>
              <div className="text-sm text-gray-600">مشاهدة</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-center text-alamer-blue mb-2">
                <ShoppingCart size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{product.sale_count}</div>
              <div className="text-sm text-gray-600">مبيعات</div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category Badge */}
          {product.category_name && (
            <Badge className="category-badge">{product.category_name}</Badge>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">{product.title_ar}</h1>

          {/* Rating */}
          {product.rating_average > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(product.rating_average) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-lg text-gray-600">
                {product.rating_average.toFixed(1)} ({product.rating_count} تقييم)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-alamer-blue">
                {formatPrice(product.price)}
              </span>
              {product.original_price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <Badge className="discount-badge">
                    -{discountPercentage}%
                  </Badge>
                </>
              )}
            </div>
            {discountAmount > 0 && (
              <p className="text-green-600 font-medium">
                توفر {formatPrice(discountAmount)}
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.stock > 0 ? t('inStock') : t('outOfStock')}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-orange-600 font-medium">
                (متبقي {product.stock} قطع فقط)
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.short_desc_ar && (
            <p className="text-gray-700 text-lg leading-relaxed">
              {product.short_desc_ar}
            </p>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-lg font-medium">{t('quantity')}:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdateQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                  className="h-10 w-10 p-0"
                >
                  <Minus size={16} />
                </Button>
                <span className="px-4 py-2 text-lg font-medium min-w-[60px] text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdateQuantity(quantity + 1)}
                  disabled={quantity >= product.stock}
                  className="h-10 w-10 p-0"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-alamer h-12 text-lg"
              >
                <ShoppingCart size={20} className="ml-2" />
                {cartQuantity > 0 
                  ? `في السلة (${cartQuantity})` 
                  : t('addToCart')
                }
              </Button>
              <Button
                variant="outline"
                onClick={handleWhatsAppInquiry}
                className="h-12 px-6"
              >
                <MessageSquare size={20} className="ml-2" />
                واتساب
              </Button>
              <Button variant="outline" size="sm" className="h-12 w-12 p-0">
                <Heart size={20} />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Truck className="text-alamer-blue" size={20} />
              <span className="text-sm font-medium">شحن مجاني للطلبات فوق 1000 ج.م</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="text-alamer-blue" size={20} />
              <span className="text-sm font-medium">ضمان شامل لمدة سنة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">الوصف</TabsTrigger>
          <TabsTrigger value="specifications">المواصفات</TabsTrigger>
          <TabsTrigger value="reviews">التقييمات</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>وصف المنتج</CardTitle>
            </CardHeader>
            <CardContent>
              {product.full_desc_ar ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.full_desc_ar}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">لا يوجد وصف تفصيلي متاح لهذا المنتج.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>المواصفات الفنية</CardTitle>
            </CardHeader>
            <CardContent>
              {product.technical_specs_ar ? (
                <div className="space-y-4">
                  {product.technical_specs_ar.split('\n').map((spec, index) => {
                    if (spec.trim()) {
                      const [key, value] = spec.split(':')
                      return (
                        <div key={index} className="flex justify-between py-2">
                          <span className="font-medium text-gray-900">{key?.trim()}</span>
                          <span className="text-gray-700">{value?.trim()}</span>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              ) : (
                <p className="text-gray-500">لا توجد مواصفات فنية متاحة لهذا المنتج.</p>
              )}
              
              {/* Additional Product Info */}
              <Separator className="my-6" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="font-medium">رقم المنتج:</span>
                    <span className="ltr-content">{product.sku}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="font-medium">الوزن:</span>
                    <span>{product.weight} كجم</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="font-medium">الأبعاد:</span>
                    <span className="ltr-content">{product.dimensions}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">المخزون:</span>
                  <span>{product.stock} قطعة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تقييمات العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              {product.rating_count > 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-alamer-blue mb-2">
                    {product.rating_average.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        className={i < Math.floor(product.rating_average) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-gray-600">
                    بناءً على {product.rating_count} تقييم
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">لا توجد تقييمات لهذا المنتج بعد.</p>
                  <p className="text-sm text-gray-400">كن أول من يقيم هذا المنتج</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Reviews */}
      {product.video_review_links && product.video_review_links.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>مراجعات بالفيديو</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.video_review_links.map((link, index) => (
                <div key={index} className="aspect-video bg-gray-100 rounded-lg">
                  <iframe
                    src={link}
                    title={`Video Review ${index + 1}`}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProductDetails
