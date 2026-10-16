import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { listMyBusinesses } from "@/lib/supabaseCatalog";

const BusinessContext = createContext(null);
const STORAGE_KEY = "vimi:selectedBusiness";

export function BusinessProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(STORAGE_KEY) || null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const useSupabase = import.meta.env.VITE_AUTH_PROVIDER === "supabase";
      const list = useSupabase
        ? await listMyBusinesses()
        : await base44.entities.Business.filter({ created_by_id: user.id }, "-created_date", 100);
      setBusinesses(list || []);
      setSelectedId((prev) => {
        if (prev && (list || []).some((b) => b.id === prev)) return prev;
        return list && list[0] ? list[0].id : null;
      });
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectBusiness = (id) => {
    setSelectedId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const selectedBusiness = businesses.find((b) => b.id === selectedId) || null;

  return (
    <BusinessContext.Provider
      value={{ businesses, loading, selectedBusiness, selectedId, selectBusiness, refresh }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);