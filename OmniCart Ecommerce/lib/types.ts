export type Product = {
  id: string
  title: string
  description: string
  price: number
  image: string
  rating: number
  tags?: string[]
  shopId: string // which shop owns/sells this product
}

export type CartLine = {
  product: Product
  quantity: number
  comment?: string
}

export type Role = "customer" | "manager" | "super-admin"

export type Shop = {
  id: string
  _id?: string
  name: string
  ownerName: string
  email: string
  phone: string
  address: string
  createdAt: string
  totalRevenue: number
  status: "pending" | "approved" | "rejected"
  ownerId?: string
  approvedAt?: string
  rejectionReason?: string
}

export type TrackingStep = {
  label: string
  timestamp: string
}

export type OrderItem = {
  productId: string | Product // Can be string (ID) or populated Product object
  quantity: number
  priceAtPurchase: number
  shopId: string | Shop // Can be string (ID) or populated Shop object
  comment?: string
}

export type Order = {
  id: string
  createdAt: string
  items: OrderItem[]
  subtotal: number
  status: "processing" | "packed" | "shipped" | "out-for-delivery" | "delivered"
  steps: TrackingStep[]
  etaBusinessDays: number
}
