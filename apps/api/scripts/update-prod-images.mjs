import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPPING = JSON.parse(await readFile(path.resolve(__dirname, "asset-mapping.json"), "utf8"));
const ids = Object.keys(MAPPING).join("|");
const re = new RegExp(`https://images\\.unsplash\\.com/(${ids})\\?[^"'\`\\s)]*`, "g");

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const prods = mongoose.connection.collection("products");
const all = await prods.find({}).toArray();
let updated = 0;
for (const p of all) {
  const images = Array.isArray(p.images) ? p.images : [];
  let changed = false;
  const newImages = images.map((img) => {
    const newUrl = typeof img.url === "string" ? img.url.replace(re, (m, id) => MAPPING[id]) : img.url;
    if (newUrl !== img.url) changed = true;
    return { ...img, url: newUrl };
  });
  if (changed) {
    await prods.updateOne({ _id: p._id }, { $set: { images: newImages } });
    updated++;
    console.log("updated:", p.name);
  }
}
console.log("Products updated:", updated);
await mongoose.disconnect();