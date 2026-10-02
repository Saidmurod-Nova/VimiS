import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import PageHeader from "@/components/vimi/PageHeader";
import BranchSelectorSheet from "@/components/vimi/seller/BranchSelectorSheet";
import OrderStatusBadge from "@/components/vimi/OrderStatusBadge";
import Price from "@/components/vimi/Price";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { key: "", label: "Barchasi" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "completed", label: "Yakunlandi" },
  { key: "cancelled", label: "Bekor" },
];

// Seller order management list. Backed by getSellerOrders (ownership-verified
// server-side). Status + branch filters; selecting an order opens details.
export default function Orders() {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [branchId, setBranchId] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const status = searchParams.get("status") || "";
  const businessId = selectedBusiness?.id;

  const fetchOrders = useCallback(async () => {
    if (!businessId) return;
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke("getSellerOrders", { status: status || undefined, branch_id: branchId === "all" ? undefined : branchId });
      setData(res.data);
    } catch (e) { setError(e); setData(null); }
    finally { setLoading(false); }
  }, [businessId, status, branchId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setBranchId("all"); }, [businessId]);

  const setStatus = (s) => {
    if (s) setSearchParams({ status: s }); else setSearchParams({});
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Buyurtmalar" subtitle={selectedBusiness?.name} backTo="/seller" />

      {!businessId ? (
        <p className="text-sm text-muted-foreground">Avval biznes tanlang.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <BranchSelectorSheet branches={data?.branches || []} selectedId={branchId} onSelect={setBranchId} disabled={!data} />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key || "all"}
                type="button"
                onClick={() => setStatus(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  status === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error ? (
            <ErrorState onRetry={fetchOrders} />
          ) : loading && !data ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : !data?.orders || data.orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Buyurtmalar yo'q" description="Tanlangan filtr bo'yicha buyurtmalar yo'q." />
          ) : (
            <div className="space-y-2">
              {data.orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/seller/orders/${o.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">#{o.order_number}</span>
                      <OrderStatusBadge status={o.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {o.buyer_name_snapshot || "Xaridor"} · {o.branch_name || "Filial"}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {o.item_count || (o.items?.length || 0)} ta mahsulot · {new Date(o.created_date).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                  <Price value={o.total} size="sm" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}