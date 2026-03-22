import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DetailSection } from "@/components/ui/detail-section";
import { historicoService } from "@/services/historicoService";
import { ROTULOS_CAMPOS, type EventoAlteracao, type CampoRastreavel } from "@/types/historico";
import type { Torre, Squad } from "@/types/torre";
import type { Diretoria } from "@/types/diretoria";
import type { BusinessUnit } from "@/types/businessUnit";

interface Props {
  colaboradorId: string;
  torres: Torre[];
  squads: Squad[];
  diretorias: Diretoria[];
  businessUnits: BusinessUnit[];
}

export function resolverValorCampo(
  campo: CampoRastreavel,
  valor: string | null,
  torres: Torre[],
  squads: Squad[],
  diretorias: Diretoria[],
  businessUnits: BusinessUnit[]
): string {
  if (valor === null || valor === undefined) return "—";

  if (campo === "torre_ids" || campo === "squad_ids") {
    let ids: string[];
    try {
      ids = JSON.parse(valor);
    } catch {
      return valor;
    }
    if (!Array.isArray(ids) || ids.length === 0) return "—";
    const lista = campo === "torre_ids" ? torres : squads;
    return ids
      .map((id) => lista.find((item) => item.id === id)?.nome ?? id)
      .join(", ");
  }

  if (campo === "diretoria_id") {
    return diretorias.find((d) => d.id === valor)?.nome ?? valor;
  }

  if (campo === "bu_id") {
    return businessUnits.find((b) => b.id === valor)?.nome ?? valor;
  }

  return valor;
}

function SkeletonRow() {
  return (
    <div className="rounded-lg border px-3 py-2 bg-muted/20 space-y-1.5 animate-pulse">
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="h-3 w-2/3 bg-muted rounded" />
    </div>
  );
}

export function HistoricoAlteracoes({
  colaboradorId,
  torres,
  squads,
  diretorias,
  businessUnits,
}: Props) {
  const { data: eventos = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ["historico", colaboradorId],
    queryFn: () => historicoService.getByColaborador(colaboradorId),
    enabled: !!colaboradorId,
  });

  return (
    <DetailSection icon={History} title="Histórico de Alterações">
      {loading ? (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico.</p>
      ) : eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {eventos.map((evento) => {
            const rotulo = ROTULOS_CAMPOS[evento.campo];
            const anterior = resolverValorCampo(evento.campo, evento.valor_anterior, torres, squads, diretorias, businessUnits);
            const novo = resolverValorCampo(evento.campo, evento.novo_valor, torres, squads, diretorias, businessUnits);
            const dataHora = new Date(evento.alterado_em).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            });
            const exibirAutor =
              evento.autor_alteracao && evento.autor_alteracao !== "sistema";

            return (
              <div
                key={evento.id}
                className="rounded-lg border px-3 py-2 bg-muted/20 space-y-0.5"
              >
                <p className="text-xs font-semibold text-foreground">{rotulo}</p>
                <p className="text-sm text-muted-foreground">
                  <span>{anterior}</span>
                  <span className="mx-1.5 text-muted-foreground/60">→</span>
                  <span className="text-foreground font-medium">{novo}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-0.5">
                  <span>{dataHora}</span>
                  {exibirAutor && (
                    <>
                      <span>·</span>
                      <span>{evento.autor_alteracao}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DetailSection>
  );
}
