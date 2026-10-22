import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/CartContext";

// Floating glass cart button with a live item-count badge. Rendered on buyer
// store / branch catalog / product detail screens. Count comes from CartContext
// (server-backed), so the badge stays in sync after add / update / remove /
// checkout.
export default function CartButton({ className }) {
  const { totalItems } = useCart();
  return (
    <Link
      to="/cart"
      aria-label="Savat"
      className={cn(
        "glass fixed bottom-24 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground shadow-lg shadow-black/5 transition active:scale-95 lg:bottom-6",
        className
      )}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </Link>
  );
}