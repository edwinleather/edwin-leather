import { Router, type Request as ExpressRequest } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
import { Feedback } from "../models/Feedback.js";

export const feedbackRouter = Router();

const createSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  topic: z.string().max(120).optional(),
  rating: z.number().int().min(0).max(5).optional(),
  message: z.string().min(3).max(3000)
});

// Optional: attach the customer id if a valid session cookie is present.
function optionalCustomerId(req: ExpressRequest): string | undefined {
  const token = req.cookies?.[env.cookieName];
  if (!token) return undefined;
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string };
    return payload.sub;
  } catch {
    return undefined;
  }
}

feedbackRouter.post("/", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    const input = createSchema.parse(req.body);
    const feedback = await Feedback.create({
      name: input.name,
      email: input.email,
      topic: input.topic,
      rating: input.rating,
      message: input.message.trim(),
      customerId: optionalCustomerId(req)
    });
    return res.status(201).json({ ok: true, data: { id: String(feedback._id), status: "new" } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid feedback", error.flatten()));
    return next(error);
  }
});