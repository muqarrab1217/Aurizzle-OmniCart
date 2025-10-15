import Hero from "@/components/site/hero"
import ProductCard from "@/components/site/product-card"
import { products } from "@/lib/data/products"

export default function HomePage() {
  return (
    <>
      <Hero />
      <section aria-labelledby="featured" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="featured" className="mb-6 font-serif text-2xl font-semibold">
          Featured products
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products.slice(0, 3).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  )
}
