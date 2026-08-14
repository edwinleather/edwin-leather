export type SeedProductInput = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  collection: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  variants: { label: string; sku: string; color: string; size?: string; inventory: number }[];
  featured?: boolean;
};

export const seedProducts: SeedProductInput[] = [
  {
    slug: "heritage-tote",
    name: "Heritage Tote",
    subtitle: "Vegetable-tanned full-grain leather",
    category: "Bags",
    collection: "The Everyday Edit",
    price: 6490,
    compareAtPrice: 7290,
    description:
      "A structured everyday tote with a softened silhouette, hand-finished edges, and room for the workday without looking like a work bag.",
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=88", alt: "Heritage Tote" },
      { url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&q=88", alt: "Heritage Tote detail" }
    ],
    variants: [
      { label: "Cognac", sku: "TOTE-COG-01", color: "Cognac", inventory: 8 },
      { label: "Espresso", sku: "TOTE-ESP-01", color: "Espresso", inventory: 5 },
      { label: "Black", sku: "TOTE-BLK-01", color: "Black", inventory: 4 }
    ],
    featured: true
  },
  {
    slug: "merchant-sling",
    name: "Merchant Sling",
    subtitle: "Compact crossbody, generous character",
    category: "Bags",
    collection: "City Carry",
    price: 3890,
    description:
      "A compact crossbody built around the essentials: phone, wallet, keys, sunglasses. Finished with a wide adjustable strap and a hidden rear pocket.",
    images: [
      { url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1600&q=88", alt: "Merchant Sling" },
      { url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1600&q=88", alt: "Merchant Sling detail" }
    ],
    variants: [
      { label: "Burnished Tan", sku: "SLNG-TAN-01", color: "Tan", inventory: 11 },
      { label: "Dark Brown", sku: "SLNG-BRN-01", color: "Brown", inventory: 7 }
    ],
    featured: true
  },
  {
    slug: "archive-wallet",
    name: "Archive Wallet",
    subtitle: "Slim bifold with hand-burnished edges",
    category: "Wallets",
    collection: "Small Goods",
    price: 1990,
    description:
      "A slim bifold that carries the cards you actually use. Designed to break in, not break down, with a hand-burnished edge that gains depth over time.",
    images: [
      { url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1600&q=88", alt: "Archive Wallet" },
      { url: "https://images.unsplash.com/photo-1612902456551-333ac5afa26e?auto=format&fit=crop&w=1600&q=88", alt: "Archive Wallet detail" }
    ],
    variants: [
      { label: "Mahogany", sku: "WALT-MAH-01", color: "Mahogany", inventory: 19 },
      { label: "Black", sku: "WALT-BLK-01", color: "Black", inventory: 14 }
    ],
    featured: true
  },
  {
    slug: "foundry-belt",
    name: "Foundry Belt",
    subtitle: "One-piece leather, solid brass buckle",
    category: "Belts",
    collection: "Daily Uniform",
    price: 2290,
    description:
      "Cut from a single thick hide and paired with a solid brass buckle. The kind of belt that looks better after a hundred wears than it did on day one.",
    images: [
      { url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1600&q=88", alt: "Foundry Belt" },
      { url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1600&q=88", alt: "Foundry Belt detail" }
    ],
    variants: [
      { label: "Cognac / 30", sku: "BELT-COG-30", color: "Cognac", size: "30", inventory: 4 },
      { label: "Cognac / 32", sku: "BELT-COG-32", color: "Cognac", size: "32", inventory: 7 },
      { label: "Cognac / 34", sku: "BELT-COG-34", color: "Cognac", size: "34", inventory: 3 },
      { label: "Dark Brown / 32", sku: "BELT-BRN-32", color: "Brown", size: "32", inventory: 6 },
      { label: "Dark Brown / 34", sku: "BELT-BRN-34", color: "Brown", size: "34", inventory: 5 },
      { label: "Dark Brown / 36", sku: "BELT-BRN-36", color: "Brown", size: "36", inventory: 2 }
    ],
    featured: true
  },
  {
    slug: "weekender-01",
    name: "Weekender No. 01",
    subtitle: "Overnight holdall in softened grain",
    category: "Travel",
    collection: "The Long Weekend",
    price: 8990,
    description:
      "A roomy two-night holdall with a wide opening, reinforced base, and a silhouette that relaxes beautifully as the leather develops a patina.",
    images: [
      { url: "https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=1600&q=88", alt: "Weekender No. 01" },
      { url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1600&q=88", alt: "Weekender No. 01 detail" }
    ],
    variants: [
      { label: "Saddle", sku: "WKND-SAD-01", color: "Saddle", inventory: 3 },
      { label: "Espresso", sku: "WKND-ESP-01", color: "Espresso", inventory: 2 }
    ]
  },
  {
    slug: "key-keeper",
    name: "Key Keeper",
    subtitle: "A small object made properly",
    category: "Accessories",
    collection: "Small Goods",
    price: 990,
    description:
      "A satisfying little loop of leather with a solid split ring and snap hook. Designed for keys, bag charms, or clipping the things you tend to misplace.",
    images: [
      { url: "https://images.unsplash.com/photo-1601924357840-3e50ad4dd9fd?auto=format&fit=crop&w=1600&q=88", alt: "Key Keeper" },
      { url: "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?auto=format&fit=crop&w=1600&q=88", alt: "Key Keeper detail" }
    ],
    variants: [
      { label: "Tan", sku: "KEY-TAN-01", color: "Tan", inventory: 27 },
      { label: "Black", sku: "KEY-BLK-01", color: "Black", inventory: 21 }
    ]
  },
  {
    slug: "document-folio",
    name: "Document Folio",
    subtitle: "A clean home for papers and devices",
    category: "Work",
    collection: "Desk to Door",
    price: 4490,
    description:
      "A minimal zip folio with just enough internal organization for a tablet, notebook, cards, and loose pages — without turning into a briefcase.",
    images: [
      { url: "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1600&q=88", alt: "Document Folio" },
      { url: "https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=1600&q=88", alt: "Document Folio detail" }
    ],
    variants: [
      { label: "Chestnut", sku: "FOL-CHS-01", color: "Chestnut", inventory: 6 },
      { label: "Black", sku: "FOL-BLK-01", color: "Black", inventory: 8 }
    ]
  },
  {
    slug: "card-sleeve",
    name: "Card Sleeve",
    subtitle: "Three pockets, almost no bulk",
    category: "Wallets",
    collection: "Small Goods",
    price: 1290,
    description:
      "A stripped-back card sleeve for minimal carry. Three pockets, one center slip, and a profile that disappears into a trouser pocket.",
    images: [
      { url: "https://images.unsplash.com/photo-1601592996763-f05c9c80a7f1?auto=format&fit=crop&w=1600&q=88", alt: "Card Sleeve" },
      { url: "https://images.unsplash.com/photo-1531190260877-c8d11eb5afaf?auto=format&fit=crop&w=1600&q=88", alt: "Card Sleeve detail" }
    ],
    variants: [
      { label: "Olive", sku: "CARD-OLV-01", color: "Olive", inventory: 12 },
      { label: "Tan", sku: "CARD-TAN-01", color: "Tan", inventory: 18 },
      { label: "Black", sku: "CARD-BLK-01", color: "Black", inventory: 15 }
    ]
  }
];

export const seedCategories = [
  { name: "Bags", slug: "bags", description: "Totes, crossbodies and everyday carry" },
  { name: "Wallets", slug: "wallets", description: "Bifolds, card sleeves and small leather goods" },
  { name: "Belts", slug: "belts", description: "One-piece full-grain belts" },
  { name: "Travel", slug: "travel", description: "Overnight and weekend pieces" },
  { name: "Accessories", slug: "accessories", description: "Small objects made properly" },
  { name: "Work", slug: "work", description: "Desk to door carry" }
];

export const seedCoupons = [
  { code: "WELCOME10", discountType: "percentage", value: 10, minimumOrder: 999, maximumDiscount: 500, usagePerCustomer: 1 },
  { code: "FREESHIP", discountType: "free_shipping", value: 0, minimumOrder: 1499 }
];