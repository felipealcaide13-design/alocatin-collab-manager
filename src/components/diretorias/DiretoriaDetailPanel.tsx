import { useMemo } from "react";
import { Users, ChevronRight, BarChart2, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DetailSection } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Diretoria } from "@/types/diretoria";
import { type Colaborador } from "@/types/colaborador";
import { type Area } from "@/types/area";
import { type Especialidade } from "@/types/especialidade";
import { type Torre, type Squad } from "@/types/torre";

interface Props {
  diretoria: Diretoria | null;
  open: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  areas: Area[];
  especialidades: Especialidade[];
  torres: Torre[];
  squads: Squad[];
}

export function DiretoriaDetailPanel({
  diretoria,
  open,
  onClose,
  colaboradores,
  areas,
  especialidades,
  torres,
  squads,
}: Props) {
  const dirColabs = useMemo(() => {
    if (!diretoria) return [];
    return colaboradores.filter(
      (c) => c.diretoria_id === diretoria.id && c.status === "Ativo"
    );
  }, [diretoria, colaboradores]);

  const bySenioridade = useMemo(() => {
    const map = new Map<string, number>();
    dirColabs.forEach((c) => {
      map.set(c.senioridade, (map.get(c.senioridade) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dirColabs]);

  const byEspecialidade = useMemo(() => {
    const map = new Map<string, number>();
    dirColabs.forEach((c) => {
      const key = c.especialidade_id
        ? (especialidades.find((e) => e.id === c.especialidade_id)?.nome ?? "Sem especialidade")
        : "Sem especialidade";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dirColabs, especialidades]);

  const squadAllocations = useMemo(() => {
    return squads
      .map((sq) => {
        const membros = sq.membros ?? [];
        const count = dirColabs.filter((c) => membros.includes(c.id)).length;
        if (count === 0) return null;
        const torre = torres.find((t) => t.id === sq.torre_id);
        return { squad: sq, torre, count };
      })
      .filter(Boolean) as { squad: Squad; torre: Torre | undefined; count: number }[];
  }, [dirColabs, squads, torres]);

  if (!diretoria) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--primary-600)]" />
            {diretoria.nome}
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {dirColabs.length} colaborador{dirColabs.length !== 1 ? "es" : ""} ativo{dirColabs.length !== 1 ? "s" : ""}
            </span>
          </DialogTitle>
        </DialogHeader>

        {dirColabs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum colaborador ativo nesta diretoria.
          </p>
        ) : (
          <div className="space-y-6 pt-2">

            {/* Senioridade breakdown */}
            <DetailSection icon={BarChart2} title="Por senioridade">
              <div className="flex flex-wrap gap-2">
                {bySenioridade.map(([sen, count]) => (
                  <span key={sen} className="inline-flex items-center gap-1.5">
                    <StatusBadge status={sen} variant="seniority" />
                    <span className="text-xs font-bold text-foreground">{count}</span>
                  </span>
                ))}
              </div>
            </DetailSection>

            {/* Especialidade breakdown */}
            <DetailSection icon={Briefcase} title="Por especialidade / cargo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {byEspecialidade.map(([esp, count]) => (
                  <div
                    key={esp}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20"
                  >
                    <span className="text-sm text-foreground truncate">{esp}</span>
                    <Badge variant="secondary" className="ml-2 shrink-0">{count}</Badge>
                  </div>
                ))}
              </div>
            </DetailSection>

            {/* Torres / Squads allocation */}
            {squadAllocations.length > 0 && (
              <DetailSection icon={ChevronRight} title="Alocação em torres e squads">
                <div className="space-y-1.5">
                  {squadAllocations.map(({ squad, torre, count }) => (
                    <div
                      key={squad.id}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20 text-sm"
                    >
                      <span className="text-muted-foreground shrink-0">{torre?.nome ?? "—"}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="font-medium text-foreground flex-1 truncate">{squad.nome}</span>
                      <Badge variant="secondary" className="shrink-0">{count}</Badge>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Lista de colaboradores */}
            <DetailSection icon={Users} title="Colaboradores">
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {dirColabs.map((c) => {
                  const esp = especialidades.find((e) => e.id === c.especialidade_id);
                  const areaNames = c.area_ids
                    .map((id) => areas.find((a) => a.id === id)?.nome)
                    .filter(Boolean)
                    .join(", ");
                  const squadNames = squads
                    .filter((sq) => (sq.membros ?? []).includes(c.id))
                    .map((sq) => sq.nome)
                    .join(", ");

                  return (
                    <div
                      key={c.id}
                      className="flex items-start justify-between rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.nomeCompleto}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {areaNames || "—"}
                          {esp ? ` · ${esp.nome}` : ""}
                          {squadNames ? ` · ${squadNames}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={c.senioridade} variant="seniority" className="ml-3 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
