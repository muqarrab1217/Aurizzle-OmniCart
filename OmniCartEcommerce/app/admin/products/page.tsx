"use client"

import { useMemo, useState, useEffect } from "react"
import { useProductsStore } from "@/stores/products-store"
import { useAuthStore } from "@/stores/auth-store"
import { getImageUrl } from "@/lib/utils"
import ProtectedRoute from "@/components/auth/protected-route"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Package, DollarSign, Star, Tag } from "lucide-react"
import type { Product } from "@/lib/types"
import api from "@/lib/api"
import { toast } from "@/hooks/use-toast"

const emptyForm: Omit<Product, "id"> = {
  title: "",
  description: "",
  price: 0,
  image: "",
  rating: 0,
  tags: [],
  shopId: "shop-1",
}

export default function ProductsAdminPage() {
  const { user } = useAuthStore()
  // Extract shopId - handle both string and object cases
  const managerShop = typeof user?.shopId === 'object' && user?.shopId !== null 
    ? (user.shopId as any)._id || (user.shopId as any).id 
    : user?.shopId
  const { products, loading, error, fetchProducts, fetchProductsByShop, createProduct, updateProduct, deleteProduct } = useProductsStore()

  const [form, setForm] = useState<Omit<Product, "id">>({ ...emptyForm, shopId: managerShop || "shop-1" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Confirmation dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  const scopedProducts = useMemo(() => {
    return user?.role === "manager" ? products.filter((p) => p.shopId === managerShop) : products
  }, [products, user?.role, managerShop])

  const canEdit = user?.role === "manager" || user?.role === "super-admin"

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only image files (JPEG, PNG, GIF, WebP) are allowed",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    setErrorMessage("")

    try {
      const response = await api.uploadProductImage(file)
      if (response.success && response.data?.imagePath) {
        const uploadedPath = response.data.imagePath
        setForm({ ...form, image: uploadedPath })
        setImagePreview(getImageUrl(uploadedPath))
        toast({
          title: "Image uploaded",
          description: "The product image has been uploaded successfully.",
        })
      } else {
        setForm({ ...form, image: "" })
        setImagePreview("")
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Upload image error:", error)
      setForm({ ...form, image: "" })
      setImagePreview("")
      toast({
        title: "Upload error",
        description: error.message || "An error occurred while uploading image.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // Fetch products on mount
  useEffect(() => {
    if (user?.role === "manager" && managerShop && typeof managerShop === 'string') {
      fetchProductsByShop(managerShop)
    } else {
      fetchProducts()
    }
  }, [user?.role, managerShop, fetchProducts, fetchProductsByShop])

  const onSubmit = async () => {
    if (!canEdit) return
    
    // Validate required fields
    if (!form.title.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a product title",
        variant: "destructive",
      })
      return
    }
    if (!form.price || form.price <= 0) {
      toast({
        title: "Validation error",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }
    if (!form.image) {
      toast({
        title: "Validation error",
        description: "Please upload a product image",
        variant: "destructive",
      })
      return
    }
    
    setActionLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
    if (editingId) {
        const success = await updateProduct(editingId, form)
        if (success) {
          toast({
            title: "Success",
            description: "Product updated successfully!",
          })
      setEditingId(null)
          setForm({ ...emptyForm, shopId: managerShop || "shop-1" })
          setImagePreview("")
          setIsModalOpen(false)
        } else {
          toast({
            title: "Error",
            description: "Failed to update product. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const product = await createProduct(form)
        if (product) {
          toast({
            title: "Success",
            description: "Product created successfully!",
          })
          setForm({ ...emptyForm, shopId: managerShop || "shop-1" })
          setImagePreview("")
          setIsModalOpen(false)
        } else {
          toast({
            title: "Error",
            description: "Failed to create product. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error('Error in onSubmit:', error)
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    
    setActionLoading(true)
    setSuccessMessage("")
    setErrorMessage("")
    setShowDeleteDialog(false)

    try {
      const success = await deleteProduct(productToDelete)
      if (success) {
        setSuccessMessage("Product deleted successfully!")
        toast({
          title: "Product deleted",
          description: "The product has been successfully deleted.",
        })
    } else {
        setErrorMessage("Failed to delete product. Please try again.")
        toast({
          title: "Delete failed",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setProductToDelete(null)
    }
  }

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      title: p.title,
      description: p.description,
      price: p.price,
      image: p.image,
      rating: p.rating,
      tags: p.tags || [],
      shopId: p.shopId,
    })
    setImagePreview("")
    setIsModalOpen(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ ...emptyForm, shopId: managerShop || "shop-1" })
    setImagePreview("")
    setIsModalOpen(false)
  }

  return (
    <ProtectedRoute allowedRoles={["manager", "super-admin"]}>
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {(errorMessage || error) && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{errorMessage || error}</AlertDescription>
          </Alert>
        )}

        {/* Header with Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Products</h1>
            <p className="text-sm text-muted-foreground">
            {user?.role === "manager" ? "Manage your shop's products" : "Manage all products across the platform"}
          </p>
        </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Update Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update product details below" : "Fill in the details to add a new product"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
            {/* Product Image Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Product Image *</h3>
              <div className="flex items-start gap-4">
                {(imagePreview || form.image) && (
                  <div className="h-32 w-32 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                    <img 
                      src={imagePreview || (form.image.startsWith('http') ? form.image : getImageUrl(form.image))} 
                      alt="Product preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    id="productImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      asChild
                      disabled={uploadingImage || actionLoading}
                    >
                      <label htmlFor="productImage" className="cursor-pointer flex items-center gap-2">
                        {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploadingImage ? "Uploading..." : "Choose Image"}
                      </label>
                    </Button>
                    {!uploadingImage && form.image ? (
                      <span className="text-xs text-green-600">Image uploaded</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select a JPG, PNG, GIF, or WebP image up to 10MB. The image uploads automatically once selected.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Product Information</h3>
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
            <Input
                  id="title"
                  placeholder="Enter product title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  disabled={actionLoading}
                />
              </div>
            </div>

            {/* Pricing & Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Pricing & Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
            <Input
                    id="price"
                    placeholder="0.00"
              type="number"
                    step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number.parseFloat(e.target.value || "0") })}
                    disabled={actionLoading}
            />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
            <Input
                    id="rating"
                    placeholder="0.0"
              type="number"
                    step="0.1"
                    min="0"
                    max="5"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number.parseFloat(e.target.value || "0") })}
                    disabled={actionLoading}
            />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
            <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g., electronics, audio, wireless)"
              value={(form.tags || []).join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
                  disabled={actionLoading}
                />
              </div>
            </div>

            {user?.role === "super-admin" && (
              <div className="space-y-2">
                <Label htmlFor="shopId">Shop ID</Label>
              <Input
                  id="shopId"
                placeholder="Shop ID"
                value={form.shopId}
                onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                  disabled={actionLoading}
              />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={onSubmit} disabled={actionLoading || loading} size="lg" className="flex-1 gap-2">
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingId ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {editingId ? "Update Product" : "Add Product"}
                  </>
                )}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={actionLoading}
                  size="lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-bold mt-1">{scopedProducts.length}</p>
                </div>
                <Package className="h-10 w-10 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Price</p>
                  <p className="text-3xl font-bold mt-1">
                    ${scopedProducts.length > 0 
                      ? (scopedProducts.reduce((sum, p) => sum + p.price, 0) / scopedProducts.length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-3xl font-bold mt-1">
                    {scopedProducts.length > 0 
                      ? (scopedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / scopedProducts.length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
                <Star className="h-10 w-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Product Inventory</h2>
          <p className="text-sm text-muted-foreground">View and manage all products</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : scopedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">Get started by adding your first product</p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scopedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => startEdit(p)}
                onDelete={() => handleDeleteClick(p.id)}
                canEdit={canEdit}
              />
            ))}
        </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  canEdit,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
  canEdit: boolean
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 bg-muted">
        <img
          src={product.image.startsWith('http') ? product.image : getImageUrl(product.image)}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              ✏️
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              🗑️
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xl font-bold text-green-600">${product.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{product.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            ID: {product.id.slice(0, 8)}...
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
