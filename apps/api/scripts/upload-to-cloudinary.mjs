import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";

cloudinary.config({
  cloud_name: "gpldwiup",
  api_key: "887919744813826",
  api_secret: "jxD1MxToB__vAJ_cAniW0IzeXfo",
});

const FOLDER = "edwin/assets";
const DIR = "C:\\Users\\1812a\\Downloads\\Cloudinary_Archive_2026-09-06_20_12_41_Originals";

const files = fs.readdirSync(DIR).filter((f) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f));
console.log(`Found ${files.length} images to upload.\n`);

const mapping = {};

for (const file of files) {
  const filePath = path.join(DIR, file);
  const publicId = path.parse(file).name;
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: FOLDER,
      public_id: publicId,
      overwrite: true,
    });
    mapping[publicId] = result.secure_url;
    console.log(`✓ ${file} → ${result.secure_url}`);
  } catch (err) {
    console.error(`✗ ${file} → ${err.message}`);
  }
}

fs.writeFileSync(
  path.join(process.cwd(), "scripts", "upload-mapping.json"),
  JSON.stringify(mapping, null, 2)
);
console.log(`\nDone! Mapping saved to scripts/upload-mapping.json`);
