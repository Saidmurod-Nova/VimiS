import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getBranch as getBranchSupabase, listProducts as listProductsSupabase, listBranchInventory as listBranchInventorySupabase } from "@/lib/supabaseCatalog";
import { Search, Package } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { SearchBar } from "@/components/vimi/VimiInput";
import StockBadge from "@/components/vimi/StockBadge";
import AvailabilityBadge from "@/components/vimi/AvailabilityBadge";
import { LoadingState, EmptyState } from "@/components/vimi/States";
import InventoryEditSheet from "@/components/vimi/InventoryEditSheet";
import { Image } from "@/components/ui/image";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatSoM, effectivePrice } from "@/lib/inventory";

const FILTERS = [
  { value: "all", label: "Barchasi" },
  { value: "available", label: "Mavjud" },
  { value: "out", label: "Tugagan" },
  { value: "low", label: "Kam qolgan" },
  { value: "disabled", label: "O'chirilgan" }
];

export default function BranchInventory() {
  const { id: businessId, branchId } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    setLoading(true);
    const useSupabase = import.meta.env.VITE_AUTH_PROVIDER === "supabase";
    Promise.all(useSupabase ? [
      getBranchSupabase(branchId),
      listProductsSupabase({ businessId, includeInactive: true, limit: 200 }),
      listBranchInventorySupabase(branchId)
    ] : [
      base44.entities.Branch.get(branchId),
      base44.entities.Product.filter({ business_id: businessId }, "name"),
      base44.entities.BranchInventory.filter({ branch_id: branchId })
    ]).then(([b, p, inv]) => { setBranch(b); setProducts(p || []); setInventory(inv || []); })
      .catch(() => { setBranch(null); setProducts([]); setInventory([]); })
      .finally(() => setLoading(false));
  }, [branchId, businessId]);

  const invByProduct = useMemo(() => {
    const m = {};
    for (const inv of inventory) m[inv.product_id] = inv;
    return m;
  }, [inventory]);

  const rows = useMemo(() => {
    let list = products.map((p) => ({ product: p, inv: invByProduct[p.id] || null }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.product.name.toLowerCase().includes(q));
    }
    if (filter !== "all") {
      list = list.filter((r) => {
        const stock = r.inv?.stock || 0;
        if (filter === "available") return r.inv && r.inv.is_available !== false && stock > 0;
        if (filter === "out") return r.inv && stock === 0;
        if (filter === "low") return r.inv && stock > 0 && stock <= 5;
        if (filter === "disabled") return r.inv && r.inv.is_available === false;
        return true;
      });
    }
    return list;
  }, [products, invByProduct, search, filter]);

  if (loading) return <div className="space-y-4"><PageHeader title="Inventar" backTo={`/seller/businesses/${businessId}/branches/${branchId}`} /><LoadingState /></div>;
  if (!branch) return <div className="space-y-4"><PageHeader title="Inventar" backTo="/seller" /><EmptyState title="Filial topilmadi" /></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Inventar" subtitle={branch.name} backTo={`/seller/businesses/${businessId}/branches/${branchId}`} />
      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mahsulot nomi" />
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="h-10 rounded-xl bg-secondary/70"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {rows.length === 0 ? (
        <EmptyState icon={Package} title="Bu filialda mahsulot mavjud emas" description="Mahsulotni filialga qo'shing." />
      ) : (
        <div className="space-y-2">
          {rows.map(({ product, inv }) => (
            <button key={product.id} type="button" onClick={() => setEditProduct(product)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                {product.image_url ? <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full" /> : <span className="flex h-full w-full items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/50" /></span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{product.name}</span>
                {inv ? <StockBadge stock={inv.stock || 0} className="mt-0.5" /> : <span className="text-xs text-muted-foreground">Qo'shilmagan</span>}
              </span>
              <span className="shrink-0">
                {inv ? <AvailabilityBadge available={inv.is_available !== false && (inv.stock || 0) > 0} disabled={inv.is_available === false} /> : <span className="text-xs text-muted-foreground">—</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {editProduct && (
        <InventoryEditSheet
          open={!!editProduct}
          onOpenChange={(o) => !o && setEditProduct(null)}
          branch={branch}
          product={editProduct}
          inventory={invByProduct[editProduct.id]}
          onSaved={(inv) => {
            setInventory((prev) => {
              const exists = prev.some((x) => x.id === inv.id);
              return exists ? prev.map((x) => (x.id === inv.id ? inv : x)) : [...prev, inv];
            });
            setEditProduct(null);
          }}
        />
      )}
    </div>
  );
}