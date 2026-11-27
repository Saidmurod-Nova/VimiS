import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bell, Check, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isSupabaseMode, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const notificationColumns = "id,recipient_id,type,title,message,link,data,is_read,created_at";

/**
 * @typedef {object} NotificationRecord
 * @property {string} id
 * @property {string} recipient_id
 * @property {string | null} type
 * @property {string} title
 * @property {string | null} message
 * @property {string | null} link
 * @property {Record<string, unknown> | null} data
 * @property {boolean} is_read
 * @property {string} created_at
 */

function relativeTime(timestamp) {
  const elapsedSeconds = (Date.now() - new Date(timestamp).getTime()) / 1000;
  if (!Number.isFinite(elapsedSeconds)) return "";
  if (Math.abs(elapsedSeconds) < 45) return "Hozir";

  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, seconds] = units.find(([, unitSeconds]) => Math.abs(elapsedSeconds) >= unitSeconds) || units[6];
  return new Intl.RelativeTimeFormat("uz", { numeric: "auto" }).format(
    -Math.round(elapsedSeconds / seconds),
    unit
  );
}

function getInternalPath(link) {
  if (typeof link !== "string" || !link.startsWith("/") || link.startsWith("//") || /[\\\u0000-\u001f]/.test(link)) {
    return null;
  }
  try {
    const url = new URL(link, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requestId = useRef(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(
    /** @type {NotificationRecord[]} */ ([])
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [realtimeError, setRealtimeError] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const loadNotifications = useCallback(async () => {
    const activeRequestId = ++requestId.current;
    if (!user?.id || !isSupabaseMode || !supabase) {
      setNotifications([]);
      setUnreadCount(0);
      setError("Bildirishnomalar uchun Supabase hisobiga kirish kerak.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [listResult, countResult] = await Promise.all([
        supabase
          .from("notifications")
          .select(notificationColumns)
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("is_read", false),
      ]);
      if (listResult.error) throw listResult.error;
      if (countResult.error) throw countResult.error;
      if (activeRequestId !== requestId.current) return;
      setNotifications(listResult.data || []);
      setUnreadCount(countResult.count || 0);
    } catch (loadError) {
      console.error("Bildirishnomalarni yuklab bo‘lmadi.", loadError);
      if (activeRequestId === requestId.current) {
        setError("Bildirishnomalarni yuklab bo‘lmadi. Qayta urinib ko‘ring.");
      }
    } finally {
      if (activeRequestId === requestId.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    setRealtimeError(false);
    if (!user?.id || !isSupabaseMode || !supabase) {
      return () => { requestId.current += 1; };
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        loadNotifications
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeError(false);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Bildirishnomalar Realtime holati: ${status}`);
          setRealtimeError(true);
        }
      });

    return () => {
      requestId.current += 1;
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, user?.id]);

  const markOneAsRead = async (notification) => {
    const internalPath = notification.link ? getInternalPath(notification.link) : null;
    setUpdatingId(notification.id);
    setError("");
    try {
      if (!notification.is_read) {
        if (!supabase || !user?.id) throw new Error("Supabase hisobiga kirilmadi.");
        const { data: updatedRows, error: updateError } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification.id)
          .eq("recipient_id", user.id)
          .select("id");
        if (updateError) throw updateError;
        if (!updatedRows?.length) throw new Error("Bildirishnoma yangilanmadi.");

        setNotifications((current) =>
          current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item)
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      if (notification.link && !internalPath) {
        setError("Bildirishnoma havolasi xavfsiz ichki manzil emas.");
        return;
      }
      setOpen(false);
      if (internalPath) navigate(internalPath);
    } catch (updateError) {
      console.error("Bildirishnomani o‘qilgan deb belgilab bo‘lmadi.", updateError);
      setError("Bildirishnomani yangilab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setUpdatingId("");
    }
  };

  const markAllAsRead = async () => {
    if (!supabase || !user?.id) {
      setError("Supabase hisobiga kirilmadi.");
      return;
    }
    setSavingAll(true);
    setError("");
    try {
      const { data: updatedRows, error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false)
        .select("id");
      if (updateError) throw updateError;
      if (unreadCount > 0 && !updatedRows?.length) {
        throw new Error("O‘qilmagan bildirishnomalar yangilanmadi.");
      }
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (updateError) {
      console.error("Barcha bildirishnomalarni yangilab bo‘lmadi.", updateError);
      setError("Bildirishnomalarni yangilab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) loadNotifications();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Bildirishnomalar${unreadCount > 0 ? `, ${unreadCount} ta o‘qilmagan` : ""}`}
          aria-expanded={open}
          className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-white/90 transition hover:bg-white/10"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="liquid-surface w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl p-0"
      >
        <div className="flex flex-col items-start justify-between gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold">Bildirishnomalar</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount ? `${unreadCount} ta o‘qilmagan` : "Yangi xabarlar"}
            </p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || savingAll}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingAll ? "Saqlanmoqda..." : "Hammasini o‘qilgan deb belgilash"}
          </button>
        </div>
        {error && (
          <div role="alert" className="border-b border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            <button type="button" onClick={loadNotifications} className="mt-1 font-semibold underline">
              Qayta urinish
            </button>
          </div>
        )}
        {realtimeError && (
          <p role="status" className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
            Jonli yangilanishlar mavjud emas. Ro‘yxatni yangilash uchun panelni qayta oching.
          </p>
        )}
        <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Yuklanmoqda...
            </div>
          ) : notifications.length === 0 && !error ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              Hozircha bildirishnomalar yo‘q.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-border/70 last:border-0">
                  <button
                    type="button"
                    onClick={() => markOneAsRead(notification)}
                    disabled={updatingId === notification.id}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-secondary/70 disabled:opacity-60 ${notification.is_read ? "" : "bg-primary/[0.04]"}`}
                  >
                    <span className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
                      {notification.is_read
                        ? <Check className="h-3.5 w-3.5" />
                        : <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{notification.title}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {relativeTime(notification.created_at)}
                        </span>
                      </span>
                      {notification.message && (
                        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                          {notification.message}
                        </span>
                      )}
                      <span className="sr-only">{notification.is_read ? "O‘qilgan" : "O‘qilmagan"}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate("/notifications");
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-border/70 px-4 text-sm font-semibold text-primary transition hover:bg-primary/5"
        >
          Barcha bildirishnomalar
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </PopoverContent>
    </Popover>
  );
}
