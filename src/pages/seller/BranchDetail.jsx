import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Phone, Clock, Navigation2, Pencil } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import StatusBadge from "@/components/vimi/StatusBadge";
import MapView from "@/components/vimi/MapView";
import ConfirmDialog from "@/components/vimi/ConfirmDialog";
import { SecondaryButton } from "@/components/vimi/VimiButton";
import { useToast } from "@/components/ui/use-toast";
import { LoadingState, EmptyState } from "@/components/vimi/States";
import { openInMaps } from "@/lib/maps";

export default function BranchDetail() {
  const { id, branchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => { setLoading(true); try { setBranch(await base44.entities.Branch.get(branchId)); } catch {} finally { setLoading(false); } })();
  }, [branchId]);

  const toggleActive = async () => {
    setConfirm(false); setSaving(true);
    try {
      const res = await base44.functions.invoke("updateBranch", { branch_id: branchId, is_active: !branch.is_active });
      setBranch(res.data?.branch || res.branch);
      toast({ title: branch.is_active ? "Filial faolsizlantirildi" : "Filial faollashtirildi" });
    } catch { toast({ title: "Amalga oshmadi", variant: "destructive" }); } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><PageHeader title="Filial" backTo={`/seller/businesses/${id}`} /><LoadingState /></div>;
  if (!branch) return <div className="space-y-4"><PageHeader title="Filial" backTo={`/seller/businesses/${id}`} /><EmptyState title="Filial topilmadi" /></div>;

  const rows = [
    { icon: MapPin, label: "Manzil", value: [branch.city, branch.region].filter(Boolean).join(", ") + (branch.address ? " · " + branch.address : "") },
    { icon: Phone, label: "Telefon", value: branch.phone || "—" },
    { icon: Clock, label: "Ish vaqti", value: branch.working_hours || "—" }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={branch.name} backTo={`/seller/businesses/${id}`} action={<SecondaryButton className="h-10" onClick={() => navigate(`/seller/businesses/${id}/branches/${branchId}/edit`)}><Pencil className="mr-1 h-4 w-4" />Tahrirlash</SecondaryButton>} />
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div><h2 className="text-lg font-semibold">{branch.name}</h2><p className="text-xs text-muted-foreground">{[branch.city, branch.region].filter(Boolean).join(", ")}</p></div>
        <StatusBadge active={branch.is_active} />
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary"><r.icon className="h-4 w-4 text-foreground" /></span>
            <div><p className="text-xs text-muted-foreground">{r.label}</p><p className="text-sm font-medium">{r.value}</p></div>
          </div>
        ))}
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary"><Navigation2 className="h-4 w-4 text-foreground" /></span>
          <div><p className="text-xs text-muted-foreground">Koordinalar</p><p className="text-sm font-medium tabular-nums">{branch.latitude?.toFixed(5)}, {branch.longitude?.toFixed(5)}</p></div>
        </div>
      </div>
      {branch.latitude && branch.longitude && <MapView branches={[branch]} />}
      <div className="flex gap-3">
        <SecondaryButton className="h-12 flex-1" onClick={() => openInMaps(branch.latitude, branch.longitude, branch.name)}><Navigation2 className="mr-1.5 h-4 w-4" />Xaritada ochish</SecondaryButton>
        <SecondaryButton className="h-12 flex-1" onClick={() => setConfirm(true)} disabled={saving}>{branch.is_active ? "Faolsizlantirish" : "Faollashtirish"}</SecondaryButton>
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={branch.is_active ? "Filialni faolsizlantirmoqchimisiz?" : "Filialni faollashtirmoqchimisiz?"} description={branch.is_active ? "Xaridorlarga ko'rinmaydi, yangi buyurtmalar to'xtaydi. Tarixiy ma'lumotlar saqlanadi." : "Filial yana xaridorlarga ochiladi."} confirmText={branch.is_active ? "Faolsizlantirish" : "Faollashtirish"} destructive={branch.is_active} onConfirm={toggleActive} />
    </div>
  );
}