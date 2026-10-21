import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Plus, ShoppingBag, Store, TrendingUp, Clock, CheckCircle2, XCircle, PackageCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useBusiness } from "@/lib/BusinessContext";
import DateRangeSelector from "@/components/vimi/seller/DateRangeSelector";
import RecentOrders from "@/components/vimi/seller/RecentOrders";
import InventoryAlerts from "@/components/vimi/seller/InventoryAlerts";
import StatCard from "@/components/vimi/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { SecondaryButton } from "@/components/vimi/VimiButton";
import { formatSoM } from "@/lib/inventory";

// Seller Home = Business Dashboard. Every metric is computed server-side from
// real order/inventory records for the selected (owned) business and branch.
export default function Home() {
  const {
    businesses,
    loading: bizLoading,
    selectedBusiness,
    selectedBranchId: branchId,
  } = useBusiness();
  const navigate = useNavigate();

  const [range, setRange] = useState("today");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const businessId = selectedBusiness?.id;
  const resolvedBranchId = branchId === "all" ? null : branchId;

  const fetchDashboard = useCallback(async () => {
    if (!businessId) { setData(null); return; }
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error("Supabase client is not configured");
      const [branchesResult, ordersResult] = await Promise.all([
        supabase.from("branches").select("*").eq("business_id", businessId),
        supabase.from("orders").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
      ]);
      if (branchesResult.error) throw branchesResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const branches = branchesResult.data || [];
      const orders = (ordersResult.data || []).filter((order) =>
        !resolvedBranchId || order.branch_id === resolvedBranchId
      );
      const now = new Date();
      const start = from ? new Date(from) : new Date(now);
      if (!from) {
        if (range === "today") start.setHours(0, 0, 0, 0);
        else if (range === "week" || range === "this_week") start.setDate(start.getDate() - 6);
        else if (range === "month" || range === "this_month") start.setDate(1);
        else start.setTime(0);
      }
      const end = to ? new Date(to) : now;
      if (to) end.setHours(23, 59, 59, 999);
      const periodOrders = orders.filter((order) => {
        const createdAt = new Date(order.created_at || order.createdAt);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= start && createdAt <= end;
      });
      const statusOf = (order) => String(order.status || "").toLowerCase();
      const countStatus = (statuses) => orders.filter((order) => statuses.includes(statusOf(order))).length;
      const completedStatuses = ["completed", "complete", "delivered"];
      const totalSales = periodOrders.reduce((sum, order) => {
        if (!completedStatuses.includes(statusOf(order))) return sum;
        return sum + Number(order.total_amount ?? order.total ?? order.amount ?? 0);
      }, 0);
      setData({
        branches,
        metrics: {
          totalSales,
          totalOrders: periodOrders.length,
          pending: countStatus(["pending"]),
          preparing: countStatus(["preparing", "processing"]),
          completed: countStatus(completedStatuses),
          cancelled: countStatus(["cancelled", "canceled"]),
        },
        recentOrders: orders.slice(0, 5),
        inventory: { threshold: 5 },
        range: { label: range === "today" ? "Bugun" : range },
      });
    } catch (e) {
      setError(e); setData(null);
    } finally { setLoading(false); }
  }, [businessId, resolvedBranchId, range, from, to]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (bizLoading) return <LoadingState />;

  if (!businesses || businesses.length === 0) {
    return (
      <div className="animate-fade-in space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Bizneslarim</h1>
        <EmptyState icon={Store} title="Bizneslar yo'q" description="Biznes yaratish uchun yuqoridagi tanlash menyusidan foydalaning." />
      </div>
    );
  }

  if (!selectedBusiness) {
    return (
      <div className="animate-fade-in space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Biznes tanlang</h1>
        <p className="text-sm text-muted-foreground">Dashboardni ko'rish uchun biznesni tanlang.</p>
      </div>
    );
  }

  const hasNoBranches = data && data.branches && data.branches.length === 0;
  const m = data?.metrics || { totalSales: 0, totalOrders: 0, pending: 0, preparing: 0, completed: 0, cancelled: 0 };

  const onRangeChange = (r) => { setRange(r.range); setFrom(r.from || null); setTo(r.to || null); };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Dashboard filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <SecondaryButton className="h-auto shrink-0 px-3 py-2.5" onClick={() => navigate("/seller/statistics")}>
            <BarChart3 className="mr-1 h-4 w-4" />Statistika
          </SecondaryButton>
        </div>

        {!hasNoBranches && (
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeSelector range={range} from={from} to={to} onChange={onRangeChange} />
            <span className="ml-auto text-xs text-muted-foreground">{data?.range?.label || ""}</span>
          </div>
        )}
      </div>

      {/* No branches onboarding */}
      {hasNoBranches ? (
        <EmptyState icon={Store} title="Filiallar yo'q" description="Filial qo‘shish uchun yuqoridagi + tugmasidan foydalaning." />
      ) : error ? (
        <ErrorState onRetry={fetchDashboard} />
      ) : loading && !data ? (
        <LoadingState />
      ) : (
        <>
          {/* Pending work banner */}
          {m.pending > 0 && (
            <button type="button" onClick={() => navigate("/seller/orders?status=pending")} className="flex w-full items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-left transition active:scale-[0.99]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-warning/20 text-warning"><Clock className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{m.pending} ta kutilayotgan buyurtma</span>
                <span className="block text-xs text-muted-foreground">Tezroq ko'rib chiqish uchun bosing</span>
              </span>
            </button>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            <StatCard label="Sotuv (davr)" icon={TrendingUp} value={formatSoM(m.totalSales)} hint="so'm · yakunlangan" className="col-span-2 md:col-span-1" />
            <StatCard label="Buyurtmalar (davr)" icon={ShoppingBag} value={formatSoM(m.totalOrders)} hint="davrda yaratilgan" />
            <StatCard label="Kutilmoqda" icon={Clock} value={formatSoM(m.pending)} hint="joriy ish yuki" />
            <StatCard label="Tayyorlanmoqda" icon={PackageCheck} value={formatSoM(m.preparing)} hint="joriy" />
            <StatCard label="Yakunlandi" icon={CheckCircle2} value={formatSoM(m.completed)} hint="jami (joriy)" />
            <StatCard label="Bekor" icon={XCircle} value={formatSoM(m.cancelled)} hint="jami (joriy)" />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <QuickAction icon={Plus} label="Yangi mahsulot" onClick={() => navigate("/seller/products/new")} />
            <QuickAction icon={ShoppingBag} label="Buyurtmalar" onClick={() => navigate("/seller/orders")} />
            <QuickAction icon={Store} label="Filiallar" onClick={() => navigate(`/seller/businesses/${selectedBusiness.id}`)} />
            <QuickAction icon={BarChart3} label="Statistika" onClick={() => navigate("/seller/statistics")} />
          </div>

          {/* Recent orders */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">So‘nggi buyurtmalar</h2>
            </div>
            <RecentOrders orders={data?.recentOrders || []} onSeeAll={() => navigate("/seller/orders")} />
          </section>

          {/* Inventory alerts */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">Zaxira ogohlantirishlari</h2>
              <span className="text-xs text-muted-foreground">Chegara: {data?.inventory?.threshold ?? 5} dona</span>
            </div>
            <InventoryAlerts inventory={data?.inventory} businessId={selectedBusiness.id} branchId={branchId} />
          </section>
        </>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition active:scale-[0.99]">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}