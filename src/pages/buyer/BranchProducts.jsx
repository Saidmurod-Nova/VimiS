import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { getBranchCatalogSupabase } from "@/lib/supabaseCatalog";
import { Package, ChevronRight } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import ProductCard from "@/components/vimi/ProductCard";
import AvailabilityBadge from "@/components/vimi/AvailabilityBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CartButton from "@/components/vimi/CartButton";

export default function BranchProducts() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setLoading(true); setError(""); setData(null);
    const request = isSupabaseMode
      ? getBranchCatalogSupabase(branchId)
      : base44.functions.invoke("getBranchCatalog", { branch_id: branchId }).then((res) => res.data);
    request.then(setData)
      .catch((err) => setError(err?.response?.data?.error || err?.message || "Katalog yuklanmadi"))
      .finally(() => setLoading(false));
  }, [branchId]);

  const categories = useMemo(() => {
    const set = new Set((data?.items || []).map((i) => i.category_name).filter(Boolean));
    return Array.from(set);
  }, [data]);

  const items = useMemo(() => {
    let list = data?.items || [];
    if (category !== "all") list = list.filter((i) => i.category_name === category);
    return list;
  }, [data, category]);

  if (loading) return <div className="space-y-4"><PageHeader title="Mahsulotlar" backTo={`/branch/${branchId}`} /><LoadingState /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Mahsulotlar" backTo={`/branch/${branchId}`} /><ErrorState title={error} /></div>;

  const { branch, business } = data;

  return (
    <div className="workspace-page animate-fade-in space-y-5">
      <PageHeader title={branch.name} backTo={`/branch/${branchId}`} />
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <span className="text-sm text-muted-foreground">{business.name}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{branch.name}</span>
      </div>

      {categories.length > 0 && (
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-10 rounded-xl bg-secondary/70"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Package} title="Hozircha mahsulotlar yo'q" description="Bu filialda hozircha mahsulot mavjud emas." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <ProductCard
              key={item.product_id}
              name={item.name}
              price={item.effective_price}
              image={item.image_url}
              onClick={() => navigate(`/branch/${branchId}/products/${item.product_id}`)}
              availability={<AvailabilityBadge available={item.available} disabled={item.disabled} hasInventory={item.has_inventory} className="text-xs" />}
            />
          ))}
        </div>
      )}
      <CartButton />
    </div>
  );
}