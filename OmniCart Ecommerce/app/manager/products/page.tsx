"use client"
import { useState, useEffect } from "react"
import { useProductsStore } from "../../../stores/products-store"
import { useAuthStore } from "../../../stores/auth-store"
import type { Product } from "../../../lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog"
import { Badge } from "../../../components/ui/badge"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { toast } from "../../../hooks/use-toast"
import ProductCard from "../../../components/site/product-card"
import api from "../../../lib/api"
import { Loader2, Plus, Package, DollarSign, Star, Tag, Edit, Trash2 } from "lucide-react"

export default function ManagerProductsPage() {
  const { products, createProduct, deleteProduct, updateProduct, fetchProductsByShop, loading } = useProductsStore()
  const { user } = useAuthStore()
  
  // Get shopId from authenticated user
  const managerShopId = typeof user?.shopId === 'object' && user?.shopId !== null 
    ? (user.shopId as any)._id || (user.shopId as any).id 
    : user?.shopId
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Confirmation dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  
  // Fetch products on mount and when shopId changes
  useEffect(() => {
    if (managerShopId && typeof managerShopId === 'string') {
      console.log('Fetching products for shop:', managerShopId)
      fetchProductsByShop(managerShopId)
    }
  }, [managerShopId, fetchProductsByShop])

  const [draft, setDraft] = useState<Omit<Product, "id">>({
    title: "",
    description: "",
    image: "",
    price: 0,
    rating: 0,
    tags: [],
    shopId: managerShopId || "",
  })
  
  // Update draft shopId when managerShopId changes
  useEffect(() => {
    if (managerShopId) {
      setDraft(prev => ({ ...prev, shopId: managerShopId }))
    }
  }, [managerShopId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = async () => {
    if (!imageFile) return

    try {
      setUploadingImage(true)
      const response = await api.uploadProductImage(imageFile)
      
      if (response.success) {
        setDraft((d) => ({ ...d, image: response.data.imagePath }))
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        })
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload image',
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const onAdd = async () => {
    if (!draft.title) {
      toast({
        title: "Validation error",
        description: "Please enter a product title",
        variant: "destructive",
      })
      return
    }
    if (!draft.price || draft.price <= 0) {
      toast({
        title: "Validation error",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }
    if (!draft.image) {
      toast({
        title: "Validation error",
        description: "Please upload a product image",
        variant: "destructive",
      })
      return
    }
    
    try {
      const product = await createProduct({ ...draft, shopId: managerShopId || "" })
      
      if (product) {
        toast({
          title: "Success",
          description: "Product created successfully!",
        })
        
        // Reset form
        setDraft({
          title: "",
          description: "",
          image: "",
          price: 0,
          rating: 0,
          tags: [],
          shopId: managerShopId || "",
        })
        setImageFile(null)
        setImagePreview("")
        
        // Close modal
        setIsModalOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to create product. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete)
      setShowDeleteDialog(false)
      setProductToDelete(null)
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      })
    }
  }

  // Show message if user doesn't have a shop
  if (!managerShopId) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            You don't have a shop assigned yet. Please contact the administrator or create a shop first.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Stats and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Products</h1>
          <p className="text-sm text-muted-foreground">Manage and track your shop's product inventory</p>
          {managerShopId && (
            <p className="text-xs text-muted-foreground mt-1">Shop ID: {managerShopId}</p>
          )}
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new product to your shop
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
          {/* Product Image Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Product Image *</h3>
            <div className="flex items-start gap-4">
              {(imagePreview || draft.image) && (
                <div className="h-32 w-32 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                  <img 
                    src={imagePreview || (draft.image.startsWith('http') ? draft.image : `http://localhost:5000${draft.image}`)} 
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
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    asChild
                  >
                    <label htmlFor="productImage" className="cursor-pointer">
                      Choose Image
                    </label>
                  </Button>
                  {imageFile && (
                    <Button 
                      type="button"
                      onClick={handleUploadImage} 
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Upload Image
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload image (JPG, PNG, GIF, WebP - Max 10MB). The image will be saved to your backend storage.
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
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
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
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
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
                  value={draft.rating}
                  onChange={(e) => setDraft((d) => ({ ...d, rating: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas (e.g., electronics, audio, wireless)"
                value={(draft.tags || []).join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>

          <Button onClick={onAdd} size="lg" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-3xl font-bold mt-1">{products.length}</p>
              </div>
              <Package className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-3xl font-bold mt-1">
                  ${products.length > 0 
                    ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-3xl font-bold mt-1">
                  {products.length > 0 
                    ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1)
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
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading products..." : `View and manage all your products (${products.length})`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your products...</p>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">Get started by adding your first product to your shop</p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ManagerProductCard
              key={product.id}
              product={product}
              onDelete={() => handleDeleteClick(product.id)}
              onUpdate={async (patch) => await updateProduct(product.id, patch)}
            />
          ))}
        </div>
      )}

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
    </main>
  )
}

function ManagerProductCard({
  product,
  onDelete,
  onUpdate,
}: {
  product: Product
  onDelete: () => void
  onUpdate: (patch: Partial<Product>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [edit, setEdit] = useState(product)

  const handleSave = () => {
    onUpdate(edit)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEdit(product)
    setIsEditing(false)
  }

  // Construct proper image URL
  const imageUrl = product.image 
    ? (product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:5000${product.image}`)
    : "/placeholder.svg"

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Product Image */}
      <div className="relative h-48 bg-muted">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
        {!isEditing && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {!isEditing ? (
          <>
            {/* View Mode */}
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

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {product.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{product.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Edit Mode */}
            <div className="space-y-3">
              <Input
                placeholder="Title"
                value={edit.title}
                onChange={(e) => setEdit((d) => ({ ...d, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description"
                value={edit.description}
                onChange={(e) => setEdit((d) => ({ ...d, description: e.target.value }))}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price"
          type="number"
                  step="0.01"
          value={edit.price}
          onChange={(e) => setEdit((d) => ({ ...d, price: Number(e.target.value) }))}
        />
                <Input
                  placeholder="Rating"
          type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={edit.rating}
                  onChange={(e) => setEdit((d) => ({ ...d, rating: Number(e.target.value) }))}
        />
      </div>
              <Input
                placeholder="Tags (comma-separated)"
                value={(edit.tags || []).join(", ")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
      </div>
    </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
