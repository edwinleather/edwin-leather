import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { ReviewForm } from "@/components/ReviewForm";
import { SmartImage } from "@/components/SmartImage";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { productInStock } from "@/lib/utils";
import { slugify } from "@/lib/slugs";
import { siteUrl } from "@/lib/site-url";

const SITE = siteUrl();

function truncate(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const description = truncate([product.subtitle, product.description].filter(Boolean).join(". "));
  return {
    title: `${product.name} | ${product.category}`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} | ${product.category}`,
      description,
      url: `${SITE}/product/${product.slug}`,
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

  const inStock = productInStock(product.variants);
  const price = Number(product.price) || 0;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "Offer",
      url: `${SITE}/product/${product.slug}`,
      priceCurrency: "INR",
      price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    }
  };
  if (product.brand) productJsonLd.brand = { "@type": "Brand", name: product.brand };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
      { "@type": "ListItem", position: 3, name: product.category, item: `${SITE}/category/${slugify(product.category)}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${SITE}/product/${product.slug}` }
    ]
  };

  return (
    <div className="product-page">
      <div className="product-detail container-wide">
        <div className="product-gallery">
          <div className="product-gallery__primary">
            <SmartImage
              src={product.images[0]}
              alt={product.imageAlts?.[0] || `${product.name} - ${product.subtitle || "leather"}`}
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
              className="product-gallery__image"
              style={{ viewTransitionName: `product-${product.slug}` }}
            />
            <span className="gallery-count">01 / {Math.min(product.images.length, 2).toString().padStart(2, "0")}</span>
          </div>
          {product.images[1] && (
            <div className="product-gallery__secondary"><SmartImage src={product.images[1]} alt={product.imageAlts?.[1] || `${product.name} detail`} sizes="(max-width: 900px) 100vw, 58vw" className="product-gallery__image" /></div>
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([productJsonLd, breadcrumbJsonLd]) }} />
    </div>
  );
}
