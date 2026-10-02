import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const BuyerContext = createContext(null);
const LOC_KEY = "vimi:selectedLocation";

export function BuyerProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOC_KEY)) || null; } catch { return null; }
  });
  const [stores, setStores] = useState({ items: [], favorites: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) { setStores({ items: [], favorites: [] }); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getBuyerStores", {});
      setStores(res.data || { items: [], favorites: [] });
    } catch {
      setStores({ items: [], favorites: [] });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load persisted location preference from the user record (server-side) once available.
  useEffect(() => {
    if (user && user.selected_location) setSelectedLocation(user.selected_location);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setLocation = useCallback(async (loc) => {
    setSelectedLocation(loc);
    if (loc) localStorage.setItem(LOC_KEY, JSON.stringify(loc)); else localStorage.removeItem(LOC_KEY);
    if (user) { try { await base44.auth.updateMe({ selected_location: loc }); } catch {} }
  }, [user]);

  const connectStore = useCallback(async (storeId) => {
    const res = await base44.functions.invoke("connectStore", { store_id: storeId });
    await refresh();
    return res.data;
  }, [refresh]);

  const markVisited = useCallback(async (businessId) => {
    try { await base44.functions.invoke("markStoreVisited", { business_id: businessId }); } catch {}
    // Refresh in background so recently-visited ordering stays current.
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((businessId) => stores.favorites.some((f) => f.business.id === businessId), [stores]);

  const toggleFavorite = useCallback(async (businessId, businessObj) => {
    const existing = stores.favorites.find((f) => f.business.id === businessId);
    // Optimistic update for immediate UI feedback.
    setStores((prev) => {
      if (existing) return { ...prev, favorites: prev.favorites.filter((f) => f.business.id !== businessId) };
      const biz = businessObj || prev.favorites.find((f) => f.business.id === businessId)?.business || prev.items.find((i) => i.business.id === businessId)?.business;
      return biz ? { ...prev, favorites: [...prev.favorites, { business: biz, favorite_id: "temp", location: "", branch_count: 0, has_new: false, is_favorite: true }] } : prev;
    });
    try {
      if (existing) {
        await base44.entities.FavoriteStore.delete(existing.favorite_id);
      } else if (user) {
        await base44.entities.FavoriteStore.create({ user_id: user.id, business_id: businessId });
      }
    } catch (e) {
      await refresh(); // revert optimistic change
      throw e;
    }
    await refresh();
  }, [stores, user, refresh]);

  const removeSavedStore = useCallback(async (savedId) => {
    setStores((prev) => ({ ...prev, items: prev.items.filter((i) => i.saved.id !== savedId) }));
    try { await base44.entities.SavedStore.delete(savedId); }
    catch (e) { await refresh(); throw e; }
    await refresh();
  }, [refresh]);

  return (
    <BuyerContext.Provider value={{ selectedLocation, setLocation, stores, loading, refresh, connectStore, markVisited, isFavorite, toggleFavorite, removeSavedStore }}>
      {children}
    </BuyerContext.Provider>
  );
}

export const useBuyer = () => useContext(BuyerContext);