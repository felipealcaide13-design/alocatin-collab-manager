import { Building2, Network } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type BusinessUnit } from "@/types/businessUnit";
import { type Torre, type Squad } from "@/types/torre";

interface Props {
  bu: BusinessUnit | null;
  open: boolean;
  onClose: () => void;
  torres: Torre[];
  squads: Squad[];
}

export function BusinessUnitDetailPanel({ bu, open, onClose, torres, squads }: Props) {
  if (!bu) return null;

  const buTorres = torres.filter((t) => t.bu_id === bu.id);
  const totalSquads = squads.filter((s) => buTorres.some((t) => t.id === s.torre_id)).length;

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
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{buTorres.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Torre{buTorres.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalSquads}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Squad{totalSquads !== 1 ? "s" : ""}</p>
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
