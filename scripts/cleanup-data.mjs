import { readFileSync } from "fs";
import mongoose from "mongoose";

const envFile = readFileSync("D:/edwin-leathers/apps/api/.env", "utf8");
const getVal = (key) => {
  const match = envFile.match(new RegExp(key + "=(.+)"));
  return match ? match[1] : "";
};

const mongoUri = getVal("MONGODB_URI");
console.log("Connecting to MongoDB...");

await mongoose.connect(mongoUri);
console.log("Connected");

const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));
const ProductVariant = mongoose.model("ProductVariant", new mongoose.Schema({}, { strict: false, collection: "productvariants" }));
const Inventory = mongoose.model("Inventory", new mongoose.Schema({}, { strict: false, collection: "inventories" }));

const products = await Product.find({});
console.log(`Found ${products.length} products\n`);

for (const p of products) {
  const isJunk = /fdsf|test|sandsle/i.test(p.name);
  const hasDemo = p.name.startsWith("demo_");
  
  if (isJunk) {
    console.log(`DELETING: ${p.name} (${p.slug})`);
    await Product.deleteOne({ _id: p._id });
    // Also delete variants
    await ProductVariant.deleteMany({ product: p._id });
    await Inventory.deleteMany({ product: p._id });
    console.log(`  Deleted product and related data`);
  } else if (hasDemo) {
    const newName = p.name.replace(/^demo_/, "");
    const newSlug = p.slug;
    console.log(`RENAME: ${p.name} -> ${newName}`);
    await Product.updateOne({ _id: p._id }, { $set: { name: newName } });
  } else {
    console.log(`KEEP: ${p.name} (${p.slug})`);
  }
}

// Also check for categories
const Category = mongoose.model("Category", new mongoose.Schema({}, { strict: false, collection: "categories" }));
const categories = await Category.find({});
console.log(`\nFound ${categories.length} categories`);
for (const c of categories) {
  console.log(`  ${c.name} (${c.slug})`);
}

// Check coupons
const Coupon = mongoose.model("Coupon", new mongoose.Schema({}, { strict: false, collection: "coupons" }));
const coupons = await Coupon.find({});
console.log(`\nFound ${coupons.length} coupons`);
for (const c of coupons) {
  console.log(`  ${c.code} - ${c.discountType}: ${c.discountValue}`);
}

await mongoose.disconnect();
console.log("\nDone!");
