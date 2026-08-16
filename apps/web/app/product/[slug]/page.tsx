import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { ReviewForm } from "@/components/ReviewForm";
import { SmartImage } from "@/components/SmartImage";
import { getCatalog, getProductBySlug } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const catalog = await getCatalog();
  const sameCategory = catalog.filter((item) => item.id !== product.id && item.category === product.category);
  const related = (sameCategory.length > 0 ? sameCategory : catalog.filter((item) => item.id !== product.id && item.collection === product.collection)).slice(0, 4);

  return (
    <div className="product-page">
      <div className="product-detail container-wide">
        <div className="product-gallery">
          <div className="product-gallery__primary">
            <SmartImage
              src={product.images[0]}
              alt={product.name}
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
              className="product-gallery__image"
              style={{ viewTransitionName: `product-${product.slug}` }}
            />
            <span className="gallery-count">01 / {Math.min(product.images.length, 2).toString().padStart(2, "0")}</span>
          </div>
          {product.images[1] && (
            <div className="product-gallery__secondary"><SmartImage src={product.images[1]} alt={`${product.name} detail`} sizes="(max-width: 900px) 100vw, 58vw" className="product-gallery__image" /></div>
          )}
        </div>
        <ProductPurchasePanel product={product} />
      </div>

      {(product.brand || product.deliveryBy || product.hsn) && (
        <div className="product-meta container-wide">
          {product.brand && <span><strong>Brand</strong> {product.brand}</span>}
          {product.deliveryBy && <span><strong>Delivery</strong> {product.deliveryBy}</span>}
          {product.hsn && <span><strong>HSN</strong> {product.hsn}{product.gst ? ` · GST ${product.gst}%` : ""}</span>}
        </div>
      )}

      <section className="product-editorial container">
        <Reveal><span className="eyebrow">Built into the object</span><h2>Character is the finish.</h2></Reveal>
        <Reveal delay={0.08}><p>Small tonal shifts, crease lines, and the marks that arrive through use are the point. Your piece should become recognizably yours instead of staying frozen in showroom condition.</p></Reveal>
      </section>

      <ReviewForm product={{ id: product.id, name: product.name }} />

      {related.length > 0 && (
        <section className="section container">
          <div className="section-heading"><div><span className="eyebrow">Keep looking</span><h2>More {product.category}.</h2></div></div>
          <div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div>
        </section>
      )}
    </div>
  );
}
