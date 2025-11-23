// src/hooks/useCart.js
// Unified cart hook used by CustomerStore, CartSidebar, and Checkout
import { useEffect, useMemo, useState, useCallback } from "react";

/**
 * useCart
 * @param {string|null} storeId - optional; if provided we persist cart per store
 */
export const useCart = (storeId = null) => {
  const storageKey = useMemo(
    () => (storeId ? `mfc_cart_${storeId}` : "mfc_cart_global"),
    [storeId]
  );

  // items: [{ id, name, price, qty, availablePreferences?, selectedPreferences?, instructions? }]
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      // Ensure qty exists
      if (!Array.isArray(parsed)) return [];
      return parsed.map((it) => {
        const availablePreferences = Array.isArray(it.availablePreferences) ? it.availablePreferences : [];
        const selectedPreferences = Array.isArray(it.selectedPreferences) ? it.selectedPreferences : [];
        const normalizedSelected =
          availablePreferences.length > 0 && selectedPreferences.length === 0
            ? [availablePreferences[0]]
            : selectedPreferences;

        return {
          ...it,
          qty: Math.max(1, Number(it.qty) || 1),
          availablePreferences,
          selectedPreferences: normalizedSelected,
        };
      });
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* no-op */
    }
  }, [items, storageKey]);

  // Add or increment an item
  const addItem = useCallback((item) => {
    if (!item) return;
    const id = item.id ?? crypto.randomUUID?.() ?? String(Date.now());
    const name = item.name ?? "Item";
    const price = Number(item.price) || 0;
    const qtyToAdd = Math.max(1, Number(item.qty) || 1);
    const image_url = item.image_url ?? item.image ?? item.imageUrl ?? null;
    const availablePreferences = Array.isArray(item.availablePreferences)
      ? item.availablePreferences
      : Array.isArray(item.preferences)
        ? item.preferences
        : [];
    const selectedPreferences = Array.isArray(item.selectedPreferences)
      ? item.selectedPreferences
      : availablePreferences.length > 0
        ? [availablePreferences[0]]
        : [];

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx !== -1) {
        const copy = prev.slice();
        copy[idx] = {
          ...copy[idx],
          qty: (copy[idx].qty || 1) + qtyToAdd,
          availablePreferences: availablePreferences.length ? availablePreferences : (copy[idx].availablePreferences || []),
          selectedPreferences: selectedPreferences.length
            ? selectedPreferences
            : (copy[idx].selectedPreferences || []),
        };
        return copy;
      }
      return [...prev, {
        id,
        name,
        price,
        qty: qtyToAdd,
        image_url,
        availablePreferences,
        selectedPreferences,
      }];
    });
  }, []);

  // Decrement quantity by 1 (or qtyToRemove) and remove if reaches 0
  const removeItem = useCallback((id, _priceIgnored, qtyToRemove = 1) => {
    if (!id) return;
    const dec = Math.max(1, Number(qtyToRemove) || 1);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const current = prev[idx];
      const nextQty = (current.qty || 1) - dec;
      if (nextQty <= 0) {
        return prev.filter((i) => i.id !== id);
      }
      const copy = prev.slice();
      copy[idx] = { ...current, qty: nextQty };
      return copy;
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const updateItem = useCallback((id, updates) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  }, []);

  const getTotal = useCallback(() =>
    items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1), 0), [items]
  );

  const getTotalItems = useCallback(() =>
    items.reduce((sum, i) => sum + (Number(i.qty) || 1), 0), [items]
  );

  return {
    items,
    addItem,
    removeItem,
    clearCart,
    getTotal,
    getTotalItems,
    updateItem,
  };
};
