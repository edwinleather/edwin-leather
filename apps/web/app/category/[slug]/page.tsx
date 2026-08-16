import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { getCatalog, getCategoryBySlug, getCategoryList } from "@/lib/catalog";
import { siteUrl } from "@/lib/site-url";

const SITE = siteUrl();

// Server-rendered category landing pages generated from the live catalog.
// Each category gets a unique URL, H1, meta description, canonical, and
// BreadcrumbList/ItemList structured data - with no thin or fabricated copy:
// everything shown is the category name/description from the database.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      type: "website",
      title: `${category.name} - Edwin Leathers`,
      description: category.description,
      url: `${SITE}/category/${category.slug}`,
      images: category.imageUrl ? [{ url: category.imageUrl }] : undefined
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, catalog, categories] = await Promise.all([getCategoryBySlug(slug), getCatalog(), getCategoryList()]);
  if (!category) notFound();

  const products = catalog.filter((product) => product.category === category.name);
  const relatedCategories = categories.filter((item) => item.slug !== category.slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${SITE}/category/${category.slug}` }
    ]
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} - Edwin Leathers`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: `${SITE}/product/${product.slug}`
    }))
  };

  return (
    <div className="page-shell category-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/shop">Shop</a></li>
            <li aria-current="page">{category.name}</li>
          </ol>
        </nav>
        <div className="page-intro">
          <span className="eyebrow">The collection</span>
          <h1>{category.name}</h1>
          <p>
            {category.description}
            {products.length > 0 ? ` ${products.length} piece${products.length === 1 ? "" : "s"} in this collection.` : ""}
          </p>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="muted">There are no products in this collection yet. <a href="/shop">Browse all goods</a>.</p>
        )}
        {relatedCategories.length > 0 && (
          <section className="section">
            <div className="section-heading"><div><span className="eyebrow">Keep looking</span><h2>Other collections.</h2></div></div>
            <div className="category-card-grid">
              {relatedCategories.map((item) => (
                <a key={item.slug} href={`/category/${item.slug}`} className="category-card">
                  {item.imageUrl && (
                    <span className="category-card__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name} loading="lazy" />
                    </span>
                  )}
                  <span className="category-card__shade" />
                  <span className="category-card__content">
                    <span className="category-card__num">{item.name.charAt(0)}</span>
                    <span className="category-card__text">
                      <strong>{item.name}</strong>
                      {item.description && <small>{item.description}</small>}
                    </span>
                    <ArrowUpRight size={18} />
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbJsonLd, itemListJsonLd]) }} />
      </div>
    </div>
  );
}
