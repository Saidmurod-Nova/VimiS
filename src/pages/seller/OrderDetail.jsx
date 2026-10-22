import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
<<<<<<< HEAD
import { MapPin, Navigation2, Phone, Package, Check, X, Clock, ChefHat, CheckCircle2, AlertCircle } from "lucide-react";
=======
import { MapPin, Phone, Package, Check, X, Clock, ChefHat, CheckCircle2, AlertCircle } from "lucide-react";
>>>>>>> origin/main
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { getSellerOrder } from "@/lib/supabaseRelations";
import { updateOrderStatusSupabase } from "@/lib/supabaseOrders";
<<<<<<< HEAD
import { directionsUrl } from "@/lib/maps";
=======
>>>>>>> origin/main
import PageHeader from "@/components/vimi/PageHeader";
import OrderStatusBadge from "@/components/vimi/OrderStatusBadge";
import Price from "@/components/vimi/Price";
import { Image } from "@/components/ui/image";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { useToast } from "@/components/ui/use-toast";
import { formatSoM } from "@/lib/inventory";

// Seller Order Details. Shows immutable snapshots, buyer + delivery info,
// a status timeline, and trusted status-transition actions (accept/prepare/
// complete/cancel). Actions call updateOrderStatus (server-authorized) and
// refresh the order. Cancelling offers an optional reason.
export default function OrderDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = isSupabaseMode
        ? await getSellerOrder(id)
        : (await base44.functions.invoke("getSellerOrder", { order_id: id })).data;
<<<<<<< HEAD
      let branch = result?.branch || null;
      if (!isSupabaseMode && !branch && result?.order?.branch_id) {
        branch = await base44.entities.Branch.get(result.order.branch_id);
      }
      if (branch && branch.business_id !== result?.order?.business_id) branch = null;
      setData(result ? { ...result, branch } : null);
=======
      setData(result);
>>>>>>> origin/main
    } catch (e) { setError(e); setData(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const act = async (action) => {
    setActing(true);
    try {
      if (isSupabaseMode) {
        const statuses = { accept: "accepted", prepare: "preparing", complete: "completed", cancel: "cancelled" };
        await updateOrderStatusSupabase({ orderId: id, status: statuses[action], cancellationReason: action === "cancel" ? reason : "" });
      } else await base44.functions.invoke("updateOrderStatus", { order_id: id, action, reason: action === "cancel" ? reason : undefined });
      toast({ title: "Buyurtma yangilandi" });
      setCancelOpen(false); setReason("");
      await fetchOrder();
    } catch (e) {
      toast({ title: e?.response?.data?.error || "Yangilanmadi", variant: "destructive" });
    } finally { setActing(false); }
  };

  if (error) return <div className="space-y-4"><PageHeader title="Buyurtma" backTo="/seller/orders" /><ErrorState onRetry={fetchOrder} /></div>;
  if (loading && !data) return <div className="space-y-4"><PageHeader title="Buyurtma" backTo="/seller/orders" /><LoadingState /></div>;
  if (!data?.order) return <div className="space-y-4"><PageHeader title="Buyurtma" backTo="/seller/orders" /><EmptyState title="Buyurtma topilmadi" /></div>;

<<<<<<< HEAD
  const { order, items, branch } = data;
  const status = order.status;
  const deliveryDirectionsUrl = directionsUrl(
    branch || {},
    {
      latitude: order.delivery_latitude,
      longitude: order.delivery_longitude,
      address: order.delivery_address,
    },
  );
=======
  const { order, items } = data;
  const status = order.status;
>>>>>>> origin/main

  const steps = [
    { key: "pending", label: "Yaratildi", icon: Clock, at: order.created_date },
    { key: "accepted", label: "Qabul qilindi", icon: Check, at: order.accepted_at },
    { key: "preparing", label: "Tayyorlanmoqda", icon: ChefHat, at: order.preparing_at },
    { key: "completed", label: "Yakunlandi", icon: CheckCircle2, at: order.completed_at },
  ];
  const stepIndex = steps.findIndex((s) => s.key === status);
  const cancelled = status === "cancelled";

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={`#${order.order_number}`} subtitle={order.branch_name} backTo="/seller/orders" />

      {/* Status + timeline */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <OrderStatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleString("ru-RU")}</span>
        </div>
        {cancelled ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />Buyurtma bekor qilindi{order.cancellation_reason ? `: ${order.cancellation_reason}` : ""}
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            {steps.map((s, i) => {
              const done = stepIndex >= 0 && i <= stepIndex;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      <s.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <span className={`h-0.5 flex-1 ${i < stepIndex ? "bg-primary" : "bg-border"}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Buyer + delivery */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
        <div className="flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary"><Package className="h-3.5 w-3.5" /></span><span className="font-medium">{order.buyer_name_snapshot || "Xaridor"}</span></div>
        {order.buyer_phone_snapshot && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{order.buyer_phone_snapshot}</div>}
        {order.delivery_address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5" />{order.delivery_address}</div>}
<<<<<<< HEAD
        {deliveryDirectionsUrl && (
          <a
            href={deliveryDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
          >
            <Navigation2 className="mr-1.5 h-4 w-4" />
            Google Xaritalarda yo'nalish olish
          </a>
        )}
=======
>>>>>>> origin/main
        {order.notes && <div className="rounded-xl bg-secondary p-2 text-xs text-muted-foreground">Izoh: {order.notes}</div>}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <h2 className="font-display text-base font-semibold tracking-tight">Mahsulotlar</h2>
        {(items || []).map((it, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              {it.image_url ? <Image src={it.image_url} alt={it.product_name} fittingType="fill" className="h-full w-full" /> : <Package className="h-4 w-4 text-muted-foreground" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{it.product_name}</span>
              <span className="block text-xs text-muted-foreground">{formatSoM(it.unit_price)} so'm × {it.quantity}</span>
            </span>
            <span className="text-right text-sm font-semibold tabular-nums">{formatSoM(it.subtotal)} so'm</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Mahsulotlar</span><span className="tabular-nums">{formatSoM(order.subtotal)} so'm</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Yetkazib berish</span><span className="tabular-nums">{formatSoM(order.delivery_fee || 0)} so'm</span></div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span>Jami</span><Price value={order.total} /></div>
      </div>

      {/* Actions */}
      {!cancelled && (
        <div className="space-y-2">
          {status === "pending" && (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton className="h-12" disabled={acting} onClick={() => act("accept")}><Check className="mr-1 h-4 w-4" />Qabul qilish</PrimaryButton>
              <SecondaryButton className="h-12" disabled={acting} onClick={() => setCancelOpen((v) => !v)}><X className="mr-1 h-4 w-4" />Bekor qilish</SecondaryButton>
            </div>
          )}
          {status === "accepted" && (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton className="h-12" disabled={acting} onClick={() => act("prepare")}><ChefHat className="mr-1 h-4 w-4" />Tayyorlash</PrimaryButton>
              <SecondaryButton className="h-12" disabled={acting} onClick={() => setCancelOpen((v) => !v)}><X className="mr-1 h-4 w-4" />Bekor qilish</SecondaryButton>
            </div>
          )}
          {status === "preparing" && (
            <PrimaryButton className="h-12 w-full" disabled={acting} onClick={() => act("complete")}><CheckCircle2 className="mr-1 h-4 w-4" />Yakunlash</PrimaryButton>
          )}

          {cancelOpen && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Bekor qilish sababi (ixtiyoriy)"
                className="w-full rounded-xl border border-border bg-background p-2 text-sm"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <SecondaryButton className="h-10" disabled={acting} onClick={() => { setCancelOpen(false); setReason(""); }}>Bekor</SecondaryButton>
                <PrimaryButton className="h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={acting} onClick={() => act("cancel")}>Tasdiqlash</PrimaryButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}