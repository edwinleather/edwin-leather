import fs from "node:fs";
import { connectDatabase, databaseReady } from "../dist/src/config/db.js";
import { uploadImage } from "../dist/src/services/cloudinary.js";
import { Asset } from "../dist/src/models/Asset.js";

const filePath = "c:\\Users\\1812a\\Downloads\\WhatsApp Image 2026-08-15 at 11.07.47 AM.jpeg";

await connectDatabase();
if (!databaseReady()) {
  console.error("DB not ready");
  process.exit(1);
}

const buf = fs.readFileSync(filePath);
const dataUri = `data:image/jpeg;base64,${buf.toString("base64")}`;
const { url, publicId } = await uploadImage(dataUri, "edwin/assets");
const doc = await Asset.create({
  category: "asset",
  url,
  publicId,
  referenceLabel: "logo",
  filename: "WhatsApp Image 2026-08-15 at 11.07.47 AM.jpeg",
  mimeType: "image/jpeg",
  size: buf.length
});
console.log("UPLOAD_OK", JSON.stringify({ url, publicId, assetId: String(doc._id) }));
process.exit(0);