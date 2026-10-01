import React from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

export default function BranchListItem({ branch, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]",
        className
      )}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <MapPin className="h-5 w-5 text-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{branch.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {[branch.city, branch.region].filter(Boolean).join(", ")}
        </span>
        {branch.address && <span className="block truncate text-xs text-muted-foreground/80">{branch.address}</span>}
      </span>
      <span className="flex flex-col items-end gap-1.5">
        <StatusBadge active={branch.is_active} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </span>
    </button>
  );
}