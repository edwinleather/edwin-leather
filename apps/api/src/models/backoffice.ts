import { Schema } from "mongoose";
import { backofficeDb } from "../config/backofficeDb.js";

export const ADMIN_ROLES = ["employee", "admin", "superadmin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const BACKOFFICE_FEATURES = [
  "overview",
  "products",
  "categories",
  "orders",
  "customers",
  "coupons",
  "returns",
  "refunds",
  "shipping",
  "homepage",
  "admins",
  "roles",
  "media"
] as const;

export type BackofficeFeature = (typeof BACKOFFICE_FEATURES)[number];

const conn = backofficeDb();

const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    provider: { type: String, default: "local" },
    googleId: { type: String },
    firstName: String,
    lastName: String,
    name: String,
    role: { type: String, enum: ADMIN_ROLES, default: "employee" },
    appUserId: { type: Schema.Types.ObjectId, index: true },
    permissions: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    addedBy: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

const rolePermissionSchema = new Schema(
  {
    role: { type: String, enum: ADMIN_ROLES, unique: true, required: true },
    features: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

export const AdminUser = conn.model("BackofficeUser", adminUserSchema, "users");
export const RolePermission = conn.model("RolePermission", rolePermissionSchema, "rolepermissions");