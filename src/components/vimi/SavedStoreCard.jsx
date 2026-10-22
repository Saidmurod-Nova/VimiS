import React from "react";
import { Image } from "@/components/ui/image";
import { Store, MapPin, Copy, Trash2, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "./Badge";
import FavoriteButton from "./FavoriteButton";
import { useToast } from "@/components/ui/use-toast";

// Card for a saved store relationship. Shows public business info, a new-products
// indicator, favorite toggle, and actions (view, copy Store ID, remove).
export default function SavedStoreCard({ entry, onView, onRemove, className }) {
  const { toast } = useToast();
  const { business, location, branch_count, has_new, saved } = entry;

  const copyId = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(business.store_id).then(() => toast({ title: "ID nusxalandi", description: business.store_id }));
  };

  const remove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.(saved.id);
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <button type="button" onClick={onView} className="flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.99]">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
          {business.logo_url ? <Image src={business.logo_url} alt={business.name} fittingType="fill" className="h-full w-full" /> : <Store className="h-6 w-6 text-muted-foreground" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">{business.name}</span>
            {has_new && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-2.5 w-2.5" />Yangi
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-mono text-xs text-primary">{business.store_id}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {business.category_name && <Badge variant="secondary" className="font-normal">{business.category_name}</Badge>}
            {location && <span className="inline-flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3" />{location}</span>}
            {branch_count > 0 && <span className="text-muted-foreground/80">· {branch_count} filial</span>}
          </span>
        </span>
        <span className="flex flex-col items-end gap-2">
          <FavoriteButton business={business} size="sm" />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </span>
      </button>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <button type="button" onClick={copyId} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary">
          <Copy className="h-3.5 w-3.5" />ID nusxalash
        </button>
        <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/5">
          <Trash2 className="h-3.5 w-3.5" />O'chirish
        </button>
      </div>
    </div>
  );
}