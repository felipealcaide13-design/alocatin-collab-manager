import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrgChartView } from "@/components/areas/OrgChartView";

export default function OrgChartPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/areas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Org Chart</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Hierarquia completa da empresa</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <OrgChartView />
      </div>
    </div>
  );
}
