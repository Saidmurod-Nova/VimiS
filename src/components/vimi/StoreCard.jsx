import React from "react";
import { Image } from "@/components/ui/image";
import { MapPin, Star, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "./Badge";

export default function StoreCard({ name, category, location, rating, image, onClick, className }) {
  return (
    <button type="button" onClick={onClick} className={cn("group block w-full text-left", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-muted">
          {image ? (
            <Image src={image} alt={name} fittingType="fill" className="h-full w-full transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Store className="w-8 h-8 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">{name}</h3>
            {rating != null && (
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-foreground text-foreground" aria-hidden="true" />{rating}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            {category && <Badge variant="secondary" className="font-normal">{category}</Badge>}
            {location && (
              <span className="inline-flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3" aria-hidden="true" />{location}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}