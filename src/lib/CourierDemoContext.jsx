import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { initialDeliveries } from "@/lib/courierDemo";
import {
  acceptCourierDelivery,
  getCourierState,
  requestCourierAccess as requestCourierAccessSupabase,
  setCourierAvailability,
  updateCourierDelivery,
} from "@/lib/supabaseCourier";
import { isSupabaseMode, supabase } from "@/lib/supabase";

const CourierDemoContext = createContext(null);
const nextMockStatus = {
  accepted: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "completed",
};
const nextDatabaseStatus = {
  accepted: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered",
};

export function CourierDemoProvider({ children }) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const stateRequestId = useRef(0);
  const [deliveries, setDeliveries] = useState(isSupabaseMode ? [] : initialDeliveries);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [courierCode, setCourierCode] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [authorizationStatus, setAuthorizationStatus] = useState(isSupabaseMode ? "not_requested" : "demo");
  const [loading, setLoading] = useState(isSupabaseMode);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isSupabaseMode) return true;
    if (!isAuthenticated) {
      stateRequestId.current += 1;
      setLoading(false);
      setError("");
      setCourierCode(null);
      setIsOnline(false);
      setAuthorizationStatus("not_requested");
      setAvailableDeliveries([]);
      setDeliveries([]);
      return true;
    }
    const requestId = ++stateRequestId.current;
    setLoading(true);
    setError("");
    try {
      const state = await getCourierState();
      if (requestId !== stateRequestId.current) return false;
      setAuthorizationStatus(state.authorizationStatus);
      setCourierCode(state.courierCode);
      setIsOnline(state.isOnline);
      setAvailableDeliveries(state.availableDeliveries);
      setDeliveries([...state.availableDeliveries, ...state.activeDeliveries, ...state.completedDeliveries]);
      return true;
    } catch (loadError) {
      if (requestId !== stateRequestId.current) return false;
      console.error("Kuryerlik ma’lumotlarini yuklab bo‘lmadi.", loadError);
      setError(loadError?.message || "Kuryerlik ma’lumotlarini yuklab bo‘lmadi.");
      return false;
    } finally {
      if (requestId === stateRequestId.current) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isSupabaseMode || !isAuthenticated) {
      stateRequestId.current += 1;
      setLoading(false);
      setError("");
      if (isSupabaseMode) {
        setDeliveries([]);
        setAvailableDeliveries([]);
        setCourierCode(null);
        setIsOnline(false);
        setAuthorizationStatus("not_requested");
      }
      return undefined;
    }
    void refresh();
    if (!supabase) return undefined;

    const channel = supabase
      .channel("courier-deliveries")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "courier_deliveries",
      }, () => { void refresh(); })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Kuryerlik Realtime holati: ${status}`);
        }
      });
    const refreshTimer = window.setInterval(() => { void refresh(); }, 30_000);

    return () => {
      stateRequestId.current += 1;
      window.clearInterval(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, refresh]);

  const notifyDemo = useCallback((title, description) => {
    toast({ title, description: `Demo: ${description}` });
  }, [toast]);

  const notifyError = useCallback((title, actionError) => {
    const message = actionError?.message || "Amalni bajarib bo‘lmadi.";
    setError(message);
    console.error(title, actionError);
    toast({ title, description: message, variant: "destructive" });
  }, [toast]);

  const requestCourierAccess = useCallback(async () => {
    try {
      const status = await requestCourierAccessSupabase();
      setAuthorizationStatus(status);
      await refresh();
      toast({ title: "So‘rov yuborildi", description: "Kuryerlik ruxsati administrator tomonidan ko‘rib chiqiladi." });
      return true;
    } catch (requestError) {
      notifyError("Kuryerlik ruxsatini so‘rab bo‘lmadi.", requestError);
      return false;
    }
  }, [notifyError, refresh, toast]);

  const acceptDelivery = useCallback(async (deliveryId) => {
    if (isSupabaseMode) {
      try {
        await acceptCourierDelivery(deliveryId);
        const refreshed = await refresh();
        if (!refreshed) return false;
        toast({ title: "Buyurtma qabul qilindi" });
        return true;
      } catch (acceptError) {
        notifyError("Buyurtmani qabul qilib bo‘lmadi.", acceptError);
        return false;
      }
    }

    if (!isOnline) {
      notifyDemo("Onlayn holatga o‘ting", "oflayn demo rejimida buyurtmani qabul qilib bo‘lmaydi.");
      return false;
    }
    const delivery = deliveries.find((item) => item.id === deliveryId && item.status === "available");
    if (!delivery) {
      notifyDemo("Buyurtma mavjud emas", "namuna buyurtmasining holati o‘zgargan.");
      return false;
    }
    setDeliveries((current) => current.map((item) => item.id === deliveryId
      ? { ...item, status: "accepted", acceptedAt: "Hozirgina" }
      : item));
    notifyDemo("Buyurtma qabul qilindi", `${delivery.id} holati faqat demo ko‘rinishida yangilandi.`);
    return true;
  }, [deliveries, isOnline, notifyDemo, notifyError, refresh, toast]);

  const advanceDelivery = useCallback(async (deliveryId) => {
    const delivery = deliveries.find((item) => item.id === deliveryId);
    if (isSupabaseMode) {
      const nextStatus = nextDatabaseStatus[delivery?.status];
      if (!nextStatus) {
        notifyError("Buyurtma holatini o‘zgartirib bo‘lmadi.", new Error("Bu buyurtma uchun keyingi amal mavjud emas."));
        return false;
      }
      try {
        await updateCourierDelivery(deliveryId, nextStatus);
        const refreshed = await refresh();
        if (!refreshed) return false;
        toast({ title: "Buyurtma holati yangilandi" });
        return true;
      } catch (updateError) {
        notifyError("Buyurtma holatini o‘zgartirib bo‘lmadi.", updateError);
        return false;
      }
    }

    const nextStatus = nextMockStatus[delivery?.status];
    if (!nextStatus) {
      notifyDemo("Holat o‘zgarmadi", "ushbu namuna buyurtma uchun keyingi amal yo‘q.");
      return false;
    }
    setDeliveries((current) => current.map((item) => item.id === deliveryId
      ? {
        ...item,
        status: nextStatus,
        completedAt: nextStatus === "completed" ? "Hozirgina" : item.completedAt,
      }
      : item));
    notifyDemo("Holat demo rejimida yangilandi", `${delivery.id} · ${nextStatus}.`);
    return true;
  }, [deliveries, notifyDemo, notifyError, refresh, toast]);

  const updateAvailability = useCallback(async (nextOnline) => {
    if (isSupabaseMode) {
      try {
        await setCourierAvailability(nextOnline);
        const refreshed = await refresh();
        if (!refreshed) return false;
        toast({ title: nextOnline ? "Kuryerlik rejimi yoqildi" : "Kuryerlik rejimi o‘chirildi" });
        return true;
      } catch (availabilityError) {
        notifyError("Kuryerlik holatini saqlab bo‘lmadi.", availabilityError);
        return false;
      }
    }

    setIsOnline(nextOnline);
    notifyDemo(
      nextOnline ? "Kuryerlik rejimi yoqildi" : "Kuryerlik rejimi o‘chirildi",
      nextOnline
        ? "onlayn holat faqat interfeysda ko‘rsatiladi."
        : "yangi takliflar berkitildi; faol buyurtmalar bekor qilinmadi."
    );
    return true;
  }, [notifyDemo, notifyError, refresh, toast]);

  const value = useMemo(() => ({
    deliveries,
    availableDeliveries: isSupabaseMode ? availableDeliveries : deliveries.filter((delivery) => delivery.status === "available"),
    courierCode,
    isOnline,
    authorizationStatus,
    loading,
    error,
    isSupabaseBacked: isSupabaseMode,
    refresh,
    requestCourierAccess,
    acceptDelivery,
    advanceDelivery,
    updateAvailability,
  }), [
    deliveries,
    availableDeliveries,
    courierCode,
    isOnline,
    authorizationStatus,
    loading,
    error,
    refresh,
    requestCourierAccess,
    acceptDelivery,
    advanceDelivery,
    updateAvailability,
  ]);

  return <CourierDemoContext.Provider value={value}>{children}</CourierDemoContext.Provider>;
}

export function useCourierDemo() {
  const context = useContext(CourierDemoContext);
  if (!context) throw new Error("useCourierDemo must be used within CourierDemoProvider");
  return context;
}
