import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getProduct, updateProduct } from "@/lib/supabaseCatalog";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import ProductForm from "@/components/vimi/ProductForm";
import PageHeader from "@/components/vimi/PageHeader";
import { LoadingState, EmptyState } from "@/components/vimi/States";
import { useBusiness } from "@/lib/BusinessContext";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const productsPath = `/business/${selectedBusiness?.id}/products`;
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (import.meta.env.VITE_AUTH_PROVIDER === "supabase" ? getProduct(id) : base44.entities.Product.get(id))
      .then((record) => setProduct(record?.business_id === selectedBusiness?.id ? record : null))
      .catch((error) => {
        console.error("Mahsulotni yuklab bo‘lmadi.", error);
        toast({ title: error?.message || "Mahsulotni yuklab bo‘lmadi.", variant: "destructive" });
        setProduct(null);
      }).finally(() => setLoading(false));
  }, [id, selectedBusiness?.id]);

  const submit = async (data) => {
    if (import.meta.env.VITE_AUTH_PROVIDER === "supabase") await updateProduct(id, data);
    else await base44.functions.invoke("updateProduct", { product_id: id, ...data });
    toast({ title: "Mahsulot yangilandi" });
    navigate(`${productsPath}/${id}`);
  };

  if (loading) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`${productsPath}/${id}`} /><LoadingState /></div>;
  if (!product) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={productsPath} /><EmptyState title="Mahsulot topilmadi" /></div>;

  return <ProductForm businessId={product.business_id} initial={product} onSubmit={submit} submitLabel="Saqlash" backTo={`${productsPath}/${id}`} />;
}