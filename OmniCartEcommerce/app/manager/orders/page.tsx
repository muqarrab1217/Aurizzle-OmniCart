"use client"

import { useMemo, useState, useEffect } from "react"
import { useOrderStore } from "@/stores/order-store"
import { useAuthStore } from "@/stores/auth-store"
import { useProductsStore } from "@/stores/products-store"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, DollarSign, Clock, TrendingUp, Eye, Loader2, CheckCircle, XCircle } from "lucide-react"
import api from "@/lib/api"

const statusOptions = [
  { value: "processing", label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  { value: "packed", label: "Packed", color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
  { value: "out-for-delivery", label: "Out for Delivery", color: "bg-orange-100 text-orange-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
]

export default function ManagerOrdersPage() {
  const { user } = useAuthStore()
  
  // Get shopId from authenticated user
  const managerShopId = typeof user?.shopId === 'object' && user?.shopId !== null 
    ? (user.shopId as any)._id || (user.shopId as any).id 
    : user?.shopId
    
  const { orders, updateOrderStatus, fetchOrders } = useOrderStore()
  const { products, fetchProducts } = useProductsStore()
  
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Fetch orders and products on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchOrders(), fetchProducts()])
      setLoading(false)
    }
    loadData()
  }, [fetchOrders, fetchProducts])

  // Filter orders for this manager's shop
  const shopOrders = useMemo(() => {
    return orders.filter(order => 
      order.items.some(item => {
        const itemShopId = typeof item.shopId === 'object' && item.shopId !== null
          ? (item.shopId as any)._id || (item.shopId as any).id
          : item.shopId
        return itemShopId === managerShopId
      })
    )
  }, [orders, managerShopId])

  // Filter by status
  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") return shopOrders
    return shopOrders.filter(order => order.status === selectedStatus)
  }, [shopOrders, selectedStatus])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = shopOrders.reduce((sum, order) => {
      const shopItems = order.items.filter(item => {
        const itemShopId = typeof item.shopId === 'object' && item.shopId !== null
          ? (item.shopId as any)._id || (item.shopId as any).id
          : item.shopId
        return itemShopId === managerShopId
      })
      return sum + shopItems.reduce((itemSum, item) => itemSum + (item.priceAtPurchase * item.quantity), 0)
    }, 0)
    
    const pending = shopOrders.filter(o => o.status === 'processing').length
    const delivered = shopOrders.filter(o => o.status === 'delivered').length
    
    return {
      totalRevenue: total,
      totalOrders: shopOrders.length,
      pendingOrders: pending,
      deliveredOrders: delivered,
    }
  }, [shopOrders, managerShopId])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    setErrorMessage("")
    setSuccessMessage("")
    
    try {
      // Call API to update status
      const response = await api.request(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.success) {
        updateOrderStatus(orderId, newStatus as any)
        setSuccessMessage(`Order status updated to ${newStatus}`)
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrorMessage("Failed to update order status")
      }
    } catch (error: any) {
      console.error('Update status error:', error)
      setErrorMessage(error.message || "Failed to update order status")
    } finally {
      setUpdating(null)
    }
  }
  
  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return (
      <Badge className={statusOption?.color || "bg-gray-100 text-gray-800"}>
        {statusOption?.label || status}
      </Badge>
    )
  }

  if (!managerShopId) {
    return (
      <ProtectedRoute allowedRoles={["manager", "super-admin"]}>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              You don't have a shop assigned yet. Please contact the administrator.
            </AlertDescription>
          </Alert>
        </main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["manager", "super-admin"]}>
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-sm text-muted-foreground">Manage orders and track delivery status for your shop</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1">{stats.pendingOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold mt-1">{stats.deliveredOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders ({shopOrders.length})</SelectItem>
              {statusOptions.map(status => {
                const count = shopOrders.filter(o => o.status === status.value).length
                return (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label} ({count})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {shopOrders.length} orders
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {selectedStatus === "all" 
                  ? "You haven't received any orders yet."
                  : `No orders with status "${statusOptions.find(s => s.value === selectedStatus)?.label}"`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => {
              const shopItems = order.items.filter(item => {
                const itemShopId = typeof item.shopId === 'object' && item.shopId !== null
                  ? (item.shopId as any)._id || (item.shopId as any).id
                  : item.shopId
                return itemShopId === managerShopId
              })
              const orderTotal = shopItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0)
              
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Items</p>
                            <p className="font-medium">{shopItems.length} item(s)</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-semibold text-lg text-green-600">${orderTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">ETA</p>
                            <p className="font-medium">{order.etaBusinessDays} business days</p>
                          </div>
                        </div>

                        {/* Products List */}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Products:</p>
                          <div className="space-y-1">
                            {shopItems.map((item, idx) => {
                              // Handle both populated product object and product ID string
                              let productTitle = 'Unknown Product'
                              
                              if (!item.productId) {
                                productTitle = 'Unknown Product'
                              } else if (typeof item.productId === 'string') {
                                productTitle = products.find(p => p.id === item.productId)?.title || 'Unknown Product'
                              } else if (typeof item.productId === 'object' && item.productId !== null) {
                                productTitle = item.productId.title || 'Unknown Product'
                              }
                              
                              return (
                                <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                                  <span>• {productTitle} × {item.quantity}</span>
                                  <span>${(item.priceAtPurchase * item.quantity).toFixed(2)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 md:w-48">
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleStatusUpdate(order.id, value)}
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className="w-full">
                            {updating === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => viewOrderDetails(order)}
                          className="w-full gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Order Details Modal */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Complete information for Order #{selectedOrder?.id.slice(0, 8)}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6 py-4">
                {/* Order Status */}
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {/* Order Information */}
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order ID</p>
                      <p className="font-mono">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order Date</p>
                      <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ETA</p>
                      <p>{selectedOrder.etaBusinessDays} business days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p>{selectedOrder.paymentMethod || 'Card'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {selectedOrder.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedOrder.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.phone}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-sm">{selectedOrder.address}</p>
                </div>

                {/* Products */}
                <div>
                  <h3 className="font-semibold mb-2">Products</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.filter((item: any) => {
                      const itemShopId = typeof item.shopId === 'object' && item.shopId !== null
                        ? (item.shopId as any)._id || (item.shopId as any).id
                        : item.shopId
                      return itemShopId === managerShopId
                    }).map((item: any, idx: number) => {
                      // Handle both populated product object and product ID string with null checks
                      let productTitle = 'Unknown Product'
                      
                      if (!item.productId) {
                        productTitle = 'Unknown Product'
                      } else if (typeof item.productId === 'string') {
                        productTitle = products.find(p => p.id === item.productId)?.title || 'Unknown Product'
                      } else if (typeof item.productId === 'object' && item.productId !== null) {
                        productTitle = item.productId.title || 'Unknown Product'
                      }
                      
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{productTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.priceAtPurchase} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedOrder.items
                        .filter((item: any) => {
                          const itemShopId = typeof item.shopId === 'object' && item.shopId !== null
                            ? (item.shopId as any)._id || (item.shopId as any).id
                            : item.shopId
                          return itemShopId === managerShopId
                        })
                        .reduce((sum: number, item: any) => sum + (item.priceAtPurchase * item.quantity), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </ProtectedRoute>
  )
}
