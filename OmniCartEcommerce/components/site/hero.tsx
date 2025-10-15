import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2">
        <div className="space-y-4">
          <h1 className="font-serif text-balance text-4xl font-bold md:text-5xl">Shop smarter with OmniCart</h1>
          <p className="text-pretty text-muted-foreground">
            Discover curated products at great prices. Built with performance, accessibility, and delightful design.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/shop">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Start shopping</Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline">View cart</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <img
            src="/ecommerce-hero-image-modern-products.jpg"
            alt="Selection of modern electronics"
            className="w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </section>
  )
}
