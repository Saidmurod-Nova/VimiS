import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin, Package, PackageCheck, RefreshCw, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import { requireSupabase } from "@/lib/supabase";
import { useBusiness } from "@/lib/BusinessContext";
import PageHeader from "@/components/vimi/PageHeader";
import OrderStatusBadge from "@/components/vimi/OrderStatusBadge";
import Price from "@/components/vimi/Price";
import { EmptyState, ErrorState } from "@/components/vimi/States";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { key: "active", label: "Faol buyurtmalar" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "accepted", label: "Qabul qilindi" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "completed", label: "Yakunlandi" },
  { key: "cancelled", label: "Bekor" },
];

// Seller order management list. Backed by getSellerOrders (ownership-verified
// server-side). Status + branch filters; selecting an order opens details.
export default function Orders() {
  const { selectedBusiness, selectedBranchId: branchId } = useBusiness();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(/** @type {{ orders: any[] } | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const status = searchParams.get("status") || "active";
  const businessId = selectedBusiness?.id;
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const businessPath = businessId ? `/business/${businessId}` : "/business";

  const fetchOrders = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!businessId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    setData(null);
    try {
      const client = requireSupabase();
      let ordersQuery = client
        .from("orders")
        .select("id, order_number, status, buyer_name_snapshot, branch_name, item_count, created_at, total, payment_method, delivery_address")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (branchId !== "all") ordersQuery = ordersQuery.eq("branch_id", branchId);

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;
      if (currentRequest !== requestId.current) return;
      setData({
        orders: (orders || []).map((order) => ({ ...order, created_date: order.created_at })),
      });
    } catch (e) {
      if (currentRequest === requestId.current) {
        setError(e);
        setData(null);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [businessId, branchId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const setStatus = (s = "active") => {
    if (s !== "active") setSearchParams({ status: s }); else setSearchParams({});
  };

  const orders = data?.orders || [];
  const normalizedQuery = search.trim().toLocaleLowerCase();
  const matchingOrders = orders.filter((order) => {
    const matchesStatus = status === "active"
      ? ["pending", "accepted", "preparing"].includes(order.status)
      : order.status === status;
    const matchesQuery = !normalizedQuery || [
      order.order_number,
      order.buyer_name_snapshot,
      order.branch_name,
    ].filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  }).sort((a, b) => {
    if (sortOrder === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (sortOrder === "amount-high") return Number(b.total || 0) - Number(a.total || 0);
    if (sortOrder === "amount-low") return Number(a.total || 0) - Number(b.total || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const inProgressCount = orders.filter((order) => ["accepted", "preparing"].includes(order.status)).length;
  const completedCount = orders.filter((order) => order.status === "completed").length;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Buyurtmalar"
        subtitle="Tanlangan biznesning mijozlar buyurtmalarini ko‘ring va boshqaring."
      />

      {!businessId ? (
        <p className="text-sm text-muted-foreground">Avval biznes tanlang.</p>
      ) : (
        <>
          {!loading && !error && (
            <section aria-label="Buyurtmalar ko‘rsatkichlari" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <OrderMetric icon={ShoppingBag} label="Faol buyurtmalar" value={pendingCount + inProgressCount} detail={`${pendingCount} ta yangi`} />
              <OrderMetric icon={Clock3} label="Jarayonda" value={inProgressCount} detail="Qabul qilingan yoki tayyorlanmoqda" />
              <OrderMetric icon={CheckCircle2} label="Yakunlangan" value={completedCount} detail="Arxiv bo‘limida ko‘rinadi" />
            </section>
          )}

          <div className="surface-card space-y-3 p-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buyurtma raqami, mijoz yoki filial"
                  aria-label="Buyurtmalarni qidirish"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm">
                <span className="sr-only">Saralash</span>
                <PackageCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <select
                  aria-label="Buyurtmalarni saralash"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="h-full bg-transparent text-foreground outline-none"
                >
                  <option value="newest">Eng yangi</option>
                  <option value="oldest">Eng eski</option>
                  <option value="amount-high">Summa: yuqoridan</option>
                  <option value="amount-low">Summa: pastdan</option>
                </select>
              </label>
              <button
                type="button"
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
                Yangilash
              </button>
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatus(f.key)}
                  aria-pressed={status === f.key}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-2 text-xs font-medium transition",
                    status === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <ErrorState onRetry={fetchOrders} />
          ) : loading && !data ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : matchingOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={status === "active" && orders.length === 0 ? "Faol buyurtmalar yo‘q" : "Buyurtmalar topilmadi"}
              description={status === "active" && orders.some((order) => order.status === "completed")
                ? "Yakunlangan buyurtmalar alohida “Yakunlandi” bo‘limida saqlanadi."
                : "Filtr yoki qidiruv so‘zini o‘zgartirib ko‘ring."}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="text-sm font-medium">{STATUS_FILTERS.find((filter) => filter.key === status)?.label}</p>
                <p className="text-xs text-muted-foreground">{matchingOrders.length} ta buyurtma</p>
              </div>
              <div className="divide-y divide-border">
                {matchingOrders.map((o) => {
                  const createdAt = new Date(o.created_at);
                  const dateLabel = Number.isNaN(createdAt.getTime()) ? "Sana ko‘rsatilmagan" : createdAt.toLocaleString("uz-UZ", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const itemCount = o.item_count || o.items?.length || 0;
                  const paymentLabel = o.payment_method === "cash_on_delivery"
                    ? "Yetkazganda naqd"
                    : o.payment_method === "card"
                      ? "Karta orqali"
                      : o.payment_method || "To‘lov turi ko‘rsatilmagan";
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => navigate(`${businessPath}/orders/${o.id}`)}
                      className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-secondary/30 active:scale-[0.99] sm:items-center sm:gap-4 sm:px-5"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-foreground">#{o.order_number}</span>
                          <span className="sm:hidden"><OrderStatusBadge status={o.status} /></span>
                          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{dateLabel}
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{o.buyer_name_snapshot || "Xaridor"}</span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{o.branch_name || "Filial"}</span>
                          </span>
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />{itemCount} ta mahsulot
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />{paymentLabel}
                          </span>
                        </span>
                        {o.delivery_address && (
                          <span className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="line-clamp-1">{o.delivery_address}</span>
                          </span>
                        )}
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{dateLabel}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-2">
                        <Price value={o.total} size="sm" />
                        <span className="hidden sm:inline-flex"><OrderStatusBadge status={o.status} /></span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderMetric({ icon: Icon, label, value, detail }) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="block text-xl font-semibold leading-7 text-foreground">{value}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
    </div>
  );
}