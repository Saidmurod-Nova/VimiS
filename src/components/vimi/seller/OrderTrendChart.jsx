import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "../States";

// Order counts over time, split by completed/cancelled. Uses creation-date
// bucketing. Empty periods render as zero bars.
export default function OrderTrendChart({ data }) {
  const hasData = (data || []).some((d) => (d.total || 0) > 0);
  if (!hasData) {
    return <EmptyState icon={BarChart3} title="Buyurtmalar yo'q" description="Tanlangan davrda buyurtmalar yo'q." />;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 12 }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="completed" name="Yakunlandi" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
          <Bar dataKey="cancelled" name="Bekor" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}