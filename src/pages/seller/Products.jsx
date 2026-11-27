import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { listProducts, listBusinessInventory, listProductCategories } from "@/lib/supabaseCatalog";
import { useBusiness } from "@/lib/BusinessContext";
import { Plus, Tag, Package, Store } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { SearchBar } from "@/components/vimi/VimiInput";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import ProductListItem from "@/components/vimi/ProductListItem";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const SORTS = [
  { value: "newest", label: "Yangilari" },
  { value: "name", label: "Nomi" },
  { value: "price", label: "Narx" },
  { value: "stock", label: "Stock" },
  { value: "lowstock", label: "Kam qolgan" }
];

export default function Products() {
  const navigate = useNavigate();
  const { selectedBusiness: biz, loading: bizLoading } = useBusiness();
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const businessPath = biz ? `/business/${biz.id}` : "/business";

  const loadProducts = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!biz?.id) {
      setProducts([]);
      setInventory([]);
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setProducts([]);
    const useSupabase = import.meta.env.VITE_AUTH_PROVIDER === "supabase";
    try {
      const [p, inv, c] = await Promise.all(useSupabase ? [
        listProducts({ businessId: biz.id, includeInactive: true, limit: 200 }),
        listBusinessInventory(biz.id),
        listProductCategories(biz.id)
      ] : [
        base44.entities.Product.filter({ business_id: biz.id }, "-created_date", 200),
        base44.entities.BranchInventory.filter({ business_id: biz.id }),
        base44.entities.ProductCategory.filter({ business_id: biz.id })
      ]);
      if (currentRequest !== requestId.current) return;
      setProducts(p || []);
      setInventory(inv || []);
      setCategories(c || []);
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      console.error("Mahsulotlar ro‘yxatini yuklab bo‘lmadi.", loadError);
      setError(loadError?.message || "Mahsulotlar ro‘yxatini yuklab bo‘lmadi.");
      setProducts([]);
      setInventory([]);
      setCategories([]);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [biz?.id]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const summaryByProduct = useMemo(() => {
    const m = {};
    for (const inv of inventory) {
      const s = m[inv.product_id] || { totalStock: 0, branchCount: 0 };
      s.totalStock += inv.stock || 0;
      s.branchCount += 1;
      m[inv.product_id] = s;
    }
    return m;
  }, [inventory]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (categoryId !== "all") list = list.filter((p) => p.category_id === categoryId);
    if (status === "active") list = list.filter((p) => p.is_active);
    if (status === "inactive") list = list.filter((p) => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.category_name || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price") return a.price - b.price;
      if (sort === "stock") return (summaryByProduct[b.id]?.totalStock || 0) - (summaryByProduct[a.id]?.totalStock || 0);
      if (sort === "lowstock") return (summaryByProduct[a.id]?.totalStock ?? 999) - (summaryByProduct[b.id]?.totalStock ?? 999);
      return 0;
    });
    return list;
  }, [products, categoryId, search, sort, status, summaryByProduct]);

  if (bizLoading || loading) return <div className="workspace-page space-y-5"><PageHeader title="Mahsulotlar" /><LoadingState /></div>;
  if (!biz) return (
    <div className="workspace-page animate-fade-in space-y-4">
      <PageHeader title="Mahsulotlar" />
      <EmptyState icon={Store} title="Avval biznes yarating" description="Mahsulot qo‘shish uchun avval biznes yarating." action={<PrimaryButton className="h-10" onClick={() => navigate("/business/new")}><Plus className="mr-1 h-4 w-4" />Biznes yaratish</PrimaryButton>} />
    </div>
  );

  return (
    <div className="workspace-page animate-fade-in space-y-5">
      <PageHeader
        title="Mahsulotlar"
        subtitle={`${products.length} ta mahsulot · ${products.filter((product) => product.is_active).length} ta faol`}
        action={<PrimaryButton className="h-10 shrink-0" onClick={() => navigate(`${businessPath}/products/new`)}><Plus className="mr-1 h-4 w-4" />Mahsulot qo‘shish</PrimaryButton>}
      />
      <div className="surface-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mahsulot yoki kategoriya qidirish" aria-label="Mahsulot qidirish" className="min-w-0 flex-1" />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-10 min-w-36 rounded-lg bg-card"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 min-w-32 rounded-lg bg-card"><SelectValue placeholder="Holat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Nofaol</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 min-w-32 rounded-lg bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <SecondaryButton className="h-10 px-3" onClick={() => navigate(`${businessPath}/products/categories`)} aria-label="Mahsulot kategoriyalarini boshqarish">
            <Tag className="h-4 w-4" /><span className="ml-2">Kategoriyalar</span>
          </SecondaryButton>
        </div>
      </div>

      {error ? <ErrorState title={error} onRetry={loadProducts} /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title={search || categoryId !== "all" ? "Mahsulot topilmadi" : "Hozircha mahsulotlar yo‘q"} description={search || categoryId !== "all" ? "Qidiruv va filtrlarni o‘zgartirib ko‘ring." : "Mahsulot qo‘shib savdoni boshlang."} action={!search && categoryId === "all" ? <PrimaryButton className="h-10" onClick={() => navigate(`${businessPath}/products/new`)}><Plus className="mr-1 h-4 w-4" />Mahsulot qo‘shish</PrimaryButton> : null} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[40px_minmax(0,2fr)_minmax(120px,1fr)_minmax(140px,1fr)_minmax(100px,.7fr)] items-center gap-4 border-b border-border bg-muted/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span aria-hidden="true" />
            <span>Mahsulot</span>
            <span>Narx</span>
            <span>Zaxira</span>
            <span>Holat</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((p) => (
              <ProductListItem key={p.id} product={p} stockSummary={summaryByProduct[p.id]} onClick={() => navigate(`${businessPath}/products/${p.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}