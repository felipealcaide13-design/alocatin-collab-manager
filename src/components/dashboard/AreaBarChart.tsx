import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { AreaHeadcountItem } from "@/utils/dashboardRH";
import { CHART_COLORS } from "@/lib/chart-colors";

interface AreaBarChartProps {
  data: AreaHeadcountItem[];
  collapsed: boolean;
}

export function AreaBarChart({ data, collapsed }: AreaBarChartProps) {
  const displayData = collapsed ? data.slice(0, 5) : data.slice(0, 10);

  if (displayData.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sem dados disponíveis</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={displayData} layout="horizontal" margin={{ left: 8, right: 8, top: 4, bottom: 8 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis type="number" tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [`${v} colaboradores`, ""]} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {displayData.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
