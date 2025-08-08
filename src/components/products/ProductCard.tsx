import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Eye, MessageSquare, Star } from 'lucide-react'
import { Product, formatPrice, generateWhatsAppUrl } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useTranslation()
  const { addItem, isInCart, getItemQuantity } = useCart()

  const discountAmount = product.original_price ? product.original_price - product.price : 0
  const discountPercentage = product.original_price 
    ? Math.round((discountAmount / product.original_price) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
  }

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const message = product.whatsapp_message_text || 
      `مرحباً، مهتم بشراء المنتج: ${product.title_ar} - المتوفر بسعر ${formatPrice(product.price)}`
    const whatsappUrl = generateWhatsAppUrl('+20102643165', message)
    window.open(whatsappUrl, '_blank')
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative">
        {/* Product Image */}
        <Link to={`/product/${product.product_id}`}>
          <div className="aspect-square overflow-hidden bg-gray-100">
            <img
              src={product.thumbnail_url || product.image_urls?.[0] || '/images/placeholder-product.png'}
              alt={product.title_ar || 'بدون اسم'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* Badges - Right Side */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {discountPercentage > 0 && (
            <Badge className="bg-red-500 text-white">
              -{discountPercentage}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-alamer-gold text-white">
              {t('featured')}
            </Badge>
          )}
        </div>

        {/* Stock Status Badge - Left Side */}
        <div className="absolute top-2 left-2">
          {product.stock > 0 ? (
            <Badge className="bg-green-500 text-white">
              متوفر
            </Badge>
          ) : (
            <Badge variant="destructive">
              {t('outOfStock')}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
              <Eye size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-8 h-8 p-0 whatsapp-btn"
              onClick={handleWhatsAppInquiry}
            >
              <MessageSquare size={16} />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4 flex-grow">
        {/* Category and Stock Warning */}
        <div className="flex justify-between items-center mb-2">
          {product.category_name && (
            <Badge variant="outline" className="text-xs">
              {product.category_name || 'بدون فئة'}
            </Badge>
          )}
          
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-medium">
              ⚠️ متبقي {product.stock} قطع
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/product/${product.product_id}`}>
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-alamer-blue transition-colors duration-200">
            {product.title_ar || 'بدون اسم'}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.short_desc_ar || 'بدون وصف'}
        </p>

        {/* Price and Rating */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-alamer-blue">
                {product.price !== undefined && product.price !== null ? formatPrice(product.price) : '—'}
              </span>
              {product.original_price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
            
            {product.rating_average > 0 && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                <div className="flex items-center">
                  <Star size={14} className="text-yellow-400 fill-current" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {product.rating_average.toFixed(1)}
                </span>
                {product.rating_count > 0 && (
                  <span className="text-xs text-gray-500 mr-1">
                    ({product.rating_count})
                  </span>
                )}
              </div>
            )}
          </div>


        </div>

      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 btn-alamer h-10 flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            <span className="whitespace-nowrap">
              {isInCart(product.product_id) 
                ? `في السلة (${getItemQuantity(product.product_id)})` 
                : t('addToCart')
              }
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-10 w-10 p-0 flex items-center justify-center"
            onClick={handleWhatsAppInquiry}
            aria-label="تواصل عبر واتساب"
          >
            <MessageSquare size={18} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ProductCard
