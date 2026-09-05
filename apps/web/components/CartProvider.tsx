"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, Product, ProductVariant } from "@/lib/types";
import { variantInStock } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics";
import { resolveUnitPrice } from "@/lib/pricing";
import { getCart, saveCart, checkStock, type CartLine } from "@/lib/api";
import { useAuth } from "@/components/useAuth";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, variant: ProductVariant, quantity?: number, openDrawer?: boolean) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  refreshStock: () => Promise<CartItem[]>;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const DrawerContext = createContext<{ isOpen: boolean; openCart: () => void; closeCart: () => void } | null>(null);
const STORAGE_KEY = "edwin-leathers-cart-v1";

function toLine(item: CartItem): CartLine {
  return {
    lineId: item.lineId,
    productId: item.productId,
    variantId: item.variantId,
    slug: item.slug,
    name: item.name,
    image: item.image,
    price: item.price,
    priceSnapshot: item.priceSnapshot ?? item.price,
    variantLabel: item.variantLabel,
    variantSnapshot: item.variantSnapshot ?? item.variantLabel,
    quantity: item.quantity,
    isOutOfStock: item.isOutOfStock,
    maxQuantity: item.maxQuantity,
    codAvailable: item.codAvailable
  };
}

function toItem(line: CartLine): CartItem {
  return {
    lineId: line.lineId,
    productId: line.productId,
    variantId: line.variantId,
    slug: line.slug ?? "",
    name: line.name ?? "",
    image: line.image ?? "",
    price: line.price ?? 0,
    priceSnapshot: line.priceSnapshot ?? line.price ?? 0,
    variantLabel: line.variantLabel ?? "",
    variantSnapshot: line.variantSnapshot ?? line.variantLabel ?? "",
    quantity: line.quantity,
    isOutOfStock: line.isOutOfStock,
    maxQuantity: line.maxQuantity,
    codAvailable: line.codAvailable
  };
}

// Union of two carts by lineId, keeping the larger quantity when both exist.
function mergeCarts(server: CartLine[], local: CartLine[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const line of server) map.set(line.lineId, toItem(line));
  for (const line of local) {
    const existing = map.get(line.lineId);
    if (!existing) map.set(line.lineId, toItem(line));
    else if (line.quantity > existing.quantity) map.set(line.lineId, { ...existing, quantity: line.quantity });
  }
  return [...map.values()];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { authed, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  const syncedUserId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Load the guest cart from localStorage (local-only until the user logs in).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore invalid saved state
    } finally {
      setHydrated(true);
    }
  }, []);

  // Keep a local mirror at all times so the cart is never emptied by logout.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // On login/signup, merge the guest (local) cart into the server cart. The
  // server cart is authoritative after that, but we union with local so no
  // items are lost. Reset the sync flag when logged out so a fresh login
  // always re-fetches the server cart instead of reusing a stale mirror.
  useEffect(() => {
    if (!authed) syncedUserId.current = null;
  }, [authed]);

  useEffect(() => {
    if (!authed || !user) return;
    if (syncedUserId.current === user._id) return;
    syncedUserId.current = user._id;
    (async () => {
      const server = await getCart();
      if (server) {
        setItems((local) => mergeCarts(server, local.map(toLine)));
      }
    })();
  }, [authed, user]);

  // While logged in, persist cart changes to the server (debounced).
  useEffect(() => {
    if (!hydrated || !authed || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCart(itemsRef.current.map(toLine));
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [items, hydrated, authed, user]);

  const addItem = useCallback((product: Product, variant: ProductVariant, quantity = 1, openDrawer = true) => {
    if (!variantInStock(variant)) return;
    const lineId = `${product.id}:${variant.id}`;
    const unitPrice = resolveUnitPrice(variant);
    trackAddToCart({
      item_id: product.id,
      item_name: product.name,
      price: unitPrice,
      quantity,
      item_category: product.category,
      item_variant: variant.label
    });
    setItems((current) => {
      const found = current.find((item) => item.lineId === lineId);
      if (found) {
        return current.map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: Math.min(item.quantity + quantity, variant.allowBackorder ? Infinity : Math.max(variant.inventory, 1)) }
            : item
        );
      }
      return [
        ...current,
        {
          lineId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: unitPrice,
          priceSnapshot: unitPrice,
          variantId: variant.id,
          variantLabel: variant.label,
          variantSnapshot: variant.label,
          quantity: Math.min(quantity, variant.allowBackorder ? Infinity : Math.max(variant.inventory, 1))
        }
      ];
    });
    if (openDrawer) setIsOpen(true);
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  // Re-check live stock for every cart line. Out-of-stock lines get flagged so
  // they're shown separately and excluded from checkout; in-stock lines get
  // their quantity clamped to what's actually available to avoid conflicts.
  // Returns the updated (clamped) list so callers can build a payload from it
  // immediately without waiting on React state.
  const refreshStock = useCallback(async (): Promise<CartItem[]> => {
    const current = itemsRef.current;
    if (current.length === 0) return current;
    const checked = await checkStock(current.map(toLine));
    if (checked.length === 0) return current;
    const next = (prev: CartItem[]) => prev.map((item) => {
      const live = checked.find((c) => c.lineId === item.lineId);
      if (!live) return item;
      const out = Boolean(live.isOutOfStock);
      const max = live.maxQuantity && live.maxQuantity > 0 ? live.maxQuantity : undefined;
      const quantity = out ? item.quantity : max ? Math.min(item.quantity, max) : item.quantity;
      return { ...item, isOutOfStock: out, maxQuantity: max ?? item.maxQuantity, quantity };
    });
    setItems(next);
    return next(current);
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.lineId !== lineId));
      return;
    }
    setItems((current) => current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // Persist empty cart to server immediately (skip debounce to avoid race on navigation).
    if (hydrated && authed && user) {
      saveCart([]).catch(() => {});
    }
  }, [hydrated, authed, user]);

  const value = useMemo(
    () => {
      const available = items.filter((item) => !item.isOutOfStock);
      return {
        items,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: available.reduce((sum, item) => sum + item.quantity * item.price, 0),
        addItem,
        removeItem,
        setQuantity,
        refreshStock,
        clearCart
      };
    },
    [items, addItem, removeItem, setQuantity, refreshStock, clearCart]
  );

  const drawerValue = useMemo(() => ({
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false)
  }), [isOpen]);

  return (
    <CartContext.Provider value={value}>
      <DrawerContext.Provider value={drawerValue}>
        {children}
      </DrawerContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function useCartDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("useCartDrawer must be used inside CartProvider");
  return context;
}