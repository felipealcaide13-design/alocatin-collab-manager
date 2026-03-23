import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { BUHistoricoTab } from "@/components/business-units/BUHistoricoTab";

export default function BusinessUnitsHistorico() {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Histórico de Business Units"
      subtitle="Registro de atividades e alterações nas estruturas."
      action={
        <Button variant="outline" onClick={() => navigate("/business-units")} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      }
    >
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border space-y-4">
        <BUHistoricoTab />
      </div>
    </PageLayout>
  );
}
