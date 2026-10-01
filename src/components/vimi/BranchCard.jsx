import React from "react";
import { MapPin, Navigation2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "./Badge";

export default function BranchCard({ name, address, distance, status = "open", onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]", className)}
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <MapPin className="w-5 h-5 text-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{address}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        {distance && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <Navigation2 className="w-3 h-3" aria-hidden="true" />{distance}
          </span>
        )}
        <Badge variant={status === "open" ? "secondary" : "outline"} className="font-normal">
          {status === "open" ? "Ochiq" : "Yopiq"}
        </Badge>
      </span>
    </button>
  );
}