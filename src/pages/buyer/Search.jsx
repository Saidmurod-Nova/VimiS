import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X, Store as StoreIcon, Package } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import SearchStoreCard from "@/components/vimi/SearchStoreCard";
import SearchProductCard from "@/components/vimi/SearchProductCard";
import { EmptyState, ErrorState } from "@/components/vimi/States";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "Barchasi" },
  { id: "stores", label: "Do'konlar" },
  { id: "products", label: "Mahsulotlar" }
];

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState({ businesses: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) { setData({ businesses: [], products: [] }); setLoading(false); setError(""); return; }
    setLoading(true); setError("");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("searchCatalog", { q });
        setData(res.data || { businesses: [], products: [] });
      } catch (err) {
        setError(err?.response?.data?.error || "Qidiruvda xatolik");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  const counts = useMemo(() => ({ all: data.businesses.length + data.products.length, stores: data.businesses.length, products: data.products.length }), [data]);
  const showStores = filter === "all" || filter === "stores";
  const showProducts = filter === "all" || filter === "products";
  const hasResults = counts.all > 0;
  const hasQuery = !!query.trim();

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Qidirish" backTo="/" />

      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }}
          placeholder="Do'kon yoki mahsulot qidiring"
          className="h-12 w-full rounded-xl border-transparent bg-secondary/70 pl-11 pr-10 text-sm outline-none focus-visible:bg-background"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setParams({}, { replace: true }); }} aria-label="Tozalash" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasQuery && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                filter === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}{counts[f.id] > 0 ? ` · ${counts[f.id]}` : ""}
            </button>
          ))}
        </div>
      )}

      {!hasQuery ? (
        <EmptyState icon={SearchIcon} title="Qidirishni boshlang" description="Do'kon nomi, ID yoki mahsulot nomini kiriting." />
      ) : error ? (
        <ErrorState title={error} onRetry={() => setQuery((q) => q)} />
      ) : loading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-secondary animate-pulse" />
          <div className="h-16 rounded-2xl bg-secondary animate-pulse" />
          <div className="h-16 rounded-2xl bg-secondary animate-pulse" />
        </div>
      ) : !hasResults ? (
        <EmptyState icon={SearchIcon} title="Natija topilmadi" description="Boshqa so'rov bilan urinib ko'ring." />
      ) : (
        <div className="space-y-5">
          {showStores && data.businesses.length > 0 && (
            <section className="space-y-2">
              {filter === "all" && <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Do'konlar</h2>}
              {data.businesses.map((b) => (
                <SearchStoreCard key={b.id} business={b} onView={() => navigate(`/store/${b.store_id}`)} />
              ))}
            </section>
          )}
          {showProducts && data.products.length > 0 && (
            <section className="space-y-2">
              {filter === "all" && <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mahsulotlar</h2>}
              <div className="grid grid-cols-2 gap-3">
                {data.products.map((p) => (
                  <SearchProductCard key={p.product_id} product={p} onView={() => navigate(`/product/${p.product_id}`)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}