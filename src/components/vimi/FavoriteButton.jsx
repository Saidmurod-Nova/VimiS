import React, { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuyer } from "@/lib/BuyerContext";

// Favorite toggle for a business. Optimistic UI via BuyerContext; shows a
// spinner while persisting and reverts on failure.
export default function FavoriteButton({ business, className, size = "md" }) {
  const { isFavorite, toggleFavorite } = useBuyer();
  const fav = isFavorite(business.id);
  const [pending, setPending] = useState(false);
  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try { await toggleFavorite(business.id, business); }
    catch { /* error handled by context revert */ }
    finally { setPending(false); }
  };
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
      aria-pressed={fav}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border transition active:scale-95", fav ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground", dim, className)}
    >
      {pending ? <Loader2 className={cn(icon, "animate-spin")} /> : <Heart className={cn(icon, fav && "fill-current")} />}
    </button>
  );
}