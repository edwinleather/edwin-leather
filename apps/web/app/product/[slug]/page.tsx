import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductViewTracker } from "@/components/ProductViewTracker";
import { Reveal } from "@/components/Reveal";
import { ReviewForm } from "@/components/ReviewForm";
import { getCatalog, getProductBySlug, getCategoryByName } from "@/lib/catalog";
import { SpecTable } from "@/components/attributes/SpecTable";
import { productInStock } from "@/lib/utils";
import { slugify } from "@/lib/slugs";
import { siteUrl } from "@/lib/site-url";
import type { Product } from "@/lib/types";

const SITE = siteUrl();

function truncate(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function join(values: string[] | undefined): string {
  return (values ?? []).filter(Boolean).join(", ");
}

function productSpecs(product: Product): { key: string; label: string; value: string | string[] }[] {
  const rows: { key: string; label: string; value: string | string[] }[] = [];
  const seen = new Set<string>();

  // Primary: dynamic attributes from category schema
  for (const a of product.attributes ?? []) {
    if (!a.key) continue;
    seen.add(a.key);
    const val = Array.isArray(a.value) ? a.value.filter(Boolean) : a.value;
    if (Array.isArray(val) ? val.length > 0 : Boolean(val)) {
      rows.push({ key: a.key, label: a.label || a.key, value: val });
    }
  }

  // Fallback: legacy hardcoded fields not already in attributes[]
  const legacy: [string, string, string | string[]][] = [
    ["articleNumber", "Article Number", join(product.articleNumber)],
    ["styleCode", "Style Code", product.styleCode ?? ""],
    ["brandColor", "Brand Colour", product.brandColor ?? ""],
    ["brandSize", "Brand Size", product.brandSize ?? ""],
    ["ukIndiaSize", "UK/India Size", product.ukIndiaSize ?? ""],
    ["euroSize", "Euro Size", product.euroSize ?? ""],
    ["womenSandalType", "Women Sandal Type", product.womenSandalType ?? ""],
    ["color", "Colour", join(product.color)],
    ["typeForFlats", "Type for Flats", product.typeForFlats ?? ""],
    ["typeForHeels", "Type for Heels", product.typeForHeels ?? ""],
    ["occasion", "Occasion", join(product.occasion)],
    ["outerMaterial", "Outer Material", join(product.outerMaterial)],
    ["heelHeight", "Heel Height", product.heelHeight ?? ""],
    ["idealFor", "Ideal For", product.idealFor ?? ""],
    ["ornamentationType", "Ornamentation Type", product.ornamentationType ?? ""],
    ["insoleMaterial", "Insole Material", join(product.insoleMaterial)],
    ["packOf", "Pack of", product.packOf ?? ""],
    ["closure", "Closure", join(product.closure)],
    ["heelPattern", "Heel Pattern", product.heelPattern ?? ""],
    ["soleMaterial", "Sole Material", join(product.soleMaterial)],
    ["innerMaterial", "Inner Material", join(product.innerMaterial)],
    ["upperPattern", "Upper Pattern", product.upperPattern ?? ""],
    ["careInstructions", "Care Instructions", join(product.careInstructions)],
    ["removableInsole", "Removable Insole", product.removableInsole ?? ""],
    ["eanUpc", "EAN/UPC", join(product.eanUpc)],
    ["cushioningLevel", "Cushioning Level", product.cushioningLevel ?? ""],
    ["includedInBox", "Included in Box", join(product.includedInBox)],
  ];
  for (const [key, label, value] of legacy) {
    if (seen.has(key)) continue;
    if (Array.isArray(value) ? value.length > 0 : Boolean(value)) {
      rows.push({ key, label, value });
    }
  }

  return rows;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const description = truncate(product.seoDescription || [product.subtitle, product.description].filter(Boolean).join(". "));
  return {
    title: product.seoTitle || `${product.name} | ${product.category}`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.seoTitle || `${product.name} | ${product.category}`,
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
  const specs = productSpecs(product);

  // Which of the product's attributes are customer-visible, per the category schema.
  const category = await getCategoryByName(product.category);
  const attrRefs: Record<string, { customerVisible: boolean }> = {};
  for (const a of category?.attributes ?? []) {
    const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
    if (def?.key) attrRefs[def.key] = { customerVisible: a.customerVisible !== false };
  }

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
      price: product.variants.length > 0 ? Math.min(...product.variants.map(v => v.price || Infinity)) : price,
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
      <ProductViewTracker productId={product.id} />
      <div className="product-detail container-wide">
        <div className="product-gallery">
          <ProductGallery product={product} />
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

      {(product.returnReplacement || product.cashDelivery || product.customerSupport) && (
        <div className="product-services container-wide">
          {product.returnReplacement && <span className="product-services__item">{product.returnReplacement === "Yes" ? "10-day return/replacement" : product.returnReplacement}</span>}
          {product.cashDelivery && <span className="product-services__item">{product.cashDelivery}</span>}
          {product.customerSupport && <span className="product-services__item">Customer support · {product.customerSupport}</span>}
        </div>
      )}

      {specs.length > 0 && (
        <section className="product-specs container-wide">
          <SpecTable attributes={specs} refs={attrRefs} />
        </section>
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
