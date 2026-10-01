import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Store } from "lucide-react";
import { useBusiness } from "@/lib/BusinessContext";
import BusinessCard from "@/components/vimi/BusinessCard";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { EmptyState, LoadingState } from "@/components/vimi/States";

export default function Home() {
  const { businesses, loading } = useBusiness();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Sotuvchi</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Bizneslarim</h1>
        </div>
        <PrimaryButton className="h-10" onClick={() => navigate("/seller/businesses/new")}><Plus className="mr-1 h-4 w-4" />Yangi biznes</PrimaryButton>
      </div>

      {loading ? (
        <LoadingState />
      ) : businesses.length === 0 ? (
        <EmptyState icon={Store} title="Bizneslar yo'q" description="Birinchi biznesingizni yarating va filiallarni qo'shing." action={<PrimaryButton className="h-10" onClick={() => navigate("/seller/businesses/new")}><Plus className="mr-1 h-4 w-4" />Biznes yaratish</PrimaryButton>} />
      ) : (
        <div className="space-y-2">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} to={`/seller/businesses/${b.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}