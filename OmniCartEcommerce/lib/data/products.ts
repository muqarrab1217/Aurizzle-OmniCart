import type { Product } from "@/lib/types"

export const products: Product[] = [
  {
    id: "p-101",
    title: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones with 30h battery.",
    price: 129.99,
    image: "/wireless-headphones.png",
    rating: 4.6,
    tags: ["audio", "wireless"],
    shopId: "shop-1",
  },
  {
    id: "p-102",
    title: "Smartwatch Pro",
    description: "Track fitness, sleep, and notifications with style.",
    price: 199.0,
    image: "/smartwatch-wearable-product.jpg",
    rating: 4.4,
    tags: ["wearable", "fitness"],
    shopId: "shop-2",
  },
  {
    id: "p-103",
    title: "Portable Speaker",
    description: "Rich sound in a compact, water-resistant design.",
    price: 79.5,
    image: "/portable-speaker.png",
    rating: 4.5,
    tags: ["audio", "portable"],
    shopId: "shop-1",
  },
  {
    id: "p-104",
    title: "4K Action Cam",
    description: "Capture every adventure in stunning detail.",
    price: 249.0,
    image: "/4k-action-camera-product.jpg",
    rating: 4.2,
    tags: ["camera", "outdoor"],
    shopId: "shop-3",
  },
]
