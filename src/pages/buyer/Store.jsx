import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store as StoreIcon } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import BranchListItem from "@/components/vimi/BranchListItem";
import StatusBadge from "@/components/vimi/StatusBadge";
import { Image } from "@/components/ui/image";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";

export default function Store() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setNotFound(false);
      try {
        const list = await base44.entities.Business.filter({ store_id: storeId });
        const b = list && list[0];
        if (!b) { setNotFound(true); setBusiness(null); return; }
        setBusiness(b);
        if (b.is_active) {
          const br = await base44.entities.Branch.filter({ business_id: b.id });
          setBranches((br || []).filter((x) => x.is_active));
        }
      } catch { setNotFound(true); } finally { setLoading(false); }
    })();
  }, [storeId]);

  if (loading) return <div className="space-y-4"><PageHeader title="Do'kon" backTo="/" /><LoadingState /></div>;
  if (notFound || !business) return <div className="space-y-4"><PageHeader title="Do'kon" backTo="/" /><ErrorState title="Do'kon topilmadi" description="ID ni tekshirib qayta urinib ko'ring." /></div>;

  const grouped = branches.reduce((acc, b) => { const key = b.city || b.region || "Boshqa"; (acc[key] = acc[key] || []).push(b); return acc; }, {});

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={business.name} backTo="/" />
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-secondary">{business.logo_url ? <Image src={business.logo_url} alt={business.name} fittingType="fill" className="h-full w-full" /> : <StoreIcon className="h-7 w-7 text-muted-foreground" />}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{business.name}</h2>
          <p className="font-mono text-sm text-primary">{business.store_id}</p>
          <p className="truncate text-xs text-muted-foreground">{business.category_name}{business.description ? " · " + business.description : ""}</p>
        </div>
        <StatusBadge active={business.is_active} />
      </div>

      {!business.is_active ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">Bu do'kon hozirda faol emas.</div>
      ) : branches.length === 0 ? (
        <EmptyState icon={StoreIcon} title="Filiallar yo'q" description="Bu do'konda hozircha filiallar mavjud emas." />
      ) : (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold">Filialni tanlang</h2>
          {Object.entries(grouped).map(([city, items]) => (
            <div key={city} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{city}</p>
              {items.map((b) => <BranchListItem key={b.id} branch={b} onClick={() => navigate(`/branch/${b.id}`)} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}