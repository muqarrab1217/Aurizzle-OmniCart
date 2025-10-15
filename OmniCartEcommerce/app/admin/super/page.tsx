"use client"

import { useState, useEffect } from "react"
import { useShopStore } from "@/stores/shop-store"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Users, ShoppingCart, Package, DollarSign, Store, TrendingUp, Calendar, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api from "@/lib/api"

export default function SuperAdminDashboard() {
  const { shops, fetchShops } = useShopStore()
  const [analytics, setAnalytics] = useState<any>(null)
  const [userRegistrations, setUserRegistrations] = useState<any[]>([])
  const [shopRegistrations, setShopRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState<any>(null)
  const [shopDetails, setShopDetails] = useState<any>(null)
  const [showShopModal, setShowShopModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [analyticsRes, userRegsRes, shopRegsRes] = await Promise.all([
          api.getPlatformAnalytics(),
          api.getDailyUserRegistrations(30),
          api.getDailyShopRegistrations(30),
        ])

        if (analyticsRes.success) setAnalytics(analyticsRes.data)
        if (userRegsRes.success) setUserRegistrations(userRegsRes.data as any[])
        if (shopRegsRes.success) setShopRegistrations(shopRegsRes.data as any[])
        
        await fetchShops()
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchShops])

  const handleViewShop = async (shop: any) => {
    try {
      setSelectedShop(shop)
      const response = await api.getShopAnalytics(shop._id || shop.id)
      if (response.success) {
        setShopDetails(response.data)
        setShowShopModal(true)
      }
    } catch (error) {
      console.error("Failed to fetch shop details:", error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super-admin"]}>
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </section>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super-admin"]}>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold mb-2">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete overview of all shops and platform performance</p>
        </div>

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 pl-4">
            <CardHeader>
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{analytics?.users?.total || 0}</div>
              <p className="text-xs text-blue-600 mt-1">
                {analytics?.users?.totalCustomers || 0} Customers, {analytics?.users?.totalManagers || 0} Managers
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">${analytics?.orders?.totalRevenue?.toFixed(2) || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                Avg: ${analytics?.orders?.avgOrderValue?.toFixed(2) || 0} per order
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{analytics?.orders?.total || 0}</div>
              <p className="text-xs text-purple-600 mt-1">All orders placed</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader>
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <Package className="h-5 w-5" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">{analytics?.products?.total || 0}</div>
              <p className="text-xs text-orange-600 mt-1">Across all shops</p>
            </CardContent>
          </Card>
        </div>

        {/* Shops Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="flex flex-row items-center justify-between px-4">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                {/* <Store className="h-10 w-10" /> */}
                Total Shops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.shops?.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center justify-between px-4">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{analytics?.shops?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center justify-between px-4">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-black">Approved Shops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{analytics?.shops?.approved || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Registrations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Registrations (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userRegistrations.slice(-10).map((day, index) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground w-24">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center px-2 text-xs text-white font-medium transition-all duration-500"
                        style={{ width: `${Math.min(100, (day.count / Math.max(...userRegistrations.map(d => d.count))) * 100)}%` }}
                      >
                        {day.count > 0 && day.count}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-16 text-right">
                      {day.count} users
                    </div>
                  </div>
                ))}
                {userRegistrations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No user registrations yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shop Registrations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Shop Registrations (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shopRegistrations.slice(-10).map((day, index) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground w-24">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-full flex items-center px-2 text-xs text-white font-medium transition-all duration-500"
                        style={{ width: `${Math.min(100, (day.count / Math.max(...shopRegistrations.map(d => d.count))) * 100)}%` }}
                      >
                        {day.count > 0 && day.count}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-16 text-right">
                      {day.count} shops
                    </div>
                  </div>
                ))}
                {shopRegistrations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No shop registrations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3">Shop Name</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop) => {
                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case "pending":
                          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        case "approved":
                          return <Badge className="bg-green-100 text-green-800">Approved</Badge>
                        case "rejected":
                          return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                        default:
                          return <Badge>Active</Badge>
                      }
                    }
                    
                    return (
                      <tr key={shop.id || shop._id} className="border-t hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{shop.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{shop.ownerName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-muted-foreground">{shop.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{shop.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(shop.status || "approved")}
                        </td>
                        <td className="px-4 py-3 font-medium text-green-600">
                          ${shop.totalRevenue?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewShop(shop)}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Shop Details Modal */}
        <Dialog open={showShopModal} onOpenChange={setShowShopModal}>
          <DialogContent className="min-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{shopDetails?.shop?.name} - Analytics</DialogTitle>
            </DialogHeader>
            {shopDetails && (
              <div className="space-y-6">
                {/* Shop Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{shopDetails.shop.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{shopDetails.shop.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{shopDetails.shop.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={shopDetails.shop.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {shopDetails.shop.status}
                    </Badge>
                  </div>
                </div>

                {/* Owner Profile */}
                {shopDetails.owner && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Owner Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span> {shopDetails.owner.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span> {shopDetails.owner.email}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {shopDetails.owner.phone || 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">CNIC:</span> {shopDetails.owner.cnic || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue & Performance */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-2">
                      <div className="text-2xl font-bold text-green-700">${shopDetails.revenue?.total?.toFixed(2) || 0}</div>
                      <p className="text-xs text-green-600">Total Revenue</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-2">
                      <div className="text-2xl font-bold text-blue-700">{shopDetails.orders?.total || 0}</div>
                      <p className="text-xs text-blue-600">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-2">
                      <div className="text-2xl font-bold text-purple-700">{shopDetails.products?.total || 0}</div>
                      <p className="text-xs text-purple-600">Products</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-2">
                      <div className="text-2xl font-bold text-orange-700">${shopDetails.revenue?.avgOrderValue?.toFixed(2) || 0}</div>
                      <p className="text-xs text-orange-600">Avg Order</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </ProtectedRoute>
  )
}
