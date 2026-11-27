import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownWideNarrow,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import moment from "moment";
import { requireSupabase } from "@/lib/supabase";
import OrderCard from "@/components/vimi/OrderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/vimi/PageHeader";

const STATUS_FILTERS = [
  { key: "", label: "Barchasi" },
  { key: "pending", label: "Yangi" },
  { key: "accepted", label: "Qabul qilindi" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "completed", label: "Yakunlandi" },
  { key: "cancelled", label: "Bekor qilindi" },
];

const DATE_FILTERS = [
  { key: "all", label: "Barcha vaqt" },
  { key: "30", label: "30 kun" },
  { key: "90", label: "90 kun" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Avval yangilari" },
  { key: "oldest", label: "Avval eskilari" },
  { key: "highest", label: "Narxi: yuqoridan" },
  { key: "lowest", label: "Narxi: pastdan" },
];

const fmtMoney = (value = 0) => new Intl.NumberFormat("en-US")
  .format(Math.round(Number(value) || 0))
  .replace(/,/g, " ") + " so'm";

function SummaryCard({ icon: Icon, label, value, tone = "bg-secondary text-foreground" }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
    </article>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = async () => {
    setLoading(true);
    setError("");
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
        .select("id, order_number, status, total, subtotal, delivery_fee, item_count, business_name, branch_name, delivery_address, payment_method, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (ordersError) throw ordersError;

      setOrders(data || []);
    } catch (/** @type {any} */ loadError) {
      setError(loadError?.message || "Buyurtmalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusCounts = useMemo(() => orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
    return counts;
  }, /** @type {Record<string, number>} */ ({})), [orders]);

  const summary = useMemo(() => ({
    active: orders.filter((order) => ["pending", "accepted", "preparing"].includes(order.status)).length,
    completed: orders.filter((order) => order.status === "completed").length,
    spent: orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + Number(order.total || 0), 0),
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const cutoff = dateRange === "all" ? null : moment().subtract(Number(dateRange), "days");
    const list = orders.filter((order) => {
      if (status && order.status !== status) return false;
      if (cutoff && moment(order.created_at).isBefore(cutoff)) return false;
      if (!term) return true;
      return [
        order.order_number,
        order.business_name,
        order.branch_name,
        order.delivery_address,
        order.payment_method,
      ].some((value) => String(value || "").toLocaleLowerCase().includes(term));
    });

    return list.sort((a, b) => {
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "highest") return Number(b.total || 0) - Number(a.total || 0);
      if (sort === "lowest") return Number(a.total || 0) - Number(b.total || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, status, search, dateRange, sort]);

  return (
    <div className="workspace-page animate-fade-in space-y-6">
      <PageHeader
        title="Buyurtmalar"
        subtitle="Xaridlaringiz holati, yetkazib berish va to‘lov tafsilotlarini kuzating."
        action={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Buyurtmalarni yangilash"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        }
      />

      {loading ? <LoadingState className="" /> : error ? <ErrorState title={error} onRetry={load} className="" /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Hozircha buyurtmalar yo‘q" description="Xaridlaringiz shu sahifada kuzatib boriladi." className="" action={<PrimaryButton onClick={() => navigate("/")} className="h-10">Xaridni boshlash</PrimaryButton>} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Buyurtmalar statistikasi">
            <SummaryCard icon={ShoppingBag} label="Jami buyurtmalar" value={orders.length} />
            <SummaryCard icon={Clock3} label="Jarayondagi buyurtmalar" value={summary.active} tone="bg-warning/10 text-warning" />
            <SummaryCard icon={Wallet} label="Yakunlangan xaridlar" value={fmtMoney(summary.spent)} tone="bg-success/10 text-success" />
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="Buyurtmalarni qidirish va filtrlash">
            <label className="relative block">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buyurtma raqami, do‘kon yoki manzil bo‘yicha qidirish"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((filter) => {
                const count = filter.key ? statusCounts[filter.key] || 0 : orders.length;
                return (
                  <button
                    key={filter.key || "all"}
                    type="button"
                    onClick={() => setStatus(filter.key)}
                    aria-pressed={status === filter.key}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition",
                      status === filter.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter.label}
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", status === filter.key ? "bg-primary-foreground/15" : "bg-background/70")}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Davr:</span>
                <div className="flex rounded-lg bg-secondary p-1">
                  {DATE_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setDateRange(filter.key)}
                      aria-pressed={dateRange === filter.key}
                      className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition", dateRange === filter.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ArrowDownWideNarrow className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Saralash</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 min-w-40 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {SORT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold">Buyurtmalar ro‘yxati</h2>
            <span className="text-xs text-muted-foreground">{visibleOrders.length} ta natija</span>
          </div>
          {visibleOrders.length === 0 ? (
            <EmptyState icon={Search} title="Mos buyurtma topilmadi" description="Qidiruv so‘zi yoki filtrlarni o‘zgartirib ko‘ring." action={null} className="" />
          ) : (
            <div className="grid gap-3">
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  orderId={order.id}
                  number={order.order_number}
                  status={order.status}
                  total={fmtMoney(order.total)}
                  itemCount={order.item_count}
                  businessName={order.business_name}
                  branchName={order.branch_name}
                  address={order.delivery_address}
                  paymentMethod={order.payment_method}
                  date={moment(order.created_at).format("DD.MM.YYYY · HH:mm")}
                />
              ))}
            </div>
          )}
          {summary.completed > 0 && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <PackageCheck className="h-4 w-4 text-success" aria-hidden="true" />
              {summary.completed} ta buyurtma muvaffaqiyatli yakunlangan.
            </p>
          )}
        </>
      )}
    </div>
  );
}
