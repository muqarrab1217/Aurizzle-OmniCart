"use client"

import { useCartStore } from "@/stores/cart-store"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function CartItem({ id }: { id: string }) {
  const line = useCartStore((s) => s.items.find((i) => i.product.id === id))
  const update = useCartStore((s) => s.update)
  const remove = useCartStore((s) => s.remove)
  const [comment, setComment] = useState(line?.comment || "")

  if (!line) return null

  const handleCommentChange = (value: string) => {
    setComment(value)
    update(line.product.id, line.quantity, value)
  }

  // Construct proper image URL
  const imageUrl = line.product.image 
    ? (line.product.image.startsWith('http') 
        ? line.product.image 
        : `http://localhost:5000${line.product.image}`)
    : "/placeholder.svg"

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-4">
        <img
          src={imageUrl}
          alt={line.product.title}
          className="h-20 w-20 rounded-md object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="flex-1">
          <p className="font-medium">{line.product.title}</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>${line.product.price.toFixed(2)} each</p>
            <p className="font-medium text-foreground">
              Total: ${(line.product.price * line.quantity).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Decrease quantity"
            onClick={() => update(line.product.id, line.quantity - 1, comment)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{line.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Increase quantity"
            onClick={() => update(line.product.id, line.quantity + 1, comment)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" aria-label="Remove item" onClick={() => remove(line.product.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="space-y-2">
        <label htmlFor={`comment-${id}`} className="text-sm font-medium pb-1 text-muted-foreground">
          Special Instructions (Optional)
        </label>
        <Input
          id={`comment-${id}`}
          placeholder="Add any special instructions for this item..."
          value={comment}
          onChange={(e) => handleCommentChange(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  )
}
