"use client"

import Link from "next/link"
import { useOrderStore, getEtaDate } from "@/stores/order-store"
import { useAuthStore } from "@/stores/auth-store"
import { useProductsStore } from "@/stores/products-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMemo, useState, useEffect } from "react"
import { Eye, Truck, Package, MapPin, Calendar, DollarSign } from "lucide-react"
import type { Order } from "@/lib/types"

export default function OrdersPage() {
  const orders = useOrderStore((s) => s.orders)
  const { user } = useAuthStore()
  const managerShopId = user?.shopId
  const { products, fetchProducts } = useProductsStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)

  // Fetch products on mount to handle non-populated order items
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Filter orders based on role
  const filteredOrders = useMemo(() => {
    if (!user) return []
    
    if (user.role === "customer") {
      return orders // Customers see all their orders
    } else if (user.role === "manager") {
      // Managers see orders for their shop
      return orders.filter(order => 
        order.items.some(item => item.shopId === managerShopId)
      )
    } else if (user.role === "super-admin") {
      return orders // Super admins see all orders
    }
    return []
  }, [orders, user, managerShopId])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      processing: "bg-yellow-100 text-yellow-800",
      packed: "bg-blue-100 text-blue-800", 
      shipped: "bg-purple-100 text-purple-800",
      "out-for-delivery": "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800"
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status.replace("-", " ").toUpperCase()}
      </Badge>
    )
  }

  const getPageTitle = () => {
    if (!user) return "Orders"
    
    switch (user.role) {
      case "customer":
        return "My Orders"
      case "manager":
        return "Shop Orders"
      case "super-admin":
        return "All Orders"
      default:
        return "Orders"
    }
  }

  const getPageDescription = () => {
    if (!user) return "View order information"
    
    switch (user.role) {
      case "customer":
        return "Track your order status and delivery progress"
      case "manager":
        return "Manage orders for your shop"
      case "super-admin":
        return "View all orders across the platform"
      default:
        return "View order information"
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderModalOpen(true)
  }

  const handleViewTracking = (order: Order) => {
    setSelectedOrder(order)
    setIsTrackingModalOpen(true)
  }

  const getTrackingSteps = (status: string) => {
    const steps = [
      { id: "processing", label: "Processing", description: "Your order is being prepared" },
      { id: "packed", label: "Packed", description: "Items have been packed and ready for shipment" },
      { id: "shipped", label: "Shipped", description: "Your order is on its way" },
      { id: "out-for-delivery", label: "Out for Delivery", description: "Your order is out for delivery" },
      { id: "delivered", label: "Delivered", description: "Your order has been delivered" }
    ]
    
    const currentIndex = steps.findIndex(step => step.id === status)
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-2">{getPageTitle()}</h1>
        <p className="text-muted-foreground">{getPageDescription()}</p>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {user?.role === "customer" ? "No orders yet. Start shopping!" : "No orders found."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
                const eta = getEtaDate(order.createdAt, order.etaBusinessDays)
                
                return (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {order.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{totalItems}</span>
                        <span className="text-sm text-muted-foreground">
                          {totalItems === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTracking(order)}
                          className="h-8 w-8 p-0"
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Order Details - {selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium">{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span>{selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Delivery:</span>
                      <span>{getEtaDate(selectedOrder.createdAt, selectedOrder.etaBusinessDays).toDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => {
                      // Handle both populated product object and product ID string with null checks
                      let productTitle = 'Unknown Product'
                      let productDescription = ''
                      let productImage = ''
                      
                      if (!item.productId) {
                        productTitle = 'Unknown Product'
                      } else if (typeof item.productId === 'string') {
                        const product = products.find(p => p.id === item.productId)
                        productTitle = product?.title || `Product ${item.productId}`
                        productDescription = product?.description || ''
                        productImage = product?.image || ''
                      } else if (typeof item.productId === 'object' && item.productId !== null) {
                        productTitle = item.productId.title || 'Unknown Product'
                        productDescription = item.productId.description || ''
                        productImage = item.productId.image || ''
                      }
                      
                      // Construct proper image URL
                      const imageUrl = productImage 
                        ? (productImage.startsWith('http') 
                            ? productImage 
                            : `http://localhost:5000${productImage}`)
                        : "/placeholder.svg"
                      
                      return (
                        <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img
                            src={imageUrl}
                            alt={productTitle}
                            className="w-16 h-16 rounded-md object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{productTitle}</h4>
                            <p className="text-sm text-muted-foreground">{productDescription}</p>
                            {item.comment && (
                              <p className="text-sm text-blue-600 mt-1">
                                <strong>Note:</strong> {item.comment}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${item.priceAtPurchase.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                            <div className="font-medium">${(item.priceAtPurchase * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Modal */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Order Tracking - {selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Tracking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-medium">{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Status:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Delivery:</span>
                    <span>{getEtaDate(selectedOrder.createdAt, selectedOrder.etaBusinessDays).toDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Time:</span>
                    <span>4-5 business days</span>
                  </div>
                </div>
              </div>

              {/* Tracking Steps */}
              <div className="space-y-4">
                <h4 className="font-medium">Delivery Progress</h4>
                <div className="space-y-3">
                  {getTrackingSteps(selectedOrder.status).map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.completed 
                          ? 'bg-green-100 text-green-800' 
                          : step.current 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          step.completed ? 'text-green-800' : step.current ? 'text-blue-800' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
