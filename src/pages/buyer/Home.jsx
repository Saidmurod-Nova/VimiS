import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Store, ArrowRight } from "lucide-react";
import VimiLogo from "@/components/vimi/VimiLogo";
import Avatar from "@/components/vimi/Avatar";
import { SearchBar, TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import StoreCard from "@/components/vimi/StoreCard";
import ProductCard from "@/components/vimi/ProductCard";
import BranchCard from "@/components/vimi/BranchCard";
import { EmptyState } from "@/components/vimi/States";
import { useAuth } from "@/lib/AuthContext";

const categories = ["Elektronika", "Maishiy texnika", "Kiyim", "Oziq-ovqat", "Go'zalloy", "Sport"];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storeCode, setStoreCode] = useState("");

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex items-center justify-between gap-3">
        <VimiLogo />
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-sm font-medium text-foreground">
            <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Toshkent</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => navigate("/profile")} aria-label="Profil">
            <Avatar name={user?.full_name || "Vimi user"} src={user?.avatar} size={40} />
          </button>
        </div>
      </header>

      <SearchBar placeholder="Do'kon yoki mahsulot qidirish" />

      <div className="glass rounded-2xl p-4">
        <p className="text-sm font-medium text-foreground">Do'kon ID orqali kirish</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Do'kon ID sini kiriting va to'g'ridan-to'g'ri kirish.</p>
        <div className="mt-3 flex gap-2">
          <TextInput
            placeholder="Do'kon ID sini kiriting"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            className="flex-1"
          />
          <PrimaryButton className="h-12 shrink-0">
            <ArrowRight className="mr-1 w-4 h-4" aria-hidden="true" />
            Kirish
          </PrimaryButton>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Kategoriyalar</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary active:scale-95"
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Saqlangan do'konlar</h2>
        <EmptyState icon={Store} title="Hozircha do'konlar yo'q" description="Do'konlarni saqlab, keyin tezroq kirishingiz mumkin." />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Yaqin filiallar</h2>
        <div className="space-y-2">
          <BranchCard name="Artel Samarqand" address="Samarqand sh., Registon ko'chasi 12" distance="2.4 km" status="open" />
          <BranchCard name="Artel Toshkent" address="Toshkent sh., Amir Temur ko'chasi 8" distance="5.1 km" status="open" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Tavsiya etilgan mahsulotlar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ProductCard name="Aqlli soat Series 9" price={2890000} onAdd={() => {}} />
          <ProductCard name="Quloqchin Pro" price={1290000} onAdd={() => {}} />
          <ProductCard name="Sport poyabzal" price={990000} onAdd={() => {}} className="hidden sm:block" />
        </div>
      </section>
    </div>
  );
}