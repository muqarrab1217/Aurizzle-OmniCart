"use client"

import { notFound, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/stores/cart-store"
import { useOrderStore, getEtaDate } from "@/stores/order-store"
import { useProductsStore } from "@/stores/products-store"
import { useAuthStore } from "@/stores/auth-store"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Star, Truck, Shield, RotateCcw } from "lucide-react"

function AddToCart({ id }: { id: string }) {
  const add = useCartStore((s) => s.add)
  const product = useProductsStore((s) => s.products.find((p) => p.id === id))
  if (!product) return null
  return (
    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full" onClick={() => add(product, 1)}>
      Add to cart
    </Button>
  )
}

function ProductCard({ product }: { product: any }) {
  const router = useRouter()
  
  // Construct proper image URL
  const imageUrl = product.image 
    ? (product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:5000${product.image}`)
    : "/placeholder.svg?height=300&width=300&query=product"
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/productDetails?id=${product.id}`)}>
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h3>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-muted-foreground">{product.rating}</span>
        </div>
        <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
      </CardContent>
    </Card>
  )
}

export default function ProductDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('id')
  
  const product = useProductsStore((s) => s.products.find((p) => p.id === productId))
  const latestOrderId = useOrderStore((s) => s.getLatestOrderIdForProduct(productId || ""))
  const latestOrder = useOrderStore((s) => s.orders.find((o) => o.id === latestOrderId))
  const { user } = useAuthStore()
  const { products } = useProductsStore()

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])

  useEffect(() => {
    if (product) {
      // Get similar products (same shop or similar tags)
      const similar = products
        .filter(p => p.id !== product.id)
        .filter(p => p.shopId === product.shopId || (product.tags && p.tags && product.tags.some(tag => p.tags?.includes(tag))))
        .slice(0, 6)
      
      // If not enough similar products, get random products
      if (similar.length < 4) {
        const random = products
          .filter(p => p.id !== product.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 6 - similar.length)
        setFeaturedProducts([...similar, ...random])
      } else {
        setFeaturedProducts(similar)
      }
    }
  }, [product, products])

  if (!productId || !product) return notFound()

  const hasOrdered = !!latestOrderId
  const eta = latestOrder ? getEtaDate(latestOrder.createdAt, latestOrder.etaBusinessDays) : null

  // Construct proper image URL for main product
  const mainImageUrl = product.image 
    ? (product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:5000${product.image}`)
    : "/placeholder.svg?height=800&width=800&query=product image"

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
        {/* Product Image - 60% width (3/5 columns) */}
        <div className="lg:col-span-3">
          <div className="sticky top-8">
            <div className="rounded-xl border p-2 bg-white">
              <img
                src={mainImageUrl}
                alt={product.title}
                className="w-full rounded-lg object-cover aspect-square"
              />
            </div>
          </div>
        </div>

        {/* Product Details - 40% width (2/5 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-3">{product.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">(4.2k reviews)</span>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="flex gap-1">
                  {product.tags.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">{product.description}</p>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
            {hasOrdered && (
              <Badge className="bg-green-100 text-green-800">
                Previously Ordered
              </Badge>
            )}
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>2-year warranty included</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <span>30-day return policy</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <AddToCart id={product.id} />
            {hasOrdered && latestOrder && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/orders/${latestOrderId}`)}
              >
                Track Latest Order
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/orders")}
            >
              View All Orders
            </Button>
          </div>

          {/* Order Status Card */}
          {hasOrdered && latestOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Order ID:</span>
                    <span className="font-mono text-sm">{latestOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={
                      latestOrder.status === "delivered" ? "bg-green-100 text-green-800" :
                      latestOrder.status === "shipped" ? "bg-blue-100 text-blue-800" :
                      latestOrder.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }>
                      {latestOrder.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Delivery:</span>
                    <span className="text-sm font-medium">
                      {eta ? eta.toDateString() : "Calculating..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Time:</span>
                    <span className="text-sm">4-5 business days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="border-t pt-12">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold mb-2">You might also like</h2>
            <p className="text-muted-foreground">Similar products you might be interested in</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredProducts.map((featuredProduct) => (
              <ProductCard key={featuredProduct.id} product={featuredProduct} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
