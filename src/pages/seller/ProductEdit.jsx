import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getProduct, updateProduct } from "@/lib/supabaseCatalog";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import ProductForm from "@/components/vimi/ProductForm";
import PageHeader from "@/components/vimi/PageHeader";
import { LoadingState, EmptyState } from "@/components/vimi/States";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (import.meta.env.VITE_AUTH_PROVIDER === "supabase" ? getProduct(id) : base44.entities.Product.get(id))
      .then(setProduct).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  const submit = async (data) => {
    if (import.meta.env.VITE_AUTH_PROVIDER === "supabase") await updateProduct(id, data);
    else await base44.functions.invoke("updateProduct", { product_id: id, ...data });
    toast({ title: "Mahsulot yangilandi" });
    navigate(`/seller/products/${id}`);
  };

  if (loading) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo={`/seller/products/${id}`} /><LoadingState /></div>;
  if (!product) return <div className="space-y-4"><PageHeader title="Tahrirlash" backTo="/seller/products" /><EmptyState title="Mahsulot topilmadi" /></div>;

  return <ProductForm businessId={product.business_id} initial={product} onSubmit={submit} submitLabel="Saqlash" backTo={`/seller/products/${id}`} />;
}