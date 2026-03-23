import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { BUOrgChart } from "@/components/business-units/BUOrgChart";

import { businessUnitService } from "@/services/businessUnitService";
import { torreService } from "@/services/torreService";
import { colaboradorService } from "@/services/colaboradorService";

export default function BusinessUnitsOrganograma() {
  const navigate = useNavigate();
  const [chartLayout, setChartLayout] = useState<"top" | "left" | "right" | "bottom">("top");

  const { data: businessUnits = [], isLoading: loadingBUs } = useQuery({ queryKey: ["business_units"], queryFn: () => businessUnitService.getAll().catch(() => []) });
  const { data: torres = [], isLoading: loadingTorres } = useQuery({ queryKey: ["torres"], queryFn: () => torreService.getAllTorres().catch(() => []) });
  const { data: squads = [], isLoading: loadingSquads } = useQuery({ queryKey: ["squads"], queryFn: () => torreService.getAllSquads().catch(() => []) });
  const { data: colaboradores = [] } = useQuery({ queryKey: ["colaboradores"], queryFn: () => colaboradorService.getAll().catch(() => []) });

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
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border w-full h-[calc(100vh-13.5rem)]">
        <BUOrgChart
          businessUnits={businessUnits}
          torres={torres}
          squads={squads}
          colaboradores={colaboradores}
          isLoading={loadingBUs || loadingTorres || loadingSquads}
          layout={chartLayout}
          onLayoutChange={setChartLayout}
        />
      </div>
    </PageLayout>
  );
}
