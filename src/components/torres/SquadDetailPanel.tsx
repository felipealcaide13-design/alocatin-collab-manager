import { useMemo } from "react";
import { Network, Users, Briefcase, Building2, UserCircle, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DetailSection } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Squad, type Torre } from "@/types/torre";
import { type Colaborador } from "@/types/colaborador";
import { type Contrato } from "@/types/contrato";
import { type Area } from "@/types/area";
import { type Especialidade } from "@/types/especialidade";

interface Props {
  squad: Squad | null;
  open: boolean;
  onClose: () => void;
  torres: Torre[];
  colaboradores: Colaborador[];
  contratos: Contrato[];
  areas: Area[];
  especialidades: Especialidade[];
}

export function SquadDetailPanel({
  squad,
  open,
  onClose,
  torres,
  colaboradores,
  contratos,
  areas,
  especialidades,
}: Props) {
  const data = useMemo(() => {
    if (!squad) return null;

    const torre = torres.find((t) => t.id === squad.torre_id);
    const contrato = squad.contrato_id ? contratos.find((c) => c.id === squad.contrato_id) : null;
    const lider = squad.lider ? colaboradores.find((c) => c.id === squad.lider) : null;

    const membros = (squad.membros ?? [])
      .map((id) => colaboradores.find((c) => c.id === id))
      .filter(Boolean) as Colaborador[];

    const bySenioridade = new Map<string, number>();
    membros.forEach((m) => {
      bySenioridade.set(m.senioridade, (bySenioridade.get(m.senioridade) ?? 0) + 1);
    });

    return { torre, contrato, lider, membros, bySenioridade };
  }, [squad, torres, colaboradores, contratos]);

  if (!squad || !data) return null;

  const { torre, contrato, lider, membros, bySenioridade } = data;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-[var(--primary-600)] shrink-0" />
            {squad.nome}
          </DialogTitle>
        </DialogHeader>

        {squad.descricao && (
          <p className="text-sm text-muted-foreground -mt-2">{squad.descricao}</p>
        )}

        {/* Torre + Contrato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/20 px-3 py-2.5 flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Torre</p>
              <p className="text-sm font-medium text-foreground">{torre?.nome ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 px-3 py-2.5 flex items-start gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Contrato</p>
              {contrato ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{contrato.nome}</p>
                  <StatusBadge status={contrato.status} variant="contract" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalhes do contrato */}
        {contrato && (
          <DetailSection icon={FileText} title="Detalhes do Contrato">
            <div className="rounded-lg border bg-muted/10 px-3 py-2.5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{contrato.cliente}</p>
                </div>
                {contrato.data_inicio && (
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="font-medium text-foreground">
                      {new Date(contrato.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                {contrato.data_fim && (
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="font-medium text-foreground">
                      {new Date(contrato.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DetailSection>
        )}

        <Separator />

        {/* Líder */}
        {lider && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] text-sm font-bold shrink-0">
              {lider.nomeCompleto.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Líder da Squad</p>
              <p className="text-sm font-medium text-foreground">{lider.nomeCompleto}</p>
            </div>
            <StatusBadge status={lider.senioridade} variant="seniority" className="ml-auto shrink-0" />
          </div>
        )}

        {/* Composição por senioridade */}
        {bySenioridade.size > 0 && (
          <DetailSection icon={Users} title={`Composição (${membros.length} membro${membros.length !== 1 ? "s" : ""})`}>
            <div className="flex flex-wrap gap-2">
              {Array.from(bySenioridade.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([sen, count]) => (
                  <span key={sen} className="inline-flex items-center gap-1.5">
                    <StatusBadge status={sen} variant="seniority" />
                    <span className="text-xs font-bold text-foreground">{count}</span>
                  </span>
                ))}
            </div>
          </DetailSection>
        )}

        {/* Lista de membros */}
        {membros.length > 0 && (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {membros.map((m) => {
              const esp = especialidades.find((e) => e.id === m.especialidade_id);
              const areaNames = m.area_ids
                .map((id) => areas.find((a) => a.id === id)?.nome)
                .filter(Boolean)
                .join(", ");
              const isLider = m.id === squad.lider;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors border"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{m.nomeCompleto}</p>
                      {isLider && (
                        <Badge variant="outline" className="text-xs py-0 px-1.5 shrink-0">líder</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {areaNames || "—"}{esp ? ` · ${esp.nome}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={m.senioridade} variant="seniority" className="ml-2 shrink-0" />
                </div>
              );
            })}
          </div>
        )}

        {membros.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro nesta squad.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
