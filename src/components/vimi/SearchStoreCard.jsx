import React from "react";
import { Image } from "@/components/ui/image";
import { Store, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "./Badge";
import FavoriteButton from "./FavoriteButton";

// Store result card for search. Opens Store Details on click; favorite toggle inline.
export default function SearchStoreCard({ business, location, onView, className }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border border-border bg-card p-3", className)}>
      <button type="button" onClick={onView} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
          {business.logo_url ? <Image src={business.logo_url} alt={business.name} fittingType="fill" className="h-full w-full" /> : <Store className="h-5 w-5 text-muted-foreground" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{business.name}</span>
          <span className="mt-0.5 block truncate font-mono text-xs text-primary">{business.store_id}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {business.category_name && <Badge variant="secondary" className="font-normal">{business.category_name}</Badge>}
            {location && <span className="inline-flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3" />{location}</span>}
          </span>
        </span>
      </button>
      <FavoriteButton business={business} size="sm" />
    </div>
  );
}