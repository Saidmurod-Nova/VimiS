import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { PrimaryButton, GhostButton } from "@/components/vimi/VimiButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import ConfirmDialog from "@/components/vimi/ConfirmDialog";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { deleteAddress, listAddresses, saveAddress } from "@/lib/supabaseRelations";
import { useToast } from "@/components/ui/use-toast";

export default function Addresses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removeId, setRemoveId] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [defaulting, setDefaulting] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const list = isSupabaseMode ? await listAddresses() : await base44.entities.Address.filter({}, "-created_date", 100);
      setAddresses((list || []).slice().sort((a, b) =>
        (b.is_default === true ? 1 : 0) - (a.is_default === true ? 1 : 0) ||
        new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at)
      ));
    } catch (e) {
      setError(e?.response?.data?.error || "Manzillar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRemove = async () => {
    if (!removeId) return;
    const id = removeId; setRemoveId(null); setRemoving(true);
    try {
      if (isSupabaseMode) await deleteAddress(id);
      else await base44.functions.invoke("deleteAddress", { address_id: id });
      toast({ title: "Manzil o'chirildi" }); await load();
    }
    catch (e) { toast({ title: e?.response?.data?.error || "O'chirib bo'lmadi", variant: "destructive" }); }
    finally { setRemoving(false); }
  };

  const setDefault = async (a) => {
    setDefaulting(a.id);
    try {
      if (isSupabaseMode) await saveAddress({ addressId: a.id, ...a, isDefault: true });
      else await base44.functions.invoke("saveAddress", {
        address_id: a.id, title: a.title, address: a.address,
        latitude: a.latitude, longitude: a.longitude, is_default: true
      });
      toast({ title: "Asosiy manzil belgilandi" });
      await load();
    } catch (e) {
      toast({ title: e?.response?.data?.error || "Yangilanmadi", variant: "destructive" });
    } finally {
      setDefaulting(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Manzillarim" backTo={-1} />

      {loading ? <LoadingState /> : error ? <ErrorState title={error} onRetry={load} /> : !addresses || addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="Saqlangan manzillar yo'q" description="Yetkazib berish uchun manzil qo'shing." action={<PrimaryButton onClick={() => navigate("/addresses/new")} className="h-10 gap-2"><Plus className="h-4 w-4" />Manzil qo'shish</PrimaryButton>} />
      ) : (
        <>
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.title}</span>
                  {a.is_default && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Asosiy</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.address}</p>
                {a.latitude != null && a.longitude != null && (
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{Number(a.latitude).toFixed(4)}, {Number(a.longitude).toFixed(4)}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!a.is_default && (
                    <GhostButton type="button" onClick={() => setDefault(a)} disabled={defaulting === a.id} className="h-8 gap-1 px-2 text-xs">
                      {defaulting === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}Asosiy qilish
                    </GhostButton>
                  )}
                  <GhostButton type="button" onClick={() => navigate(`/addresses/${a.id}/edit`)} className="h-8 gap-1 px-2 text-xs"><Pencil className="h-3.5 w-3.5" />Tahrirlash</GhostButton>
                  <GhostButton type="button" onClick={() => setRemoveId(a.id)} disabled={removing} className="h-8 gap-1 px-2 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" />O'chirish</GhostButton>
                </div>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => navigate("/addresses/new")} className="h-12 w-full gap-2"><Plus className="h-4 w-4" />Yangi manzil qo'shish</PrimaryButton>
        </>
      )}

      <ConfirmDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)} title="Manzilni o'chirish" description="Bu manzil o'chiriladi. Avvalgi buyurtmalarga ta'sir etmaydi." confirmText="O'chirish" destructive onConfirm={onRemove} />
    </div>
  );
}