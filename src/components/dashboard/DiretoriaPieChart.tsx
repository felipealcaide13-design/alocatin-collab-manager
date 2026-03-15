import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DiretoriaItem } from "@/utils/dashboardRH";
import { CHART_COLORS } from "@/lib/chart-colors";

interface DiretoriaPieChartProps {
  data: DiretoriaItem[];
  collapsed: boolean;
}

export function DiretoriaPieChart({ data, collapsed }: DiretoriaPieChartProps) {
  const legendData = collapsed ? data.slice(0, 3) : data;
  const hasMore = collapsed && data.length > 3;

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sem dados disponíveis</p>;
  }

  const renderLegend = (props: { payload?: Array<{ value: string; color: string }> }) => {
    const items = props.payload ?? [];
    return (
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs mt-2">
        {items.map((entry, index) => {
          const label =
            collapsed && entry.value.length > 20
              ? entry.value.slice(0, 20) + "…"
              : entry.value;
          return (
            <li key={index} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{label}</span>
            </li>
          );
        })}
        {hasMore && (
          <li className="text-muted-foreground">...</li>
        )}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={collapsed ? 200 : 300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v, name) => [`${v} colaboradores`, name]} />
        <Legend
          content={renderLegend}
          payload={legendData.map((item, index) => ({
            value: item.name,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
