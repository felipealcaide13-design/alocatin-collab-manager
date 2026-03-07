import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Colaborador, Pilar } from "@/types/colaborador";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

interface ChartsProps {
  colaboradores: Colaborador[];
}

export function PilarChart({ colaboradores }: ChartsProps) {
  const pilarCount = colaboradores.reduce<Record<string, number>>((acc, c) => {
    acc[c.pilar] = (acc[c.pilar] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(pilarCount).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-base font-semibold text-foreground mb-4">Distribuição por Pilar</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} colaboradores`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SenioridadeChart({ colaboradores }: ChartsProps) {
  const senCount = colaboradores.reduce<Record<string, number>>((acc, c) => {
    acc[c.senioridade] = (acc[c.senioridade] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(senCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-base font-semibold text-foreground mb-4">Por Senioridade</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
          <Tooltip />
          <Bar dataKey="value" name="Colaboradores" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
