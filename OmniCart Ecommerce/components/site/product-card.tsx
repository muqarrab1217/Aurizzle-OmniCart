"use client"

import type { Product } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"
import { useRouter } from "next/navigation"

export default function ProductCard({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add)
  const router = useRouter()

  const handleProductClick = () => {
    router.push(`/productDetails?id=${product.id}`)
  }

  // Construct proper image URL
  const imageUrl = product.image 
    ? (product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:5000${product.image}`)
    : "/placeholder.svg"

  return (
    <Card className="h-full overflow-hidden rounded-xl shadow-md cursor-pointer" onClick={handleProductClick}>
      <CardContent className="grid gap-4">
        <img
          src={imageUrl}
          alt={product.title}
          className="aspect-square w-full rounded-md object-cover"
        />
        <CardHeader>
          <CardTitle className="text-pretty p-null">{product.title}</CardTitle>
        </CardHeader>
        <p className="text-sm text-muted-foreground">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">${product.price.toFixed(2)}</span>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90" 
            onClick={(e) => {
              e.stopPropagation()
              add(product, 1)
            }}
          >
            Add to cart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
