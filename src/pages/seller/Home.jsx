import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Plus, ShoppingBag, Store, AlertTriangle, TrendingUp, Clock, CheckCircle2, XCircle, PackageCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import BusinessSelectorSheet from "@/components/vimi/seller/BusinessSelectorSheet";
import BranchSelectorSheet from "@/components/vimi/seller/BranchSelectorSheet";
import DateRangeSelector from "@/components/vimi/seller/DateRangeSelector";
import RecentOrders from "@/components/vimi/seller/RecentOrders";
import InventoryAlerts from "@/components/vimi/seller/InventoryAlerts";
import StatCard from "@/components/vimi/StatCard";
import Price from "@/components/vimi/Price";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { formatSoM } from "@/lib/inventory";

// Seller Home = Business Dashboard. Every metric is computed server-side from
// real order/inventory records for the selected (owned) business and branch.
export default function Home() {
  const { businesses, loading: bizLoading, selectedBusiness, selectBusiness } = useBusiness();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState("all");
  const [range, setRange] = useState("today");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const businessId = selectedBusiness?.id;

  const fetchDashboard = useCallback(async () => {
    if (!businessId) { setData(null); return; }
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke("getSellerDashboard", { business_id: businessId, branch_id: branchId, range, from, to });
      setData(res.data);
    } catch (e) {
      setError(e); setData(null);
    } finally { setLoading(false); }
  }, [businessId, branchId, range, from, to]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Reset branch scope when switching business.
  useEffect(() => { setBranchId("all"); }, [businessId]);

  // If the business has a single active branch, select it by default.
  useEffect(() => {
    if (data && data.branches && data.branches.filter((b) => b.is_active).length === 1 && branchId === "all") {
      setBranchId(data.branches.find((b) => b.is_active).id);
    }
  }, [data, branchId]);

  if (bizLoading) return <LoadingState />;

  if (!businesses || businesses.length === 0) {
    return (
      <div className="animate-fade-in space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Bizneslarim</h1>
        <EmptyState icon={Store} title="Bizneslar yo'q" description="Birinchi biznesingizni yarating va filiallarni qo'shing." action={<PrimaryButton className="h-10" onClick={() => navigate("/seller/businesses/new")}><Plus className="mr-1 h-4 w-4" />Biznes yaratish</PrimaryButton>} />
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

  const activeBranches = (data?.branches || []).filter((b) => b.is_active);
  const hasNoBranches = data && data.branches && data.branches.length === 0;
  const m = data?.metrics || { totalSales: 0, totalOrders: 0, pending: 0, preparing: 0, completed: 0, cancelled: 0 };

  const onRangeChange = (r) => { setRange(r.range); setFrom(r.from || null); setTo(r.to || null); };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header: business + branch + date + stats */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {businesses.length > 1 ? (
            <BusinessSelectorSheet businesses={businesses} selectedBusiness={selectedBusiness} onSelect={selectBusiness} />
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-border bg-card p-2 pr-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{selectedBusiness.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{selectedBusiness.store_id}</span>
              </span>
            </div>
          )}
          <SecondaryButton className="h-auto shrink-0 px-3 py-2.5" onClick={() => navigate("/seller/statistics")}>
            <BarChart3 className="mr-1 h-4 w-4" />Statistika
          </SecondaryButton>
        </div>

        {!hasNoBranches && (
          <div className="flex flex-wrap items-center gap-2">
            <BranchSelectorSheet branches={data?.branches || []} selectedId={branchId} onSelect={setBranchId} disabled={!data} />
            <DateRangeSelector range={range} from={from} to={to} onChange={onRangeChange} />
            <span className="ml-auto text-xs text-muted-foreground">{data?.range?.label || ""}</span>
          </div>
        )}
      </div>

      {/* No branches onboarding */}
      {hasNoBranches ? (
        <EmptyState icon={Store} title="Filiallar yo'q" description="Buyurtma qabul qilish uchun kamida bitta filial yarating." action={<PrimaryButton className="h-10" onClick={() => navigate(`/seller/businesses/${selectedBusiness.id}/branches/new`)}><Plus className="mr-1 h-4 w-4" />Filial yaratish</PrimaryButton>} />
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