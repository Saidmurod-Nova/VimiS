import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Plus, ShoppingBag, Store, TrendingUp, Clock, CheckCircle2, XCircle, PackageCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { listBusinessInventory, listProducts } from "@/lib/supabaseCatalog";
import PageHeader from "@/components/vimi/PageHeader";
import { useBusiness } from "@/lib/BusinessContext";
import DateRangeSelector from "@/components/vimi/seller/DateRangeSelector";
import RecentOrders from "@/components/vimi/seller/RecentOrders";
import InventoryAlerts from "@/components/vimi/seller/InventoryAlerts";
import StatCard from "@/components/vimi/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { SecondaryButton } from "@/components/vimi/VimiButton";
import { formatSoM } from "@/lib/inventory";

// Seller Home = Business Dashboard, using real records scoped to the current
// business and branch and protected by the backend's existing access policies.
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
  const requestId = useRef(0);

  const businessId = selectedBusiness?.id;
  const resolvedBranchId = branchId === "all" ? null : branchId;

  const fetchDashboard = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!businessId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true); setError(null); setData(null);
    try {
      let branches;
      let orders;
      let products;
      let inventoryRows;
      if (isSupabaseMode) {
        if (!supabase) throw new Error("Supabase client is not configured");
        const [branchesResult, ordersResult, productRecords, inventoryRecords] = await Promise.all([
          supabase.from("branches").select("id,business_id,name").eq("business_id", businessId),
          supabase.from("orders").select("id,business_id,branch_id,status,created_at,total,order_number,buyer_name_snapshot,branch_name,item_count").eq("business_id", businessId).order("created_at", { ascending: false }),
          listProducts({ businessId, includeInactive: true, limit: 200 }),
          listBusinessInventory(businessId),
        ]);
        if (branchesResult.error) throw branchesResult.error;
        if (ordersResult.error) throw ordersResult.error;
        branches = branchesResult.data || [];
        orders = ordersResult.data || [];
        products = productRecords || [];
        inventoryRows = inventoryRecords || [];
      } else {
        [branches, orders, products, inventoryRows] = await Promise.all([
          base44.entities.Branch.filter({ business_id: businessId }, "name", 100),
          base44.entities.Order.filter({ business_id: businessId }, "-created_date", 500),
          base44.entities.Product.filter({ business_id: businessId }, "-created_date", 200),
          base44.entities.BranchInventory.filter({ business_id: businessId }),
        ]);
      }

      orders = (orders || []).filter((order) =>
        !resolvedBranchId || order.branch_id === resolvedBranchId
      );
      const now = new Date();
      const start = from ? new Date(`${from}T00:00:00`) : new Date(now);
      if (!from) {
        if (range === "today") start.setHours(0, 0, 0, 0);
        else if (range === "7d" || range === "week" || range === "this_week") start.setDate(start.getDate() - 6);
        else if (range === "30d" || range === "month" || range === "this_month") start.setDate(start.getDate() - 29);
        else if (range === "all") start.setTime(0);
      }
      const end = to ? new Date(`${to}T23:59:59.999`) : now;
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
      const configuredThreshold = Number(selectedBusiness.low_stock_threshold ?? 5);
      const threshold = Number.isFinite(configuredThreshold) ? configuredThreshold : 5;
      const branchNames = new Map((branches || []).map((branch) => [branch.id, branch.name]));
      const productsById = new Map((products || []).map((product) => [product.id, product]));
      const scopedInventory = (inventoryRows || []).filter((row) =>
        !resolvedBranchId || row.branch_id === resolvedBranchId
      );
      const alerts = scopedInventory
        .filter((row) => Number(row.stock || 0) <= threshold)
        .map((row) => {
          const product = productsById.get(row.product_id);
          return {
            product_id: row.product_id,
            branch_id: row.branch_id,
            name: product?.name || "Noma’lum mahsulot",
            image_url: product?.image_url || null,
            branch_name: branchNames.get(row.branch_id) || "",
            stock: Number(row.stock || 0),
          };
        })
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10);
      if (currentRequest !== requestId.current) return;
      setData({
        branches: branches || [],
        products: products || [],
        metrics: {
          totalSales,
          totalOrders: periodOrders.length,
          pending: countStatus(["pending"]),
          preparing: countStatus(["preparing", "processing"]),
          completed: countStatus(completedStatuses),
          cancelled: countStatus(["cancelled", "canceled"]),
          productCount: (products || []).length,
          activeProductCount: (products || []).filter((product) => product.is_active).length,
        },
        recentOrders: orders.filter((order) => order.status !== "completed").slice(0, 5),
        inventory: {
          threshold,
          trackedCount: scopedInventory.length,
          outOfStock: scopedInventory.filter((row) => Number(row.stock || 0) <= 0).length,
          lowStock: scopedInventory.filter((row) => Number(row.stock || 0) > 0 && Number(row.stock) <= threshold).length,
          totalAvailable: scopedInventory.filter((row) => Number(row.stock || 0) > 0 && row.is_available !== false).length,
          items: alerts,
        },
        range: {
          label: {
            today: "Bugun",
            "7d": "7 kun",
            "30d": "30 kun",
            all: "Barcha davr",
            custom: "Tanlangan davr",
          }[range] || range,
        },
      });
    } catch (e) {
      if (currentRequest === requestId.current) {
        setError(e);
        setData(null);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [businessId, selectedBusiness?.low_stock_threshold, resolvedBranchId, range, from, to]);

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
  const m = data?.metrics || { totalSales: 0, totalOrders: 0, pending: 0, preparing: 0, completed: 0, cancelled: 0, productCount: 0, activeProductCount: 0 };
  const businessPath = `/business/${selectedBusiness.id}`;

  const onRangeChange = (r) => { setRange(r.range); setFrom(r.from || null); setTo(r.to || null); };

  return (
    <div className="workspace-page animate-fade-in space-y-5">
      <PageHeader
        title="Umumiy ko‘rinish"
        subtitle={selectedBusiness.name}
        action={<SecondaryButton className="h-10 shrink-0" onClick={() => navigate(`${businessPath}/analytics`)}><BarChart3 className="mr-2 h-4 w-4" />Tahlillar</SecondaryButton>}
      />
      {/* Dashboard filters */}
      <div className="space-y-3">
        {!hasNoBranches && (
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeSelector range={range} from={from} to={to} onChange={onRangeChange} />
            <span className="ml-auto text-xs text-muted-foreground">{data?.range?.label || ""}</span>
          </div>
        )}
      </div>

      {/* No branches onboarding */}
      {hasNoBranches ? (
        <EmptyState icon={Store} title="Faol filial topilmadi" description="Biznes boshqaruvini davom ettirish uchun filial qo‘shing." action={<SecondaryButton className="h-10" onClick={() => navigate(`${businessPath}/branches/new`)}><Plus className="mr-2 h-4 w-4" />Filial qo‘shish</SecondaryButton>} />
      ) : error ? (
        <ErrorState
          title="Dashboard yuklanmadi"
          description={error.message || "Ma’lumotlarni yuklashda xatolik yuz berdi."}
          onRetry={fetchDashboard}
        />
      ) : loading && !data ? (
        <LoadingState />
      ) : (
        <>
          {/* Pending work banner */}
          {m.pending > 0 && (
            <button type="button" onClick={() => navigate(`${businessPath}/orders?status=pending`)} className="flex w-full items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-left transition hover:bg-warning/15">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-warning/20 text-warning"><Clock className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{m.pending} ta kutilayotgan buyurtma</span>
                <span className="block text-xs text-muted-foreground">Tezroq ko'rib chiqish uchun bosing</span>
              </span>
            </button>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            <StatCard label="Sotuv (davr)" icon={TrendingUp} value={formatSoM(m.totalSales)} hint="so‘m · yakunlangan buyurtmalar" />
            <StatCard label="Buyurtmalar (davr)" icon={ShoppingBag} value={formatSoM(m.totalOrders)} hint="davrda yaratilgan" />
            <StatCard label="Kutilmoqda" icon={Clock} value={formatSoM(m.pending)} hint="joriy ish yuki" />
            <StatCard label="Tayyorlanmoqda" icon={PackageCheck} value={formatSoM(m.preparing)} hint="joriy" />
            <StatCard label="Faol mahsulotlar" icon={Store} value={`${formatSoM(m.activeProductCount)} / ${formatSoM(m.productCount)}`} hint="faol / jami mahsulot" />
            <StatCard label="Yakunlandi" icon={CheckCircle2} value={formatSoM(m.completed)} hint="jami (joriy)" />
            <StatCard label="Bekor" icon={XCircle} value={formatSoM(m.cancelled)} hint="jami (joriy)" />
          </div>

          {/* Quick actions */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction icon={Plus} label="Yangi mahsulot" onClick={() => navigate(`${businessPath}/products/new`)} />
            <QuickAction icon={ShoppingBag} label="Buyurtmalar" onClick={() => navigate(`${businessPath}/orders`)} />
            <QuickAction icon={Store} label="Biznes sozlamalari" onClick={() => navigate(`${businessPath}/settings`)} />
            <QuickAction icon={BarChart3} label="Tahlillar" onClick={() => navigate(`${businessPath}/analytics`)} />
          </div>

          {/* Recent orders */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">So‘nggi buyurtmalar</h2>
            </div>
            <RecentOrders orders={data?.recentOrders || []} businessId={businessId} onSeeAll={() => navigate(`${businessPath}/orders`)} />
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
    <button type="button" onClick={onClick} className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-card px-4 text-left text-sm font-medium transition hover:border-primary/30 hover:bg-secondary/40">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <span className="text-foreground">{label}</span>
    </button>
  );
}