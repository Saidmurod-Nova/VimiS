import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState(/** @type {any[]} */ ([]));
  const [products, setProducts] = useState(/** @type {any[]} */ ([]));
  const [businesses, setBusinesses] = useState(/** @type {any[]} */ ([]));
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
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
  useEffect(() => {
    setCategoryId(searchParams.get("categoryId") || "");
  }, [searchParams]);

  const selectCategory = (id) => {
    setCategoryId(id);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set("categoryId", id);
      else next.delete("categoryId");
      return next;
    }, { replace: true });
  };

  const businessMap = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const childIds = selectedCategory && !selectedCategory.parent_id
      ? categories.filter((category) => category.parent_id === selectedCategory.id).map((category) => category.id)
      : [];
    const matchingCategoryIds = selectedCategory
      ? selectedCategory.parent_id
        ? [selectedCategory.id, selectedCategory.parent_id]
        : [selectedCategory.id, ...childIds]
      : [];
    return products.filter((product) => {
      const business = businessMap.get(product.business_id);
      if (!business) return false;
      if (categoryId && !matchingCategoryIds.includes(business.category_id)) return false;
      return !term || `${product.name} ${product.category_name || ""} ${business.name}`.toLocaleLowerCase().includes(term);
    });
  }, [products, businesses, businessMap, categories, categoryId, query]);

  return (
    <div className="workspace-page animate-fade-in space-y-5">
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
        <div className="space-y-2">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => selectCategory("")}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", !categoryId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
            >
              Barchasi
            </button>
            {categories.filter((category) => !category.parent_id).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", categoryId === category.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
              >
                {category.icon ? `${category.icon} ` : ""}{category.name}
              </button>
            ))}
          </div>
          {categoryId && (() => {
            const selected = categories.find((category) => category.id === categoryId);
            const parentId = selected?.parent_id || selected?.id;
            const children = categories.filter((category) => category.parent_id === parentId);
            if (!children.length) return null;
            return (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {children.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium", categoryId === category.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground")}
                  >
                    {category.icon ? `${category.icon} ` : ""}{category.name}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {loading ? <LoadingState className="" /> : error ? <ErrorState title={error} onRetry={loadCatalog} className="" /> : filteredProducts.length === 0 ? (
        <EmptyState icon={Package} title="Mahsulot topilmadi" description="Qidiruv yoki kategoriya tanlovini o‘zgartiring." action={null} className="" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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