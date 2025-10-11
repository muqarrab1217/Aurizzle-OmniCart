"use client"

import { useState, useEffect } from "react"
import { useShopStore } from "@/stores/shop-store"
import { useAuthStore } from "@/stores/auth-store"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Clock, User, Phone, Mail, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

export default function ManageShopsPage() {
  const { shops, loading, fetchShops } = useShopStore()
  const { user } = useAuthStore()
  const [selectedShop, setSelectedShop] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [shopToApprove, setShopToApprove] = useState<string | null>(null)

  useEffect(() => {
    fetchShops()
  }, [fetchShops])

  const openApproveDialog = (shopId: string) => {
    setShopToApprove(shopId)
    setShowApproveDialog(true)
  }

  const handleApprove = async () => {
    if (!shopToApprove) return

    setActionLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const response = await api.updateShopStatus(shopToApprove, "approved")
      if (response.success) {
        setSuccessMessage("Shop approved successfully! Owner is now a manager.")
        setShowApproveDialog(false)
        setShopToApprove(null)
        fetchShops() // Refresh list
      } else {
        setErrorMessage("Failed to approve shop")
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to approve shop")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedShop || !rejectionReason.trim()) {
      setErrorMessage("Please provide a rejection reason")
      return
    }

    setActionLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const response = await api.updateShopStatus(selectedShop._id, "rejected", rejectionReason)
      if (response.success) {
        setSuccessMessage("Shop rejected")
        setShowRejectDialog(false)
        setRejectionReason("")
        setSelectedShop(null)
        fetchShops()
      } else {
        setErrorMessage("Failed to reject shop")
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to reject shop")
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectDialog = (shop: any) => {
    setSelectedShop(shop)
    setShowRejectDialog(true)
    setRejectionReason("")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const pendingShops = shops.filter(s => s.status === "pending")
  const approvedShops = shops.filter(s => s.status === "approved")
  const rejectedShops = shops.filter(s => s.status === "rejected")

  return (
    <ProtectedRoute allowedRoles={["super-admin"]}>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold mb-2">Manage Shops</h1>
          <p className="text-muted-foreground">Review and approve shop registrations</p>
        </div>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Statistics - Row Format */}
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-around divide-x">
                <div className="flex items-center gap-3 px-6">
                  <Clock className="h-8 w-8 text-yellow-600 animate-pulse" />
                  <div>
                    <div className="text-3xl font-bold">{pendingShops.length}</div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-3xl font-bold">{approvedShops.length}</div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-3xl font-bold">{rejectedShops.length}</div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading shops...</p>
          </div>
        ) : (
          <>
            {/* Pending Shops */}
            {pendingShops.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
                  Pending Approval ({pendingShops.length})
                </h2>
                <div className="space-y-3">
                  {pendingShops.map((shop, index) => (
                    <Card 
                      key={shop.id || shop._id}
                      className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-2"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4">
                          {/* Shop Name & Status */}
                          <div className="min-w-[200px]">
                            <h3 className="font-bold text-lg mb-1">{shop.name}</h3>
                            {getStatusBadge(shop.status)}
                          </div>

                          {/* Owner Info */}
                          <div className="flex-1 flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{shop.ownerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{shop.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{shop.phone}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => openApproveDialog(shop._id || shop.id)} 
                              disabled={actionLoading}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => openRejectDialog(shop)} 
                              disabled={actionLoading}
                              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        
                        {/* Address Row */}
                        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{shop.address}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Shops */}
            {approvedShops.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approved Shops ({approvedShops.length})
                </h2>
                <div className="space-y-3">
                  {approvedShops.map((shop, index) => (
                    <Card 
                      key={shop.id || shop._id}
                      className="hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 flex-1">
                            <div className="min-w-[200px]">
                              <h3 className="font-bold text-lg">{shop.name}</h3>
                              <p className="text-sm text-muted-foreground">{shop.ownerName}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{shop.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{shop.phone}</span>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(shop.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Shops */}
            {rejectedShops.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Rejected Shops ({rejectedShops.length})
                </h2>
                <div className="space-y-3">
                  {rejectedShops.map((shop, index) => (
                    <Card 
                      key={shop.id || shop._id}
                      className="hover:shadow-md transition-all duration-300 border-l-4 border-l-red-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-6 flex-1">
                            <div className="min-w-[200px]">
                              <h3 className="font-bold text-lg">{shop.name}</h3>
                              <p className="text-sm text-muted-foreground">{shop.ownerName}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{shop.email}</span>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(shop.status)}
                          </div>
                        </div>
                        {shop.rejectionReason && (
                          <div className="mt-3 pt-3 border-t bg-red-50 -m-6 p-3 rounded-b-lg">
                            <p className="text-sm text-red-700">
                              <strong>Rejection Reason:</strong> {shop.rejectionReason}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {shops.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No shop registrations yet</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Approval Confirmation Modal */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Shop Registration
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this shop? The owner will be upgraded to a manager and will be able to manage products and orders.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <strong>After approval:</strong>
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>Shop owner will become a manager</li>
                    <li>They can add and manage products</li>
                    <li>They can manage orders for their shop</li>
                    <li>Shop status will change to "Approved"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowApproveDialog(false)
                  setShopToApprove(null)
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Shop
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Shop Registration
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {selectedShop?.name}. The owner will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Shop
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </ProtectedRoute>
  )
}

