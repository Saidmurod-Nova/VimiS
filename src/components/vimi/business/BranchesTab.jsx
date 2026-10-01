import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, Map as MapIcon, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import BranchListItem from "../BranchListItem";
import MapView from "../MapView";
import { PrimaryButton } from "../VimiButton";
import { EmptyState } from "../States";

export default function BranchesTab({ businessId, branches }) {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const newTo = `/seller/businesses/${businessId}/branches/new`;
  const detail = (bid) => `/seller/businesses/${businessId}/branches/${bid}`;

  const toggle = (v) => (
    <button type="button" onClick={() => setView(v)} className={cn(view === v ? "rounded-full bg-background px-3 py-1 text-xs font-medium" : "px-3 py-1 text-xs text-muted-foreground")}>
      {v === "list" ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{branches.length} ta filial</p>
        <div className="inline-flex rounded-full bg-secondary p-1">{toggle("list")}{toggle("map")}</div>
      </div>
      {branches.length === 0 ? (
        <EmptyState icon={Store} title="Filiallar yo'q" description="Birinchi filialni qo'shing." action={<PrimaryButton className="h-10" onClick={() => navigate(newTo)}><Plus className="mr-1 h-4 w-4" />Filial qo'shish</PrimaryButton>} />
      ) : view === "map" ? (
        <MapView branches={branches} onSelect={(b) => navigate(detail(b.id))} />
      ) : (
        <div className="space-y-2">{branches.map((b) => <BranchListItem key={b.id} branch={b} onClick={() => navigate(detail(b.id))} />)}</div>
      )}
    </div>
  );
}