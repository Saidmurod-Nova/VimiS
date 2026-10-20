import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import moment from "moment";
import { requireSupabase } from "@/lib/supabase";
import OrderCard from "@/components/vimi/OrderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { cn } from "@/lib/utils";

const STATUS_LABELS = /** @type {Record<string, string>} */ ({
  pending: "Yangi",
  accepted: "Qabul qilindi",
  preparing: "Tayyorlanmoqda",
  completed: "Yakunlandi",
  cancelled: "Bekor qilindi"
});

const STATUS_FILTERS = [
  { key: "", label: "Barchasi" },
  { key: "pending", label: "Yangi" },
  { key: "accepted", label: "Qabul qilindi" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "completed", label: "Yakunlandi" },
  { key: "cancelled", label: "Bekor qilindi" },
];

const fmtMoney = (v = 0) => new Intl.NumberFormat("en-US").format(Math.round(Number(v) || 0)).replace(/,/g, " ") + " so'm";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const visibleOrders = orders.filter((order) => !status || order.status === status);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const client = requireSupabase();
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setOrders([]);
        return;
      }

      const { data, error: ordersError } = await client
        .from("orders")
        .select("id, order_number, status, total, item_count, business_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (ordersError) throw ordersError;
      setOrders(data || []);
    } catch (/** @type {any} */ e) {
      setError(e?.message || "Buyurtmalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
      {!loading && !error && orders?.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key || "all"}
              type="button"
              onClick={() => setStatus(filter.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
                status === filter.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
      {loading ? <LoadingState className="" /> : error ? <ErrorState title={error} onRetry={load} className="" /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Hozircha buyurtmalar yo'q" description="Buyurtmalaringiz shu yerda paydo bo'ladi." className="" action={<PrimaryButton onClick={() => navigate("/")} className="h-10">Bosh sahifaga qaytish</PrimaryButton>} />
      ) : visibleOrders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Bu holatda buyurtmalar yo‘q" description="Boshqa holatni tanlang." action={null} className="" />
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((o) => (
            <OrderCard
              key={o.id}
              orderId={o.id}
              number={o.order_number}
              status={STATUS_LABELS[String(o.status)] || o.status}
              total={fmtMoney(o.total)}
              items={`${o.item_count} ta mahsulot · ${o.business_name || ""}`}
              date={moment(o.created_at).format("DD.MM.YYYY HH:mm")}
              onClick={() => {}}
              className=""
            />
          ))}
        </div>
      )}
    </div>
  );
}