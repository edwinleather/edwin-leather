const API_URL = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type DeliveryConfig = {
  defaultFee: number;
  stateFees: { state: string; fee: number }[];
  freeDeliveryThreshold: number;
};

export async function getDeliveryConfig(): Promise<DeliveryConfig | null> {
  try {
    const response = await fetch(`${API_URL}/delivery/config`, { credentials: "include" });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export async function adminSaveDelivery(config: DeliveryConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/admin/delivery`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(config)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error || `Save failed (${response.status})` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the admin service." };
  }
}

export async function adminGetDelivery(): Promise<DeliveryConfig | null> {
  try {
    const response = await fetch(`${API_URL}/admin/delivery`, { credentials: "include" });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export type PlaceOrderPayload = {
  email: string;
  customerId?: string;
  paymentMethod: "razorpay" | "cod";
  items: { productId: string; variantId: string; quantity: number }[];
  couponCode?: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
};

export type OrderResponse = {
  id: string;
  orderNumber: string;
  email: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  lines: { productId: string; sku: string; name: string; variantLabel?: string; quantity: number; unitPrice: number; lineTotal: number }[];
  shippingAddress?: { fullName?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; phone?: string };
  tracking?: { awb?: string; trackingId?: string; courier?: string; deliveryPartnerName?: string; trackingUrl?: string };
  timeline?: { type: string; message?: string; at: string }[];
  createdAt?: string;
};

export type PlaceOrderResult =
  | { ok: true; order: OrderResponse }
  | { ok: false; error: string };

export async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: body?.error || `Request failed (${response.status})` };
    }
    return { ok: true, order: body?.order };
  } catch {
    return { ok: false, error: "Could not reach the checkout service. Your order was not charged." };
  }
}

export type CouponValidation = { valid: boolean; amount: number; freeShipping: boolean; note: string };

export async function validateCoupon(payload: { code: string; state?: string; items: { productId: string; variantId: string; quantity: number }[] }): Promise<CouponValidation | null> {
  try {
    const response = await fetch(`${API_URL}/orders/validate-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.ok) return null;
    return body.data as CouponValidation;
  } catch {
    return null;
  }
}

export async function getOrder(orderId: string): Promise<OrderResponse | null> {
  try {
    const response = await fetch(`${API_URL}/account/orders/${orderId}`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.ok) return null;
    return body.order as OrderResponse;
  } catch {
    return null;
  }
}

export async function updateProfile(payload: { firstName?: string; lastName?: string; phone?: string }): Promise<{ ok: boolean; error?: string; user?: { _id: string; firstName?: string; lastName?: string; phone?: string; email: string; provider?: string } }> {
  try {
    const response = await fetch(`${API_URL}/account/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error };
    return { ok: true, user: body?.user };
  } catch {
    return { ok: false, error: "Could not update your profile." };
  }
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const { changePassword: firebaseChangePassword } = await import("@/lib/firebase");
    await firebaseChangePassword(payload.currentPassword, payload.newPassword);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not change your password.";
    if (/wrong-password|invalid-credential|invalid/i.test(message)) {
      return { ok: false, error: "Your current password is incorrect." };
    }
    return { ok: false, error: "Could not change your password." };
  }
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // ignore — session will be cleared client-side regardless
  }
}

export type Address = {
  _id?: string;
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
};

export async function getAddresses(): Promise<Address[] | null> {
  try {
    const response = await fetch(`${API_URL}/account/addresses`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.ok) return null;
    return body.addresses;
  } catch {
    return null;
  }
}

export async function addAddress(address: Address): Promise<{ ok: boolean; error?: string; addresses?: Address[] }> {
  try {
    const response = await fetch(`${API_URL}/account/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(address)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error };
    return { ok: true, addresses: body.addresses };
  } catch {
    return { ok: false, error: "Could not add the address." };
  }
}

export async function updateAddress(addressId: string, address: Partial<Address>): Promise<{ ok: boolean; error?: string; addresses?: Address[] }> {
  try {
    const response = await fetch(`${API_URL}/account/addresses/${addressId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(address)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error };
    return { ok: true, addresses: body.addresses };
  } catch {
    return { ok: false, error: "Could not update the address." };
  }
}

export async function deleteAddress(addressId: string): Promise<{ ok: boolean; addresses?: Address[] }> {
  try {
    const response = await fetch(`${API_URL}/account/addresses/${addressId}`, { method: "DELETE", credentials: "include" });
    const body = await response.json().catch(() => null);
    return { ok: response.ok, addresses: body?.addresses };
  } catch {
    return { ok: false };
  }
}

export type RazorpayOrderResult =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string }
  | { ok: false; error: string };

export async function createRazorpayOrder(orderId: string, receipt: string): Promise<RazorpayOrderResult> {
  try {
    const response = await fetch(`${API_URL}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId, receipt })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error || `Payment setup failed (${response.status})` };
    return { ok: true, orderId: body.orderId, amount: body.amount, currency: body.currency, keyId: body.keyId };
  } catch {
    return { ok: false, error: "Could not reach the payment service." };
  }
}

export async function verifyPayment(orderId: string, paymentId: string, signature: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId, paymentId, signature })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error || "Payment verification failed" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the payment service." };
  }
}

export type CartLine = {
  lineId: string;
  productId: string;
  variantId: string;
  slug?: string;
  name?: string;
  image?: string;
  price?: number;
  variantLabel?: string;
  quantity: number;
};

export async function getCart(): Promise<CartLine[] | null> {
  try {
    const response = await fetch(`${API_URL}/cart`, { credentials: "include" });
    if (!response.ok) return null;
    const body = await response.json();
    return Array.isArray(body?.items) ? body.items : null;
  } catch {
    return null;
  }
}

export async function saveCart(items: CartLine[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/cart`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  phone?: string;
  emailVerified?: boolean;
};

export type AuthResult =
  | { ok: true; user: AuthUser; message?: string }
  | { ok: false; error: string; code?: string };

// Exchange a Firebase ID token for the httpOnly session cookie.
export async function completeFirebaseAuth(idToken: string, extra?: { firstName?: string; lastName?: string; phone?: string }): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_URL}/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken, ...extra })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: body?.error || `Request failed (${response.status})`, code: body?.details?.code };
    }
    return { ok: true, user: body?.user, message: body?.message };
  } catch {
    return { ok: false, error: "Could not reach the authentication service." };
  }
}

export type AccountMe =
  | { ok: true; user: { _id: string; email: string; firstName?: string; lastName?: string; phone?: string; provider?: string; role: string; addresses: unknown[]; emailVerifiedAt?: string } }
  | { ok: false; error?: string };

export async function fetchMe(): Promise<AccountMe> {
  try {
    const response = await fetch(`${API_URL}/account/me`, { credentials: "include" });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: body?.error };
    return { ok: true, user: body?.user };
  } catch {
    return { ok: false, error: "Could not reach the account service." };
  }
}