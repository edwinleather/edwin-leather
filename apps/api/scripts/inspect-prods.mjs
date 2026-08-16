import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const prods = mongoose.connection.collection("products");
const all = await prods.find({}, { name: 1, images: 1 }).limit(1).toArray();
for (const p of all) {
  console.log("name:", p.name);
  console.log("images type:", Array.isArray(p.images) ? "array" : typeof p.images);
  console.log("images[0]:", JSON.stringify(p.images?.[0]));
  console.log("sample images:", JSON.stringify(p.images));
}
await mongoose.disconnect();