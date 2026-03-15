import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { X } from "lucide-react";
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
import { SENIORIDADES, SENIORIDADE_GRUPOS, type Colaborador } from "@/types/colaborador";
import { type Area as AreaEntity } from "@/types/area";
import { type Diretoria } from "@/types/diretoria";
import { areaService } from "@/services/areaService";
import { especialidadeService } from "@/services/especialidadeService";
import { diretoriaService } from "@/services/diretoriaService";
import { torreService } from "@/services/torreService";
import { useQuery } from "@tanstack/react-query";

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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: "", email: "", documento: "",
      senioridade: "Analista pleno",
      diretoria_id: null, area_ids: [], especialidade_id: null, squad_ids: [],
      status: "Ativo",
      dataAdmissao: new Date().toISOString().split("T")[0],
    },
  });

  const senioridade = form.watch("senioridade");
  const diretoriaId = form.watch("diretoria_id");
  const areaIds = form.watch("area_ids");

  const isGestor = SENIORIDADE_GRUPOS.gestor.includes(senioridade as any);
  const isIC = SENIORIDADE_GRUPOS.ic.includes(senioridade as any);
  const showSquad = isGestor || isIC;
  const showArea = isGestor || isIC;
  const showEspecialidade = isIC;
  const multiArea = isGestor; // gestores podem ter N áreas; ICs apenas 1

  // ── Queries ──────────────────────────────────────────────
  const { data: diretorias = [] } = useQuery({
    queryKey: ["diretorias"],
    queryFn: () => diretoriaService.getAll().catch(() => []),
  });

  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas-all"],
    queryFn: () => areaService.getAll().catch(() => []),
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

  // ── Reset ao abrir ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
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
        status: initialData.status,
        dataAdmissao: initialData.dataAdmissao,
      });
    } else {
      form.reset({
        nomeCompleto: "", email: "", documento: "",
        senioridade: "Analista pleno",
        diretoria_id: null, area_ids: [], especialidade_id: null, squad_ids: [],
        status: "Ativo",
        dataAdmissao: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, initialData]);

  // Reset campos dependentes quando senioridade muda
  useEffect(() => {
    form.setValue("area_ids", []);
    form.setValue("especialidade_id", null);
    form.setValue("squad_ids", []);
  }, [senioridade]);

  // Reset especialidade quando área muda (IC)
  useEffect(() => {
    if (isIC) form.setValue("especialidade_id", null);
  }, [areaIds.join(",")]);

  // ── Helpers para multi-select ─────────────────────────────
  const toggleArea = (id: string) => {
    const current = form.getValues("area_ids");
    if (multiArea) {
      form.setValue("area_ids", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    } else {
      form.setValue("area_ids", current[0] === id ? [] : [id]);
    }
  };

  const toggleSquad = (nome: string) => {
    const current = form.getValues("squad_ids");
    form.setValue("squad_ids", current.includes(nome) ? current.filter((x) => x !== nome) : [...current, nome]);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>

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

            {/* ── Bloco 2: Senioridade (define o fluxo) ── */}
            <FormField control={form.control} name="senioridade" render={({ field }) => (
              <FormItem>
                <FormLabel>Senioridade *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isDesligado}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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

            {/* ── Bloco 3: Diretoria (todos exceto sem senioridade) ── */}
            {senioridade && (
              <FormField control={form.control} name="diretoria_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Diretoria</FormLabel>
                  <Select
                    onValueChange={(v) => { field.onChange(v === "nenhuma" ? null : v); form.setValue("area_ids", []); }}
                    value={field.value ?? "nenhuma"}
                    disabled={isDesligado}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione uma diretoria" /></SelectTrigger>
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

            {/* ── Bloco 4: Área(s) — Gestores (multi) e ICs (single) ── */}
            {showArea && (
              <FormField control={form.control} name="area_ids" render={() => (
                <FormItem>
                  <FormLabel>
                    {multiArea ? "Áreas" : "Área *"}
                    {multiArea && <span className="text-xs text-muted-foreground ml-1">(pode selecionar mais de uma)</span>}
                  </FormLabel>

                  {/* Chips das selecionadas */}
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

                  <Select
                    onValueChange={(v) => toggleArea(v)}
                    value=""
                    disabled={isDesligado}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={areaIds.length === 0 ? "Selecione uma área" : "Adicionar área..."} />
                      </SelectTrigger>
                    </FormControl>
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

            {/* ── Bloco 5: Especialidade — apenas ICs, 1 área selecionada ── */}
            {showEspecialidade && singleAreaId && especialidades.length > 0 && (
              <FormField control={form.control} name="especialidade_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade *</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "nenhuma" ? null : v)}
                    value={field.value ?? "nenhuma"}
                    disabled={isDesligado}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
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

            {/* ── Bloco 6: Squad(s) — Gestores e ICs, multi-select ── */}
            {showSquad && (
              <FormField control={form.control} name="squad_ids" render={() => (
                <FormItem>
                  <FormLabel>
                    Squad
                    <span className="text-xs text-muted-foreground ml-1">(opcional, pode selecionar mais de uma)</span>
                  </FormLabel>

                  {/* Chips das selecionadas */}
                  {areaIds.length > 0 || form.watch("squad_ids").length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {form.watch("squad_ids").map((nome) => (
                        <Badge key={nome} variant="secondary" className="gap-1 pr-1">
                          {nome}
                          <button type="button" onClick={() => toggleSquad(nome)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <Select onValueChange={(v) => toggleSquad(v)} value="" disabled={isDesligado}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Adicionar squad..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {squads
                        .filter((s) => !form.watch("squad_ids").includes(s.nome))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* ── Bloco 7: Status e Data ── */}
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
