import { v2 as cloudinary } from "cloudinary";
import { env, isConfigured } from "../config/env.js";
import { ApiError } from "../middleware/error.js";

const configured = isConfigured(env.cloudinaryCloudName) && isConfigured(env.cloudinaryApiKey) && isConfigured(env.cloudinaryApiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true
  });
}

export function isCloudinaryConfigured() {
  return configured;
}

export function cloudName() {
  return env.cloudinaryCloudName;
}

export function ensureConfigured() {
  if (!configured) throw new ApiError(503, "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function parseDataUri(dataUri: string, maxBytes = MAX_BYTES): { mime: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!match) throw new ApiError(400, "Invalid image data URI");
  const [, mime, base64] = match;
  if (!ALLOWED.has(mime)) throw new ApiError(415, `Unsupported image type "${mime}". Use JPEG, PNG, WebP, or AVIF.`);
  const bytes = Buffer.byteLength(base64, "base64");
  if (bytes > maxBytes) throw new ApiError(413, `Image too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).`);
  return { mime, base64 };
}

export async function uploadImage(dataUri: string, folder = "edwin/products", maxBytes = MAX_BYTES): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const { base64 } = parseDataUri(dataUri, maxBytes);
  const result = await cloudinary.uploader.upload(`data:image/webp;base64,${base64}`, {
    folder,
    resource_type: "image",
    // Normalize every uploaded image to WebP so the stored master is small,
    // then let Cloudinary serve the best format at delivery time.
    transformation: [{ quality: "auto:eco", fetch_format: "webp" }]
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteAsset(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}