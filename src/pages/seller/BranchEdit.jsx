import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vimi/PageHeader";
import BranchForm from "@/components/vimi/BranchForm";
import { useToast } from "@/components/ui/use-toast";
import { LoadingState, EmptyState } from "@/components/vimi/States";

export default function BranchEdit() {
  const { id, branchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { setBranch(await base44.entities.Branch.get(branchId)); } catch {} finally { setLoading(false); }
    })();
  }, [branchId]);

  const onSubmit = async (data) => {
    setSaving(true);
    const payload = { branch_id: branchId, name: data.name, address: data.address, phone: data.phone, working_hours: data.working_hours, latitude: data.latitude, longitude: data.longitude };
    if (data.geo) { payload.geo_area_id = data.geo.geo_area_id; payload.country = data.geo.country; payload.region = data.geo.region; payload.city = data.geo.city; payload.district = data.geo.district; }
    try {
      await base44.functions.invoke("updateBranch", payload);
      toast({ title: "Filial yangilandi" });
      navigate(`/seller/businesses/${id}/branches/${branchId}`);
    } catch (err) {
      toast({ title: err.response?.data?.error || "Yangilanmadi", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`/seller/businesses/${id}/branches/${branchId}`} /><LoadingState /></div>;
  if (!branch) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`/seller/businesses/${id}/branches/${branchId}`} /><EmptyState title="Filial topilmadi" /></div>;
  return <div className="animate-fade-in space-y-6"><PageHeader title="Filialni tahrirlash" backTo={`/seller/businesses/${id}/branches/${branchId}`} /><BranchForm initial={branch} onSubmit={onSubmit} loading={saving} submitLabel="Saqlash" /></div>;
}