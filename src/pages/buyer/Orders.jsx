import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import moment from "moment";
import { supabase } from "@/lib/supabase";
import OrderCard from "@/components/vimi/OrderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { PrimaryButton } from "@/components/vimi/VimiButton";

const STATUS_LABELS = {
  pending: "Yangi",
  accepted: "Qabul qilindi",
  preparing: "Tayyorlanmoqda",
  completed: "Yakunlandi",
  cancelled: "Bekor qilindi"
};

const fmtMoney = (v) => new Intl.NumberFormat("en-US").format(Math.round(Number(v) || 0)).replace(/,/g, " ") + " so'm";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setOrders([]);
        return;
      }

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, status, total, item_count, business_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (ordersError) throw ordersError;
      setOrders(data || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Buyurtmalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
      {loading ? <LoadingState /> : error ? <ErrorState title={error} onRetry={load} /> : !orders || orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Hozircha buyurtmalar yo'q" description="Buyurtmalaringiz shu yerda paydo bo'ladi." action={<PrimaryButton onClick={() => navigate("/")} className="h-10">Bosh sahifaga qaytish</PrimaryButton>} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              number={o.order_number}
              status={STATUS_LABELS[o.status] || o.status}
              total={fmtMoney(o.total)}
              items={`${o.item_count} ta mahsulot · ${o.business_name || ""}`}
              date={moment(o.created_at).format("DD.MM.YYYY HH:mm")}
            />
          ))}
        </div>
      )}
    </div>
  );
}