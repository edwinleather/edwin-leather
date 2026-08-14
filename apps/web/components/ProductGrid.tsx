import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <Reveal key={product.id} delay={(index % 3) * 0.05}>
          <ProductCard product={product} priority={index < 3} />
        </Reveal>
      ))}
    </div>
  );
}
