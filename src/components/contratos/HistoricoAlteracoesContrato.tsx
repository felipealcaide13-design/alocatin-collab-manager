import { useQuery } from "@tanstack/react-query";
import { historicoContratoService } from "@/services/historicoContratoService";
import { ROTULOS_CAMPOS_CONTRATO, type EventoAlteracaoContrato, type CampoRastreavelContrato } from "@/types/historicoContrato";
import type { Torre, Squad } from "@/types/torre";

interface Props {
  contratoId: string;
  torres: Torre[];
  squads: Squad[];
}

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

export function resolverValorCampoContrato(
  campo: CampoRastreavelContrato,
  valor: string | null,
  torres: Torre[],
  squads: Squad[]
): string {
  if (valor === null || valor === undefined) return "—";

  if (campo === "torres" || campo === "squads_ids") {
    let parsed: unknown[];
    try {
      parsed = JSON.parse(valor);
    } catch {
      return valor;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return "—";
    const lista = campo === "torres" ? torres : squads;
    return parsed.map((item) => resolverItem(item, lista)).join(", ");
  }

  if (campo === "valor") {
    const numero = Number(valor);
    if (!isNaN(numero)) {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numero);
    }
  }

  return valor;
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-transparent p-4 bg-muted flex flex-col gap-2 animate-pulse w-full">
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="h-3 w-2/3 bg-muted rounded" />
    </div>
  );
}

export function HistoricoAlteracoesContrato({
  contratoId,
  torres,
  squads,
}: Props) {
  const { data: eventos = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ["historico_contratos", contratoId],
    queryFn: () => historicoContratoService.getByContrato(contratoId),
    enabled: !!contratoId,
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-[#262626] text-sm font-semibold">Histórico de alterações</p>
      
      {loading ? (
        <div className="flex flex-col gap-2 w-full">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground p-4 bg-muted rounded-xl">Não foi possível carregar o histórico.</p>
      ) : eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 bg-muted rounded-xl">Nenhuma alteração registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-2 w-full max-h-[400px] overflow-y-auto pr-2">
          {eventos.map((evento) => {
            const rotulo = ROTULOS_CAMPOS_CONTRATO[evento.campo];
            const dataHora = new Date(evento.alterado_em).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
            const exibirAutor =
              evento.autor_alteracao && evento.autor_alteracao !== "sistema";

            if (evento.campo === "cadastro") {
              return (
                <div
                  key={evento.id}
                  className="bg-[#f0fdf4] flex items-start justify-between p-4 rounded-xl w-full"
                >
                  <div className="flex flex-col min-w-0 pr-4">
                    <p className="text-xs font-semibold text-[#15803d]">Cadastro</p>
                    <p className="text-sm font-medium text-[#262626] mt-1 break-words">{evento.novo_valor}</p>
                    {exibirAutor && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">Autor: {evento.autor_alteracao}</p>
                    )}
                  </div>
                  <span className="text-[#262626] text-xs pt-1 shrink-0">{dataHora}</span>
                </div>
              );
            }

            const anterior = resolverValorCampoContrato(evento.campo, evento.valor_anterior, torres, squads);
            const novo = resolverValorCampoContrato(evento.campo, evento.novo_valor, torres, squads);

            return (
              <div
                key={evento.id}
                className="bg-muted flex items-start justify-between p-4 rounded-xl w-full border border-gray-100 dark:border-gray-800"
              >
                <div className="flex flex-col min-w-0 pr-4">
                  <p className="text-xs font-semibold text-[#262626] dark:text-gray-200">{rotulo}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[#737373] text-sm break-all">{anterior}</span>
                    <span className="text-[#737373]/60">→</span>
                    <span className="font-medium text-[#262626] dark:text-gray-100 text-sm break-all">{novo}</span>
                  </div>
                  {exibirAutor && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Alterado por: {evento.autor_alteracao}</p>
                  )}
                </div>
                <span className="text-muted-foreground text-xs pt-1 shrink-0">{dataHora}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
