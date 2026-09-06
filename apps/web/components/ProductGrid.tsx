import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { ProductListTracker } from "./ProductListTracker";
import { Reveal } from "./Reveal";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      <ProductListTracker products={products} listId="product-grid" listName="Product grid" />
      {products.map((product, index) => (
        index < 6 ? (
          <ProductCard key={product.id} product={product} priority={index < 3} />
        ) : (
          <Reveal key={product.id} delay={((index - 6) % 3) * 0.05}>
            <ProductCard product={product} priority={false} />
          </Reveal>
        )
      ))}
    </div>
  );
}
