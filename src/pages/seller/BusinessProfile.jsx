import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode, requireSupabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import BusinessHeader from "@/components/vimi/business/BusinessHeader";
import BranchesTab from "@/components/vimi/business/BranchesTab";
import SettingsTab from "@/components/vimi/business/SettingsTab";
import { SecondaryButton } from "@/components/vimi/VimiButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";

export default function BusinessProfile() {
  const { id, businessId } = useParams();
  const targetBusinessId = businessId || id;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const loadBusiness = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true); setError(""); setBusiness(null); setBranches([]);
    try {
      let businessRecord;
      let branchRecords;
      if (isSupabaseMode) {
        const client = requireSupabase();
        const { data: businessData, error: businessError } = await client
          .from("businesses").select("*").eq("id", targetBusinessId).single();
        if (businessError) throw businessError;
        const { data: branchData, error: branchError } = await client
          .from("branches").select("*").eq("business_id", targetBusinessId);
        if (branchError) throw branchError;
        businessRecord = businessData;
        branchRecords = branchData || [];
      } else {
        businessRecord = await base44.entities.Business.get(targetBusinessId);
        branchRecords = await base44.entities.Branch.filter({ business_id: targetBusinessId }, "name", 100);
      }
      if (!businessRecord) throw new Error("Biznes topilmadi.");
      if (currentRequest !== requestId.current) return;
      setBusiness(businessRecord);
      setBranches(branchRecords || []);
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      console.error("Biznes ma’lumotlarini yuklab bo‘lmadi.", loadError);
      setBusiness(null);
      setBranches([]);
      setError(loadError?.message || "Biznes ma’lumotlarini yuklab bo‘lmadi.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [targetBusinessId]);

  useEffect(() => { loadBusiness(); }, [loadBusiness]);

  if (loading) return <div className="space-y-4"><PageHeader title="Biznes" subtitle="" action={null} backTo="/business" className="" /><LoadingState className="" /></div>;
  if (error || !business) {
    return (
      <div className="space-y-4">
        <PageHeader title="Biznes" subtitle="" action={null} backTo="/business" className="" />
        {error
          ? <ErrorState title={error} description="" onRetry={loadBusiness} className="" />
          : <EmptyState icon={undefined} title="Biznes topilmadi" description="" action={null} className="" />}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Business Settings" subtitle={business.name} backTo={`/business/${targetBusinessId}`} className="" action={<SecondaryButton className="h-10" onClick={() => navigate(`/business/${targetBusinessId}/branches/new`)}><Plus className="mr-1 h-4 w-4" />Filial</SecondaryButton>} />
      <BusinessHeader business={business} branchCount={branches.length} />
      <Tabs
        value={searchParams.get("tab") === "branches" ? "branches" : "settings"}
        onValueChange={(tab) => {
          const next = new URLSearchParams(searchParams);
          if (tab === "branches") next.set("tab", "branches");
          else next.delete("tab");
          setSearchParams(next, { replace: true });
        }}
      >
        <TabsList className="w-fit">
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
          <TabsTrigger value="branches">Filiallar</TabsTrigger>
        </TabsList>
        <TabsContent value="branches"><BranchesTab businessId={targetBusinessId} branches={branches} /></TabsContent>
        <TabsContent value="settings"><SettingsTab business={business} onUpdated={setBusiness} /></TabsContent>
      </Tabs>
    </div>
  );
}