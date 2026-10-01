import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { Plus, Tag, Package, Store } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { SearchBar } from "@/components/vimi/VimiInput";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { EmptyState, LoadingState } from "@/components/vimi/States";
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

  useEffect(() => {
    if (!biz) { setProducts([]); setInventory([]); setCategories([]); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      base44.entities.Product.filter({ business_id: biz.id }, "-created_date", 200),
      base44.entities.BranchInventory.filter({ business_id: biz.id }),
      base44.entities.ProductCategory.filter({ business_id: biz.id })
    ]).then(([p, inv, c]) => { setProducts(p || []); setInventory(inv || []); setCategories(c || []); })
      .catch(() => { setProducts([]); setInventory([]); setCategories([]); })
      .finally(() => setLoading(false));
  }, [biz?.id]);

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
  }, [products, categoryId, search, sort, summaryByProduct]);

  if (bizLoading || loading) return <div className="space-y-4"><PageHeader title="Mahsulotlar" /><LoadingState /></div>;
  if (!biz) return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Mahsulotlar" />
      <EmptyState icon={Store} title="Avval biznes yarating" description="Mahsulot qo'shish uchun biznesingiz bo'lishi kerak." action={<PrimaryButton className="h-10" onClick={() => navigate("/seller/businesses/new")}><Plus className="mr-1 h-4 w-4" />Biznes yaratish</PrimaryButton>} />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Mahsulotlar"
        action={<PrimaryButton className="h-10" onClick={() => navigate("/seller/products/new")}><Plus className="mr-1 h-4 w-4" />Mahsulot</PrimaryButton>}
      />
      <div className="flex items-center gap-2">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mahsulot qidirish" className="flex-1" />
        <SecondaryButton className="h-12 px-3" onClick={() => navigate("/seller/products/categories")}><Tag className="h-4 w-4" /></SecondaryButton>
      </div>
      <div className="flex gap-2">
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="h-10 flex-1 rounded-xl bg-secondary/70"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-10 flex-1 rounded-xl bg-secondary/70"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Hozircha mahsulotlar yo'q" description="Mahsulotlaringizni qo'shib savdoni boshlang." action={<PrimaryButton className="h-10" onClick={() => navigate("/seller/products/new")}><Plus className="mr-1 h-4 w-4" />Mahsulot qo'shish</PrimaryButton>} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <ProductListItem key={p.id} product={p} stockSummary={summaryByProduct[p.id]} onClick={() => navigate(`/seller/products/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}