import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";

function withVariantIds(products) {
  return products.map(p => ({
    ...p,
    variants: p.variants.map(v => ({
      ...v,
      _id: new ObjectId(),
      inventoryTotal: v.inventory ?? 0,
      inventoryAvailable: v.inventory ?? 0,
      inventoryReserved: 0,
      inventoryStoreAllocated: 0
    }))
  }));
}

const seedProducts = [
  {
    slug: "heritage-tote", name: "Heritage Tote", subtitle: "Vegetable-tanned full-grain leather",
    category: "Bags", collection: "The Everyday Edit", price: 6490, compareAtPrice: 7290,
    description: "A structured everyday tote with a softened silhouette, hand-finished edges, and room for the workday without looking like a work bag.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/mgzyaetkznw6ft1f6tdi.webp", alt: "Heritage Tote" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/hfs08azolqdqrout5s6j.webp", alt: "Heritage Tote detail" }
    ],
    variants: [
      { label: "Cognac", sku: "TOTE-COG-01", color: "Cognac", inventory: 8 },
      { label: "Espresso", sku: "TOTE-ESP-01", color: "Espresso", inventory: 5 },
      { label: "Black", sku: "TOTE-BLK-01", color: "Black", inventory: 4 }
    ],
    featured: true
  },
  {
    slug: "merchant-sling", name: "Merchant Sling", subtitle: "Compact crossbody, generous character",
    category: "Bags", collection: "City Carry", price: 3890,
    description: "A compact crossbody built around the essentials: phone, wallet, keys, sunglasses. Finished with a wide adjustable strap and a hidden rear pocket.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp", alt: "Merchant Sling" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/vvdyofotdhcwvuznlxec.webp", alt: "Merchant Sling detail" }
    ],
    variants: [
      { label: "Burnished Tan", sku: "SLNG-TAN-01", color: "Tan", inventory: 11 },
      { label: "Dark Brown", sku: "SLNG-BRN-01", color: "Brown", inventory: 7 }
    ],
    featured: true
  },
  {
    slug: "archive-wallet", name: "Archive Wallet", subtitle: "Slim bifold with hand-burnished edges",
    category: "Wallets", collection: "Small Goods", price: 1990,
    description: "A slim bifold that carries the cards you actually use. Designed to break in, not break down, with a hand-burnished edge that gains depth over time.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/jmsky5qf33pm7v9izsel.webp", alt: "Archive Wallet" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/j5qcnfhhduia56ssnprq.webp", alt: "Archive Wallet detail" }
    ],
    variants: [
      { label: "Mahogany", sku: "WALT-MAH-01", color: "Mahogany", inventory: 19 },
      { label: "Black", sku: "WALT-BLK-01", color: "Black", inventory: 14 }
    ],
    featured: true
  },
  {
    slug: "foundry-belt", name: "Foundry Belt", subtitle: "One-piece leather, solid brass buckle",
    category: "Belts", collection: "Daily Uniform", price: 2290,
    description: "Cut from a single thick hide and paired with a solid brass buckle. The kind of belt that looks better after a hundred wears than it did on day one.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/eqapt0yuxl1vs0sqw9j1.webp", alt: "Foundry Belt" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/gneyctzgsmrs8yeo5pkm.webp", alt: "Foundry Belt detail" }
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
    slug: "weekender-01", name: "Weekender No. 01", subtitle: "Overnight holdall in softened grain",
    category: "Travel", collection: "The Long Weekend", price: 8990,
    description: "A roomy two-night holdall with a wide opening, reinforced base, and a silhouette that relaxes beautifully as the leather develops a patina.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/uzpcycud0y6fr3ixhfdi.webp", alt: "Weekender No. 01" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/wjorleikcvlc21h4tjys.webp", alt: "Weekender No. 01 detail" }
    ],
    variants: [
      { label: "Saddle", sku: "WKND-SAD-01", color: "Saddle", inventory: 3 },
      { label: "Espresso", sku: "WKND-ESP-01", color: "Espresso", inventory: 2 }
    ]
  },
  {
    slug: "key-keeper", name: "Key Keeper", subtitle: "A small object made properly",
    category: "Accessories", collection: "Small Goods", price: 990,
    description: "A satisfying little loop of leather with a solid split ring and snap hook. Designed for keys, bag charms, or clipping the things you tend to misplace.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/datthgtxvfqbwjddtarp.webp", alt: "Key Keeper" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/cgxjzfsb6lejdoqrcetp.webp", alt: "Key Keeper detail" }
    ],
    variants: [
      { label: "Tan", sku: "KEY-TAN-01", color: "Tan", inventory: 27 },
      { label: "Black", sku: "KEY-BLK-01", color: "Black", inventory: 21 }
    ]
  },
  {
    slug: "document-folio", name: "Document Folio", subtitle: "A clean home for papers and devices",
    category: "Work", collection: "Desk to Door", price: 4490,
    description: "A minimal zip folio with just enough internal organization for a tablet, notebook, cards, and loose pages - without turning into a briefcase.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/ennayofvolqm4brzorsn.webp", alt: "Document Folio" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/wb49p31tafio3gzbtfct.webp", alt: "Document Folio detail" }
    ],
    variants: [
      { label: "Chestnut", sku: "FOL-CHS-01", color: "Chestnut", inventory: 6 },
      { label: "Black", sku: "FOL-BLK-01", color: "Black", inventory: 8 }
    ]
  },
  {
    slug: "card-sleeve", name: "Card Sleeve", subtitle: "Three pockets, almost no bulk",
    category: "Wallets", collection: "Small Goods", price: 1290,
    description: "A stripped-back card sleeve for minimal carry. Three pockets, one center slip, and a profile that disappears into a trouser pocket.",
    images: [
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/ywe4jfmryjr3hbfzhdz7.webp", alt: "Card Sleeve" },
      { url: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/yzh4nn5r3vk6wcopmjli.webp", alt: "Card Sleeve detail" }
    ],
    variants: [
      { label: "Olive", sku: "CARD-OLV-01", color: "Olive", inventory: 12 },
      { label: "Tan", sku: "CARD-TAN-01", color: "Tan", inventory: 18 },
      { label: "Black", sku: "CARD-BLK-01", color: "Black", inventory: 15 }
    ]
  }
];

const seedCategories = [
  { name: "Bags", slug: "bags", description: "Totes, crossbodies and everyday carry" },
  { name: "Wallets", slug: "wallets", description: "Bifolds, card sleeves and small leather goods" },
  { name: "Belts", slug: "belts", description: "One-piece full-grain belts" },
  { name: "Travel", slug: "travel", description: "Overnight and weekend pieces" },
  { name: "Accessories", slug: "accessories", description: "Small objects made properly" },
  { name: "Work", slug: "work", description: "Desk to door carry" }
];

const seedCoupons = [
  { code: "WELCOME10", discountType: "percentage", value: 10, minimumOrder: 999, maximumDiscount: 500, usagePerCustomer: 1 },
  { code: "FREESHIP", discountType: "free_shipping", value: 0, minimumOrder: 1499 }
];

const siteSettings = {
  heroTitle: "Leather goods built to last.",
  heroSubtitle: "Full-grain leather, hand-finished, made to order.",
  heroImage: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/wjorleikcvlc21h4tjys.webp",
  heroCtaText: "Shop the collection",
  heroCtaLink: "/products",
  sections: [
    { title: "Bags", copy: "Carry a little better.", image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" },
    { title: "Wallets", copy: "Small, useful, personal.", image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/jmsky5qf33pm7v9izsel.webp" },
    { title: "Belts", copy: "One piece. No shortcuts.", image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/eqapt0yuxl1vs0sqw9j1.webp" }
  ],
  brandName: "Edwin Leathers",
  tagline: "Full-grain leather. Built to last.",
  announcementBar: "Free shipping on orders over ₹1,499"
};

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();

    console.log("Dropping all collections...");
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.dropCollection(col.name);
      console.log(`  Dropped: ${col.name}`);
    }

    console.log("\nSeeding products...");
    await db.collection("products").insertMany(withVariantIds(seedProducts).map(p => ({ ...p, active: true, createdAt: new Date(), updatedAt: new Date() })));
    console.log(`  Inserted ${seedProducts.length} products`);

    console.log("Seeding categories...");
    await db.collection("categories").insertMany(seedCategories.map(c => ({ ...c, active: true, createdAt: new Date(), updatedAt: new Date() })));
    console.log(`  Inserted ${seedCategories.length} categories`);

    console.log("Seeding coupons...");
    await db.collection("coupons").insertMany(seedCoupons.map(c => ({ ...c, usedCount: 0, createdAt: new Date(), updatedAt: new Date() })));
    console.log(`  Inserted ${seedCoupons.length} coupons`);

    console.log("Seeding site settings...");
    await db.collection("sitesettings").insertOne({ ...siteSettings, createdAt: new Date(), updatedAt: new Date() });
    console.log("  Inserted 1 site settings");

    console.log("\nDone! Database wiped and re-seeded.");
  } finally {
    await client.close();
  }
}
main().catch(console.error);
