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

/** Extrai nome legível de um item do histórico — suporta formato legado (só ID) e novo ({id, nome}) */
function resolverItem(
  raw: unknown,
  lista: { id: string; nome: string }[]
): string {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { id?: string; nome?: string };
    if (obj.nome) return obj.nome;
    if (obj.id) {
      const found = lista.find((x) => x.id === obj.id);
      return found ? found.nome : `${obj.id.slice(0, 8)}… (removido)`;
    }
  }
  if (typeof raw === "string") {
    const found = lista.find((x) => x.id === raw);
    return found ? found.nome : `${raw.slice(0, 8)}… (removido)`;
  }
  return "—";
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
    let parsed: unknown[];
    try {
      parsed = JSON.parse(valor);
    } catch {
      return valor;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return "—";
    const lista = campo === "torre_ids" ? torres : squads;
    return parsed.map((item) => resolverItem(item, lista)).join(", ");
  }

  if (campo === "bu_id") {
    // Novo formato: JSON {id, nome}
    try {
      const obj = JSON.parse(valor) as { id?: string; nome?: string };
      if (obj.nome) return obj.nome;
      if (obj.id) {
        const found = businessUnits.find((b) => b.id === obj.id);
        return found ? found.nome : `${obj.nome ?? obj.id} (removido)`;
      }
    } catch {
      // Formato legado: só o ID
    }
    const found = businessUnits.find((b) => b.id === valor);
    return found ? found.nome : "(removido)";
  }

  if (campo === "diretoria_id") {
    try {
      const obj = JSON.parse(valor) as { id?: string; nome?: string };
      if (obj.nome) return obj.nome;
      if (obj.id) {
        const found = diretorias.find((d) => d.id === obj.id);
        return found ? found.nome : `${obj.nome ?? obj.id} (removido)`;
      }
    } catch {
      // Formato legado
    }
    const found = diretorias.find((d) => d.id === valor);
    return found ? found.nome : "(removido)";
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
            const dataHora = new Date(evento.alterado_em).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            });
            const exibirAutor =
              evento.autor_alteracao && evento.autor_alteracao !== "sistema";

            if (evento.campo === "cadastro") {
              return (
                <div
                  key={evento.id}
                  className="rounded-lg border px-3 py-2 bg-green-50 border-green-200 space-y-0.5"
                >
                  <p className="text-xs font-semibold text-green-700">{rotulo}</p>
                  <p className="text-sm text-green-800 font-medium">{evento.novo_valor}</p>
                  <div className="flex items-center gap-2 text-xs text-green-600/80 pt-0.5">
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
            }

            const anterior = resolverValorCampo(evento.campo, evento.valor_anterior, torres, squads, diretorias, businessUnits);
            const novo = resolverValorCampo(evento.campo, evento.novo_valor, torres, squads, diretorias, businessUnits);

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
