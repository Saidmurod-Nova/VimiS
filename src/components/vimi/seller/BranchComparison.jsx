import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { formatSoM } from "@/lib/inventory";
import { EmptyState } from "../States";

// Branch comparison table shown only when "All branches" is selected and the
// business has more than one authorized branch. All branches compared over the
// SAME selected period using consistent metric definitions.
export default function BranchComparison({ branches, businessId }) {
  const navigate = useNavigate();
  if (!branches || branches.length === 0) {
    return <EmptyState title="Taqqoslash uchun filiallar yo'q" description="Bitta filialli bizneslar uchun taqqoslash ko'rsatilmaydi." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-2 py-2 font-medium">Filial</th>
            <th className="px-2 py-2 text-right font-medium">Daromad</th>
            <th className="px-2 py-2 text-right font-medium">Buyurtma</th>
            <th className="px-2 py-2 text-right font-medium">Yakunlandi</th>
            <th className="px-2 py-2 text-right font-medium">Kutilmoqda</th>
            <th className="px-2 py-2 text-right font-medium">Kam zaxira</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => (
            <tr key={b.branchId} className="border-t border-border">
              <td className="px-2 py-3">
                <span className="font-medium text-foreground">{b.name}</span>
                {!b.is_active && <span className="ml-1 text-xs text-muted-foreground">(faol emas)</span>}
              </td>
              <td className="px-2 py-3 text-right tabular-nums">{formatSoM(b.revenue)}</td>
              <td className="px-2 py-3 text-right tabular-nums">{b.orders}</td>
              <td className="px-2 py-3 text-right tabular-nums">{b.completed}</td>
              <td className="px-2 py-3 text-right tabular-nums">{b.pending}</td>
              <td className="px-2 py-3 text-right tabular-nums">{b.lowStock}</td>
              <td className="px-2 py-3 text-right">
                <button
                  type="button"
                  onClick={() => navigate(`/business/${businessId}/branches/${b.branchId}`)}
                  className="inline-flex items-center text-primary"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}