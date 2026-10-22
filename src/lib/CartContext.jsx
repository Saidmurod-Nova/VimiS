import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getCart, addToCart as addToCartSupabase, updateCartItemQuantity, removeCartItem, clearCart as clearCartSupabase } from "@/lib/supabaseCart";
import { getAuthErrorMessage } from "@/lib/supabase";

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
      const payload = await getCart();
      setCart(payload.cart || null);
      setItems(payload.items || []);
      setBusiness(payload.business || null);
      setBranch(payload.branch || null);
      setSubtotal(payload.subtotal || 0);
      setTotalItems(payload.total_items || 0);
    } catch (e) {
      console.log("Error fetching cart:", e);
      setError(getAuthErrorMessage(e, 'Savat yuklanmadi'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (product_id, branch_id, quantity = 1, opts = {}) => {
    const previous = [...items];
    try {
      const result = await addToCartSupabase({
        product_id,
        branch_id,
        quantity,
        forceNew: !!opts.forceNew,
      });
      if (result?.conflict) return { conflict: true, current_cart: result.current_cart };
      await refresh();
      return { ok: true, quantity: result?.quantity ?? quantity };
    } catch (e) {
      setItems(previous);
      setError(getAuthErrorMessage(e, 'Mahsulot savatga qo‘shilmadi.'));
      throw e;
    }
  }, [items, refresh]);

  const updateQuantity = useCallback(async (cart_item_id, quantity) => {
    const previous = [...items];
    const nextQty = Number(quantity);

    setItems((prev) => prev.map((item) => item.cart_item_id === cart_item_id
      ? { ...item, quantity: nextQty, subtotal: nextQty * Number(item.unit_price || 0) }
      : item));
    try {
      await updateCartItemQuantity(cart_item_id, quantity);
      await refresh();
    } catch (e) {
      setItems(previous);
      setError(getAuthErrorMessage(e, 'Miqdor yangilanmadi.'));
      throw e;
    }
  }, [items, refresh]);

  const removeItem = useCallback(async (cart_item_id) => {
    const previous = [...items];
    setItems((prev) => prev.filter((item) => item.cart_item_id !== cart_item_id));
    try {
      await removeCartItem(cart_item_id);
      await refresh();
    } catch (e) {
      setItems(previous);
      setError(getAuthErrorMessage(e, 'Mahsulot o‘chirilmadi.'));
      throw e;
    }
  }, [items, refresh]);

  const clearCart = useCallback(async () => {
    const previous = [...items];
    setItems([]);
    try {
      await clearCartSupabase();
      await refresh();
    } catch (e) {
      setItems(previous);
      setError(getAuthErrorMessage(e, 'Savat tozalanmadi.'));
      throw e;
    }
  }, [items, refresh]);

  return (
    <CartContext.Provider value={{ cart, items, business, branch, subtotal, totalItems, loading, error, refresh, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);