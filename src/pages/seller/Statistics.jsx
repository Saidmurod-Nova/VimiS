import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ShoppingBag, CheckCircle2, XCircle, Package, Receipt } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import PageHeader from "@/components/vimi/PageHeader";
import BranchSelectorSheet from "@/components/vimi/seller/BranchSelectorSheet";
import DateRangeSelector from "@/components/vimi/seller/DateRangeSelector";
import RevenueChart from "@/components/vimi/seller/RevenueChart";
import OrderTrendChart from "@/components/vimi/seller/OrderTrendChart";
import BranchComparison from "@/components/vimi/seller/BranchComparison";
import ProductPerformance from "@/components/vimi/seller/ProductPerformance";
import StatCard from "@/components/vimi/StatCard";
import { ErrorState, LoadingState } from "@/components/vimi/States";
import { formatSoM } from "@/lib/inventory";

// Dedicated statistics screen. All metrics derived from real aggregated order
// data; revenue uses completed orders only, AOV guards divide-by-zero, product
// performance uses immutable OrderItem snapshots.
export default function Statistics() {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const businessId = selectedBusiness?.id;

  const [branchId, setBranchId] = useState("all");
  const [range, setRange] = useState("30d");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!businessId) return;
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke("getSellerStatistics", { business_id: businessId, branch_id: branchId, range, from, to });
      setData(res.data);
    } catch (e) { setError(e); setData(null); }
    finally { setLoading(false); }
  }, [businessId, branchId, range, from, to]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setBranchId("all"); }, [businessId]);

  if (!businessId) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader title="Statistika" backTo="/seller" />
        <p className="text-sm text-muted-foreground">Avval biznes tanlang.</p>
      </div>
    );
  }

  const c = data?.core || { completedRevenue: 0, orderCount: 0, completedCount: 0, cancelledCount: 0, avgOrderValue: 0, productsSold: 0 };
  const onRangeChange = (r) => { setRange(r.range); setFrom(r.from || null); setTo(r.to || null); };
  const showComparison = data?.branchComparison && data.branchComparison.length > 0;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Statistika" subtitle={selectedBusiness?.name} backTo="/seller" />

      <div className="flex flex-wrap items-center gap-2">
        <BranchSelectorSheet branches={data?.branches || []} selectedId={branchId} onSelect={setBranchId} disabled={!data} />
        <DateRangeSelector range={range} from={from} to={to} onChange={onRangeChange} />
        <span className="ml-auto text-xs text-muted-foreground">{data?.range?.label || ""}</span>
      </div>

      {error ? (
        <ErrorState onRetry={fetchStats} />
      ) : loading && !data ? (
        <LoadingState />
      ) : (
        <>
          {/* Core metrics */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            <StatCard label="Daromad" icon={TrendingUp} value={formatSoM(c.completedRevenue)} hint="so'm · yakunlangan" className="col-span-2 md:col-span-1" />
            <StatCard label="Buyurtmalar" icon={ShoppingBag} value={formatSoM(c.orderCount)} hint="davrda yaratilgan" />
            <StatCard label="Yakunlangan" icon={CheckCircle2} value={formatSoM(c.completedCount)} hint="davrda yakunlangan" />
            <StatCard label="Bekor" icon={XCircle} value={formatSoM(c.cancelledCount)} hint="davrda bekor qilingan" />
            <StatCard label="O'rtacha chek" icon={Receipt} value={formatSoM(c.avgOrderValue)} hint="so'm · yakunlangan/dona" />
            <StatCard label="Sotilgan mahsulot" icon={Package} value={formatSoM(c.productsSold)} hint="dona · yakunlangan" />
          </div>

          {/* Revenue trend */}
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-base font-semibold tracking-tight">Daromad dinamikasi</h2>
            <RevenueChart data={data?.revenueTrend || []} />
          </section>

          {/* Order trend */}
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-base font-semibold tracking-tight">Buyurtmalar dinamikasi</h2>
            <OrderTrendChart data={data?.orderTrend || []} />
          </section>

          {/* Branch comparison */}
          {showComparison && (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-base font-semibold tracking-tight">Filiallar taqqoslashi</h2>
              <BranchComparison branches={data.branchComparison} businessId={businessId} />
            </section>
          )}

          {/* Product performance */}
          <section className="space-y-3">
            <h2 className="font-display text-base font-semibold tracking-tight">Mahsulotlar statistikasi</h2>
            <ProductPerformance products={data?.productPerformance || []} businessId={businessId} />
          </section>
        </>
      )}
    </div>
  );
}