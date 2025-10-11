"use client"

import ProductCard from "@/components/site/product-card"
import { useProductsStore } from "@/stores/products-store"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type SortOption = "price-low" | "price-high" | "date-old" | "date-new"
type CategoryFilter = "all" | "electronics" | "audio" | "wearables" | "cameras"

export default function ShopPage() {
  const { products, loading, fetchProducts } = useProductsStore()
  const [sortBy, setSortBy] = useState<SortOption>("date-new")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [bannerPosition, setBannerPosition] = useState(0)

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Extract unique categories from products
  const categories = useMemo(() => {
    const allTags = products.flatMap(p => p.tags || [])
    const uniqueTags = Array.from(new Set(allTags))
    return uniqueTags.slice(0, 4) // Limit to 4 categories for clean UI
  }, [products])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = products.filter(product => 
        product.tags?.includes(categoryFilter) || 
        product.title.toLowerCase().includes(categoryFilter.toLowerCase())
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "date-old":
          return new Date(a.id).getTime() - new Date(b.id).getTime()
        case "date-new":
        default:
          return new Date(b.id).getTime() - new Date(a.id).getTime()
      }
    })

    return sorted
  }, [products, categoryFilter, sortBy])

  // Featured products (random selection of products not in main filtered list)
  const featuredProducts = useMemo(() => {
    const featuredIds = filteredAndSortedProducts.slice(0, 3).map(p => p.id)
    return products
      .filter(p => !featuredIds.includes(p.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)
  }, [products, filteredAndSortedProducts])

  // Banner animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerPosition(prev => (prev - 1) % -100)
    }, 30)

    return () => clearInterval(interval)
  }, [])

  // Show loading state
  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">

      {/* Sliding Banner */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white/70 dark:bg-gray-900/70 border">
        <div 
          className="flex whitespace-nowrap text-2xl font-bold text-primary py-4"
          style={{ transform: `translateX(${bannerPosition}%)` }}
        >
          <span className="px-8">New Arrivals Collection</span>
          <span className="px-8">.</span>
          <span className="px-8">Winter Collection</span>
          <span className="px-8">.</span>
          <span className="px-8">New Arrivals Collection</span>
          <span className="px-8">.</span>
          <span className="px-8">Winter Collection</span>
          <span className="px-8">.</span>
          <span className="px-8">New Arrivals Collection</span>
          <span className="px-8">.</span>
          <span className="px-8">Winter Collection</span>
          <span className="px-8">.</span>
          
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
          >
            All Products
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category as CategoryFilter)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-new">Newest First</SelectItem>
              <SelectItem value="date-old">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedProducts.length} of {products.length} products
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="ml-2">
              {categoryFilter}
            </Badge>
          )}
        </p>
      </div>

      {/* Main Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 mb-12">
        {filteredAndSortedProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="border-t pt-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold mb-2">Featured Products</h2>
            <p className="text-muted-foreground">Discover these amazing products</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredAndSortedProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or browse all products
            </p>
            <Button onClick={() => setCategoryFilter("all")}>
              Show All Products
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
