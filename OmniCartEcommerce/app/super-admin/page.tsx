"use client"
import { useOrderStore } from "../../stores/order-store"
import { shops } from "../../lib/data/shops"

export default function SuperAdminDashboard() {
  const orders = useOrderStore((s) => s.orders)
  
  const revenueMap = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      acc[item.shopId] = (acc[item.shopId] || 0) + (item.priceAtPurchase * item.quantity)
    })
    return acc
  }, {} as Record<string, number>)
  
  const total = Object.values(revenueMap).reduce((sum, amount) => sum + amount, 0)

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Super Admin Dashboard</h1>

      <section className="mt-6">
        <div className="rounded-xl border p-4 bg-card text-card-foreground">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-3xl font-semibold">${total.toFixed(2)}</div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Revenue by Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shops.map((s) => {
            const amt = revenueMap[s.id] || 0
            return (
              <div key={s.id} className="rounded-xl border p-4">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">Owner: {s.ownerName}</div>
                <div className="mt-3 text-2xl font-semibold">${amt.toFixed(2)}</div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
