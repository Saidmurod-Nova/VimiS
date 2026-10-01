import React from "react";
import { Link } from "react-router-dom";
import { Store, ChevronRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

export default function BusinessCard({ business, branchCount, to, selected, onClick, className }) {
  const Comp = to ? Link : "button";
  const props = to ? { to } : { type: "button", onClick };
  return (
    <Comp
      {...props}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition active:scale-[0.99]",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border hover:bg-secondary/40",
        className
      )}
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
        {business.logo_url ? (
          <Image src={business.logo_url} alt={business.name} fittingType="fill" className="h-full w-full" />
        ) : (
          <Store className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{business.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {business.store_id} · {business.category_name || "Kategoriya"}
        </span>
        {branchCount != null && <span className="text-xs text-muted-foreground/90">{branchCount} filial</span>}
      </span>
      <span className="flex flex-col items-end gap-1.5">
        <StatusBadge active={business.is_active} />
        {!selected && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      </span>
    </Comp>
  );
}