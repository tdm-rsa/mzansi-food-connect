// src/hooks/useCart.js
// ✅ Unified cart hook for templates and Designer preview
import { useEffect, useMemo, useState } from "react";

/**
 * useCart
 * @param {string|null} storeId - optional; if provided we persist cart per store
 */
export const useCart = (storeId = null) => {
  const storageKey = useMemo(
    () => (storeId ? `mfc_cart_${storeId}` : "mfc_cart_global"),
    [storeId]
  );

  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      /* no-op */
    }
  }, [cart, storageKey]);

  // Add an item (expects { id, name, price })
  const addItem = (item) => {
    if (!item) return;
    const normalized = {
      id: item.id ?? crypto.randomUUID?.() ?? String(Date.now()),
      name: item.name ?? "Item",
      price: Number(item.price) || 0,
    };
    setCart((prev) => [...prev, normalized]);
  };

  // Remove by id (removes first match)
  const removeItem = (id) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const copy = prev.slice();
      copy.splice(idx, 1);
      return copy;
    });
  };

  // Clear all
  const clearCart = () => setCart([]);

  // Sum total
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
    [cart]
  );

  return { cart, addItem, removeItem, clearCart, total };
};
