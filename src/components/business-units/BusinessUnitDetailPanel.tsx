import { useMemo } from "react";
import { Building2, Network, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type BusinessUnit } from "@/types/businessUnit";
import { type Torre, type Squad } from "@/types/torre";
import { type Colaborador } from "@/types/colaborador";

interface Props {
  bu: BusinessUnit | null;
  open: boolean;
  onClose: () => void;
  torres: Torre[];
  squads: Squad[];
  colaboradores: Colaborador[];
}

export function BusinessUnitDetailPanel({ bu, open, onClose, torres, squads, colaboradores }: Props) {
  const data = useMemo(() => {
    if (!bu) return null;

    const buTorres = torres.filter((t) => t.bu_id === bu.id);
    const buTorreIds = new Set(buTorres.map((t) => t.id));
    const buSquads = squads.filter((s) => buTorreIds.has(s.torre_id));
    const buSquadIds = new Set(buSquads.map((s) => s.id));

    // Deduplicar por id: responsáveis das torres, quem atua em squad/torre/BU
    const membrosMap = new Map<string, Colaborador>();

    // Responsáveis diretos de cada torre da BU
    for (const t of buTorres) {
      const roleIds = [
        t.responsavel_negocio,
        t.head_tecnologia,
        t.head_produto,
        t.gerente_produto,
        t.gerente_design,
      ].filter(Boolean) as string[];
      for (const rid of roleIds) {
        const pessoa = colaboradores.find((c) => c.id === rid);
        if (pessoa) membrosMap.set(pessoa.id, pessoa);
      }
    }

    for (const c of colaboradores) {
      const emSquad = (c.squad_ids ?? []).some((sid) => buSquadIds.has(sid));
      const emTorre = (c.torre_ids ?? []).some((tid) => buTorreIds.has(tid));
      const emBU = c.bu_id === bu.id;
      if (emSquad || emTorre || emBU) membrosMap.set(c.id, c);
    }

    return { buTorres, buSquads, totalColaboradores: membrosMap.size };
  }, [bu, torres, squads, colaboradores]);

  if (!bu || !data) return null;

  const { buTorres, buSquads, totalColaboradores } = data;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            {bu.nome}
          </DialogTitle>
        </DialogHeader>

        {bu.descricao && (
          <p className="text-sm text-muted-foreground -mt-2">{bu.descricao}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{buTorres.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Torre{buTorres.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{buSquads.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Squad{buSquads.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalColaboradores}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Colaborador{totalColaboradores !== 1 ? "es" : ""}</p>
          </div>
        </div>

        {/* Torres */}
        <Separator />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5" /> Torres
          </p>
          {buTorres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma torre vinculada a esta BU.</p>
          ) : (
            <div className="space-y-2">
              {buTorres.map((t) => {
                const torreSquads = squads.filter((s) => s.torre_id === t.id);
                return (
                  <div key={t.id} className="rounded-lg border bg-muted/10 px-3 py-2.5 flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{t.nome}</span>
                    <Badge variant="secondary">{torreSquads.length} squad{torreSquads.length !== 1 ? "s" : ""}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
