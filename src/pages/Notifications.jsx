import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vimi/PageHeader";
import { PrimaryButton, GhostButton } from "@/components/vimi/VimiButton";

const PAGE = 20;

// Shared notification center for buyers and sellers. Lists the current user's
// notifications newest-first with unread indicators, mark-as-read (single +
// all), tap-to-open the related order, and loading/empty/error states. RLS
// scopes reads to the current user; mark-as-read goes through a backend
// function that re-verifies ownership.
export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const list = await base44.entities.Notification.filter({}, "-created_date", PAGE);
      setItems(list || []);
      setHasMore((list || []).length === PAGE);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    let unsub;
    try {
      unsub = base44.entities.Notification.subscribe(() => {
        // Refresh quietly without flipping the loading spinner.
        base44.entities.Notification.filter({}, "-created_date", Math.max(PAGE, (items?.length || PAGE)))
          .then((list) => { setItems(list || []); setHasMore((list || []).length === (items?.length || PAGE)); })
          .catch(() => {});
      });
    } catch {}
    return () => { if (typeof unsub === "function") unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = (items?.length || PAGE) + PAGE;
      const list = await base44.entities.Notification.filter({}, "-created_date", next);
      setItems(list || []);
      setHasMore((list || []).length === next);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const openNotification = (n) => {
    // Mark read first (best-effort), then navigate to the related order.
    if (!n.read) {
      base44.functions.invoke("setNotificationRead", { notification_id: n.id }).catch(() => {});
      setItems((prev) => (prev || []).map((x) => (x.id === n.id ? { ...x, read: true, read_at: new Date().toISOString() } : x)));
    }
    if (n.related_id) {
      if (n.type === "order_seller") navigate(`/seller/orders/${n.related_id}`);
      else navigate("/orders");
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await base44.functions.invoke("setNotificationRead", { all: true });
      const now = new Date().toISOString();
      setItems((prev) => (prev || []).map((x) => ({ ...x, read: true, read_at: x.read_at || now })));
    } catch {
      setError(true);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = (items || []).filter((n) => !n.read).length;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Bildirishnomalar" backTo={-1} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items ? `${unreadCount} o‘qilmagan · ${items.length} jami` : "Yuklanmoqda..."}
        </p>
        <GhostButton
          type="button"
          onClick={markAllRead}
          disabled={markingAll || !items || unreadCount === 0}
          className="h-9 gap-2 px-3"
        >
          {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Hammasini o‘qilgan qilish
        </GhostButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Bildirishnomalarni yuklab bo‘lmadi.</p>
          <PrimaryButton type="button" onClick={load} className="h-10 gap-2">
            <RefreshCw className="h-4 w-4" /> Qayta urinish
          </PrimaryButton>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Bell className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-foreground">Hozircha bildirishnomalar yo‘q.</p>
          <p className="text-xs text-muted-foreground">Yangi buyurtmalar va holatlar shu yerda ko‘rinadi.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => openNotification(n)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                  n.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                }`}
              >
                <span
                  className={`mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-transparent ring-1 ring-border" : "bg-primary"}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {n.created_date ? moment(n.created_date).fromNow() : ""}
                  </span>
                </span>
                {n.related_id && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && hasMore && (
        <div className="flex justify-center pt-2">
          <GhostButton type="button" onClick={loadMore} disabled={loadingMore} className="h-10 gap-2">
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ko‘proq yuklash
          </GhostButton>
        </div>
      )}
    </div>
  );
}