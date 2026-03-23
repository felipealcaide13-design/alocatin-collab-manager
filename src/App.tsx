import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Colaboradores from "./pages/Colaboradores";
import ColaboradorDetail from "./pages/ColaboradorDetail";
import Areas from "./pages/Areas";
import DiretoriaAnalise from "./pages/DiretoriaAnalise";
import OrgChartPage from "./pages/OrgChartPage";
import Contratos from "./pages/Contratos";
import BusinessUnits from "./pages/BusinessUnits";
import BusinessUnitsOrganograma from "./pages/BusinessUnitsOrganograma";
import BusinessUnitsHistorico from "./pages/BusinessUnitsHistorico";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/business-units" element={<BusinessUnits />} />
                      <Route path="/business-units/organograma" element={<BusinessUnitsOrganograma />} />
                      <Route path="/business-units/historico" element={<BusinessUnitsHistorico />} />
                      <Route path="/contratos" element={<Contratos />} />
                      <Route path="/colaboradores" element={<Colaboradores />} />
                      <Route path="/colaboradores/:id" element={<ColaboradorDetail />} />
                      <Route path="/areas" element={<Areas />} />
                      <Route path="/areas/orgchart" element={<OrgChartPage />} />
                      <Route path="/areas/diretorias/:id" element={<DiretoriaAnalise />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
