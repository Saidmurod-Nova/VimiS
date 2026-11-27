import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Circle,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Store,
} from "lucide-react";
import { requireSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/vimi/PageHeader";

const COLUMNS = "id,recipient_id,type,title,message,link,data,is_read,created_at";
const FILTERS = [
  { key: "all", label: "Barchasi" },
  { key: "unread", label: "O‘qilmagan" },
  { key: "read", label: "O‘qilgan" },
];

function getInternalPath(link) {
  if (typeof link !== "string" || !link.startsWith("/") || link.startsWith("//") || /[\\\u0000-\u001f]/.test(link)) {
    return null;
  }
  try {
    const url = new URL(link, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

function relativeTime(timestamp) {
  const seconds = (Date.now() - new Date(timestamp).getTime()) / 1000;
  if (!Number.isFinite(seconds)) return "";
  if (Math.abs(seconds) < 45) return "Hozir";
  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, size] = units.find(([, duration]) => Math.abs(seconds) >= duration) || units[6];
  return new Intl.RelativeTimeFormat("uz", { numeric: "auto" }).format(-Math.round(seconds / size), unit);
}

function notificationIcon(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("order")) return PackageCheck;
  if (normalized.includes("business") || normalized.includes("store")) return Store;
  if (normalized.includes("security") || normalized.includes("account")) return ShieldCheck;
  return BellRing;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [savingAll, setSavingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setError("Bildirishnomalarni ko‘rish uchun tizimga kiring.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: loadError } = await requireSupabase()
        .from("notifications")
        .select(COLUMNS)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (loadError) throw loadError;
      setNotifications(data || []);
    } catch (loadError) {
      console.error("Bildirishnomalarni yuklab bo‘lmadi.", loadError);
      setError("Bildirishnomalarni yuklab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  const typeOptions = useMemo(() => [...new Set(notifications.map((item) => item.type).filter(Boolean))], [notifications]);
  const visibleNotifications = useMemo(() => notifications.filter((item) => {
    if (filter === "unread" && item.is_read) return false;
    if (filter === "read" && !item.is_read) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  }), [notifications, filter, typeFilter]);

  const openNotification = async (item) => {
    const path = item.link ? getInternalPath(item.link) : null;
    if (item.link && !path) {
      setError("Bildirishnoma havolasi xavfsiz ichki manzil emas.");
      return;
    }
    setUpdatingId(item.id);
    setError("");
    try {
      if (!item.is_read) {
        const { data, error: updateError } = await requireSupabase()
          .from("notifications")
          .update({ is_read: true })
          .eq("id", item.id)
          .eq("recipient_id", user.id)
          .select("id");
        if (updateError) throw updateError;
        if (!data?.length) throw new Error("Bildirishnoma yangilanmadi.");
        setNotifications((current) => current.map((notification) =>
          notification.id === item.id ? { ...notification, is_read: true } : notification
        ));
      }
      if (path) navigate(path);
    } catch (updateError) {
      console.error("Bildirishnomani o‘qilgan deb belgilab bo‘lmadi.", updateError);
      setError("Bildirishnomani yangilab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setUpdatingId("");
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setSavingAll(true);
    setError("");
    try {
      const { data, error: updateError } = await requireSupabase()
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false)
        .select("id");
      if (updateError) throw updateError;
      if (!data?.length) throw new Error("O‘qilmagan bildirishnomalar yangilanmadi.");
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (updateError) {
      console.error("Bildirishnomalarni o‘qilgan deb belgilab bo‘lmadi.", updateError);
      setError("Bildirishnomalarni yangilab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="workspace-page animate-fade-in space-y-6">
      <PageHeader
        title="Bildirishnomalar"
        subtitle="Buyurtma, do‘kon va hisobingizga tegishli yangiliklar."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadNotifications} disabled={loading} aria-label="Yangilash" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-secondary disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
            <button type="button" onClick={markAllAsRead} disabled={unreadCount === 0 || savingAll} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm">
              {savingAll ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">Hammasini o‘qish</span>
              <span className="sm:hidden">O‘qish</span>
            </button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bell className="h-5 w-5" aria-hidden="true" /></span>
          <span><span className="block text-xs text-muted-foreground">Jami bildirishnomalar</span><strong className="mt-1 block font-display text-xl">{notifications.length}</strong></span>
        </article>
        <article className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning"><Circle className="h-4 w-4 fill-current" aria-hidden="true" /></span>
          <span><span className="block text-xs text-muted-foreground">O‘qilmagan</span><strong className="mt-1 block font-display text-xl">{unreadCount}</strong></span>
        </article>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((item) => (
            <button key={item.key} type="button" onClick={() => setFilter(item.key)} aria-pressed={filter === item.key} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition ${filter === item.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {item.label}{item.key === "unread" ? ` · ${unreadCount}` : ""}
            </button>
          ))}
        </div>
        {typeOptions.length > 1 && (
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Bildirishnoma turi
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 min-w-36 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground">
              <option value="all">Barcha turlar</option>
              {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        )}
      </section>

      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {loading ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin" />Yuklanmoqda...</div>
      ) : visibleNotifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"><Bell className="h-6 w-6" aria-hidden="true" /></span>
          <h2 className="mt-3 font-display text-base font-semibold">{notifications.length ? "Bu filtrda bildirishnoma yo‘q" : "Hozircha bildirishnomalar yo‘q"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{notifications.length ? "Boshqa filtr turini tanlab ko‘ring." : "Buyurtma va do‘konlaringiz yangiliklari shu yerda ko‘rinadi."}</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold">So‘nggi xabarlar</h2>
            <span className="text-xs text-muted-foreground">{visibleNotifications.length} ta</span>
          </div>
          <ul className="divide-y divide-border">
            {visibleNotifications.map((item) => {
              const Icon = notificationIcon(item.type);
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => openNotification(item)} disabled={updatingId === item.id} className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-secondary/60 disabled:opacity-60 sm:px-5 ${item.is_read ? "" : "bg-primary/[0.045]"}`}>
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.is_read ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className={`text-sm ${item.is_read ? "font-medium" : "font-semibold"}`}>{item.title}</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</span>
                      </span>
                      {item.message && <span className="mt-1 block whitespace-pre-line text-sm leading-5 text-muted-foreground">{item.message}</span>}
                      {item.link && <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">Tafsilotlarni ko‘rish <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span>}
                    </span>
                    {!item.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="O‘qilmagan" />}
                    {updatingId === item.id && <LoaderCircle className="mt-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Yangilanmoqda" />}
                    {item.is_read && updatingId !== item.id && <Check className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/60" aria-label="O‘qilgan" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
