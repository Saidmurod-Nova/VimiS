import React from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { BriefcaseBusiness } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { useBusiness } from "@/lib/BusinessContext";

export default function BusinessAccessGate() {
  const { id, businessId } = useParams();
  const { businesses, loading, error, refresh } = useBusiness();
  const business = businesses.find((item) => item.id === (businessId || id));

  if (loading) return <LoadingState className="" />;
  if (error) return <ErrorState title={error} onRetry={refresh} className="" />;
  if (!business) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="Biznes topilmadi yoki ruxsat yo‘q"
        description="Bu biznes boshqaruviga faqat egasi yoki ruxsat etilgan menejer kira oladi."
        className=""
        action={
          <Link to="/business" className="text-sm font-medium text-primary hover:underline">
            Bizneslarimga qaytish
          </Link>
        }
      />
    );
  }
  return <Outlet />;
}
