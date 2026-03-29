import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { BUOrgChart } from "@/components/business-units/BUOrgChart";
import { getOrgChartAtDate } from "@/services/orgchartTimeTravelService";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function BusinessUnitsOrganograma() {
  const navigate = useNavigate();
  const [chartLayout, setChartLayout] = useState<"top" | "left" | "right" | "bottom">("top");
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const today = todayStr();
  const isHistorico = selectedDate !== today;

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["orgchart_snapshot", selectedDate],
    queryFn: () => getOrgChartAtDate(selectedDate),
    staleTime: isHistorico ? Infinity : 30_000,
  });

  const handleDateChange = useCallback((date: string) => {
    if (date && date <= todayStr()) {
      setSelectedDate(date);
    }
  }, []);

  const resetToToday = useCallback(() => {
    setSelectedDate(todayStr());
  }, []);

  const formatDateBR = (dateStr: string): string => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <PageLayout
      title="Organograma"
      subtitle="Visualização hierárquica das Business Units, Torres e Squads."
      action={
        <Button variant="outline" onClick={() => navigate("/business-units")} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      }
    >
      {/* Banner de modo histórico */}
      {isHistorico && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Visualizando organograma de {formatDateBR(selectedDate)}</strong>
              <span className="text-amber-700 ml-1.5">
                — Os dados exibidos refletem o estado no final do dia.
              </span>
            </span>
          </div>
          <button
            onClick={resetToToday}
            className="p-1 rounded-full hover:bg-amber-200 transition-colors shrink-0"
            title="Voltar para hoje"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border w-full h-[calc(100vh-13.5rem)]">
        <BUOrgChart
          businessUnits={snapshot?.businessUnits ?? []}
          torres={snapshot?.torres ?? []}
          squads={snapshot?.squads ?? []}
          colaboradores={snapshot?.colaboradores ?? []}
          isLoading={isLoading}
          layout={chartLayout}
          onLayoutChange={setChartLayout}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          maxDate={today}
        />
      </div>
    </PageLayout>
  );
}
