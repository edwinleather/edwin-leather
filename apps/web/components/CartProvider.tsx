"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, Product, ProductVariant } from "@/lib/types";
import { variantInStock } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics";
import { getCart, saveCart, type CartLine } from "@/lib/api";
import { useAuth } from "@/components/useAuth";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
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
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    isOutOfStock: item.isOutOfStock,
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
    variantLabel: line.variantLabel ?? "",
    quantity: line.quantity,
    isOutOfStock: line.isOutOfStock,
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

  const addItem = useCallback((product: Product, variant: ProductVariant, quantity = 1) => {
    if (!variantInStock(variant)) return;
    const lineId = `${product.id}:${variant.id}`;
    trackAddToCart({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity,
      item_category: product.category,
      item_variant: variant.label
    });
    setItems((current) => {
      const found = current.find((item) => item.lineId === lineId);
      if (found) {
        return current.map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: Math.min(item.quantity + quantity, Math.max(variant.inventory, 1)) }
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
          price: product.price,
          variantId: variant.id,
          variantLabel: variant.label,
          quantity: Math.min(quantity, Math.max(variant.inventory, 1))
        }
      ];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.lineId !== lineId));
      return;
    }
    setItems((current) => current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)));
  }, []);

  const value = useMemo(
    () => {
      const available = items.filter((item) => !item.isOutOfStock);
      return {
        items,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: available.reduce((sum, item) => sum + item.quantity * item.price, 0),
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        removeItem,
        setQuantity,
        clearCart: () => setItems([])
      };
    },
    [items, isOpen, addItem, removeItem, setQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}