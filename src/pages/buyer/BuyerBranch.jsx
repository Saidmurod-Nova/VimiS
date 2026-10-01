import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Phone, Clock, Navigation2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import StatusBadge from "@/components/vimi/StatusBadge";
import MapView from "@/components/vimi/MapView";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { LoadingState, EmptyState } from "@/components/vimi/States";
import { openInMaps } from "@/lib/maps";

export default function BuyerBranch() {
  const { branchId } = useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { try { setBranch(await base44.entities.Branch.get(branchId)); } catch {} finally { setLoading(false); } })();
  }, [branchId]);

  if (loading) return <div className="space-y-4"><PageHeader title="Filial" backTo="/" /><LoadingState /></div>;
  if (!branch) return <div className="space-y-4"><PageHeader title="Filial" backTo="/" /><EmptyState title="Filial topilmadi" /></div>;

  const rows = [
    { icon: MapPin, label: "Manzil", value: [branch.city, branch.region].filter(Boolean).join(", ") + (branch.address ? " · " + branch.address : "") },
    { icon: Phone, label: "Telefon", value: branch.phone || "—" },
    { icon: Clock, label: "Ish vaqti", value: branch.working_hours || "—" }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={branch.name} backTo="/" />
      {!branch.is_active && <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm"><AlertCircle className="h-5 w-5 text-warning" />Bu filial hozirda faol emas.</div>}
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
      </div>
      {branch.latitude && branch.longitude && <MapView branches={[branch]} />}
      <PrimaryButton className="h-12 w-full" onClick={() => openInMaps(branch.latitude, branch.longitude, branch.name)}><Navigation2 className="mr-1.5 h-4 w-4" />Xaritada ochish</PrimaryButton>
    </div>
  );
}