import { useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Users, UserMinus, FileCheck } from "lucide-react";
import { PageLayout } from "@/components/ui/page-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from "recharts";

import { colaboradorService } from '@/services/colaboradorService';
import { contratoService } from '@/services/contratoService';
import { torreService } from '@/services/torreService';
import { diretoriaService } from '@/services/diretoriaService';
import { businessUnitService } from '@/services/businessUnitService';



const COLORS = ['#0ea5e9', '#6366f1', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#8b5cf6'];



export default function Dashboard() {
  const { data: colaboradores = [], isLoading: isLoadingColabs } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => colaboradorService.getAll(),
  });

  const { data: contratos = [], isLoading: isLoadingContratos } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => contratoService.getAll(),
  });

  const { data: torres = [], isLoading: isLoadingTorres } = useQuery({
    queryKey: ['torres'],
    queryFn: () => torreService.getAllTorres(),
  });

  const { data: diretorias = [], isLoading: isLoadingDir } = useQuery({
    queryKey: ['diretorias'],
    queryFn: () => diretoriaService.getAll(),
  });

  const { data: bus = [], isLoading: isLoadingBU } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => businessUnitService.getAll(),
  });

  const isLoading = isLoadingColabs || isLoadingContratos || isLoadingTorres || isLoadingDir || isLoadingBU;

  // Calculos Linha 1: Overview Pessoas
  const headcountAtivo = colaboradores.filter(c => c.status === 'Ativo').length;
  const headcountDeletado = colaboradores.filter(c => c.status === 'Desligado').length;

  const alocadosBUPie = useMemo(() => {
    const ativos = colaboradores.filter(c => c.status === 'Ativo');
    let alocados = 0;
    let naoAlocados = 0;

    ativos.forEach(c => {
      // considera alocado se tiver squad, torre ou bu atrelada (C-levels tem bu_id, ICs tem squad_ids)
      if ((c.squad_ids && c.squad_ids.length > 0) || (c.torre_ids && c.torre_ids.length > 0) || c.bu_id) {
        alocados++;
      } else {
        naoAlocados++;
      }
    });

    return [
      { name: 'Alocados', value: alocados },
      { name: 'Não Alocados', value: naoAlocados },
    ];
  }, [colaboradores]);

  // Calculos Linha 2: Contratos e Receita
  const contratosAtivos = contratos.filter(c => c.status === 'Ativo').length;

  const receitaPorClientePie = useMemo(() => {
    // Calculado: fechados = total/duração
    const data = contratos.filter(c => c.status === 'Ativo').map(c => {
      let receitaMensal = c.valor || 0;
      if (c.contract_type === 'Fechado' && c.data_inicio && c.data_fim) {
        const start = new Date(c.data_inicio);
        const end = new Date(c.data_fim);
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        receitaMensal = (c.valor || 0) / months;
      }
      return { name: c.cliente || c.nome, value: Math.round(receitaMensal) };
    });
    // group by cliente
    const grouped = data.reduce((acc, curr) => {
      acc[curr.name] = (acc[curr.name] || 0) + curr.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [contratos]);

  const receitaPorBUBar = useMemo(() => {
    const buMap: Record<string, number> = {};
    bus.forEach(bu => { buMap[bu.id] = 0; });

    // Distribuir receita pelas BUs através das torres
    contratos.filter(c => c.status === 'Ativo').forEach(c => {
      let receitaMensal = c.valor || 0;
      if (c.contract_type === 'Fechado' && c.data_inicio && c.data_fim) {
        const start = new Date(c.data_inicio);
        const end = new Date(c.data_fim);
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        receitaMensal = (c.valor || 0) / months;
      }

      if (c.torres && c.torres.length > 0) {
        const valuePerTorre = receitaMensal / c.torres.length;
        c.torres.forEach(tId => {
          const torre = torres.find(t => t.id === tId);
          if (torre && torre.bu_id) {
            buMap[torre.bu_id] = (buMap[torre.bu_id] || 0) + valuePerTorre;
          }
        });
      }
    });

    return bus.map(bu => ({
      name: bu.nome,
      value: Math.round(buMap[bu.id] || 0)
    })).filter(b => b.value > 0).sort((a, b) => b.value - a.value);
  }, [bus, torres, contratos]);

  // Calculos Linha 3: Breakdown Hierárquico
  const colabsPorDiretoriaPie = useMemo(() => {
    const counts: Record<string, number> = {};
    colaboradores.filter(c => c.status === 'Ativo').forEach(c => {
      const dir = diretorias.find(d => d.id === c.diretoria_id);
      const name = dir ? dir.nome : 'Sem Diretoria';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [colaboradores, diretorias]);

  const colabsPorBUPie = useMemo(() => {
    const counts: Record<string, number> = {};
    colaboradores.filter(c => c.status === 'Ativo').forEach(c => {
      let assignedBU = 'Sem BU';
      if (c.bu_id) {
        const bu = bus.find(b => b.id === c.bu_id);
        if (bu) assignedBU = bu.nome;
      } else if (c.torre_ids && c.torre_ids.length > 0) {
        // Pega a primeira torre associada para simplificar a visão
        const torre = torres.find(t => t.id === c.torre_ids[0]);
        if (torre && torre.bu_id) {
          const bu = bus.find(b => b.id === torre.bu_id);
          if (bu) assignedBU = bu.nome;
        }
      } else if (c.squad_ids && c.squad_ids.length > 0) {
        // Se atrelado via squad
        for (const torre of torres) {
          if (torre.squads?.some(s => c.squad_ids.includes(s.id))) {
            if (torre.bu_id) {
              const bu = bus.find(b => b.id === torre.bu_id);
              if (bu) { assignedBU = bu.nome; break; }
            }
          }
        }
      }
      counts[assignedBU] = (counts[assignedBU] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [colaboradores, torres, bus]);

  const colabsPorTorrePie = useMemo(() => {
    const counts: Record<string, number> = {};
    colaboradores.filter(c => c.status === 'Ativo').forEach(c => {
      let assignedTorre = 'Sem Torre';
      if (c.torre_ids && c.torre_ids.length > 0) {
        const torre = torres.find(t => t.id === c.torre_ids[0]);
        if (torre) assignedTorre = torre.nome;
      } else if (c.squad_ids && c.squad_ids.length > 0) {
        for (const torre of torres) {
          if (torre.squads?.some(s => c.squad_ids.includes(s.id))) {
            assignedTorre = torre.nome;
            break;
          }
        }
      }
      counts[assignedTorre] = (counts[assignedTorre] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [colaboradores, torres]);

  // Calculos Linha 4: Análises Avançadas
  const receitaPorTorreBar = useMemo(() => {
    const torreMap: Record<string, number> = {};
    torres.forEach(t => { torreMap[t.id] = 0; });

    contratos.filter(c => c.status === 'Ativo').forEach(c => {
      let receitaMensal = c.valor || 0;
      if (c.contract_type === 'Fechado' && c.data_inicio && c.data_fim) {
        const start = new Date(c.data_inicio);
        const end = new Date(c.data_fim);
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        receitaMensal = (c.valor || 0) / months;
      }

      if (c.torres && c.torres.length > 0) {
        const valuePerTorre = receitaMensal / c.torres.length;
        c.torres.forEach(tId => {
          torreMap[tId] = (torreMap[tId] || 0) + valuePerTorre;
        });
      }
    });

    return torres.map(t => ({
      name: t.nome,
      value: Math.round(torreMap[t.id] || 0)
    })).filter(t => t.value > 0).sort((a, b) => b.value - a.value);
  }, [torres, contratos]);

  const headcountEvolucaoMensal = useMemo(() => {
    // Evolução simplificada baseada na data de admissão vs data atual
    // Usaremos os últimos 6 meses
    const data = [];
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' });

      // conta quantos colaboradores entraram até esse mês
      const count = colaboradores.filter(c => {
        if (!c.dataAdmissao) return false;
        const [day, month, year] = c.dataAdmissao.split('-');
        // Se a data estiver em YYYY-MM-DD
        let cDate;
        if (c.dataAdmissao.includes('-')) {
          const parts = c.dataAdmissao.split('-');
          if (parts[0].length === 4) {
            cDate = new Date(c.dataAdmissao);
          } else {
            cDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
        }
        return cDate && cDate <= new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0); // último dia do mês
      }).length;

      data.push({ name: monthLabel, value: count });
    }
    return data;
  }, [colaboradores]);


  const lastUpdate = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const lastUpdateBadge = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border rounded-full px-3 py-1.5">
      <RefreshCw className="h-3 w-3" />
      <span>Atualizado em {lastUpdate}</span>
    </div>
  );

  if (isLoading) {
    return (
      <PageLayout title="Visão geral" action={lastUpdateBadge}>
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </PageLayout>
    );
  }

  const formatCompactNumber = (number: number) => {
    if (number < 1000) return number.toString();
    if (number < 1000000) return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'MM';
  };

  const renderTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-xl shadow-sm p-3 text-sm z-50">
          <p className="font-medium mb-1 text-gray-900">{payload[0].name}</p>
          <p className="text-gray-500">Valor: <span className="font-semibold text-gray-900">{formatCompactNumber(payload[0].value)}</span></p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = ({ payload }: { payload?: { value: string; color: string }[] }) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs mt-6">
        {payload?.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-2 text-gray-500">
            <span className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="truncate max-w-[120px]">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const cardClass = "bg-white border border-[rgba(247,247,247,0.3)] rounded-[24px] p-[25px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full flex flex-col";
  const cardTitleClass = "text-[14px] font-medium text-[#262626] tracking-tight mb-6";

  return (
    <PageLayout title="Visão geral" action={lastUpdateBadge}>
      <div className="space-y-6">

        {/* Linha 1 */}
        <div className="grid grid-cols-12 gap-6">
          {/* Stack of KPIs */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <KpiCard icon={Users} label="Colaboradores ativos" value={headcountAtivo} className="h-[106px]" />
            <KpiCard icon={UserMinus} label="Turnover (Últimos 12m)" value={headcountDeletado} className="h-[106px]" />
            <KpiCard icon={FileCheck} label="Contratos ativos" value={contratosAtivos} className="h-[106px]" />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Alocados vs. Não Alocados</h3>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={alocadosBUPie} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value">
                      {alocadosBUPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                    <Legend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Receita Mensal por Cliente</h3>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={receitaPorClientePie} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value">
                      {receitaPorClientePie.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                    <Legend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Linha 2 */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Colaboradores por Diretoria</h3>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={colabsPorDiretoriaPie} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value">
                      {colabsPorDiretoriaPie.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                    <Legend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Colaboradores por BU</h3>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={colabsPorBUPie} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value">
                      {colabsPorBUPie.map((_, i) => <Cell key={i} fill={COLORS[(i + 5) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                    <Legend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Colaboradores por Torre</h3>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={colabsPorTorrePie} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value">
                      {colabsPorTorrePie.map((_, i) => <Cell key={i} fill={COLORS[(i + 6) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={renderTooltip} />
                    <Legend content={renderLegend} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Linha 3 */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Receita por BU</h3>
              <div className="flex-1 w-full relative -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitaPorBUBar} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val) => val === 0 ? "0" : formatCompactNumber(val)} />
                    <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.4)' }} content={renderTooltip} />
                    <Bar dataKey="value" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Receita por Torre</h3>
              <div className="flex-1 w-full relative -ml-6 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitaPorTorreBar} margin={{ top: 0, right: 30, left: 10, bottom: 20 }} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={formatCompactNumber} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} width={90} />
                    <Tooltip cursor={{ fill: 'rgba(243, 244, 246, 0.4)' }} content={renderTooltip} />
                    <Bar dataKey="value" fill={COLORS[1]} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
              <h3 className={cardTitleClass}>Evolução do Headcount (Últimos 6 meses)</h3>
              <div className="flex-1 w-full relative -ml-4 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={headcountEvolucaoMensal} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <Tooltip content={renderTooltip} />
                    <Line type="monotone" dataKey="value" stroke={COLORS[2]} strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
