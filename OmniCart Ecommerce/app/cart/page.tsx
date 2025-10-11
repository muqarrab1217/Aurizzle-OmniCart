"use client"

import CartItem from "@/components/cart/cart-item"
import { useCartStore } from "@/stores/cart-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  
  // Calculate pricing breakdown
  const taxRate = 0.04 // 4% tax
  const discountRate = 0.02 // 2% season special discount
  const tax = subtotal * taxRate
  const discount = subtotal * discountRate
  const total = subtotal + tax - discount

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl font-bold">Your Cart</h1>
      {items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
          <Link href="/shop">
            <Button variant="outline">Continue shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {items.map((i) => (
              <CartItem key={i.product.id} id={i.product.id} />
            ))}
          </div>
          <aside className="rounded-lg border p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold">Order Summary</h2>
            
            {/* Individual Items Breakdown */}
            <div className="mb-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="truncate">
                    {item.product.title} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {/* Tax */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tax (4%)</span>
                <span className="text-sm">${tax.toFixed(2)}</span>
              </div>
              
              {/* Discount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Season Special Discount (2%)</span>
                <span className="text-sm text-green-600">-${discount.toFixed(2)}</span>
              </div>
              
              {/* Total */}
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
            
            <Link href="/checkout" className="block mt-6">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Proceed to Checkout
              </Button>
            </Link>
          </aside>
        </div>
      )}
    </section>
  )
}
