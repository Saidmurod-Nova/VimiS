import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

const BuyerContext = createContext(null);
const LOC_KEY = "vimi:selectedLocation";

export function BuyerProvider({ children }) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOC_KEY)) || null; } catch { return null; }
  });
  const [stores, setStores] = useState({ items: [], favorites: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) { setStores({ items: [], favorites: [] }); setLoading(false); return; }
    setLoading(true);
    try {
      const businessFields = "id,name,description,logo_url,category_id,category_name,store_id,branches(id,name,country,region,city,district,is_active)";
      const [savedResult, favoriteResult] = await Promise.all([
        supabase.from("saved_stores")
          .select(`id,last_visited_at,business:businesses(${businessFields})`)
          .eq("user_id", user.id)
          .order("last_visited_at", { ascending: false, nullsFirst: false }),
        supabase.from("favorite_stores")
          .select(`id,business:businesses(${businessFields})`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (savedResult.error) throw savedResult.error;
      if (favoriteResult.error) throw favoriteResult.error;

      const toStore = (row, isFavorite) => {
        if (!row.business) return null;
        const branches = (row.business.branches || []).filter((branch) => branch.is_active);
        const branch = branches[0];
        return {
          business: { ...row.business, branches },
          location: branch ? [branch.district, branch.city, branch.region, branch.country].filter(Boolean).join(", ") : "",
          branch_count: branches.length,
          has_new: false,
          is_favorite: isFavorite,
          ...(isFavorite ? { favorite_id: row.id } : { saved: { id: row.id, last_visited_at: row.last_visited_at } }),
        };
      };
      setStores({
        items: (savedResult.data || []).map((row) => toStore(row, false)).filter(Boolean),
        favorites: (favoriteResult.data || []).map((row) => toStore(row, true)).filter(Boolean),
      });
    } catch {
      setStores({ items: [], favorites: [] });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load persisted location preference from the user record (server-side) once available.
  useEffect(() => {
    if (user?.selected_location) {
      setSelectedLocation(user.selected_location);
      localStorage.setItem(LOC_KEY, JSON.stringify(user.selected_location));
    }
  }, [user?.id, user?.selected_location]);

  useEffect(() => { refresh(); }, [refresh]);

  const setLocation = useCallback(async (loc) => {
    if (user) await updateUser({ selected_location: loc });
    setSelectedLocation(loc);
    if (loc) localStorage.setItem(LOC_KEY, JSON.stringify(loc)); else localStorage.removeItem(LOC_KEY);
  }, [user, updateUser]);

  const connectStore = useCallback(async (storeId) => {
    if (!user) throw new Error("Authentication required");
    let lookup = await supabase.from("businesses").select("id").eq("id", storeId).maybeSingle();
    if (lookup.error) throw lookup.error;
    if (!lookup.data) {
      lookup = await supabase.from("businesses").select("id").eq("store_id", storeId).maybeSingle();
      if (lookup.error) throw lookup.error;
    }
    if (!lookup.data) throw new Error("Store not found");
    const { data, error } = await supabase.from("saved_stores")
      .upsert({ user_id: user.id, business_id: lookup.data.id }, { onConflict: "user_id,business_id" })
      .select("id,business_id")
      .single();
    if (error) throw error;
    await refresh();
    return data;
  }, [refresh, user]);

  const markVisited = useCallback(async (businessId) => {
    try {
      if (!user) return;
      const { error } = await supabase.from("saved_stores").upsert(
        { user_id: user.id, business_id: businessId, last_visited_at: new Date().toISOString() },
        { onConflict: "user_id,business_id" },
      );
      if (error) throw error;
    } catch {}
    // Refresh in background so recently-visited ordering stays current.
    refresh();
  }, [refresh, user]);

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
        const { error } = await supabase.from("favorite_stores").delete().eq("id", existing.favorite_id).eq("user_id", user.id);
        if (error) throw error;
      } else if (user) {
        const { error } = await supabase.from("favorite_stores").insert({ user_id: user.id, business_id: businessId });
        if (error) throw error;
      }
    } catch (e) {
      await refresh(); // revert optimistic change
      throw e;
    }
    await refresh();
  }, [stores, user, refresh]);

  const removeSavedStore = useCallback(async (savedId) => {
    setStores((prev) => ({ ...prev, items: prev.items.filter((i) => i.saved.id !== savedId) }));
    try {
      const { error } = await supabase.from("saved_stores").delete().eq("id", savedId).eq("user_id", user.id);
      if (error) throw error;
    }
    catch (e) { await refresh(); throw e; }
    await refresh();
  }, [refresh, user]);

  return (
    <BuyerContext.Provider value={{ selectedLocation, setLocation, stores, loading, refresh, connectStore, markVisited, isFavorite, toggleFavorite, removeSavedStore }}>
      {children}
    </BuyerContext.Provider>
  );
}

export const useBuyer = () => useContext(BuyerContext);