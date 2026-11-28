import React from "react";
import { Image } from "@/components/ui/image";
import { MapPin, Plus, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import Price from "./Price";

export default function ProductCard({
  name,
  price,
  image = null,
  onAdd = null,
  onClick,
  availability = null,
  category = null,
  storeName = null,
  location = null,
  description = null,
  className = "",
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", className)}>
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {image ? (
            <Image src={image} alt={name} fittingType="fill" className="h-full w-full transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
          {category && (
            <span className="absolute left-2.5 top-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full border border-white/30 bg-background/90 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
              {category}
            </span>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{name}</h3>
          {description && (
            <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{description}</p>
          )}
          {(storeName || location) && (
            <div className="mt-2 space-y-1">
              {storeName && <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{storeName}</span></p>}
              {location && <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{location}</span></p>}
            </div>
          )}
          <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/70 pt-2.5">
            <Price value={price} size="sm" />
            {availability && <div className="shrink-0">{availability}</div>}
          </div>
        </div>
      </button>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label="Savatga qo'shish"
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
