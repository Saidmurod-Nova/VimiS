import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getBranch as getBranchSupabase, updateBranch as updateBranchSupabase } from "@/lib/supabaseCatalog";
import PageHeader from "@/components/vimi/PageHeader";
import BranchForm from "@/components/vimi/BranchForm";
import { useToast } from "@/components/ui/use-toast";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";

export default function BranchEdit() {
  const { id, businessId, branchId } = useParams();
  const ownerBusinessId = businessId || id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const record = import.meta.env.VITE_AUTH_PROVIDER === "supabase"
          ? await getBranchSupabase(branchId)
          : await base44.entities.Branch.get(branchId);
        setBranch(record?.business_id === ownerBusinessId ? record : null);
      } catch (e) {
        console.error("Filialni yuklab bo‘lmadi.", e);
        setError(e?.message || "Filialni yuklab bo‘lmadi.");
      } finally { setLoading(false); }
    })();
  }, [branchId, ownerBusinessId]);

  const onSubmit = async (data) => {
    setSaving(true);
    const payload = { branch_id: branchId, name: data.name, address: data.address, phone: data.phone, working_hours: data.working_hours, latitude: data.latitude, longitude: data.longitude };
    if (data.geo) { payload.geo_area_id = data.geo.geo_area_id; payload.country = data.geo.country; payload.region = data.geo.region; payload.city = data.geo.city; payload.district = data.geo.district; }
    try {
      if (import.meta.env.VITE_AUTH_PROVIDER === "supabase") {
        const { branch_id, ...patch } = payload;
        await updateBranchSupabase(branchId, patch);
      } else await base44.functions.invoke("updateBranch", payload);
      toast({ title: "Filial yangilandi" });
      navigate(`/business/${ownerBusinessId}/branches/${branchId}`);
    } catch (err) {
      toast({ title: err.response?.data?.error || "Yangilanmadi", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`/business/${ownerBusinessId}/branches/${branchId}`} /><LoadingState /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`/business/${ownerBusinessId}/branches/${branchId}`} /><ErrorState title={error} /></div>;
  if (!branch) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`/business/${ownerBusinessId}/branches/${branchId}`} /><EmptyState title="Filial topilmadi" /></div>;
  return <div className="animate-fade-in space-y-6"><PageHeader title="Filialni tahrirlash" backTo={`/business/${ownerBusinessId}/branches/${branchId}`} /><BranchForm initial={branch} onSubmit={onSubmit} loading={saving} submitLabel="Saqlash" /></div>;
}