import React from "react";
import { Store } from "lucide-react";
import { Image } from "@/components/ui/image";
import StatusBadge from "../StatusBadge";

export default function BusinessHeader({ business, branchCount }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
        {business.logo_url ? (
          <Image src={business.logo_url} alt={business.name} fittingType="fill" className="h-full w-full" />
        ) : (
          <Store className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold text-foreground">{business.name}</h2>
        <p className="font-mono text-sm text-primary">{business.store_id}</p>
        <p className="text-xs text-muted-foreground">{business.category_name} · {branchCount} filial</p>
      </div>
      <StatusBadge active={business.is_active} />
    </div>
  );
}