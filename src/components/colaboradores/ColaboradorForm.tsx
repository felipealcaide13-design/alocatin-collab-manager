import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SENIORIDADES, type Colaborador, type Senioridade } from "@/types/colaborador";
import { type Area as AreaEntity } from "@/types/area";
import { type Diretoria } from "@/types/diretoria";
import { type Torre } from "@/types/torre";
import { areaService } from "@/services/areaService";
import { especialidadeService } from "@/services/especialidadeService";
import { diretoriaService } from "@/services/diretoriaService";
import { torreService } from "@/services/torreService";
import { businessUnitService } from "@/services/businessUnitService";
import { colaboradorService } from "@/services/colaboradorService";
import { type BusinessUnit } from "@/types/businessUnit";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getCamadasPermitidas,
  validarCamadasPorSenioridade,
  type Camada,
} from "@/utils/senioridadeCamadas";

const schema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  documento: z.string().max(18).optional().or(z.literal("")),
  senioridade: z.enum([
    "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
    "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
  ]),
  diretoria_id: z.string().nullable().optional(),
  area_ids: z.array(z.string()).default([]),
  especialidade_id: z.string().nullable().optional(),
  squad_ids: z.array(z.string()).default([]),
  bu_id: z.string().nullable().optional(),
  torre_ids: z.array(z.string()).default([]),
  lider_id: z.string().nullable().optional(),
  status: z.enum(["Ativo", "Desligado"]),
  dataAdmissao: z.string().min(1, "Informe a data de admissão"),
});

type FormValues = z.infer<typeof schema>;

interface ColaboradorFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initialData?: Colaborador | null;
  isLoading?: boolean;
}

export function ColaboradorForm({ open, onClose, onSubmit, initialData, isLoading }: ColaboradorFormProps) {
  const isEdit = !!initialData;
  const isDesligado = initialData?.status === "Desligado";
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: "", email: "", documento: "",
      senioridade: "Analista pleno",
      diretoria_id: null, area_ids: [], especialidade_id: null, squad_ids: [],
      bu_id: null, torre_ids: [], lider_id: null,
      status: "Ativo",
      dataAdmissao: new Date().toISOString().split("T")[0],
    },
  });

  const senioridade = form.watch("senioridade");
  const diretoriaId = form.watch("diretoria_id");
  const areaIds = form.watch("area_ids");
  const buId = form.watch("bu_id");
  const torreIds = form.watch("torre_ids");

  // Ref para evitar que o effect de senioridade rode no reset inicial
  const isInitializing = useRef(false);

  // ── Derivações de visibilidade baseadas em camadas permitidas ──
  const camadasPermitidas = getCamadasPermitidas(senioridade);
  const showBU = camadasPermitidas.includes("BU");
  const showTorre = camadasPermitidas.includes("Torre");
  const showSquad = camadasPermitidas.includes("Squad");

  // Analistas e Staff: apenas Squad visível, Torre derivada automaticamente
  const isApenasSquad = showSquad && !showTorre;

  // Manter lógica de área/especialidade baseada em grupos de senioridade
  const isGestor = ["Head", "Gerente", "Coordenador(a)"].includes(senioridade);
  const isIC = ["Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior"].includes(senioridade);
  const showArea = isGestor || isIC;
  const showEspecialidade = isIC;
  const multiArea = isGestor;

  // ── Queries ──────────────────────────────────────────────
  const { data: diretorias = [] } = useQuery({
    queryKey: ["diretorias"],
    queryFn: () => diretoriaService.getAll().catch(() => []),
  });

  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas-all"],
    queryFn: () => areaService.getAll().catch(() => []),
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["business-units"],
    queryFn: () => businessUnitService.getAll().catch(() => []),
  });

  const { data: torres = [] } = useQuery({
    queryKey: ["torres-all"],
    queryFn: () => torreService.getAllTorres().catch(() => []),
  });

  // Filtra áreas pela diretoria selecionada
  const areasDaDiretoria = diretoriaId
    ? allAreas.filter((a: AreaEntity) => a.diretoria_id === diretoriaId)
    : allAreas;

  // Para IC: especialidades da única área selecionada
  const singleAreaId = isIC && areaIds.length === 1 ? areaIds[0] : undefined;
  const { data: especialidades = [] } = useQuery({
    queryKey: ["especialidades-by-area", singleAreaId],
    queryFn: () => singleAreaId ? especialidadeService.getByArea(singleAreaId).catch(() => []) : Promise.resolve([]),
    enabled: !!singleAreaId,
  });

  const { data: squads = [] } = useQuery({
    queryKey: ["squads-all"],
    queryFn: () => torreService.getAllSquads().catch(() => []),
  });

  // Squads filtradas pelas torres selecionadas (quando Torre é visível)
  // Para analistas/staff (isApenasSquad) ou sem torre selecionada: todas as squads
  const squadsDisponiveis = useMemo(() => {
    if (isApenasSquad || torreIds.length === 0) return squads;
    return squads.filter((s) => torreIds.includes(s.torre_id));
  }, [squads, torreIds, isApenasSquad]);

  // Torres filtradas pela BU selecionada (quando BU visível e selecionada)
  const torresDisponiveis = useMemo(() => {
    if (!showBU || !buId) return torres;
    return torres.filter((t: Torre) => t.bu_id === buId);
  }, [torres, buId, showBU]);

  // Todos colaboradores ativos para o select de líder
  const { data: todosColaboradores = [] } = useQuery({
    queryKey: ["colaboradores-all"],
    queryFn: () => colaboradorService.getAll().catch(() => []),
  });

  // ── Candidatos a líder: cargo acima + mesma área (ou mesma diretoria) ──
  const liderCandidatos = useMemo(() => {
    const SENIORITY_ORDER: Senioridade[] = [
      "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
      "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
    ];
    const myIdx = SENIORITY_ORDER.indexOf(senioridade);
    if (myIdx <= 0) return []; // C-level não tem líder

    // Senioridades acima (índice menor)
    const senioridadesAcima = SENIORITY_ORDER.slice(0, myIdx);

    return todosColaboradores.filter((c) => {
      if (c.status !== "Ativo") return false;
      if (initialData && c.id === initialData.id) return false; // não pode ser líder de si mesmo
      if (!senioridadesAcima.includes(c.senioridade)) return false;

      // Precisa ter ao menos uma área em comum (se o colaborador já tem áreas selecionadas)
      const minhasAreas = form.getValues("area_ids");
      if (minhasAreas.length > 0 && c.area_ids.length > 0) {
        return minhasAreas.some((a) => c.area_ids.includes(a));
      }
      // Se ainda não selecionou área, filtra só por diretoria
      const minhaDiretoria = form.getValues("diretoria_id");
      if (minhaDiretoria && c.diretoria_id) {
        return c.diretoria_id === minhaDiretoria;
      }
      // Sem área nem diretoria: mostra todos acima
      return true;
    });
  }, [senioridade, areaIds, diretoriaId, todosColaboradores, initialData]);

  // ── Alerta de inconsistência ao abrir em modo edição ─────
  const inconsistenciaMsg = useMemo(() => {
    if (!isEdit || !initialData) return null;

    // Derivar camadas ativas do colaborador a partir dos dados existentes
    const camadasAtivas: Camada[] = [];
    if ((initialData as any).bu_id) camadasAtivas.push("BU");
    if (initialData.torre_ids && initialData.torre_ids.length > 0) camadasAtivas.push("Torre");
    if (initialData.squad_ids && initialData.squad_ids.length > 0) camadasAtivas.push("Squad");

    if (camadasAtivas.length === 0) return null;

    const resultado = validarCamadasPorSenioridade(initialData.senioridade, camadasAtivas);
    return resultado.valido ? null : resultado.mensagem ?? null;
  }, [isEdit, initialData]);

  // ── Reset ao abrir ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    isInitializing.current = true;
    if (initialData) {
      form.reset({
        nomeCompleto: initialData.nomeCompleto,
        email: initialData.email ?? "",
        documento: initialData.documento ?? "",
        senioridade: initialData.senioridade,
        diretoria_id: initialData.diretoria_id ?? null,
        area_ids: initialData.area_ids ?? [],
        especialidade_id: initialData.especialidade_id ?? null,
        squad_ids: initialData.squad_ids ?? [],
        bu_id: initialData.bu_id ?? null,
        torre_ids: initialData.torre_ids ?? [],
        lider_id: initialData.lider_id ?? null,
        status: initialData.status,
        dataAdmissao: initialData.dataAdmissao,
      });
    } else {
      form.reset({
        nomeCompleto: "", email: "", documento: "",
        senioridade: "Analista pleno",
        diretoria_id: null, area_ids: [], especialidade_id: null, squad_ids: [],
        bu_id: null, torre_ids: [], lider_id: null,
        status: "Ativo",
        dataAdmissao: new Date().toISOString().split("T")[0],
      });
    }
    // Libera o flag após o ciclo de render
    setTimeout(() => { isInitializing.current = false; }, 0);
  }, [open, initialData]);

  // Reset campos de camadas quando senioridade muda (não roda no reset inicial)
  useEffect(() => {
    if (isInitializing.current) return;
    const permitidas = getCamadasPermitidas(senioridade);
    if (!permitidas.includes("BU")) form.setValue("bu_id", null);
    if (!permitidas.includes("Torre")) form.setValue("torre_ids", []);
    if (!permitidas.includes("Squad")) form.setValue("squad_ids", []);
    // Limpar área/especialidade/líder também
    form.setValue("area_ids", []);
    form.setValue("especialidade_id", null);
    form.setValue("lider_id", null);
  }, [senioridade]);

  // Reset especialidade quando área muda (IC)
  useEffect(() => {
    if (isIC) form.setValue("especialidade_id", null);
  }, [areaIds.join(",")]);

  // Reset torre e squad quando BU muda (não roda no reset inicial)
  useEffect(() => {
    if (isInitializing.current) return;
    form.setValue("torre_ids", []);
    form.setValue("squad_ids", []);
  }, [buId]);

  // ── Helpers para multi-select ─────────────────────────────
  const toggleArea = (id: string) => {
    const current = form.getValues("area_ids");
    if (multiArea) {
      form.setValue("area_ids", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    } else {
      form.setValue("area_ids", current[0] === id ? [] : [id]);
    }
  };

  const toggleSquad = (id: string) => {
    const current = form.getValues("squad_ids");
    form.setValue("squad_ids", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const toggleTorre = (id: string) => {
    const current = form.getValues("torre_ids");
    form.setValue("torre_ids", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    // Para analistas/staff (só Squad): derivar torre_ids automaticamente das squads selecionadas
    if (isApenasSquad && values.squad_ids.length > 0) {
      const torresDerivadas = [
        ...new Set(
          values.squad_ids
            .map((sid) => squads.find((s) => s.id === sid)?.torre_id)
            .filter(Boolean) as string[]
        ),
      ];
      values.torre_ids = torresDerivadas;
    }

    // Derivar camadas ativas para validação
    const camadasSelecionadas: Camada[] = [];
    if (values.bu_id) camadasSelecionadas.push("BU");
    if (values.torre_ids && values.torre_ids.length > 0) camadasSelecionadas.push("Torre");
    if (values.squad_ids && values.squad_ids.length > 0) camadasSelecionadas.push("Squad");

    if (camadasSelecionadas.length > 0) {
      const resultado = validarCamadasPorSenioridade(values.senioridade, camadasSelecionadas);
      if (!resultado.valido) {
        toast({
          variant: "destructive",
          title: "Alocação inválida",
          description: resultado.mensagem,
        });
        return;
      }
    }

    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>

        {/* ── Alerta de inconsistência (modo edição) ── */}
        {inconsistenciaMsg && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="ml-6">
              <strong>Inconsistência detectada:</strong> {inconsistenciaMsg}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Bloco 1: Identificação ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="nomeCompleto" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl><Input {...field} placeholder="Ex: João Silva" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="joao@empresa.com" disabled={isDesligado} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="documento" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl><Input {...field} placeholder="000.000.000-00" disabled={isDesligado} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ══ GRUPO 1: Cargo e Estrutura Organizacional ══ */}
            <FormField control={form.control} name="senioridade" render={({ field }) => (
              <FormItem>
                <FormLabel>Senioridade *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isDesligado}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SENIORIDADES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {senioridade && (
              <FormField control={form.control} name="diretoria_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Diretoria</FormLabel>
                  <Select
                    onValueChange={(v) => { field.onChange(v === "nenhuma" ? null : v); form.setValue("area_ids", []); }}
                    value={field.value ?? ""}
                    disabled={isDesligado}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                      {diretorias.map((d: Diretoria) => (
                        <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {showArea && (
              <FormField control={form.control} name="area_ids" render={() => (
                <FormItem>
                  <FormLabel>
                    {multiArea ? "Áreas" : "Área"}
                    {multiArea && <span className="text-xs text-muted-foreground ml-1">(pode selecionar mais de uma)</span>}
                  </FormLabel>
                  {areaIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {areaIds.map((id) => {
                        const area = allAreas.find((a: AreaEntity) => a.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 pr-1">
                            {area?.nome ?? id}
                            <button type="button" onClick={() => toggleArea(id)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <Select onValueChange={(v) => toggleArea(v)} value="" disabled={isDesligado}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {areasDaDiretoria
                        .filter((a: AreaEntity) => !areaIds.includes(a.id))
                        .map((a: AreaEntity) => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {showEspecialidade && singleAreaId && especialidades.length > 0 && (
              <FormField control={form.control} name="especialidade_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "nenhuma" ? null : v)}
                    value={field.value ?? ""}
                    disabled={isDesligado}
                  >
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                      {especialidades.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {senioridade !== "C-level" && (
              <FormField control={form.control} name="lider_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Líder direto
                    <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "nenhum" ? null : v)}
                    value={field.value ?? ""}
                    disabled={isDesligado}
                  >
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {liderCandidatos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nomeCompleto}
                          <span className="text-muted-foreground ml-1 text-xs">({c.senioridade})</span>
                        </SelectItem>
                      ))}
                      {liderCandidatos.length === 0 && (
                        <SelectItem value="nenhum" disabled>Nenhum candidato encontrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* ══ GRUPO 2: Alocação (BU → Torre → Squad) ══ */}
            {(showBU || showTorre || showSquad) && (
              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Alocação</p>

                {showBU && (
                  <FormField control={form.control} name="bu_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Unit</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "nenhuma" ? null : v)}
                        value={field.value ?? ""}
                        disabled={isDesligado}
                      >
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="nenhuma">Nenhuma</SelectItem>
                          {businessUnits.map((bu: BusinessUnit) => (
                            <SelectItem key={bu.id} value={bu.id}>{bu.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {showTorre && (
                  <FormField control={form.control} name="torre_ids" render={() => (
                    <FormItem>
                      <FormLabel>
                        Torre
                        <span className="text-xs text-muted-foreground ml-1">(pode selecionar mais de uma)</span>
                      </FormLabel>
                      {form.watch("torre_ids").length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {form.watch("torre_ids").map((id) => {
                            const torre = torres.find((t: Torre) => t.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                                {torre?.nome ?? id}
                                <button type="button" onClick={() => toggleTorre(id)} className="hover:text-destructive">
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <Select onValueChange={(v) => toggleTorre(v)} value="" disabled={isDesligado}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {torresDisponiveis
                            .filter((t: Torre) => !form.watch("torre_ids").includes(t.id))
                            .map((t: Torre) => (
                              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {showSquad && (
                  <FormField control={form.control} name="squad_ids" render={() => (
                    <FormItem>
                      <FormLabel>
                        Squad
                        {isApenasSquad
                          ? <span className="text-xs text-muted-foreground ml-1">(opcional, pode selecionar mais de uma)</span>
                          : <span className="text-xs text-muted-foreground ml-1">(opcional — vazio = todas as squads das torres)</span>
                        }
                      </FormLabel>
                      {form.watch("squad_ids").length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {form.watch("squad_ids").map((id) => {
                            const squad = squads.find((s) => s.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                                {squad?.nome ?? id}
                                <button type="button" onClick={() => toggleSquad(id)} className="hover:text-destructive">
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <Select
                        onValueChange={(v) => toggleSquad(v)}
                        value=""
                        disabled={isDesligado || (showTorre && torreIds.length === 0)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={showTorre && torreIds.length === 0 ? "Selecione uma Torre primeiro" : undefined} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {squadsDisponiveis
                            .filter((s) => !form.watch("squad_ids").includes(s.id))
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            )}

            {/* ── Bloco 9: Status e Data ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Desligado">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dataAdmissao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Admissão *</FormLabel>
                  <FormControl><Input {...field} type="date" disabled={isDesligado} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {isDesligado && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                ⚠️ Colaborador desligado — apenas nome e status podem ser editados.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
