"use client"

import { notFound, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/stores/cart-store"
import { useOrderStore, getEtaDate } from "@/stores/order-store"
import { useProductsStore } from "@/stores/products-store"
import { useAuthStore } from "@/stores/auth-store"

function AddToCart({ id }: { id: string }) {
  const add = useCartStore((s) => s.add)
  const product = useProductsStore((s) => s.products.find((p) => p.id === id))
  if (!product) return null
  return (
    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => add(product, 1)}>
      Add to cart
    </Button>
  )
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const product = useProductsStore((s) => s.products.find((p) => p.id === params.id))
  const latestOrderId = useOrderStore((s) => s.getLatestOrderIdForProduct(params.id))
  const latestOrder = useOrderStore((s) => s.orders.find((o) => o.id === latestOrderId))
  const { user } = useAuthStore()

  if (!product) return notFound()

  const hasOrdered = !!latestOrderId
  const eta = latestOrder ? getEtaDate(latestOrder.createdAt, latestOrder.etaBusinessDays) : null

  // Construct proper image URL
  const imageUrl = product.image 
    ? (product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:5000${product.image}`)
    : "/placeholder.svg?height=800&width=800&query=product image"

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Product Image */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border p-2">
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Rating: {product.rating}/5</Badge>
              {product.tags && product.tags.length > 0 && (
                <div className="flex gap-1">
                  {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {hasOrdered && (
              <Badge className="bg-green-100 text-green-800">
                Previously Ordered
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <AddToCart id={product.id} />
            {hasOrdered && latestOrder && (
              <Button
                variant="outline"
                onClick={() => router.push(`/orders/${latestOrderId}`)}
              >
                Track Latest Order
              </Button>
            )}
            <Button
              variant="outline"
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
    </section>
  )
}
