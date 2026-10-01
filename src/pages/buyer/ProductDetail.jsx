import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import Price from "@/components/vimi/Price";
import AvailabilityBadge from "@/components/vimi/AvailabilityBadge";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ProductDetail() {
  const { branchId, productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    base44.functions.invoke("getBranchCatalog", { branch_id: branchId })
      .then(async (res) => {
        setData(res.data);
        if (res.data?.business?.id) {
          const br = await base44.entities.Branch.filter({ business_id: res.data.business.id });
          setBranches((br || []).filter((b) => b.is_active));
        }
      })
      .catch((err) => setError(err.response?.data?.error || "Mahsulot yuklanmadi"))
      .finally(() => setLoading(false));
  }, [branchId, productId]);

  if (loading) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={`/branch/${branchId}/products`} /><LoadingState /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={`/branch/${branchId}/products`} /><ErrorState title={error} /></div>;

  const item = (data?.items || []).find((i) => i.product_id === productId);
  if (!item) return <div className="space-y-4"><PageHeader title="Mahsulot" backTo={`/branch/${branchId}/products`} /><EmptyState title="Mahsulot topilmadi" description="Bu mahsulot hozirda sotuvda emas." /></div>;

  const branch = data.branch;
  const onAdd = () => toast({ title: "Savat funksiyasi tez orada", description: "Buyurtmalar moduli hozir tayyorlanmoqda." });

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={item.name} backTo={`/branch/${branchId}/products`} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-square w-full bg-secondary">
          {item.image_url ? <Image src={item.image_url} alt={item.name} fittingType="fill" className="h-full w-full" /> : <div className="flex h-full w-full items-center justify-center"><Store className="h-12 w-12 text-muted-foreground/40" /></div>}
        </div>
        <div className="p-4 space-y-3">
          {item.category_name && <p className="text-xs text-muted-foreground">{item.category_name}</p>}
          <h2 className="text-xl font-semibold">{item.name}</h2>
          <Price value={item.effective_price} size="lg" />
          <AvailabilityBadge available={item.available} disabled={item.disabled} hasInventory={item.has_inventory} />
          {item.description && <p className="pt-1 text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Filial</Label>
        <Select value={branchId} onValueChange={(v) => navigate(`/branch/${v}/products/${productId}`)}>
          <SelectTrigger className="h-12 rounded-xl bg-secondary/70"><SelectValue /></SelectTrigger>
          <SelectContent>
            {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <PrimaryButton className="h-12 w-full" disabled={!item.available} onClick={onAdd}>
        {item.available ? "Savatga qo'shish" : "Mavjud emas"}
      </PrimaryButton>
    </div>
  );
}