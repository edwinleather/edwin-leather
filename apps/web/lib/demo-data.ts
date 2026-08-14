import type { Product } from "./types";

export const products: Product[] = [
  {
    id: "p_heritage_tote",
    slug: "heritage-tote",
    name: "Heritage Tote",
    subtitle: "Vegetable-tanned full-grain leather",
    category: "Bags",
    collection: "The Everyday Edit",
    price: 6490,
    compareAtPrice: 7290,
    badge: "Bestseller",
    description:
      "A structured everyday tote with a softened silhouette, hand-finished edges, and room for the workday without looking like a work bag.",
    details: [
      "Full-grain leather exterior",
      "Cotton twill lining",
      "Padded 14-inch laptop sleeve",
      "Antique brass hardware",
      "Made in small batches"
    ],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_tote_cognac", label: "Cognac", sku: "TOTE-COG-01", color: "Cognac", inventory: 8 },
      { id: "v_tote_espresso", label: "Espresso", sku: "TOTE-ESP-01", color: "Espresso", inventory: 5 },
      { id: "v_tote_black", label: "Black", sku: "TOTE-BLK-01", color: "Black", inventory: 4 }
    ],
    featured: true,
    newArrival: true
  },
  {
    id: "p_merchant_sling",
    slug: "merchant-sling",
    name: "Merchant Sling",
    subtitle: "Compact crossbody, generous character",
    category: "Bags",
    collection: "City Carry",
    price: 3890,
    badge: "New",
    description:
      "A compact crossbody built around the essentials: phone, wallet, keys, sunglasses. Finished with a wide adjustable strap and a hidden rear pocket.",
    details: ["Full-grain leather", "Adjustable strap", "Magnetic flap", "Rear quick-access pocket", "Soft suede-touch lining"],
    images: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_sling_tan", label: "Burnished Tan", sku: "SLNG-TAN-01", color: "Tan", inventory: 11 },
      { id: "v_sling_brown", label: "Dark Brown", sku: "SLNG-BRN-01", color: "Brown", inventory: 7 }
    ],
    featured: true,
    newArrival: true
  },
  {
    id: "p_archive_wallet",
    slug: "archive-wallet",
    name: "Archive Wallet",
    subtitle: "Slim bifold with hand-burnished edges",
    category: "Wallets",
    collection: "Small Goods",
    price: 1990,
    description:
      "A slim bifold that carries the cards you actually use. Designed to break in, not break down, with a hand-burnished edge that gains depth over time.",
    details: ["Six card slots", "Full-length cash sleeve", "RFID-blocking interlayer", "Hand-burnished edge", "Monogram-ready panel"],
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1612902456551-333ac5afa26e?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_wallet_mahogany", label: "Mahogany", sku: "WALT-MAH-01", color: "Mahogany", inventory: 19 },
      { id: "v_wallet_black", label: "Black", sku: "WALT-BLK-01", color: "Black", inventory: 14 }
    ],
    featured: true
  },
  {
    id: "p_foundry_belt",
    slug: "foundry-belt",
    name: "Foundry Belt",
    subtitle: "One-piece leather, solid brass buckle",
    category: "Belts",
    collection: "Daily Uniform",
    price: 2290,
    description:
      "Cut from a single thick hide and paired with a solid brass buckle. The kind of belt that looks better after a hundred wears than it did on day one.",
    details: ["One-piece full-grain strap", "Solid brass buckle", "32 mm width", "Beveled edge", "Five sizing holes"],
    images: [
      "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_belt_cog_30", label: "Cognac / 30", sku: "BELT-COG-30", color: "Cognac", size: "30", inventory: 4 },
      { id: "v_belt_cog_32", label: "Cognac / 32", sku: "BELT-COG-32", color: "Cognac", size: "32", inventory: 7 },
      { id: "v_belt_cog_34", label: "Cognac / 34", sku: "BELT-COG-34", color: "Cognac", size: "34", inventory: 3 },
      { id: "v_belt_brown_32", label: "Dark Brown / 32", sku: "BELT-BRN-32", color: "Brown", size: "32", inventory: 6 },
      { id: "v_belt_brown_34", label: "Dark Brown / 34", sku: "BELT-BRN-34", color: "Brown", size: "34", inventory: 5 },
      { id: "v_belt_brown_36", label: "Dark Brown / 36", sku: "BELT-BRN-36", color: "Brown", size: "36", inventory: 2 }
    ],
    featured: true
  },
  {
    id: "p_weekender_01",
    slug: "weekender-01",
    name: "Weekender No. 01",
    subtitle: "Overnight holdall in softened grain",
    category: "Travel",
    collection: "The Long Weekend",
    price: 8990,
    badge: "Limited",
    description:
      "A roomy two-night holdall with a wide opening, reinforced base, and a silhouette that relaxes beautifully as the leather develops a patina.",
    details: ["Cabin-friendly proportions", "Detachable shoulder strap", "Reinforced base", "Interior shoe pocket", "YKK metal zip"],
    images: [
      "https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_weekender_saddle", label: "Saddle", sku: "WKND-SAD-01", color: "Saddle", inventory: 3 },
      { id: "v_weekender_espresso", label: "Espresso", sku: "WKND-ESP-01", color: "Espresso", inventory: 2 }
    ],
    newArrival: true
  },
  {
    id: "p_key_keeper",
    slug: "key-keeper",
    name: "Key Keeper",
    subtitle: "A small object made properly",
    category: "Accessories",
    collection: "Small Goods",
    price: 990,
    description:
      "A satisfying little loop of leather with a solid split ring and snap hook. Designed for keys, bag charms, or clipping the things you tend to misplace.",
    details: ["Full-grain leather", "Solid brass hardware", "Hand-set rivet", "Gift-ready sleeve", "Made from workshop offcuts"],
    images: [
      "https://images.unsplash.com/photo-1601924357840-3e50ad4dd9fd?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_key_tan", label: "Tan", sku: "KEY-TAN-01", color: "Tan", inventory: 27 },
      { id: "v_key_black", label: "Black", sku: "KEY-BLK-01", color: "Black", inventory: 21 }
    ]
  },
  {
    id: "p_document_folio",
    slug: "document-folio",
    name: "Document Folio",
    subtitle: "A clean home for papers and devices",
    category: "Work",
    collection: "Desk to Door",
    price: 4490,
    description:
      "A minimal zip folio with just enough internal organization for a tablet, notebook, cards, and loose pages—without turning into a briefcase.",
    details: ["Fits up to 13-inch tablet", "Document divider", "Pen loop", "Card pockets", "Protective microsuede lining"],
    images: [
      "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_folio_chestnut", label: "Chestnut", sku: "FOL-CHS-01", color: "Chestnut", inventory: 6 },
      { id: "v_folio_black", label: "Black", sku: "FOL-BLK-01", color: "Black", inventory: 8 }
    ],
    newArrival: true
  },
  {
    id: "p_card_sleeve",
    slug: "card-sleeve",
    name: "Card Sleeve",
    subtitle: "Three pockets, almost no bulk",
    category: "Wallets",
    collection: "Small Goods",
    price: 1290,
    description:
      "A stripped-back card sleeve for minimal carry. Three pockets, one center slip, and a profile that disappears into a trouser pocket.",
    details: ["Three-pocket construction", "Holds 6–8 cards", "Full-grain leather", "Hand-painted edge", "Debossed Edwin mark"],
    images: [
      "https://images.unsplash.com/photo-1601592996763-f05c9c80a7f1?auto=format&fit=crop&w=1600&q=88",
      "https://images.unsplash.com/photo-1531190260877-c8d11eb5afaf?auto=format&fit=crop&w=1600&q=88"
    ],
    variants: [
      { id: "v_card_olive", label: "Olive", sku: "CARD-OLV-01", color: "Olive", inventory: 12 },
      { id: "v_card_tan", label: "Tan", sku: "CARD-TAN-01", color: "Tan", inventory: 18 },
      { id: "v_card_black", label: "Black", sku: "CARD-BLK-01", color: "Black", inventory: 15 }
    ]
  }
];

export const categories = ["All", ...Array.from(new Set(products.map((product) => product.category)))];

export const featuredProducts = products.filter((product) => product.featured);
export const newArrivals = products.filter((product) => product.newArrival);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
