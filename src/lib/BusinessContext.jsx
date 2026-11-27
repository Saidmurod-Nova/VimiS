import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { listMyBusinesses } from "@/lib/supabaseCatalog";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const requestId = useRef(0);

  const workspaceId = pathname.match(/^\/business\/([^/]+)/)?.[1];
  const activeBusinessId = workspaceId && workspaceId !== "new" ? workspaceId : null;

  useEffect(() => {
    setSelectedBranchId("all");
  }, [activeBusinessId, user?.id]);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!isAuthenticated || !user) {
      setBusinesses([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const useSupabase = import.meta.env.VITE_AUTH_PROVIDER === "supabase";
      const list = useSupabase
        ? await listMyBusinesses()
        : await base44.entities.Business.filter({ created_by_id: user.id }, "-created_date", 100);
      if (currentRequest !== requestId.current) return [];
      setBusinesses(list || []);
      return list || [];
    } catch (loadError) {
      if (currentRequest !== requestId.current) return [];
      setBusinesses([]);
      setError(loadError?.message || "Bizneslar ro‘yxatini yuklab bo‘lmadi.");
      return [];
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rememberBusiness = useCallback((business) => {
    if (!business?.id) return;
    setBusinesses((current) => [
      business,
      ...current.filter((item) => item.id !== business.id),
    ]);
    setError("");
  }, []);

  const selectedBusiness = businesses.find((b) => b.id === activeBusinessId) || null;

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        loading,
        error,
        selectedBusiness,
        workspaceId: workspaceId === "new" ? null : workspaceId,
        rememberBusiness,
        selectedBranchId,
        selectBranch: setSelectedBranchId,
        refresh,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);