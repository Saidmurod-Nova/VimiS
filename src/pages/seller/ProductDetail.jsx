import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBusiness } from "@/lib/BusinessContext";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Archive, AlertCircle, Store } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import Price from "@/components/vimi/Price";
import StockBadge from "@/components/vimi/StockBadge";
import { PrimaryButton, SecondaryButton, GhostButton } from "@/components/vimi/VimiButton";
import { LoadingState, EmptyState } from "@/components/vimi/States";
import InventoryEditSheet from "@/components/vimi/InventoryEditSheet";
import BranchAssignSheet from "@/components/vimi/BranchAssignSheet";
import { Image } from "@/components/ui/image";
import { formatSoM, effectivePrice } from "@/lib/inventory";

export default function ProductDetail() {
  const { id, businessId } = useParams();
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBranch, setEditBranch] = useState(null); // branch being edited
  const [assignOpen, setAssignOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const requestId = useRef(0);

  const load = async () => {
    const currentRequest = ++requestId.current;
    const targetBusinessId = businessId || selectedBusiness?.id;
    setLoading(true); setProduct(null); setBranches([]); setInventory([]);
    try {
      const { data: p, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("business_id", targetBusinessId)
        .maybeSingle();
      if (productError) throw productError;
      if (currentRequest !== requestId.current) return;
      setProduct(p);
      if (p) {
        const [branchesResult, inventoryResult] = await Promise.all([
          supabase.from("branches").select("*").eq("business_id", targetBusinessId).order("name"),
          supabase.from("branch_inventory").select("*").eq("product_id", p.id).eq("business_id", targetBusinessId)
        ]);
        if (branchesResult.error) throw branchesResult.error;
        if (inventoryResult.error) throw inventoryResult.error;
        if (currentRequest !== requestId.current) return;
        setBranches(branchesResult.data || []);
        setInventory(inventoryResult.data || []);
      }
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error("Mahsulot ma’lumotlarini yuklab bo‘lmadi.", error);
      toast({ title: error?.message || "Mahsulot ma’lumotlarini yuklab bo‘lmadi.", variant: "destructive" });
      setProduct(null);
      setBranches([]);
      setInventory([]);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, businessId, selectedBusiness?.id]);

  const invByBranch = useMemo(() => {
    const m = {};
    for (const inv of inventory) m[inv.branch_id] = inv;
    return m;
  }, [inventory]);

  const toggleActive = async () => {
    setToggling(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", id)
        .eq("business_id", businessId || selectedBusiness?.id)
        .select()
        .single();
      if (error) throw error;
      setProduct(data);
      toast({ title: product.is_active ? "Mahsulot arxivlandi" : "Mahsulot faollashtirildi" });
    } catch (err) {
      toast({ title: err.message || "Amalga oshmadi", variant: "destructive" });
    } finally { setToggling(false); }
  };

  const productsPath = `/business/${businessId || selectedBusiness?.id}/products`;
  if (loading) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={productsPath} /><LoadingState /></div>;
  if (!product) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={productsPath} /><EmptyState title="Mahsulot topilmadi" /></div>;

  const assignedCount = inventory.length;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={product.name} backTo={productsPath} action={
        <GhostButton icon={Pencil} label="Tahrirlash" onClick={() => navigate(`${productsPath}/${id}/edit`)} />
      } />

      {!product.is_active && (
        <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm"><AlertCircle className="h-5 w-5 text-warning" />Mahsulot faol emas — xaridorlar ko'rolmaydi.</div>
      )}

      <div className="flex gap-4 rounded-2xl border border-border bg-card p-4">
        <span className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          {product.image_url ? <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full" /> : <span className="flex h-full w-full items-center justify-center"><Store className="h-8 w-8 text-muted-foreground/50" /></span>}
        </span>
        <div className="min-w-0 flex-1">
          {product.category_name && <p className="text-xs text-muted-foreground">{product.category_name}</p>}
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <Price value={product.price} size="md" className="mt-1" />
          {product.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{product.description}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <SecondaryButton className="h-11 flex-1" onClick={() => navigate(`${productsPath}/${id}/edit`)}><Pencil className="mr-1.5 h-4 w-4" />Tahrirlash</SecondaryButton>
        <SecondaryButton className="h-11 flex-1" disabled={toggling} onClick={toggleActive}><Archive className="mr-1.5 h-4 w-4" />{product.is_active ? "Arxivlash" : "Faollashtirish"}</SecondaryButton>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filiallar · {assignedCount}/{branches.length}</h3>
          <PrimaryButton className="h-9" onClick={() => setAssignOpen(true)}><Plus className="mr-1 h-4 w-4" />Filialga qo'shish</PrimaryButton>
        </div>

        {branches.length === 0 ? (
          <EmptyState icon={Store} title="Filiallar yo'q" description="Avval biznesga filial qo'shing." />
        ) : (
          <div className="space-y-2">
            {branches.map((b) => {
              const inv = invByBranch[b.id];
              const eff = inv ? effectivePrice(product, inv) : product.price;
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{[b.city, b.region].filter(Boolean).join(", ")}</p>
                    {inv ? (
                      <div className="mt-1 flex items-center gap-3">
                        <StockBadge stock={inv.stock || 0} />
                        {inv.price_override != null && <span className="text-xs text-muted-foreground">Narx: {formatSoM(eff)} so'm</span>}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Bu filialda mavjud emas</p>
                    )}
                  </div>
                  {inv ? (
                    <SecondaryButton className="h-9" onClick={() => setEditBranch(b)}>Boshqarish</SecondaryButton>
                  ) : (
                    <PrimaryButton className="h-9" onClick={() => setEditBranch(b)}>Qo'shish</PrimaryButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editBranch && (
        <InventoryEditSheet
          open={!!editBranch}
          onOpenChange={(o) => !o && setEditBranch(null)}
          branch={editBranch}
          product={product}
          inventory={invByBranch[editBranch.id]}
          onSaved={(inv) => {
            setInventory((prev) => {
              const exists = prev.some((x) => x.id === inv.id);
              return exists ? prev.map((x) => (x.id === inv.id ? inv : x)) : [...prev, inv];
            });
            setEditBranch(null);
          }}
        />
      )}
      <BranchAssignSheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        product={product}
        branches={branches}
        inventoryByBranch={invByBranch}
        onAssigned={load}
      />
    </div>
  );
}