import React from "react";
import { Package, ShoppingBag, Wallet, AlertTriangle, Plus } from "lucide-react";
import StatCard from "@/components/vimi/StatCard";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { EmptyState } from "@/components/vimi/States";

export default function Home() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Sotuvchi</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Boshqaruv paneli</h1>
        </div>
        <PrimaryButton className="h-10">
          <Plus className="mr-1 w-4 h-4" aria-hidden="true" />Yangi
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Buyurtmalar" value="0" icon={ShoppingBag} />
        <StatCard label="Daromad" value="0 so'm" icon={Wallet} />
        <StatCard label="Mahsulotlar" value="0" icon={Package} />
        <StatCard label="Kam qolgan" value="0" icon={AlertTriangle} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">So'nggi buyurtmalar</h2>
        <EmptyState icon={ShoppingBag} title="Hozircha buyurtmalar yo'q" description="Yangi buyurtmalar shu yerda paydo bo'ladi." />
      </section>
    </div>
  );
}