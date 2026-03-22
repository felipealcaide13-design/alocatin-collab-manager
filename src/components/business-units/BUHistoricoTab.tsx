import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Network, Layers, AlertCircle, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { historicoBUService } from "@/services/historicoBUService";
import { EventoBUTorreSquad, EntidadeTipo } from "@/types/historicoBU";

const TIPO_EVENTO_LABEL: Record<string, string> = {
  bu_criada: "BU criada",
  bu_alterada: "BU alterada",
  bu_deletada: "BU deletada",
  torre_criada: "Torre criada",
  torre_alterada: "Torre alterada",
  torre_deletada: "Torre deletada",
  squad_criado: "Squad criado",
  squad_alterado: "Squad alterado",
  squad_deletado: "Squad deletado",
  campo_lideranca_criado: "Campo de liderança criado",
  campo_lideranca_alterado: "Campo de liderança alterado",
  campo_lideranca_removido: "Campo de liderança removido",
  lideranca_atribuida: "Liderança atribuída",
  lideranca_alterada: "Liderança alterada",
  lideranca_removida: "Liderança removida",
};

const ENTIDADE_CONFIG: Record<EntidadeTipo, { label: string; color: string; icon: React.ReactNode }> = {
  bu: { label: "BU", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Layers className="h-3 w-3" /> },
  torre: { label: "Torre", color: "bg-green-100 text-green-700 border-green-200", icon: <Building2 className="h-3 w-3" /> },
  squad: { label: "Squad", color: "bg-orange-100 text-orange-700 border-orange-200", icon: <Network className="h-3 w-3" /> },
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).replace(",", " às");
}

function formatarDia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SnapshotResumo({ evento }: { evento: EventoBUTorreSquad }) {
  const s = evento.snapshot_dados;
  if (!s) return null;

  if (evento.tipo_evento === "lideranca_atribuida") {
    return <span className="text-xs text-muted-foreground">Cargo: {String(s.cargo ?? "—")}</span>;
  }
  if (evento.tipo_evento === "lideranca_alterada") {
    return <span className="text-xs text-muted-foreground">Cargo: {String(s.cargo ?? "—")} — colaborador alterado</span>;
  }
  if (evento.tipo_evento === "lideranca_removida") {
    return <span className="text-xs text-muted-foreground">Cargo: {String(s.cargo ?? "—")} — liderança removida</span>;
  }
  if (evento.tipo_evento === "campo_lideranca_criado" || evento.tipo_evento === "campo_lideranca_removido") {
    return <span className="text-xs text-muted-foreground">Campo: {String(s.nome ?? "—")}</span>;
  }
  if (evento.tipo_evento === "campo_lideranca_alterado") {
    const antes = s.antes as any;
    const depois = s.depois as any;
    return <span className="text-xs text-muted-foreground">{antes?.nome} → {depois?.nome}</span>;
  }
  if (s.antes && s.depois) {
    const antes = s.antes as any;
    const depois = s.depois as any;
    const campos = Object.keys(depois).filter(k => antes[k] !== depois[k] && depois[k] != null);
    if (campos.length > 0) {
      return <span className="text-xs text-muted-foreground">{campos.map(k => `${k}: ${antes[k] ?? "—"} → ${depois[k]}`).join(" · ")}</span>;
    }
  }
  if (s.nome) {
    return <span className="text-xs text-muted-foreground">{String(s.nome)}</span>;
  }
  return null;
}

export function BUHistoricoTab() {
  const [filtroTipo, setFiltroTipo] = useState<"todos" | EntidadeTipo>("todos");
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => new Date().toISOString().split("T")[0]);

  const { data: eventos = [], isLoading, isError } = useQuery({
    queryKey: ["historico_bu_torre_squad", dataInicio, dataFim],
    queryFn: () => historicoBUService.getEventosByPeriodo(new Date(dataInicio), new Date(dataFim + "T23:59:59")),
  });

  const eventosFiltrados = filtroTipo === "todos"
    ? eventos
    : eventos.filter((e) => e.entidade_tipo === filtroTipo);

  // Agrupar por dia
  const grupos = eventosFiltrados.reduce<Record<string, EventoBUTorreSquad[]>>((acc, e) => {
    const dia = formatarDia(e.ocorrido_em);
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(e);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(grupos).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="bu">BU</SelectItem>
            <SelectItem value="torre">Torre</SelectItem>
            <SelectItem value="squad">Squad</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 items-center">
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" />
          <span className="text-muted-foreground text-sm">até</span>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
          <AlertCircle className="h-4 w-4" />
          <span>Não foi possível carregar o histórico.</span>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <History className="h-8 w-8 opacity-30" />
          <span>Nenhum evento registrado ainda.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {diasOrdenados.map((dia) => (
            <div key={dia}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{dia}</div>
              <div className="bg-card rounded-xl border shadow-sm divide-y">
                {grupos[dia].map((evento) => {
                  const cfg = ENTIDADE_CONFIG[evento.entidade_tipo];
                  return (
                    <div key={evento.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium mt-0.5 ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {TIPO_EVENTO_LABEL[evento.tipo_evento] ?? evento.tipo_evento}
                        </div>
                        <SnapshotResumo evento={evento} />
                        {evento.autor_alteracao && evento.autor_alteracao !== "sistema" && (
                          <span className="text-xs text-muted-foreground">por {evento.autor_alteracao}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatarData(evento.ocorrido_em)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
