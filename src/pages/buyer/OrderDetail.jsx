import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, Package, ShoppingBag, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { getBuyerOrder } from "@/lib/supabaseRelations";
import { updateOrderStatusSupabase } from "@/lib/supabaseOrders";
import PageHeader from "@/components/vimi/PageHeader";
import OrderStatusBadge from "@/components/vimi/OrderStatusBadge";
import Price from "@/components/vimi/Price";
import { Image } from "@/components/ui/image";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { useToast } from "@/components/ui/use-toast";
import { formatSoM } from "@/lib/inventory";

const STEPS = [
  { key: "pending", label: "Buyurtma yaratildi", icon: Clock },
  { key: "accepted", label: "Do'kon qabul qildi", icon: CheckCircle2 },
  { key: "preparing", label: "Tayyorlanmoqda", icon: Package },
  { key: "completed", label: "Yakunlandi", icon: CheckCircle2 },
];

export default function BuyerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = isSupabaseMode
        ? await getBuyerOrder(id)
        : (await base44.functions.invoke("getMyOrder", { order_id: id })).data;
      setData(result || null);
    } catch (e) {
      setError(e?.response?.data?.error || "Buyurtma yuklanmadi");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const cancelOrder = async () => {
    if (!data?.order || acting) return;
    setActing(true);
    try {
      if (isSupabaseMode) await updateOrderStatusSupabase({ orderId: id, status: "cancelled" });
      else await base44.functions.invoke("updateOrderStatus", { order_id: id, action: "cancel" });
      toast({ title: "Buyurtma bekor qilindi" });
      setConfirmCancel(false);
      await load();
    } catch (e) {
      toast({ title: e?.response?.data?.error || "Buyurtmani bekor qilib bo'lmadi", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  if (loading && !data) return <div className="space-y-4"><PageHeader title="Buyurtma" backTo="/orders" /><LoadingState /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Buyurtma" backTo="/orders" /><ErrorState title={error} onRetry={load} /></div>;
  if (!data?.order) return <div className="space-y-4"><PageHeader title="Buyurtma" backTo="/orders" /><EmptyState icon={ShoppingBag} title="Buyurtma topilmadi" action={<PrimaryButton onClick={() => navigate("/orders")}>Buyurtmalarga qaytish</PrimaryButton>} /></div>;

  const { order, items = [] } = data;
  const statusIndex = STEPS.findIndex((step) => step.key === order.status);
  const cancelled = order.status === "cancelled";
  const canCancel = order.status === "pending" || order.status === "accepted";

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={`#${order.order_number || "Buyurtma"}`} subtitle={order.business_name || "Vimi"} backTo="/orders" />

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="text-xs text-muted-foreground">{order.created_date ? new Date(order.created_date).toLocaleString("uz-UZ") : ""}</span>
        </div>
        {cancelled ? (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Buyurtma bekor qilindi{order.cancellation_reason ? `: ${order.cancellation_reason}` : ""}</span>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {STEPS.map((step, index) => {
              const done = statusIndex >= 0 && index <= statusIndex;
              const Icon = step.icon;
              return <div key={step.key} className="flex items-center gap-3 text-sm">
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}><Icon className="h-4 w-4" /></span>
                <span className={done ? "font-medium text-foreground" : "text-muted-foreground"}>{step.label}</span>
              </div>;
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold">Mahsulotlar</h2>
        {items.map((item, index) => <div key={item.id || `${item.product_id || item.product_name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
            {item.image_url ? <Image src={item.image_url} alt={item.product_name || "Mahsulot"} fittingType="fill" className="h-full w-full" /> : <ShoppingBag className="h-5 w-5 text-muted-foreground" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.product_name || "Mahsulot"}</span>
            <span className="block text-xs text-muted-foreground">{formatSoM(item.unit_price)} so'm × {item.quantity}</span>
          </span>
          <span className="text-right text-sm font-semibold tabular-nums">{formatSoM(item.subtotal)} so'm</span>
        </div>)}
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Mahsulotlar</span><span>{formatSoM(order.subtotal)} so'm</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Yetkazib berish</span><span>{formatSoM(order.delivery_fee || 0)} so'm</span></div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Jami</span><Price value={order.total} /></div>
        {order.delivery_address && <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">Yetkazib berish manzili</p><p className="mt-1">{order.delivery_address}</p></div>}
        {order.notes && <div><p className="text-xs text-muted-foreground">Izoh</p><p className="mt-1">{order.notes}</p></div>}
      </section>

      {canCancel && <div className="space-y-2">
        {confirmCancel ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm">Buyurtmani bekor qilmoqchimisiz? Bu amalni qaytarib bo'lmaydi.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SecondaryButton className="h-10" disabled={acting} onClick={() => setConfirmCancel(false)}>Ortga</SecondaryButton>
            <PrimaryButton className="h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={acting} onClick={cancelOrder}><X className="mr-1 h-4 w-4" />{acting ? "Bekor qilinmoqda..." : "Bekor qilish"}</PrimaryButton>
          </div>
        </div> : <SecondaryButton className="h-11 w-full text-destructive" onClick={() => setConfirmCancel(true)}>Buyurtmani bekor qilish</SecondaryButton>}
      </div>}
    </div>
  );
}
