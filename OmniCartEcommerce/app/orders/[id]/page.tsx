"use client"

import { useParams, useRouter } from "next/navigation"
import { useOrderStore, getEtaDate } from "@/stores/order-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OrderDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id))

  if (!order) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border p-6">
          <p className="mb-4 font-medium">Order not found.</p>
          <Button variant="outline" onClick={() => router.push("/orders")}>
            Back to orders
          </Button>
        </div>
      </section>
    )
  }

  const eta = getEtaDate(order.createdAt, order.etaBusinessDays)

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-serif text-3xl font-bold">Order {order.id}</h1>
      <p className="mb-6 text-muted-foreground">Estimated delivery: {eta.toDateString()} (4–5 business days)</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tracking Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {order.steps.map((s, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.timestamp).toLocaleString()}</div>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <div className="flex-1">
                <div className="font-medium">Delivered</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="mb-2">Items: {order.items.reduce((s, it) => s + it.quantity, 0)}</div>
          <div>Subtotal: ${order.subtotal.toFixed(2)}</div>
        </CardContent>
      </Card>
    </section>
  )
}
