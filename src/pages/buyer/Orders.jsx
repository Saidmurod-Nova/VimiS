import React from "react";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/vimi/States";

export default function Orders() {
  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
      <EmptyState icon={ShoppingBag} title="Hozircha buyurtmalar yo'q" description="Buyurtmalaringiz shu yerda paydo bo'ladi." />
    </div>
  );
}