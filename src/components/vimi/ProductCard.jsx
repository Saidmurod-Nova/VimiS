import React from "react";
import { Image } from "@/components/ui/image";
import { Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import Price from "./Price";

export default function ProductCard({ name, price, image = null, onAdd = null, onClick, availability = null, className = "" }) {
  return (
    <div className={cn("group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", className)}>
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          {image ? (
            <Image src={image} alt={name} fittingType="fill" className="h-full w-full transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{name}</h3>
          <Price value={price} size="sm" className="mt-2" />
          {availability && <div className="mt-1">{availability}</div>}
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