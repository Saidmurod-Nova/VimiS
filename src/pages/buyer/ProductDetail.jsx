import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store as StoreIcon, ShoppingBag, MapPin, Loader2 } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import Price from "@/components/vimi/Price";
import AvailabilityBadge from "@/components/vimi/AvailabilityBadge";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/CartContext";
import ConfirmDialog from "@/components/vimi/ConfirmDialog";
import CartButton from "@/components/vimi/CartButton";

// Single product detail implementation. Supports both branch-scoped
// (/branch/:branchId/products/:productId) and branch-agnostic (/product/:productId)
// routes. Branch-specific price and availability come from getBranchCatalog;
// when multiple branches exist the buyer selects one before adding to cart.
export default function ProductDetail() {
  const { branchId, productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || null);
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);

  // Load product + business + active branches.
  useEffect(() => {
    (async () => {
      setLoading(true); setError(""); setProduct(null); setBusiness(null); setBranches([]); setCatalog(null);
      try {
        const p = await base44.entities.Product.get(productId);
        if (!p || !p.is_active) { setError("Mahsulot topilmadi"); return; }
        setProduct(p);
        const b = await base44.entities.Business.get(p.business_id);
        if (!b || !b.is_active) { setError("Do'kon hozirda mavjud emas"); return; }
        setBusiness(b);
        const br = await base44.entities.Branch.filter({ business_id: b.id });
        const active = (br || []).filter((x) => x.is_active);
        setBranches(active);
        const paramValid = branchId && active.some((x) => x.id === branchId);
        if (paramValid) setSelectedBranchId(branchId);
        else if (active.length === 1) setSelectedBranchId(active[0].id);
        else setSelectedBranchId(null);
      } catch (e) {
        setError(e?.response?.data?.error || "Mahsulot yuklanmadi");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Load branch catalog when a branch is selected.
  useEffect(() => {
    if (!selectedBranchId || !business) return;
    setCatalogLoading(true);
    base44.functions.invoke("getBranchCatalog", { branch_id: selectedBranchId })
      .then((res) => setCatalog(res.data))
      .catch(() => setCatalog(null))
      .finally(() => setCatalogLoading(false));
  }, [selectedBranchId, business]);

  if (loading) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={branchId ? `/branch/${branchId}/products` : "/"} /><LoadingState /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={branchId ? `/branch/${branchId}/products` : "/"} /><ErrorState title={error} /></div>;

  const item = (catalog?.items || []).find((i) => i.product_id === productId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const onBranchChange = (v) => {
    // Canonicalize to the branch-scoped route so the link is shareable and
    // back-navigation works from the catalog list.
    navigate(`/branch/${v}/products/${productId}`, { replace: true });
    setSelectedBranchId(v);
  };

  const canAdd = item && item.available && selectedBranchId;

  const doAdd = async (forceNew) => {
    if (!selectedBranchId || !item) return;
    setAdding(true);
    try {
      const res = await addItem(productId, selectedBranchId, 1, { forceNew });
      if (res && res.conflict) { setConflictOpen(true); return; }
      toast({ title: "Savatga qo'shildi", description: item.name });
    } catch (e) {
      toast({ title: e?.response?.data?.error || "Qo'shib bo'lmadi", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };
  const onAdd = () => doAdd(false);
  const onConfirmConflict = async () => {
    setConflictOpen(false);
    setAdding(true);
    try {
      await addItem(productId, selectedBranchId, 1, { forceNew: true });
      toast({ title: "Savatga qo'shildi", description: item?.name });
    } catch (e) {
      toast({ title: e?.response?.data?.error || "Qo'shib bo'lmadi", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={product.name} backTo={branchId ? `/branch/${branchId}/products` : business ? `/store/${business.store_id}` : "/"} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-square w-full bg-secondary">
          {product.image_url ? <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full" /> : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-12 w-12 text-muted-foreground/40" /></div>}
        </div>
        <div className="space-y-3 p-4">
          {product.category_name && <p className="text-xs text-muted-foreground">{product.category_name}</p>}
          <h2 className="text-xl font-semibold">{product.name}</h2>
          {business && <button type="button" onClick={() => navigate(`/store/${business.store_id}`)} className="inline-flex items-center gap-1 text-xs text-primary">{business.name}</button>}
          {item ? <Price value={item.effective_price} size="lg" /> : <p className="text-sm text-muted-foreground">Filial tanlang</p>}
          {item && <AvailabilityBadge available={item.available} disabled={item.disabled} hasInventory={item.has_inventory} />}
          {product.description && <p className="whitespace-pre-line pt-1 text-sm text-muted-foreground">{product.description}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Filial</Label>
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Faol filiallar yo'q.</p>
        ) : (
          <Select value={selectedBranchId || ""} onValueChange={onBranchChange}>
            <SelectTrigger className="h-12 rounded-xl bg-secondary/70"><SelectValue placeholder="Filialni tanlang" /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}{b.city ? " · " + b.city : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedBranch && (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />{[selectedBranch.city, selectedBranch.region].filter(Boolean).join(", ")}{selectedBranch.address ? " · " + selectedBranch.address : ""}
          </p>
        )}
      </div>

      {branches.length > 0 && (
        <PrimaryButton className="h-12 w-full" disabled={!canAdd || adding} onClick={onAdd}>
          {adding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Qo'shilmoqda...</> : !selectedBranchId ? "Filialni tanlang" : item ? (item.available ? "Savatga qo'shish" : "Mavjud emas") : "..."}
        </PrimaryButton>
      )}

      <ConfirmDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        title="Savatda boshqa do'kon mahsuloti bor"
        description="Joriy savatni tozalab, bu mahsulotni qo'shishni xohlaysizmi?"
        confirmText="Tozalash va qo'shish"
        destructive
        onConfirm={onConfirmConflict}
      />
      <CartButton />
    </div>
  );
}