import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { SenioridadeItem } from "@/utils/dashboardRH";
import { CHART_COLORS } from "@/lib/chart-colors";

interface SenioridadeBarChartProps {
  data: SenioridadeItem[];
  collapsed: boolean;
}

export function SenioridadeBarChart({ data, collapsed }: SenioridadeBarChartProps) {
  const displayData = collapsed ? data.slice(0, 4) : data;
  const height = Math.max(180, displayData.length * 36 + 20);

  if (displayData.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sem dados disponíveis</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={collapsed ? 180 : height}>
        <BarChart data={displayData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v) => [`${v} colaboradores`, ""]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {displayData.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {collapsed && data.length > 4 && (
        <p className="text-center text-xs text-muted-foreground mt-1">...</p>
      )}
    </div>
  );
}
