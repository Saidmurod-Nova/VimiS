import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vimi/PageHeader";
import BranchForm from "@/components/vimi/BranchForm";
import { useToast } from "@/components/ui/use-toast";

export default function BranchCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = { business_id: id, name: data.name, address: data.address, phone: data.phone, working_hours: data.working_hours, latitude: data.latitude, longitude: data.longitude };
    if (data.geo) { payload.geo_area_id = data.geo.geo_area_id; payload.country = data.geo.country; payload.region = data.geo.region; payload.city = data.geo.city; payload.district = data.geo.district; }
    try {
      await base44.functions.invoke("createBranch", payload);
      toast({ title: "Filial yaratildi" });
      navigate(`/seller/businesses/${id}`);
    } catch (err) {
      toast({ title: err.response?.data?.error || "Filial yaratilmadi", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return <div className="animate-fade-in space-y-6"><PageHeader title="Yangi filial" backTo={`/seller/businesses/${id}`} /><BranchForm onSubmit={onSubmit} loading={loading} submitLabel="Filial yaratish" /></div>;
}