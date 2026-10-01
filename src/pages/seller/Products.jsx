import React from "react";
import { Package, Plus } from "lucide-react";
import { EmptyState } from "@/components/vimi/States";
import { PrimaryButton } from "@/components/vimi/VimiButton";

export default function Products() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Mahsulotlar</h1>
        <PrimaryButton className="h-10">
          <Plus className="mr-1 w-4 h-4" aria-hidden="true" />Qo'shish
        </PrimaryButton>
      </div>
      <EmptyState icon={Package} title="Hozircha mahsulotlar yo'q" description="Mahsulotlaringizni qo'shib savdoni boshlang." />
    </div>
  );
}