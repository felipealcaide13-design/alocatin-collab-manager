import { useMemo, useState } from "react";
import { Users, ChevronRight, BarChart2, Briefcase, Plus, Edit2, Trash2, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailSection } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { AreaForm, type AreaFormValues } from "@/components/areas/AreaForm";
import { DeleteConfirmDialog } from "@/components/areas/DeleteConfirmDialog";
import { areaService } from "@/services/areaService";
import { especialidadeService } from "@/services/especialidadeService";
import { useToast } from "@/hooks/use-toast";
import { type Diretoria } from "@/types/diretoria";
import { type Colaborador } from "@/types/colaborador";
import { type Area } from "@/types/area";
import { type Especialidade } from "@/types/especialidade";
import { type Torre, type Squad } from "@/types/torre";

interface Props {
  diretoria: Diretoria | null;
  open: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  areas: Area[];
  especialidades: Especialidade[];
  torres: Torre[];
  squads: Squad[];
}

export function DiretoriaDetailPanel({
  diretoria,
  open,
  onClose,
  colaboradores,
  areas,
  especialidades,
  torres,
  squads,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [areaFormOpen, setAreaFormOpen] = useState(false);
  const [areaEditTarget, setAreaEditTarget] = useState<Area | null>(null);
  const [areaDeleteTarget, setAreaDeleteTarget] = useState<Area | null>(null);

  const dirAreas = useMemo(
    () => (diretoria ? areas.filter((a) => a.diretoria_id === diretoria.id) : []),
    [diretoria, areas]
  );

  const dirColabs = useMemo(() => {
    if (!diretoria) return [];
    return colaboradores.filter((c) => c.diretoria_id === diretoria.id && c.status === "Ativo");
  }, [diretoria, colaboradores]);

  const bySenioridade = useMemo(() => {
    const map = new Map<string, number>();
    dirColabs.forEach((c) => { map.set(c.senioridade, (map.get(c.senioridade) ?? 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dirColabs]);

  const CARGOS_GESTAO = new Set(["C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)"]);

  const byEspecialidade = useMemo(() => {
    const map = new Map<string, number>();
    dirColabs
      .filter((c) => !CARGOS_GESTAO.has(c.senioridade) && !!c.especialidade_id)
      .forEach((c) => {
        const key = especialidades.find((e) => e.id === c.especialidade_id)?.nome ?? "Desconhecida";
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dirColabs, especialidades]);

  const squadAllocations = useMemo(() => {
    return squads
      .map((sq) => {
        const membros = sq.membros ?? [];
        const count = dirColabs.filter((c) => membros.includes(c.id)).length;
        if (count === 0) return null;
        const torre = torres.find((t) => t.id === sq.torre_id);
        return { squad: sq, torre, count };
      })
      .filter(Boolean) as { squad: Squad; torre: Torre | undefined; count: number }[];
  }, [dirColabs, squads, torres]);

  // ── Área queries ──────────────────────────────────────────
  const { data: allEspecialidades = [] } = useQuery({
    queryKey: ["especialidades"],
    queryFn: () => especialidadeService.getAll().catch(() => []),
    enabled: open,
  });

  const getEspecialidadesByArea = (areaId: string) =>
    allEspecialidades.filter((e) => e.area_id === areaId);

  // ── Área mutations ────────────────────────────────────────
  const createAreaMutation = useMutation({
    mutationFn: (data: Omit<Area, "id" | "created_at">) => areaService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateAreaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Area, "id" | "created_at">> }) =>
      areaService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => areaService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      setAreaDeleteTarget(null);
      toast({ title: "Área excluída" });
    },
    onError: (e: Error) => {
      setAreaDeleteTarget(null);
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const handleAreaSubmit = async (values: AreaFormValues) => {
    const { especialidades: espNomes, ...rest } = values;
    const areaData = { ...rest, subareas_possiveis: [] as string[] } as Omit<Area, "id" | "created_at">;

    let areaId: string;
    if (areaEditTarget) {
      await updateAreaMutation.mutateAsync({ id: areaEditTarget.id, data: areaData });
      areaId = areaEditTarget.id;
    } else {
      const created = await createAreaMutation.mutateAsync(areaData);
      areaId = created.id;
    }

    const existing = getEspecialidadesByArea(areaId);
    const existingNames = existing.map((e) => e.nome);
    const toDelete = existing.filter((e) => !espNomes.includes(e.nome));
    const toCreate = espNomes.filter((n) => !existingNames.includes(n));

    await Promise.all([
      ...toDelete.map((e) => especialidadeService.remove(e.id).catch(() => {})),
      ...toCreate.map((nome) => especialidadeService.create({ nome, area_id: areaId })),
    ]);

    queryClient.invalidateQueries({ queryKey: ["especialidades"] });
    setAreaFormOpen(false);
    setAreaEditTarget(null);
    toast({ title: areaEditTarget ? "Área atualizada!" : "Área cadastrada!" });
  };

  if (!diretoria) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--primary-600)]" />
              {diretoria.nome}
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {dirColabs.length} colaborador{dirColabs.length !== 1 ? "es" : ""} ativo{dirColabs.length !== 1 ? "s" : ""}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">

            {/* Áreas */}
            <DetailSection
              icon={MapPin}
              title="Áreas"
              action={
                <Button
                  variant="ghost" size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => { setAreaEditTarget(null); setAreaFormOpen(true); }}
                >
                  <Plus className="h-3.5 w-3.5" /> Nova Área
                </Button>
              }
            >
              {dirAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhuma área cadastrada.</p>
              ) : (
                <div className="space-y-1">
                  {dirAreas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{area.nome}</p>
                        {area.descricao && (
                          <p className="text-xs text-muted-foreground truncate">{area.descricao}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 ml-2">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => { setAreaEditTarget(area); setAreaFormOpen(true); }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setAreaDeleteTarget(area)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            {dirColabs.length > 0 && (
              <>
                {/* Senioridade breakdown */}
                <DetailSection icon={BarChart2} title="Por senioridade">
                  <div className="flex flex-wrap gap-2">
                    {bySenioridade.map(([sen, count]) => (
                      <span key={sen} className="inline-flex items-center gap-1.5">
                        <StatusBadge status={sen} variant="seniority" />
                        <span className="text-xs font-bold text-foreground">{count}</span>
                      </span>
                    ))}
                  </div>
                </DetailSection>

                {/* Especialidade breakdown */}
                {byEspecialidade.length > 0 && (
                <DetailSection icon={Briefcase} title="Por especialidade / cargo">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {byEspecialidade.map(([esp, count]) => (
                      <div key={esp} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20">
                        <span className="text-sm text-foreground truncate">{esp}</span>
                        <Badge variant="secondary" className="ml-2 shrink-0">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </DetailSection>
                )}

                {/* Torres / Squads */}
                {squadAllocations.length > 0 && (
                  <DetailSection icon={ChevronRight} title="Alocação em torres e squads">
                    <div className="space-y-1.5">
                      {squadAllocations.map(({ squad, torre, count }) => (
                        <div key={squad.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20 text-sm">
                          <span className="text-muted-foreground shrink-0">{torre?.nome ?? "—"}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-medium text-foreground flex-1 truncate">{squad.nome}</span>
                          <Badge variant="secondary" className="shrink-0">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                )}

                {/* Colaboradores */}
                <DetailSection icon={Users} title="Colaboradores">
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {dirColabs.map((c) => {
                      const esp = especialidades.find((e) => e.id === c.especialidade_id);
                      const areaNames = c.area_ids
                        .map((id) => areas.find((a) => a.id === id)?.nome)
                        .filter(Boolean)
                        .join(", ");
                      const squadNames = squads
                        .filter((sq) => (sq.membros ?? []).includes(c.id))
                        .map((sq) => sq.nome)
                        .join(", ");
                      return (
                        <div key={c.id} className="flex items-start justify-between rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.nomeCompleto}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {areaNames || "—"}
                              {esp ? ` · ${esp.nome}` : ""}
                              {squadNames ? ` · ${squadNames}` : ""}
                            </p>
                          </div>
                          <StatusBadge status={c.senioridade} variant="seniority" className="ml-3 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </DetailSection>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Area form modal */}
      <Dialog open={areaFormOpen} onOpenChange={(v) => { if (!v) { setAreaFormOpen(false); setAreaEditTarget(null); } }}>
        <DialogContent className="max-w-lg overflow-y-auto bg-white border border-[#e0e0e0] shadow-xl sm:rounded-[24px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#262626] font-semibold tracking-normal">{areaEditTarget ? "Editar Área" : "Nova Área"}</DialogTitle>
          </DialogHeader>
          <AreaForm
            onCancel={() => { setAreaFormOpen(false); setAreaEditTarget(null); }}
            onSubmit={handleAreaSubmit}
            initialData={areaEditTarget ?? null}
            defaultDiretoriaId={diretoria.id}
            existingEspecialidades={areaEditTarget ? getEspecialidadesByArea(areaEditTarget.id) : []}
            isLoading={createAreaMutation.isPending || updateAreaMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Area delete confirm */}
      <DeleteConfirmDialog
        open={!!areaDeleteTarget}
        onClose={() => setAreaDeleteTarget(null)}
        onConfirm={() => areaDeleteTarget && deleteAreaMutation.mutate(areaDeleteTarget.id)}
        nome={areaDeleteTarget?.nome ?? ""}
        isLoading={deleteAreaMutation.isPending}
      />
    </>
  );
}
