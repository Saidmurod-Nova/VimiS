import React from "react";
import { Store, Check, Plus, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../VimiButton";

// Switches the active business for the seller console. Only owned businesses
// are listed (BusinessContext already filters by created_by_id). Selecting one
// refreshes every dashboard metric via the parent's effect.
export default function BusinessSelectorSheet({ businesses, selectedBusiness, onSelect, triggerClassName }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const trigger = (
    <button
      type="button"
      aria-label={`Biznesni tanlash: ${selectedBusiness?.name || "Biznes tanlang"}`}
      className={`flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-card p-2 pr-3 text-left transition active:scale-[0.99] ${triggerClassName || ""}`}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
        {selectedBusiness?.logo_url ? (
          <Image src={selectedBusiness.logo_url} alt={selectedBusiness.name} fittingType="fill" className="h-full w-full" />
        ) : (
          <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{selectedBusiness?.name || "Biznes tanlang"}</span>
        <span className="block truncate text-xs text-muted-foreground">{selectedBusiness?.store_id || "—"}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
        <SheetHeader className="px-5 pt-6 pb-2 text-left">
          <SheetTitle>Biznesni tanlash</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 px-4 pb-6 pt-2">
          {(businesses || []).map((b) => {
            const active = selectedBusiness?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => { onSelect(b.id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/40"
                )}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                  {b.logo_url ? (
                    <Image src={b.logo_url} alt={b.name} fittingType="fill" className="h-full w-full" />
                  ) : (
                    <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{b.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.store_id}</span>
                </span>
                {active ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
          <PrimaryButton className="mt-2 h-12 w-full" onClick={() => { setOpen(false); navigate("/seller/businesses/new"); }}>
            <Plus className="mr-1 h-4 w-4" />Yangi biznes
          </PrimaryButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}