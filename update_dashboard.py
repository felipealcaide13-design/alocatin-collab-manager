import re

with open("src/pages/Index.tsx", "r") as f:
    content = f.read()

# Replace the layout
# We will use regex or string replace to rewrite the render output

new_jsx = """
  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-xl shadow-sm p-3 text-sm z-50">
          <p className="font-medium mb-1 text-gray-900">{payload[0].name}</p>
          <p className="text-gray-500">Valor: <span className="font-semibold text-gray-900">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs mt-6">
        {payload?.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2 text-gray-500">
            <span className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="truncate max-w-[120px]">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const cardClass = "bg-white border border-[rgba(247,247,247,0.3)] rounded-[24px] p-[25px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full flex flex-col";
  const kpiCardClass = "bg-white border border-[rgba(247,247,247,0.3)] rounded-[24px] p-[25px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full flex items-center gap-4 h-[106px]";
  const cardTitleClass = "text-[14px] font-medium text-[#262626] tracking-tight mb-6";

  return (
    <PageLayout title={`${getGreeting()}, RH 👋`} action={lastUpdateBadge}>
      <div className="space-y-6">
        
        {/* Linha 1 */}
        <div className="grid grid-cols-12 gap-6">
          {/* Stack of KPIs */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className={kpiCardClass}>
              <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[#737373]">Headcount Total Ativo</span>
                <span className="text-[16px] font-semibold text-[#262626]">{headcountAtivo}</span>
              </div>
            </div>

            <div className={kpiCardClass}>
              <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[#737373]">Turnover (Últimos 12m)</span>
                <span className="text-[16px] font-semibold text-[#262626]">{headcountDeletado}</span>
              </div>
            </div>

            <div className={kpiCardClass}>
              <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[#737373]">Contratos ativos</span>
                <span className="text-[16px] font-semibold text-[#262626]">{contratosAtivos}</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={cardClass + " h-[366px]"}>
               <h3 className={cardTitleClass}>Alocados vs. Não Alocados</h3>
               <div className="flex-1 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={alocadosBUPie} cx="50%" cy="40%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value">
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
                     <Pie data={receitaPorClientePie} cx="50%" cy="40%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value">
                       {receitaPorClientePie.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
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
                     <Pie data={colabsPorDiretoriaPie} cx="50%" cy="40%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value">
                       {colabsPorDiretoriaPie.map((_, i) => <Cell key={i} fill={COLORS[(i+4) % COLORS.length]} />)}
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
                     <Pie data={colabsPorBUPie} cx="50%" cy="40%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value">
                       {colabsPorBUPie.map((_, i) => <Cell key={i} fill={COLORS[(i+5) % COLORS.length]} />)}
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
                     <Pie data={colabsPorTorrePie} cx="50%" cy="40%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value">
                       {colabsPorTorrePie.map((_, i) => <Cell key={i} fill={COLORS[(i+6) % COLORS.length]} />)}
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
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val) => val === 0 ? '0' : val} />
                     <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.4)'}} content={renderTooltip} />
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
                     <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                     <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} width={90} />
                     <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.4)'}} content={renderTooltip} />
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
"""

start_str = "return (\n    <PageLayout"
end_str = "    </PageLayout>\n  );\n}"

start_idx = content.find("const renderTooltip")
if start_idx == -1:
    start_idx = content.find("  const renderTooltip")

end_idx = content.find(end_str) + len(end_str)

new_content = content[:start_idx] + new_jsx.strip() + "\n}\n"

with open("src/pages/Index.tsx", "w") as f:
    f.write(new_content)

