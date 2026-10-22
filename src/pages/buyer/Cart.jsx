import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Loader2, ArrowRight, Store as StoreIcon, MapPin } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import Price from "@/components/vimi/Price";
import QuantitySelector from "@/components/vimi/QuantitySelector";
import { PrimaryButton, GhostButton } from "@/components/vimi/VimiButton";
import { Image } from "@/components/ui/image";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import ConfirmDialog from "@/components/vimi/ConfirmDialog";
import { useCart } from "@/lib/CartContext";
import { useToast } from "@/components/ui/use-toast";

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, items, business, branch, subtotal, totalItems, loading, error, refresh, updateQuantity, removeItem, clearCart } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [removeId, setRemoveId] = useState(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const onQty = async (item, qty) => {
    if (qty === item.quantity || updatingId) return;
    if (qty > item.stock) { toast({ title: `Yetarli zaxira yo'q (qoldi: ${item.stock})`, variant: "destructive" }); return; }
    setUpdatingId(item.cart_item_id);
    try { await updateQuantity(item.cart_item_id, qty); }
    catch (e) { toast({ title: e?.response?.data?.error || "Yangilanmadi", variant: "destructive" }); }
    finally { setUpdatingId(null); }
  };

  const onRemove = async () => {
    if (!removeId) return;
    const id = removeId; setRemoveId(null);
    try { await removeItem(id); toast({ title: "Mahsulot o'chirildi" }); }
    catch (e) { toast({ title: e?.response?.data?.error || "O'chirib bo'lmadi", variant: "destructive" }); }
  };

  const onClear = async () => {
    setClearOpen(false); setClearing(true);
    try { await clearCart(); toast({ title: "Savat tozalandi" }); }
    catch (e) { toast({ title: e?.response?.data?.error || "Tozalab bo'lmadi", variant: "destructive" }); }
    finally { setClearing(false); }
  };

  const anyUnavailable = items.some((i) => !i.available);
  const goCheckout = () => {
    if (anyUnavailable) { toast({ title: "Ba'zi mahsulotlar mavjud emas", variant: "destructive" }); return; }
    navigate("/checkout");
  };

  if (loading && !cart) return <div className="space-y-4"><PageHeader title="Savat" backTo="/" /><LoadingState /></div>;
  if (error && !cart) return <div className="space-y-4"><PageHeader title="Savat" backTo="/" /><ErrorState title={error} onRetry={refresh} /></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Savat" backTo="/" />

      {!cart || items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Savat bo'sh" description="Mahsulot qo'shing va bu yerda ko'rinadi." action={<PrimaryButton onClick={() => navigate("/search")} className="h-10">Do'kon qidirish</PrimaryButton>} />
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"><StoreIcon className="h-5 w-5 text-foreground" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{business?.name || "Do'kon"}</span>
              <span className="block truncate text-xs text-muted-foreground"><MapPin className="inline h-3 w-3 mr-0.5" />{branch?.name}{branch?.city ? " · " + branch.city : ""}</span>
            </span>
          </div>

          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.cart_item_id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                  {it.image_url ? <Image src={it.image_url} alt={it.name} fittingType="fill" className="h-full w-full" /> : <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{it.name}</span>
                  <span className="mt-0.5 block"><Price value={it.unit_price} size="sm" /></span>
                  {!it.available && <span className="mt-1 block text-xs font-medium text-destructive">Mavjud emas</span>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {it.available ? (
                      <div className="relative">
                        <QuantitySelector value={it.quantity} onChange={(q) => onQty(it, q)} min={1} max={Math.max(1, it.stock)} size="sm" />
                        {updatingId === it.cart_item_id && <Loader2 className="absolute -right-6 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Zaxira: {it.stock}</span>
                    )}
                    <button type="button" onClick={() => setRemoveId(it.cart_item_id)} aria-label="O'chirish" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-destructive transition hover:bg-destructive/5 active:scale-95">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </span>
                <span className="shrink-0 text-right"><Price value={it.subtotal} size="sm" /></span>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Mahsulotlar ({totalItems})</span><Price value={subtotal} size="sm" /></div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold"><span>Jami</span><Price value={subtotal} size="md" /></div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <GhostButton type="button" onClick={() => setClearOpen(true)} disabled={clearing} className="h-12 flex-1 gap-2">
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Savatni tozalash
            </GhostButton>
            <PrimaryButton onClick={goCheckout} disabled={anyUnavailable} className="h-12 flex-[1.4] gap-2">
              Checkout <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </div>

          <ConfirmDialog open={clearOpen} onOpenChange={setClearOpen} title="Savatni tozalash" description="Savatdagi barcha mahsulotlar o'chiriladi." confirmText="Tozalash" destructive onConfirm={onClear} />
          <ConfirmDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)} title="Mahsulotni o'chirish" description="Bu mahsulot savatdan olinadi." confirmText="O'chirish" destructive onConfirm={onRemove} />
        </>
      )}
    </div>
  );
}