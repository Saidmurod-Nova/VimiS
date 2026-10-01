import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { Plus } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import BusinessHeader from "@/components/vimi/business/BusinessHeader";
import BranchesTab from "@/components/vimi/business/BranchesTab";
import SettingsTab from "@/components/vimi/business/SettingsTab";
import { SecondaryButton } from "@/components/vimi/VimiButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState, EmptyState } from "@/components/vimi/States";

export default function BusinessProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectBusiness } = useBusiness();
  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const b = await base44.entities.Business.get(id);
        setBusiness(b);
        const br = await base44.entities.Branch.filter({ business_id: id });
        setBranches(br || []);
        selectBusiness(id);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="space-y-4"><PageHeader title="Biznes" backTo="/seller" /><LoadingState /></div>;
  if (!business) return <div className="space-y-4"><PageHeader title="Biznes" backTo="/seller" /><EmptyState title="Biznes topilmadi" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={business.name} backTo="/seller" action={<SecondaryButton className="h-10" onClick={() => navigate(`/seller/businesses/${id}/branches/new`)}><Plus className="mr-1 h-4 w-4" />Filial</SecondaryButton>} />
      <BusinessHeader business={business} branchCount={branches.length} />
      <Tabs defaultValue="branches">
        <TabsList className="w-full">
          <TabsTrigger value="branches" className="flex-1">Filiallar</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Sozlamalar</TabsTrigger>
        </TabsList>
        <TabsContent value="branches"><BranchesTab businessId={id} branches={branches} /></TabsContent>
        <TabsContent value="settings"><SettingsTab business={business} onUpdated={setBusiness} /></TabsContent>
      </Tabs>
    </div>
  );
}