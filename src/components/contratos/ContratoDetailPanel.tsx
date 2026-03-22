import { useMemo } from "react";
import { FileText, Building2, Calendar, DollarSign, Layers, Network } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DetailSection, StatMini } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Contrato } from "@/types/contrato";
import { type Torre, type Squad } from "@/types/torre";

interface Props {
  contrato: Contrato | null;
  open: boolean;
  onClose: () => void;
  torres: Torre[];
  squads: Squad[];
}

const formatCurrency = (val: number | null) => {
  if (val == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

export function ContratoDetailPanel({ contrato, open, onClose, torres, squads }: Props) {
  const data = useMemo(() => {
    if (!contrato) return null;

    const torresVinculadas = torres.filter((t) =>
      contrato.torres?.includes(t.id)
    );

    // Se há squads_ids específicas, mostrar só elas; senão, todas as squads das torres vinculadas
    const specificIds = contrato.squads_ids ?? [];
    const squadsVinculadas = specificIds.length > 0
      ? squads.filter((s) => specificIds.includes(s.id))
      : squads.filter((s) => s.contrato_id === contrato.id);

    return { torresVinculadas, squadsVinculadas };
  }, [contrato, torres, squads]);

  if (!contrato || !data) return null;

  const { torresVinculadas, squadsVinculadas } = data;

  const duracao = (() => {
    if (!contrato.data_inicio) return null;
    const inicio = new Date(contrato.data_inicio);
    const fim = contrato.data_fim ? new Date(contrato.data_fim) : new Date();
    const meses =
      (fim.getFullYear() - inicio.getFullYear()) * 12 +
      (fim.getMonth() - inicio.getMonth());
    return meses > 0 ? `${meses} mês${meses !== 1 ? "es" : ""}` : null;
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--primary-600)] shrink-0" />
            {contrato.nome}
          </DialogTitle>
        </DialogHeader>

        {/* Status + Cliente */}
        <div className="flex items-center gap-2 -mt-2 flex-wrap">
          <StatusBadge status={contrato.status} variant="contract" />
          {contrato.contract_type && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[var(--color-info-subtle)] text-[var(--color-info)]">
              {contrato.contract_type}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{contrato.cliente}</span>
        </div>

        {contrato.descricao && (
          <p className="text-sm text-muted-foreground">{contrato.descricao}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatMini
            icon={DollarSign}
            value={formatCurrency(contrato.valor ?? contrato.valor_total)}
            label={contrato.contract_type === "Aberto" ? "Valor Mensal" : "Valor Total"}
          />
          <StatMini
            value={duracao ?? "—"}
            label="Duração"
          />
        </div>

        {/* Período */}
        <DetailSection icon={Calendar} title="Período">
          <div className="grid grid-cols-2 gap-3 rounded-lg border px-3 py-2.5 bg-muted/10">
            <div>
              <p className="text-xs text-muted-foreground">Início</p>
              <p className="text-sm font-medium">{formatDate(contrato.data_inicio)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fim</p>
              <p className="text-sm font-medium">{formatDate(contrato.data_fim)}</p>
            </div>
          </div>
        </DetailSection>

        {/* Torres vinculadas */}
        {torresVinculadas.length > 0 && (
          <DetailSection icon={Building2} title={`Torres (${torresVinculadas.length})`}>
            <div className="space-y-1.5">
              {torresVinculadas.map((t) => {
                const squadsDaTorre = squadsVinculadas.filter((s) => s.torre_id === t.id);
                return (
                  <div key={t.id} className="rounded-lg border bg-muted/10 px-3 py-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-[var(--primary-600)] shrink-0" />
                      <span className="text-sm font-medium">{t.nome}</span>
                    </div>
                    {squadsDaTorre.length > 0 && (
                      <div className="pl-5 space-y-1">
                        {squadsDaTorre.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Layers className="h-3 w-3 shrink-0" />
                              <span className="text-foreground">{s.nome}</span>
                            </div>
                            {s.membros && s.membros.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {s.membros.length} membro{s.membros.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DetailSection>
        )}

        {/* Squads sem torre vinculada (edge case) */}
        {squadsVinculadas.filter((s) => !torresVinculadas.find((t) => t.id === s.torre_id)).length > 0 && (
          <DetailSection icon={Network} title="Squads">
            <div className="space-y-1.5">
              {squadsVinculadas
                .filter((s) => !torresVinculadas.find((t) => t.id === s.torre_id))
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-sm font-medium">{s.nome}</span>
                    </div>
                    {s.membros && s.membros.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {s.membros.length} membro{s.membros.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </DetailSection>
        )}
      </DialogContent>
    </Dialog>
  );
}
