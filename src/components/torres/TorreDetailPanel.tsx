import { useMemo } from "react";
import { Building2, Users, Network, Briefcase, UserCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DetailSection, StatMini } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Torre, type Squad } from "@/types/torre";
import { type Colaborador } from "@/types/colaborador";
import { type Contrato } from "@/types/contrato";
import { type BusinessUnit } from "@/types/businessUnit";

interface Props {
  torre: Torre | null;
  open: boolean;
  onClose: () => void;
  squads: Squad[];
  colaboradores: Colaborador[];
  contratos: Contrato[];
  businessUnits?: BusinessUnit[];
}

function RoleRow({ label, id, colaboradores }: { label: string; id: string | null; colaboradores: Colaborador[] }) {
  if (!id) return null;
  const pessoa = colaboradores.find((c) => c.id === id);
  if (!pessoa) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{pessoa.nomeCompleto}</span>
    </div>
  );
}

export function TorreDetailPanel({ torre, open, onClose, squads, colaboradores, contratos, businessUnits = [] }: Props) {
  const data = useMemo(() => {
    if (!torre) return null;

    const torreSquads = squads.filter((s) => s.torre_id === torre.id);

    const squadDetails = torreSquads.map((sq) => {
      const contrato = sq.contrato_id ? contratos.find((c) => c.id === sq.contrato_id) : null;
      const lider = sq.lider ? colaboradores.find((c) => c.id === sq.lider) : null;
      const membros = (sq.membros ?? [])
        .map((id) => colaboradores.find((c) => c.id === id))
        .filter(Boolean) as Colaborador[];
      return { squad: sq, contrato, lider, membros };
    });

    const allMemberIds = new Set(torreSquads.flatMap((sq) => sq.membros ?? []));
    const totalMembros = allMemberIds.size;

    return { torreSquads, squadDetails, totalMembros };
  }, [torre, squads, colaboradores, contratos]);

  if (!torre || !data) return null;

  const { squadDetails, totalMembros } = data;

  const hasRoles = torre.responsavel_negocio || torre.head_tecnologia || torre.head_produto ||
    torre.gerente_produto || torre.gerente_design;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--primary-600)] shrink-0" />
            {torre.nome}
          </DialogTitle>
        </DialogHeader>

        {torre.bu_id && businessUnits.length > 0 && (
          <p className="text-xs text-muted-foreground -mt-3">
            BU: <span className="font-medium text-foreground">{businessUnits.find(b => b.id === torre.bu_id)?.nome ?? "—"}</span>
          </p>
        )}

        {torre.descricao && (
          <p className="text-sm text-muted-foreground -mt-2">{torre.descricao}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatMini value={squadDetails.length} label={`Squad${squadDetails.length !== 1 ? "s" : ""}`} icon={Network} />
          <StatMini value={totalMembros} label={`Colaborador${totalMembros !== 1 ? "es" : ""} únicos`} icon={Users} />
        </div>

        {/* Responsáveis */}
        {hasRoles && (
          <DetailSection icon={UserCircle} title="Responsáveis">
            <div className="space-y-1.5 rounded-lg border px-3 py-2 bg-muted/10">
              <RoleRow label="Responsável de Negócio" id={torre.responsavel_negocio} colaboradores={colaboradores} />
              <RoleRow label="Head de Tecnologia" id={torre.head_tecnologia} colaboradores={colaboradores} />
              <RoleRow label="Head de Produto" id={torre.head_produto} colaboradores={colaboradores} />
              <RoleRow label="Gerente de Produto" id={torre.gerente_produto} colaboradores={colaboradores} />
              <RoleRow label="Gerente de Design" id={torre.gerente_design} colaboradores={colaboradores} />
            </div>
          </DetailSection>
        )}

        {/* Squads */}
        <DetailSection icon={Network} title="Squads">
          {squadDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma squad nesta torre.</p>
          ) : (
            <div className="space-y-2">
              {squadDetails.map(({ squad, contrato, lider, membros }) => (
                <div key={squad.id} className="rounded-lg border bg-muted/10 px-3 py-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{squad.nome}</span>
                    <Badge variant="secondary">{membros.length} membro{membros.length !== 1 ? "s" : ""}</Badge>
                  </div>

                  {lider && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserCircle className="h-3 w-3 shrink-0" />
                      <span>Líder: <span className="text-foreground font-medium">{lider.nomeCompleto}</span></span>
                    </div>
                  )}

                  {contrato && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contrato.nome}</span>
                      <StatusBadge status={contrato.status} variant="contract" className="ml-auto shrink-0" />
                    </div>
                  )}

                  {membros.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {membros.map((m) => (
                        <span key={m.id} className="inline-flex items-center rounded-full bg-background border px-2 py-0.5 text-xs text-foreground">
                          {m.nomeCompleto.split(" ").slice(0, 2).join(" ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DetailSection>
      </DialogContent>
    </Dialog>
  );
}
