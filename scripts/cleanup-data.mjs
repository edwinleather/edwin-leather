import { readFileSync } from "fs";
import mongoose from "mongoose";

const envFile = readFileSync("D:/edwin-leathers/apps/api/.env", "utf8");
const mongoUri = envFile.match(/MONGODB_URI=(.+)/)[1];
await mongoose.connect(mongoUri);

const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));
const products = await Product.find({});

for (const p of products) {
  if (p.name.startsWith("demo_")) {
    const newName = p.name.replace(/^demo_/, "");
    await Product.updateOne({ _id: p._id }, { $set: { name: newName } });
    console.log("Renamed:", p.name, "->", newName);
  } else {
    console.log("OK:", p.name);
  }
}

await mongoose.disconnect();
console.log("Done");
