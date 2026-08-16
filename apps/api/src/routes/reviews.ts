import { Router, type Request } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { uploadImage } from "../services/cloudinary.js";

export const reviewsRouter = Router();

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 4;

const createSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(120),
  body: z.string().min(3).max(2000),
  authorName: z.string().min(1).max(80),
  location: z.string().max(80).optional(),
  images: z.array(z.object({ url: z.string().url().max(500), publicId: z.string().max(200) })).max(MAX_IMAGES).optional()
});

// Only signed-in, email-verified customers can upload images.
async function requireVerifiedCustomer(req: AuthenticatedRequest) {
  if (!req.auth?.sub) throw new ApiError(401, "Sign in to upload images.");
  const user = await User.findById(req.auth.sub).select("emailVerifiedAt role").lean();
  if (!user) throw new ApiError(401, "Account not found.");
  if (!user.emailVerifiedAt && user.role === "customer") {
    throw new ApiError(403, "Please verify your email before uploading images.", { code: "EMAIL_NOT_VERIFIED" });
  }
}

// Optional: read the customer session (if any) so we can mark "Verified purchase".
function optionalCustomerId(req: Request): { customerId?: string; email?: string } {
  const token = req.cookies?.[env.cookieName];
  if (!token) return {};
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string; email?: string };
    if (!payload.sub) return {};
    return { customerId: payload.sub, email: payload.email };
  } catch {
    return {};
  }
}

// Public: customers upload a review image (up to 3) before submitting the review.
// The image is uploaded to Cloudinary and returned as { url, publicId } so the
// client can attach it to the review when submitting. Images are moderated only
// when the review itself is approved.
reviewsRouter.post("/media/upload", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await requireVerifiedCustomer(req);
    const input = z.object({ dataUri: z.string().min(5) }).parse(req.body);
    const asset = await uploadImage(input.dataUri, "edwin/reviews", MAX_IMAGE_BYTES);
    return res.status(201).json({ ok: true, url: asset.url, publicId: asset.publicId });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid upload input", error.flatten()));
    return next(error);
  }
});

// Public: customers submit a review (text-only for safety). It lands as "pending"
// for an admin to approve. Verified purchase is derived from the customer's orders.
reviewsRouter.post("/", async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const product = await Product.findById(input.productId).lean();
    if (!product) return next(new ApiError(404, "Product not found"));

    const { customerId } = optionalCustomerId(req);
    let verifiedPurchase = false;
    if (customerId) {
      const order = await Order.findOne({ customerId, "lines.productId": product._id }).lean();
      verifiedPurchase = Boolean(order);
    }

    const review = await Review.create({
      productId: product._id,
      productName: product.name,
      authorName: input.authorName.trim(),
      location: input.location?.trim() || undefined,
      rating: input.rating,
      title: input.title.trim(),
      body: input.body.trim(),
      images: input.images ?? [],
      verifiedPurchase,
      status: "pending"
    });

    return res.status(201).json({ ok: true, data: { id: String(review._id), status: "pending" } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid review", error.flatten()));
    return next(error);
  }
});

// Public: only approved reviews. Returns the average rating, a 1-5
// distribution, and the approved reviews (optionally for one product).
reviewsRouter.get("/", async (req, res, next) => {
  try {
    const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
    const filter: Record<string, unknown> = { status: "approved" };
    if (productId) filter.productId = productId;

    const reviews = await Review.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
    const total = reviews.length;
    const average = total === 0 ? 0 : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      rating: star,
      count: reviews.filter((r) => r.rating === star).length
    }));

    return res.json({
      ok: true,
      data: {
        average,
        total,
        distribution,
        reviews: reviews.map((r) => ({
          id: String(r._id),
          productId: r.productId ? String(r.productId) : undefined,
          productName: r.productName,
          authorName: r.authorName,
          location: r.location,
          rating: r.rating,
          title: r.title,
          body: r.body,
          images: r.images ?? [],
          verifiedPurchase: r.verifiedPurchase,
          featured: r.featured,
          createdAt: r.createdAt
        }))
      }
    });
  } catch (error) {
    return next(error);
  }
});