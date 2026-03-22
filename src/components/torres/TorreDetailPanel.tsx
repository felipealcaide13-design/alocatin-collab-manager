import { useMemo } from "react";
import { Building2, Users, Network, Briefcase, UserCircle, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DetailSection, StatMini } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Torre, type Squad } from "@/types/torre";
import { type Colaborador } from "@/types/colaborador";
import { type Contrato } from "@/types/contrato";
import { type BusinessUnit } from "@/types/businessUnit";

const SENIORIDADES_LIDERANCA = ["Head", "Gerente", "Coordenador(a)"] as const;

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
    const torreSquadIds = new Set(torreSquads.map((s) => s.id));

    // Colaboradores desta torre: quem tem squad_ids com alguma squad da torre,
    // torre_ids com esta torre, ou é responsável/head/gerente da torre — deduplicados por id
    const membrosNaTorreMap = new Map<string, Colaborador>();

    // Adiciona responsáveis diretos da torre (campos de role)
    const roleIds = [
      torre.responsavel_negocio,
      torre.head_tecnologia,
      torre.head_produto,
      torre.gerente_produto,
      torre.gerente_design,
    ].filter(Boolean) as string[];
    for (const rid of roleIds) {
      const pessoa = colaboradores.find((c) => c.id === rid);
      if (pessoa) membrosNaTorreMap.set(pessoa.id, pessoa);
    }

    for (const c of colaboradores) {
      const emSquadDaTorre = (c.squad_ids ?? []).some((sid) => torreSquadIds.has(sid));
      const emTorreDireta = (c.torre_ids ?? []).includes(torre.id);
      if (emSquadDaTorre || emTorreDireta) {
        membrosNaTorreMap.set(c.id, c);
      }
    }
    const membrosNaTorre = Array.from(membrosNaTorreMap.values());
    const totalMembros = membrosNaTorre.length;

    // Líderes: Coordenador(a), Gerente, Head que cobrem TODAS as squads da torre
    // (aparecem uma vez como liderança, não por squad)
    const liderancaTorre: Colaborador[] = [];
    const membrosRegulares: Colaborador[] = [];

    for (const c of membrosNaTorre) {
      const isLideranca = (SENIORIDADES_LIDERANCA as readonly string[]).includes(c.senioridade);
      if (isLideranca && torreSquads.length > 0) {
        const squadsDoPessoa = (c.squad_ids ?? []).filter((sid) => torreSquadIds.has(sid));
        const cobreTodasSquads = torreSquads.every((sq) => squadsDoPessoa.includes(sq.id));
        if (cobreTodasSquads) {
          liderancaTorre.push(c);
          continue;
        }
      }
      membrosRegulares.push(c);
    }

    // Squads com membros derivados de colaborador.squad_ids
    const squadDetails = torreSquads.map((sq) => {
      const contrato = sq.contrato_id ? contratos.find((c) => c.id === sq.contrato_id) : null;
      const lider = sq.lider ? colaboradores.find((c) => c.id === sq.lider) : null;
      const liderancaIds = new Set(liderancaTorre.map((l) => l.id));
      // Todos os membros da squad, separados em líderes da torre e regulares
      const todosMembrosDaSquad = colaboradores.filter((c) => (c.squad_ids ?? []).includes(sq.id));
      const lideresNaSquad = todosMembrosDaSquad.filter((c) => liderancaIds.has(c.id));
      const membrosRegularesDaSquad = todosMembrosDaSquad.filter((c) => !liderancaIds.has(c.id));
      return { squad: sq, contrato, lider, lideresNaSquad, membros: membrosRegularesDaSquad };
    });

    return { torreSquads, squadDetails, totalMembros, liderancaTorre, membrosRegulares };
  }, [torre, squads, colaboradores, contratos]);

  if (!torre || !data) return null;

  const { squadDetails, totalMembros, liderancaTorre } = data;

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

        {/* Liderança da Torre */}
        {liderancaTorre.length > 0 && (
          <DetailSection icon={Crown} title="Liderança da Torre">
            <div className="space-y-1.5">
              {liderancaTorre.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] text-xs font-bold shrink-0">
                      {l.nomeCompleto.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">{l.nomeCompleto}</span>
                  </div>
                  <StatusBadge status={l.senioridade} variant="seniority" className="ml-2 shrink-0" />
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        <Separator />

        {/* Squads com membros */}
        <DetailSection icon={Network} title="Squads e Colaboradores">
          {squadDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma squad nesta torre.</p>
          ) : (
            <div className="space-y-3">
              {squadDetails.map(({ squad, contrato, lider, lideresNaSquad, membros }) => (
                <div key={squad.id} className="rounded-lg border bg-muted/10 px-3 py-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{squad.nome}</span>
                    <Badge variant="secondary">{membros.length + lideresNaSquad.length} membro{(membros.length + lideresNaSquad.length) !== 1 ? "s" : ""}</Badge>
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

                  {(lideresNaSquad.length > 0 || membros.length > 0) && (
                    <div className="space-y-1 pt-0.5">
                      {lideresNaSquad.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="text-foreground truncate font-medium">{l.nomeCompleto}</span>
                          </div>
                          <StatusBadge status={l.senioridade} variant="seniority" className="ml-2 shrink-0" />
                        </div>
                      ))}
                      {membros.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs">
                          <span className="text-foreground truncate">{m.nomeCompleto}</span>
                          <StatusBadge status={m.senioridade} variant="seniority" className="ml-2 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {membros.length === 0 && lideresNaSquad.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum membro alocado.</p>
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
