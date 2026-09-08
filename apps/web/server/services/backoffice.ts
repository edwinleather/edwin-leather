import { AdminUser, RolePermission, BACKOFFICE_FEATURES, type AdminRole } from "../models/backoffice.js";
import type mongoose from "mongoose";

export const DEFAULT_FEATURES: Record<AdminRole, string[]> = {
  superadmin: ["*"],
  admin: BACKOFFICE_FEATURES.filter((f) => f !== "admins" && f !== "roles"),
  employee: ["overview", "products", "orders", "customers"]
};

export function allFeatures() {
  return [...BACKOFFICE_FEATURES];
}

export function hasWildcard(permissions: string[] = []) {
  return permissions.includes("*");
}

export function roleFeatures(role: AdminRole, features: string[] | undefined): string[] {
  if (!features || features.length === 0) return DEFAULT_FEATURES[role] ?? [];
  if (features.includes("*")) return allFeatures();
  return features;
}

export async function getAdminUser(appUserId: mongoose.Types.ObjectId | string) {
  return AdminUser.findOne({ appUserId }).lean();
}

export async function getAllowedFeatures(admin: { role: AdminRole; permissions?: string[] }) {
  if (hasWildcard(admin.permissions)) return allFeatures();
  const rp = await RolePermission.findOne({ role: admin.role }).lean();
  const base = rp?.features ? roleFeatures(admin.role, rp.features) : DEFAULT_FEATURES[admin.role] ?? [];
  return [...new Set([...base, ...(admin.permissions ?? [])])];
}

export function adminPublic(admin: Record<string, unknown>) {
  return {
    id: String(admin._id),
    email: admin.email,
    name: admin.name,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    active: admin.active,
    appUserId: admin.appUserId ? String(admin.appUserId) : undefined,
    permissions: admin.permissions,
    createdAt: admin.createdAt
  };
}