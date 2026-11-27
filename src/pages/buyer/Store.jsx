import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { getPublicBusinessByStoreId, listBranches, getBranchCatalogSupabase } from "@/lib/supabaseCatalog";
import { Store as StoreIcon, MapPin, Navigation2, Map, SlidersHorizontal, Package } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import BottomSheet from "@/components/vimi/BottomSheet";
import BranchSelectSheet from "@/components/vimi/BranchSelectSheet";
import FavoriteButton from "@/components/vimi/FavoriteButton";
import CartButton from "@/components/vimi/CartButton";
import ProductCard from "@/components/vimi/ProductCard";
import AvailabilityBadge from "@/components/vimi/AvailabilityBadge";
import { Image } from "@/components/ui/image";
import { LoadingState, EmptyState, ErrorState } from "@/components/vimi/States";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useBuyer } from "@/lib/BuyerContext";
import { openInMaps } from "@/lib/maps";

export default function Store() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { markVisited, selectedLocation } = useBuyer();
  const [business, setBusiness] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inactive, setInactive] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("relevance");

  // Load business + active branches.
  useEffect(() => {
    let isCurrent = true;
    (async () => {
      setLoading(true); setNotFound(false); setInactive(false); setBusiness(null); setBranches([]); setSelectedBranchId(null);
      try {
        let b;
        if (isSupabaseMode) {
          b = await getPublicBusinessByStoreId(storeId);
        } else {
          const list = await base44.entities.Business.filter({ store_id: storeId });
          b = list && list[0];
        }
        if (!b) { if (isCurrent) setNotFound(true); return; }
        if (isCurrent) setBusiness(b);
        if (!b.is_active) { if (isCurrent) setInactive(true); return; }
        const br = isSupabaseMode ? await listBranches(b.id) : await base44.entities.Branch.filter({ business_id: b.id });
        const active = (br || []).filter((x) => x.is_active);
        if (!isCurrent) return;
        setBranches(active);
        let initial = null;
        if (active.length === 1) initial = active[0];
        else if (active.length > 1) {
          initial = (selectedLocation?.city ? active.find((x) => x.city === selectedLocation.city) : null) || active[0];
        }
        if (isCurrent) setSelectedBranchId(initial ? initial.id : null);
        if (isCurrent) await markVisited(b.id);
      } catch {
        if (isCurrent) setNotFound(true);
      } finally {
        if (isCurrent) setLoading(false);
      }
    })();
    return () => { isCurrent = false; };
  }, [storeId, selectedLocation?.city, markVisited]);

  // Load branch catalog when a branch is selected.
  useEffect(() => {
    if (!selectedBranchId || !business) return;
    setCatalogLoading(true); setCatalogError(""); setCatalog(null);
    const request = isSupabaseMode
      ? getBranchCatalogSupabase(selectedBranchId)
      : base44.functions.invoke("getBranchCatalog", { branch_id: selectedBranchId }).then((res) => res.data);
    request.then(setCatalog)
      .catch((err) => setCatalogError(err?.response?.data?.error || err?.message || "Katalog yuklanmadi"))
      .finally(() => setCatalogLoading(false));
  }, [selectedBranchId, business]);

  const categories = useMemo(() => {
    const set = new Set((catalog?.items || []).map((i) => i.category_name).filter(Boolean));
    return Array.from(set);
  }, [catalog]);

  const items = useMemo(() => {
    let list = catalog?.items || [];
    if (category !== "all") list = list.filter((i) => i.category_name === category);
    if (sort === "price_asc") list = [...list].sort((a, b) => a.effective_price - b.effective_price);
    if (sort === "price_desc") list = [...list].sort((a, b) => b.effective_price - a.effective_price);
    return list;
  }, [catalog, category, sort]);

  if (loading) return <div className="space-y-4"><PageHeader title="Do'kon" backTo="/" /><LoadingState /></div>;
  if (notFound || !business) return <div className="space-y-4"><PageHeader title="Do'kon" backTo="/" /><ErrorState title="Do'kon topilmadi" description="ID ni tekshirib qayta urinib ko'ring." /></div>;

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="-mx-4 -mt-6 relative isolate min-h-[calc(100vh-4rem)] bg-[#f3f6f3] px-4 pb-10 pt-6 dark:bg-background sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[#dcece4] dark:bg-emerald-950/30 sm:h-64 lg:h-72" aria-hidden="true" />
      <div className="workspace-page animate-fade-in relative mx-auto max-w-[1440px]">
        <PageHeader title="Do‘kon" backTo="/" />

        <section className="mt-20 flex min-w-0 items-start gap-3 rounded-2xl border border-emerald-900/10 bg-card p-4 shadow-xl shadow-emerald-950/10 sm:mt-24 sm:items-center sm:gap-5 sm:rounded-3xl sm:p-6 lg:mt-28 dark:border-emerald-100/10">
          <span className="inline-flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-900/10 sm:h-24 sm:w-24 dark:bg-emerald-950/40 dark:ring-emerald-100/10">
            {business.logo_url ? <Image src={business.logo_url} alt={business.name} fittingType="fill" className="h-full w-full" /> : <StoreIcon className="h-8 w-8 text-primary" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Do‘kon</p>
                <h2 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{business.name}</h2>
              </div>
              <FavoriteButton business={business} size="sm" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold tracking-wide text-primary">
                {business.store_id}
              </span>
              {business.category_name && (
                <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                  {business.category_name}
                </span>
              )}
            </div>
            {business.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{business.description}</p>
            )}
          </div>
        </section>

      <div className="mt-5 space-y-5">
      {inactive ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">Bu do'kon hozirda mavjud emas.</div>
      ) : branches.length === 0 ? (
        <EmptyState icon={StoreIcon} title="Filiallar yo'q" description="Bu do'konda hozircha faol filiallar mavjud emas." />
      ) : (
        <>
          {/* Branch selector */}
          <button type="button" onClick={() => setSheetOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary"><MapPin className="h-5 w-5 text-foreground" /></span>
            {selectedBranch ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{selectedBranch.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{[selectedBranch.city, selectedBranch.region].filter(Boolean).join(", ")}{selectedBranch.address ? " · " + selectedBranch.address : ""}</span>
              </span>
            ) : (
              <span className="flex-1 text-sm text-muted-foreground">Filialni tanlang</span>
            )}
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>

          {selectedBranch && (
            <div className="flex gap-2">
              {selectedBranch.latitude && selectedBranch.longitude ? (
                <>
                  <button type="button" onClick={() => openInMaps(selectedBranch.latitude, selectedBranch.longitude, selectedBranch.name)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium transition hover:bg-secondary">
                    <Map className="h-4 w-4" />Xaritada ko'rish
                  </button>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBranch.latitude},${selectedBranch.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium transition hover:bg-secondary">
                    <Navigation2 className="h-4 w-4" />Yo'nalish olish
                  </a>
                </>
              ) : (
                <p className="px-1 text-xs text-muted-foreground">Bu filialning joylashuv ma'lumotlari yo'q.</p>
              )}
            </div>
          )}

          {selectedBranch && catalogError && <ErrorState title={catalogError} />}
          {selectedBranch && catalogLoading && <LoadingState />}
          {selectedBranch && !catalogLoading && !catalogError && (
            <>
              <div className="flex items-center gap-2">
                {categories.length > 0 && (
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 flex-1 rounded-xl bg-secondary/70"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-10 flex-1 rounded-xl bg-secondary/70"><SelectValue placeholder="Saralash" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price_asc">Arzon → Qimmat</SelectItem>
                    <SelectItem value="price_desc">Qimmat → Arzon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {items.length === 0 ? (
                <EmptyState icon={Package} title="Bu filialda mahsulot yo'q" description="Boshqa filialni tanlab ko'ring." />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => (
                    <ProductCard
                      key={item.product_id}
                      name={item.name}
                      price={item.effective_price}
                      image={item.image_url}
                      onClick={() => navigate(`/branch/${selectedBranchId}/products/${item.product_id}`)}
                      availability={<AvailabilityBadge available={item.available} disabled={item.disabled} hasInventory={item.has_inventory} className="text-xs" />}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filialni tanlang">
            <BranchSelectSheet branches={branches} selectedId={selectedBranchId} onSelect={(b) => { setSelectedBranchId(b.id); setSheetOpen(false); setCategory("all"); }} locationFilter={selectedLocation} />
          </BottomSheet>
        </>
      )}
        <CartButton />
      </div>
      </div>
    </div>
  );
}