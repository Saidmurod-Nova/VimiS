import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import ProductCard from "@/components/vimi/ProductCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { listProducts, listPublicBusinesses, listPublicCategories } from "@/lib/supabaseCatalog";
import { cn } from "@/lib/utils";

export default function Catalog() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(/** @type {any[]} */ ([]));
  const [products, setProducts] = useState(/** @type {any[]} */ ([]));
  const [businesses, setBusinesses] = useState(/** @type {any[]} */ ([]));
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCatalog = async () => {
    setLoading(true);
    setError("");
    try {
      const result = isSupabaseMode
        ? await Promise.all([
            listPublicCategories(),
            listProducts({ limit: 200 }),
            listPublicBusinesses({ limit: 100 }),
          ])
        : await Promise.all([
            base44.entities.Category.list(),
            base44.entities.Product.filter({ is_active: true }, "-created_date", 200),
            base44.entities.Business.filter({ is_active: true }, "-created_date", 100),
          ]);
      setCategories(result[0] || []);
      setProducts(result[1] || []);
      setBusinesses(result[2] || []);
    } catch (/** @type {any} */ loadError) {
      setError(loadError?.message || "Katalogni yuklab bo‘lmadi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, []);

  const businessMap = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const business = businessMap.get(product.business_id);
      if (!business) return false;
      if (categoryId && business.category_id !== categoryId) return false;
      return !term || `${product.name} ${product.category_name || ""} ${business.name}`.toLocaleLowerCase().includes(term);
    });
  }, [products, businesses, businessMap, categoryId, query]);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Katalog" subtitle="Do‘konlardagi mahsulotlarni ko‘ring." backTo="/" action={null} className="" />
      <label className="relative block">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Mahsulot yoki do‘kon qidirish"
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {categories.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setCategoryId("")} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", !categoryId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
            Barchasi
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", categoryId === category.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
            >
              {category.icon ? `${category.icon} ` : ""}{category.name}
            </button>
          ))}
        </div>
      )}

      {loading ? <LoadingState className="" /> : error ? <ErrorState title={error} onRetry={loadCatalog} className="" /> : filteredProducts.length === 0 ? (
        <EmptyState icon={Package} title="Mahsulot topilmadi" description="Qidiruv yoki kategoriya tanlovini o‘zgartiring." action={null} className="" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              image={product.image_url}
              onClick={() => navigate(`/product/${product.id}`)}
              onAdd={null}
              availability={null}
              className=""
            />
          ))}
        </div>
      )}
    </div>
  );
}