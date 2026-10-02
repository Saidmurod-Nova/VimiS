import React from "react";
import { MapPin, Check, Navigation2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

// Branch selector bottom sheet content. Lists active branches with full geo
// info and lets the buyer filter by their selected location. Supports multiple
// branches in the same city.
export default function BranchSelectSheet({ branches, selectedId, onSelect, locationFilter }) {
  const list = (branches || []).filter((b) => b.is_active);
  const filtered = locationFilter
    ? [...list.filter((b) => b.city === locationFilter.city && locationFilter.city), ...list.filter((b) => !(b.city === locationFilter.city && locationFilter.city))]
    : list;

  if (list.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Faol filiallar yo'q.</p>;
  }

  return (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto pb-2">
      {filtered.map((b) => {
        const active = b.id === selectedId;
        const area = [b.city, b.region].filter(Boolean).join(", ");
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(b)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
              active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <MapPin className="h-5 w-5 text-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{b.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{area}</span>
              {b.address && <span className="block truncate text-xs text-muted-foreground/80">{b.address}</span>}
            </span>
            <span className="flex flex-col items-end gap-1.5">
              <StatusBadge active={b.is_active} />
              {b.latitude && b.longitude && <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Navigation2 className="h-3 w-3" />Xarita</span>}
              {active ? <Check className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}