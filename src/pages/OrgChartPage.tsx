import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { OrgChartView } from "@/components/areas/OrgChartView";

export default function OrgChartPage() {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Organograma Empresarial"
      subtitle="Hierarquia completa da empresa"
      action={
        <Button variant="outline" onClick={() => navigate("/areas")} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      }
    >
      <div className="flex-1 min-h-0 h-[calc(100vh-12rem)]">
        <OrgChartView />
      </div>
    </PageLayout>
  );
}
