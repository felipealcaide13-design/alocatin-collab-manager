import { useMemo } from "react";
import {
  User, Mail, FileText, Calendar, Building2, Layers, Network, ChevronRight, Briefcase, UserCheck,
} from "lucide-react";
import { HistoricoAlteracoes } from "@/components/colaboradores/HistoricoAlteracoes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DetailSection, DetailRow } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Colaborador } from "@/types/colaborador";
import { type Area } from "@/types/area";
import { type Especialidade } from "@/types/especialidade";
import { type Diretoria } from "@/types/diretoria";
import { type Torre, type Squad } from "@/types/torre";
import { type Contrato } from "@/types/contrato";
import { type BusinessUnit } from "@/types/businessUnit";

interface Props {
  colaborador: Colaborador | null;
  open: boolean;
  onClose: () => void;
  areas: Area[];
  especialidades: Especialidade[];
  diretorias: Diretoria[];
  torres: Torre[];
  squads: Squad[];
  contratos: Contrato[];
  businessUnits: BusinessUnit[];
  colaboradores?: Colaborador[];
}

export function ColaboradorDetailPanel({
  colaborador,
  open,
  onClose,
  areas,
  especialidades,
  diretorias,
  torres,
  squads,
  contratos,
  businessUnits,
  colaboradores = [],
}: Props) {
  const data = useMemo(() => {
    if (!colaborador) return null;

    const diretoria = diretorias.find((d) => d.id === colaborador.diretoria_id);
    const lider = colaborador.lider_id ? colaboradores.find((c) => c.id === colaborador.lider_id) : null;
    const colabAreas = areas.filter((a) => colaborador.area_ids.includes(a.id));
    const especialidade = especialidades.find((e) => e.id === colaborador.especialidade_id);

    const colabSquads = squads.filter((sq) => (colaborador.squad_ids ?? []).includes(sq.id));

    const squadDetails = colabSquads.map((sq) => {
      const torre = torres.find((t) => t.id === sq.torre_id);
      const contrato = sq.contrato_id ? contratos.find((c) => c.id === sq.contrato_id) : null;
      const bu = torre?.bu_id ? businessUnits.find((b) => b.id === torre.bu_id) : null;
      return { squad: sq, torre, contrato, bu };
    });

    const uniqueContratos = Array.from(
      new Map(
        squadDetails
          .filter((d) => d.contrato)
          .map((d) => [d.contrato!.id, d.contrato!])
      ).values()
    );

    return { diretoria, lider, colabAreas, especialidade, squadDetails, uniqueContratos };
  }, [colaborador, diretorias, areas, especialidades, squads, torres, contratos, businessUnits]);

  if (!colaborador || !data) return null;

  const { diretoria, lider, colabAreas, especialidade, squadDetails, uniqueContratos } = data;

  const initials = colaborador.nomeCompleto
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{colaborador.nomeCompleto}</DialogTitle>
        </DialogHeader>

        {/* Avatar + nome */}
        <div className="flex items-center gap-4 pt-2">
          <div className="h-14 w-14 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">{colaborador.nomeCompleto}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={colaborador.senioridade} variant="seniority" />
              <StatusBadge status={colaborador.status} variant="entity" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Dados cadastrais */}
        <DetailSection icon={User} title="Dados cadastrais">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon={Mail} label="E-mail" value={colaborador.email} />
            <DetailRow icon={FileText} label="CPF / Documento" value={colaborador.documento} />
            <DetailRow
              icon={Calendar}
              label="Data de admissão"
              value={new Date(colaborador.dataAdmissao + "T00:00:00").toLocaleDateString("pt-BR")}
            />
            <DetailRow icon={Building2} label="Diretoria" value={diretoria?.nome} />
            <DetailRow
              icon={UserCheck}
              label="Líder direto"
              value={lider ? `${lider.nomeCompleto} (${lider.senioridade})` : undefined}
            />
          </div>
        </DetailSection>

        {/* Área(s) e Especialidade */}
        <DetailSection icon={Layers} title={`Área${colabAreas.length !== 1 ? "s" : ""} e Especialidade`}>
          {colabAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem área associada.</p>
          ) : (
            <div className="space-y-1.5">
              {colabAreas.map((area) => (
                <div key={area.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20">
                  <span className="text-sm font-medium text-foreground">{area.nome}</span>
                  {especialidade && especialidade.area_id === area.id && (
                    <Badge variant="secondary" className="ml-2 text-xs">{especialidade.nome}</Badge>
                  )}
                </div>
              ))}
              {especialidade && !colabAreas.some((a) => a.id === especialidade.area_id) && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20">
                  <span className="text-sm text-muted-foreground">Especialidade:</span>
                  <Badge variant="secondary">{especialidade.nome}</Badge>
                </div>
              )}
            </div>
          )}
        </DetailSection>

        {/* Torres e Squads */}
        <DetailSection icon={Network} title="Torres e Squads">
          {squadDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Não alocado em nenhuma squad.</p>
          ) : (
            <div className="space-y-1.5">
              {squadDetails.map(({ squad, torre, contrato, bu }) => (
                <div key={squad.id} className="rounded-lg border px-3 py-2 bg-muted/20 space-y-1">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {bu && (
                      <>
                        <span className="text-muted-foreground shrink-0">{bu.nome}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      </>
                    )}
                    <span className="text-muted-foreground shrink-0">{torre?.nome ?? "—"}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="font-medium text-foreground">{squad.nome}</span>
                  </div>
                  {contrato && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-0.5">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span>{contrato.nome}</span>
                      <StatusBadge status={contrato.status} variant="contract" className="ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        {/* Contratos únicos (resumo) */}
        {uniqueContratos.length > 1 && (
          <DetailSection icon={Briefcase} title="Contratos associados">
            <div className="space-y-1.5">
              {uniqueContratos.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.cliente}</p>
                  </div>
                  <StatusBadge status={c.status} variant="contract" className="ml-2 shrink-0" />
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Histórico de Alterações */}
        <HistoricoAlteracoes
          colaboradorId={colaborador.id}
          torres={torres}
          squads={squads}
          diretorias={diretorias}
          businessUnits={businessUnits}
        />
      </DialogContent>
    </Dialog>
  );
}
