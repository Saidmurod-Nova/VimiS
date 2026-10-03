import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Buyer cart state. The cart lives on the server (single active cart per user,
// single business + branch). This context mirrors it: every mutation calls the
// backend function then refreshes, so the UI never holds an authoritative
// local copy that could drift. addItem surfaces business/branch conflicts so
// the calling page can show a clear-and-add dialog.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [business, setBusiness] = useState(null);
  const [branch, setBranch] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null); setItems([]); setBusiness(null); setBranch(null);
      setSubtotal(0); setTotalItems(0); setError(""); return;
    }
    setLoading(true); setError("");
    try {
      const res = await base44.functions.invoke("getMyCart", {});
      const d = res.data || {};
      setCart(d.cart || null);
      setItems(d.items || []);
      setBusiness(d.business || null);
      setBranch(d.branch || null);
      setSubtotal(d.subtotal || 0);
      setTotalItems(d.total_items || 0);
    } catch (e) {
      setError(e?.response?.data?.error || "Savat yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (product_id, branch_id, quantity = 1, opts = {}) => {
    const res = await base44.functions.invoke("addToCart", {
      product_id, branch_id, quantity, force_new: !!opts.forceNew
    });
    const d = res.data || {};
    if (d.conflict) return { conflict: true, current_cart: d.current_cart };
    await refresh();
    return { ok: true, quantity: d.quantity };
  }, [refresh]);

  const updateQuantity = useCallback(async (cart_item_id, quantity) => {
    await base44.functions.invoke("updateCartItem", { cart_item_id, quantity });
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (cart_item_id) => {
    await base44.functions.invoke("removeCartItem", { cart_item_id });
    await refresh();
  }, [refresh]);

  const clearCart = useCallback(async () => {
    await base44.functions.invoke("clearCart", {});
    await refresh();
  }, [refresh]);

  return (
    <CartContext.Provider value={{ cart, items, business, branch, subtotal, totalItems, loading, error, refresh, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);