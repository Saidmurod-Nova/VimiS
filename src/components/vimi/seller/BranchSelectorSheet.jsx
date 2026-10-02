import React from "react";
import { MapPin, Check, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Branch selector for the seller console. Includes an "All branches" option;
// selecting a specific branch scopes all branch-dependent metrics. When the
// business has a single active branch it is selected by default upstream.
export default function BranchSelectorSheet({ branches, selectedId, onSelect, disabled }) {
  const [open, setOpen] = React.useState(false);
  const selected = selectedId === "all" || !selectedId
    ? null
    : (branches || []).find((b) => b.id === selectedId);

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-sm transition active:scale-[0.99] disabled:opacity-50"
    >
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{selected ? selected.name : "Barcha filiallar"}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="p-0 sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
        <SheetHeader className="px-5 pt-6 pb-2 text-left">
          <SheetTitle>Filialni tanlash</SheetTitle>
        </SheetHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={() => { onSelect("all"); setOpen(false); }}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
              (selectedId === "all" || !selectedId) ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <MapPin className="h-4 w-4 text-foreground" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Barcha filiallar</span>
              <span className="block text-xs text-muted-foreground">Barcha faol filiallar bo‘yicha</span>
            </span>
            {(selectedId === "all" || !selectedId) && <Check className="h-4 w-4 text-primary" />}
          </button>
          {(branches || []).map((b) => {
            const active = selectedId === b.id;
            const area = [b.city, b.region].filter(Boolean).join(", ");
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => { onSelect(b.id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/40",
                  !b.is_active && "opacity-60"
                )}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <MapPin className="h-4 w-4 text-foreground" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{b.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{area || "Manzil ko‘rsatilmagan"}</span>
                </span>
                {active ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}