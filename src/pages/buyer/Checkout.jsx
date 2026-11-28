import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Plus, Loader2, CheckCircle2, ShoppingBag, ChevronRight } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import Price from "@/components/vimi/Price";
import { PrimaryButton, GhostButton } from "@/components/vimi/VimiButton";
import { Image } from "@/components/ui/image";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/CartContext";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { checkoutSupabase } from "@/lib/supabaseOrders";
import { listAddresses } from "@/lib/supabaseRelations";
import { hasValidCoordinates } from "@/lib/maps";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { cart, items, business, branch, subtotal, totalItems, loading, refresh } = useCart();
  const [addresses, setAddresses] = useState(null);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState("");
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedAddress = addresses?.find((address) => address.id === selectedAddr);

  const loadAddresses = async () => {
    setAddrLoading(true); setAddrError("");
    try {
      const list = isSupabaseMode ? await listAddresses() : await base44.entities.Address.filter({}, "-created_date", 100);
      const sorted = (list || []).slice().sort((a, b) =>
        (b.is_default === true ? 1 : 0) - (a.is_default === true ? 1 : 0) ||
        new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at)
      );
      setAddresses(sorted);
      const requested = sorted.find((a) => a.id === location.state?.selectedAddressId);
      const def = requested || sorted.find((a) => a.is_default) || sorted[0] || null;
      setSelectedAddr(def ? def.id : null);
    } catch (e) {
      setAddrError(e?.response?.data?.error || "Manzillar yuklanmadi");
    } finally {
      setAddrLoading(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  const addAddress = () => navigate("/addresses/new", { state: { returnTo: "/checkout" } });

  const placeOrder = async () => {
    if (!cart) { toast({ title: "Savat bo'sh", variant: "destructive" }); return; }
    if (!selectedAddr) { toast({ title: "Manzilni tanlang", variant: "destructive" }); return; }
    if (!hasValidCoordinates(selectedAddress)) {
      toast({ title: "Yo‘nalish uchun manzil koordinatasini belgilang", variant: "destructive" });
      if (selectedAddress) {
        navigate(`/addresses/${selectedAddress.id}/edit`, { state: { returnTo: "/checkout" } });
      }
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      let order;
      if (isSupabaseMode) {
        order = await checkoutSupabase({ cartId: cart.id, addressId: selectedAddr, paymentMethod: "cash_on_delivery", notes });
      } else {
        const res = await base44.functions.invoke("checkout", {
          cart_id: cart.id, address_id: selectedAddr, payment_method: "cash_on_delivery", notes
        });
        order = res.data?.order;
      }
      await refresh();
      toast({ title: "Buyurtma yaratildi", description: order ? `${order.order_number} · ${order.business_name || business?.name || ""}` : "" });
      navigate("/orders");
    } catch (e) {
      toast({ title: e?.response?.data?.error || "Buyurtma yaratilmadi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4"><PageHeader title="Checkout" backTo="/cart" /><LoadingState /></div>;
  if (!cart || items.length === 0) {
    return <div className="space-y-4"><PageHeader title="Checkout" backTo="/cart" /><EmptyState icon={ShoppingBag} title="Savat bo'sh" description="Avval mahsulot qo'shing." action={<PrimaryButton onClick={() => navigate("/search")} className="h-10">Do'kon qidirish</PrimaryButton>} /></div>;
  }

  const anyUnavailable = items.some((i) => !i.available);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Checkout" backTo="/cart" />

      <div className="rounded-2xl border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">Do'kon</p>
        <p className="text-sm font-medium">{business?.name || "—"}</p>
        <p className="text-xs text-muted-foreground"><MapPin className="inline h-3 w-3 mr-0.5" />{branch?.name}{branch?.city ? " · " + branch.city : ""}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Mahsulotlar ({totalItems})</h2>
        {items.map((it) => (
          <div key={it.cart_item_id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
              {it.image_url ? <Image src={it.image_url} alt={it.name} fittingType="fill" className="h-full w-full" /> : <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{it.name}</span>
              <span className="block text-xs text-muted-foreground">{it.quantity} × <Price value={it.unit_price} size="sm" className="inline-flex" /></span>
            </span>
            <Price value={it.subtotal} size="sm" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Yetkazib berish manzili</h2>
          <GhostButton type="button" onClick={addAddress} className="h-8 gap-1 px-2 text-xs"><Plus className="h-3.5 w-3.5" />Yangi</GhostButton>
        </div>
        {addrLoading ? <LoadingState /> : addrError ? <ErrorState title={addrError} onRetry={loadAddresses} /> : !addresses || addresses.length === 0 ? (
          <EmptyState icon={MapPin} title="Manzillar yo'q" description="Yetkazib berish uchun manzil qo'shing." action={<PrimaryButton onClick={addAddress} className="h-10">Manzil qo'shish</PrimaryButton>} />
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <button key={a.id} type="button" onClick={() => setSelectedAddr(a.id)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition", selectedAddr === a.id ? "border-primary bg-primary/5" : "border-border bg-card")}>
                <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", selectedAddr === a.id ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {selectedAddr === a.id && <CheckCircle2 className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{a.title}{a.is_default && <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Asosiy</span>}</span>
                  <span className="block text-xs text-muted-foreground">{a.address}</span>
                </span>
              </button>
            ))}
            {selectedAddress && !hasValidCoordinates(selectedAddress) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-sm text-foreground">Yo‘nalish koordinata orqali ochilishi uchun xaritada manzil nuqtasini belgilang.</p>
                <GhostButton
                  type="button"
                  onClick={() => navigate(`/addresses/${selectedAddress.id}/edit`, { state: { returnTo: "/checkout" } })}
                  className="mt-2 h-9 px-2 text-xs"
                >
                  Xaritada nuqtani belgilash
                </GhostButton>
              </div>
            )}
            <GhostButton type="button" onClick={() => navigate("/addresses")} className="h-10 w-full gap-1 text-xs">Boshqa manzilni tanlash / tahrirlash</GhostButton>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Izoh (ixtiyoriy)</h2>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Buyurtma uchun izoh..." className="min-h-[80px] rounded-xl bg-secondary/70" />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Mahsulotlar ({totalItems})</span><Price value={subtotal} size="sm" /></div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold"><span>Jami</span><Price value={subtotal} size="md" /></div>
      </div>

      {anyUnavailable && <p className="text-center text-xs text-destructive">Ba'zi mahsulotlar mavjud emas. Savatni tekshiring.</p>}

      <PrimaryButton onClick={placeOrder} disabled={submitting || !selectedAddr || anyUnavailable} className="h-12 w-full gap-2">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Buyurtma berilmoqda...</> : <>Buyurtma berish <ChevronRight className="h-4 w-4" /></>}
      </PrimaryButton>
    </div>
  );
}