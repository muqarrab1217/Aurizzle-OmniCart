import type { Shop } from "@/lib/types"

export const shops: Shop[] = [
  { 
    id: "shop-1", 
    name: "Audio Hub", 
    ownerName: "Ava Carter",
    email: "ava@audiohub.com",
    phone: "+1 (555) 123-4567",
    address: "123 Sound Street, Music City, MC 12345",
    createdAt: "2024-01-15T00:00:00Z",
    totalRevenue: 0
  },
  { 
    id: "shop-2", 
    name: "Wearables Co.", 
    ownerName: "Liam Patel",
    email: "liam@wearablesco.com",
    phone: "+1 (555) 234-5678",
    address: "456 Tech Avenue, Innovation District, ID 67890",
    createdAt: "2024-02-20T00:00:00Z",
    totalRevenue: 0
  },
  { 
    id: "shop-3", 
    name: "Adventure Cams", 
    ownerName: "Noah Kim",
    email: "noah@adventurecams.com",
    phone: "+1 (555) 345-6789",
    address: "789 Adventure Lane, Outdoor City, OC 13579",
    createdAt: "2024-03-10T00:00:00Z",
    totalRevenue: 0
  },
]
