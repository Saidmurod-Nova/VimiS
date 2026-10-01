import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { useToast } from "@/components/ui/use-toast";
import ProductForm from "@/components/vimi/ProductForm";
import PageHeader from "@/components/vimi/PageHeader";
import { EmptyState } from "@/components/vimi/States";

export default function ProductCreate() {
  const navigate = useNavigate();
  const { selectedBusiness: biz } = useBusiness();
  const { toast } = useToast();

  if (!biz) return (
    <div className="space-y-4">
      <PageHeader title="Yangi mahsulot" backTo="/seller/products" />
      <EmptyState title="Avval biznes tanlang" />
    </div>
  );

  const submit = async (data) => {
    const res = await base44.functions.invoke("createProduct", { business_id: biz.id, ...data });
    toast({ title: "Mahsulot yaratildi" });
    navigate(`/seller/products/${res.data.product.id}`);
  };

  return <ProductForm businessId={biz.id} onSubmit={submit} submitLabel="Mahsulot yaratish" backTo="/seller/products" />;
}