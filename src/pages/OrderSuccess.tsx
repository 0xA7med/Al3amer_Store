import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProductCard from '@/components/products/ProductCard'

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate()
  
  // Get featured products (first 12 products for demo)
  const featuredProducts: any[] = [] // TODO: fetch from Supabase if needed
  
  // Create infinite loop by duplicating products
  const infiniteProducts = [...featuredProducts, ...featuredProducts, ...featuredProducts]
  
  // Auto-scroll effect
  React.useEffect(() => {
    const scrollContainer = document.getElementById('infinite-scroll')
    if (!scrollContainer) return
    
    let animationId: number
    let scrollPosition = 0
    
    const animate = () => {
      scrollPosition += 1 // Adjust speed here
      if (scrollPosition >= scrollContainer.scrollWidth / 3) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              تم إتمام الطلب بنجاح!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-gray-600">
              شكراً لك على طلبك. تم استلام طلبك وسيتم معالجته قريباً.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-alamer-blue ml-2" />
                <h3 className="text-lg font-semibold">معلومات الطلب</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>رقم الطلب: <span className="font-medium">#ORD-{Date.now().toString().slice(-6)}</span></p>
                <p>تاريخ الطلب: <span className="font-medium">{new Date().toLocaleDateString('ar-EG')}</span></p>
                <p>حالة الطلب: <span className="font-medium text-green-600">قيد المعالجة</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                سيتم التواصل معك عبر الهاتف لتأكيد الطلب وتحديد موعد التوصيل.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/')} 
                  className="btn-alamer flex items-center"
                >
                  <Home className="ml-2" size={16} />
                  العودة للرئيسية
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/products')}
                  className="flex items-center"
                >
                  <Package className="ml-2" size={16} />
                  تصفح المزيد من المنتجات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Infinite Scrolling Featured Products */}
      <div className="mt-12">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">منتجات مميزة</h2>
          <p className="text-gray-600 text-sm">اكتشف المزيد من منتجاتنا المميزة</p>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          {/* Gradient Overlays for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Infinite Scroll Container */}
          <div 
            id="infinite-scroll"
            className="flex gap-4 overflow-x-hidden scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {infiniteProducts.map((product, index) => (
              <div 
                key={`${product.product_id}-${index}`} 
                className="flex-shrink-0 w-64 sm:w-72"
              >
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess 