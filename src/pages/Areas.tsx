import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Edit2, Trash2, ChevronDown, ChevronRight, BookOpen, BarChart2, Network, UserRound, Check, X,
    Layers, LayoutGrid, Sparkle, XLineTop,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/ui/page-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { AreaForm, type AreaFormValues } from "@/components/areas/AreaForm";
import { DeleteConfirmDialog as AreaDeleteDialog } from "@/components/areas/DeleteConfirmDialog";
import { DeleteConfirmDialog as EspecialidadeDeleteDialog } from "@/components/especialidades/DeleteConfirmDialog";
import { DeleteConfirmDialog as DiretoriaDeleteDialog } from "@/components/diretorias/DeleteConfirmDialog";
import { EspecialidadeForm } from "@/components/especialidades/EspecialidadeForm";
import { DiretoriaForm } from "@/components/diretorias/DiretoriaForm";
import { DiretoriaDetailPanel } from "@/components/diretorias/DiretoriaDetailPanel";
import { areaService } from "@/services/areaService";
import { diretoriaService } from "@/services/diretoriaService";
import { especialidadeService } from "@/services/especialidadeService";
import { torreService } from "@/services/torreService";
import { supabase } from "@/lib/supabase";
import { type Area } from "@/types/area";
import { type Diretoria, type DiretoriaInput } from "@/types/diretoria";
import { type Especialidade } from "@/types/especialidade";
import { type Squad } from "@/types/torre";

export default function Areas() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [expandedDiretorias, setExpandedDiretorias] = useState<Set<string>>(new Set());

    // Area form state
    const [areaFormOpen, setAreaFormOpen] = useState(false);
    const [areaEditTarget, setAreaEditTarget] = useState<Area | null>(null);
    const [areaDeleteTarget, setAreaDeleteTarget] = useState<Area | null>(null);
    // Pre-fill diretoria when adding area from within a diretoria row
    const [areaFormDiretoriaId, setAreaFormDiretoriaId] = useState<string | undefined>();

    // Diretoria form state
    const [dirFormOpen, setDirFormOpen] = useState(false);
    const [dirEditTarget, setDirEditTarget] = useState<Diretoria | null>(null);
    const [dirDeleteTarget, setDirDeleteTarget] = useState<Diretoria | null>(null);

    // Especialidade state
    const [espDialogArea, setEspDialogArea] = useState<Area | null>(null);
    const [espFormOpen, setEspFormOpen] = useState(false);
    const [espDeleteTarget, setEspDeleteTarget] = useState<Especialidade | null>(null);
    const [espEditTarget, setEspEditTarget] = useState<Especialidade | null>(null);
    const [espEditNome, setEspEditNome] = useState("");

    // Diretoria detail panel
    const [detailDiretoria, setDetailDiretoria] = useState<Diretoria | null>(null);

    // ── Queries ──────────────────────────────────────────────
    const { data: diretorias = [], isLoading: loadingDir } = useQuery({
        queryKey: ["diretorias"],
        queryFn: () => diretoriaService.getAll().catch(() => []),
    });

    const { data: areas = [], isLoading: loadingAreas } = useQuery({
        queryKey: ["areas"],
        queryFn: () => areaService.getAll().catch(() => []),
    });

    const { data: especialidades = [] } = useQuery({
        queryKey: ["especialidades"],
        queryFn: () => especialidadeService.getAll().catch(() => []),
    });

    const { data: colaboradores = [] } = useQuery({
        queryKey: ["colaboradores-diretoria-lideres"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("colaboradores")
                .select("id, nome_completo, senioridade")
                .in("senioridade", ["C-level", "Diretor(a)"])
                .eq("status", "Ativo");
            if (error) return [];
            return (data || []).map((c: any) => ({ id: c.id, nomeCompleto: c.nome_completo }));
        },
    });

    const { data: allColaboradores = [] } = useQuery({
        queryKey: ["colaboradores"],
        queryFn: async () => {
            const { data, error } = await supabase.from("colaboradores").select("*");
            if (error) return [];
            return (data || []).map((c: any) => ({
                id: c.id,
                nomeCompleto: c.nome_completo,
                email: c.email ?? null,
                documento: c.documento ?? null,
                diretoria_id: c.diretoria_id ?? null,
                area_ids: c.area_ids ?? [],
                especialidade_id: c.especialidade_id ?? null,
                squad_ids: c.squad_ids ?? [],
                torre_ids: c.torre_ids ?? [],
                senioridade: c.senioridade,
                status: c.status,
                dataAdmissao: c.data_admissao,
            }));
        },
    });

    const { data: torres = [] } = useQuery({
        queryKey: ["torres"],
        queryFn: () => torreService.getAllTorres().catch(() => []),
    });

    const { data: squads = [] } = useQuery({
        queryKey: ["squads"],
        queryFn: () => torreService.getAllSquads().catch(() => []),
    });

    const isLoading = loadingDir || loadingAreas;
    const getAreasByDiretoria = (diretoriaId: string) =>
        areas.filter((a) => a.diretoria_id === diretoriaId);

    const getEspecialidadesByArea = (areaId: string) =>
        especialidades.filter((e) => e.area_id === areaId);

    const getLideresNames = (ids: string[]) =>
        ids.length === 0
            ? "—"
            : ids.map((id) => colaboradores.find((c) => c.id === id)?.nomeCompleto ?? "?").join(", ");

    const toggleDiretoria = (id: string) =>
        setExpandedDiretorias((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    // ── KPI calculations (reactive) ──────────────────────────────
    const kpis = useMemo(() => {
        const totalDiretorias = diretorias.length;
        const totalAreas = areas.length;
        const totalEspecialidades = especialidades.length;
        const mediaAreasPorDiretoria = totalDiretorias > 0
            ? (totalAreas / totalDiretorias).toFixed(1)
            : "0";
        const mediaEspecialidadesPorArea = totalAreas > 0
            ? (totalEspecialidades / totalAreas).toFixed(1)
            : "0";
        return { totalDiretorias, totalAreas, totalEspecialidades, mediaAreasPorDiretoria, mediaEspecialidadesPorArea };
    }, [diretorias, areas, especialidades]);

    // ── Filtered diretorias ───────────────────────────────────
    const filteredDiretorias = diretorias;

    // Unassigned areas (no diretoria_id)
    const unassignedAreas = useMemo(
        () => areas.filter((a) => !a.diretoria_id),
        [areas]
    );

    // ── Mutations — Diretoria ─────────────────────────────────
    const createDirMutation = useMutation({
        mutationFn: (data: DiretoriaInput) => diretoriaService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["diretorias"] });
            setDirFormOpen(false);
            toast({ title: "Diretoria cadastrada!" });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const updateDirMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DiretoriaInput> }) =>
            diretoriaService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["diretorias"] });
            setDirFormOpen(false);
            setDirEditTarget(null);
            toast({ title: "Diretoria atualizada!" });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteDirMutation = useMutation({
        mutationFn: (id: string) => diretoriaService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["diretorias"] });
            setDirDeleteTarget(null);
            toast({ title: "Diretoria excluída" });
        },
        onError: (e: Error) => {
            setDirDeleteTarget(null);
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });

    // ── Mutations — Area ──────────────────────────────────────
    const createAreaMutation = useMutation({
        mutationFn: (data: Omit<Area, "id" | "created_at">) => areaService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const updateAreaMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Area, "id" | "created_at">> }) =>
            areaService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
    const deleteAreaMutation = useMutation({
        mutationFn: (id: string) => areaService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
            setAreaDeleteTarget(null);
            toast({ title: "Área excluída" });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    // ── Mutations — Especialidade ─────────────────────────────
    const createEspMutation = useMutation({
        mutationFn: (data: { nome: string; area_id: string; descricao?: string }) =>
            especialidadeService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["especialidades"] });
            setEspFormOpen(false);
            toast({ title: "Especialidade cadastrada!" });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteEspMutation = useMutation({
        mutationFn: (id: string) => especialidadeService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["especialidades"] });
            setEspDeleteTarget(null);
            toast({ title: "Especialidade excluída" });
        },
        onError: (e: Error) => {
            setEspDeleteTarget(null);
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });

    const updateEspMutation = useMutation({
        mutationFn: ({ id, nome }: { id: string; nome: string }) =>
            especialidadeService.update(id, { nome }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["especialidades"] });
            setEspEditTarget(null);
            setEspEditNome("");
            toast({ title: "Especialidade atualizada!" });
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    // ── Handlers ──────────────────────────────────────────────
    const handleDirFormSubmit = async (values: DiretoriaInput) => {
        if (dirEditTarget) {
            await updateDirMutation.mutateAsync({ id: dirEditTarget.id, data: values });
        } else {
            await createDirMutation.mutateAsync(values);
        }
    };
    const handleAreaFormSubmit = async (values: AreaFormValues) => {
        const { especialidades: espNomes, ...rest } = values;
        // subareas_possiveis mantido no banco por compatibilidade, mas não usado na UI
        const areaData = { ...rest, subareas_possiveis: [] as string[] } as Omit<Area, "id" | "created_at">;

        let areaId: string;
        const isEditing = !!areaEditTarget;
        if (isEditing) {
            await updateAreaMutation.mutateAsync({ id: areaEditTarget!.id, data: areaData });
            areaId = areaEditTarget!.id;
        } else {
            const created = await createAreaMutation.mutateAsync(areaData);
            areaId = created.id;
        }

        // Sync especialidades: delete removed, create new
        const existing = getEspecialidadesByArea(areaId);
        const existingNames = existing.map((e) => e.nome);
        const toDelete = existing.filter((e) => !espNomes.includes(e.nome));
        const toCreate = espNomes.filter((n) => !existingNames.includes(n));

        await Promise.all([
            ...toDelete.map((e) => especialidadeService.remove(e.id).catch(() => { })),
            ...toCreate.map((nome) => especialidadeService.create({ nome, area_id: areaId })),
        ]);

        queryClient.invalidateQueries({ queryKey: ["especialidades"] });
        setAreaFormOpen(false);
        setAreaEditTarget(null);
        toast({ title: isEditing ? "Área atualizada!" : "Área cadastrada!" });
    };

    const openAddArea = (diretoriaId?: string) => {
        setAreaEditTarget(null);
        setAreaFormDiretoriaId(diretoriaId);
        setAreaFormOpen(true);
    };

    // ── Area row component ────────────────────────────────────
    const AreaRow = ({ area }: { area: Area }) => {
        const esps = getEspecialidadesByArea(area.id);
        return (
            <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors border-b last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    <div className="min-w-0">
                        <span className="font-medium text-sm text-foreground">{area.nome}</span>
                        {area.descricao && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{area.descricao}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserRound className="h-3 w-3 shrink-0" />
                        {getLideresNames(area.lideres)}
                    </span>
                    <span className="text-xs text-muted-foreground hidden md:block">
                        {esps.length} especialidade{esps.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="Gerenciar Especialidades"
                            onClick={() => { setEspDialogArea(area); setEspFormOpen(false); }}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => { setAreaEditTarget(area); setAreaFormDiretoriaId(undefined); setAreaFormOpen(true); }}
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
            </div>
        );
    };

    return (
        <PageLayout
            title="Diretorias"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                <KpiCard icon={Layers} label="Diretorias ativas" value={kpis.totalDiretorias} />
                <KpiCard icon={LayoutGrid} label="Total de áreas" value={kpis.totalAreas} />
                <KpiCard icon={Sparkle} label="Total de especialidades" value={kpis.totalEspecialidades} />
                <KpiCard icon={XLineTop} label="Áreas por diretoria" value={kpis.mediaAreasPorDiretoria} />
                <KpiCard icon={XLineTop} label="Especialidades por área" value={kpis.mediaEspecialidadesPorArea} />
            </div>

            {/* Main container */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-[#e0e0e0] space-y-6 w-full">

                {/* Actions bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Button onClick={() => { setDirEditTarget(null); setDirFormOpen(true); }}>
                        <Plus className="h-4 w-4" />
                        Nova diretoria
                    </Button>
                    <Button
                        variant="soft"
                        className="h-9 px-4 rounded-full gap-2"
                        title="Ver Organograma Empresarial"
                        onClick={() => navigate("/areas/orgchart")}
                    >
                        <Network className="h-4 w-4" />
                        Organograma empresarial
                    </Button>
                </div>

                {/* Accordion list */}
                <div className="space-y-3 mt-4">
                    {isLoading
                        ? [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-card rounded-xl border shadow-sm p-4">
                                <Skeleton className="h-5 w-48" />
                            </div>
                        ))
                        : filteredDiretorias.length === 0 && unassignedAreas.length === 0
                            ? (
                                <div className="bg-card rounded-xl border shadow-sm px-4 py-12 text-center text-muted-foreground">
                                    Nenhuma diretoria encontrada. Clique em "Nova Diretoria" para começar.
                                </div>
                            )
                            : (
                                <>
                                    {filteredDiretorias.map((dir) => {
                                        const expanded = expandedDiretorias.has(dir.id);
                                        const dirAreas = getAreasByDiretoria(dir.id);
                                        const filteredAreas = dirAreas;

                                        return (
                                            <div key={dir.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                                                {/* Diretoria header */}
                                                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                                                    <button
                                                        className="flex items-center gap-2 flex-1 text-left"
                                                        onClick={() => toggleDiretoria(dir.id)}
                                                    >
                                                        {expanded
                                                            ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                        <span className="font-semibold text-foreground">{dir.nome}</span>
                                                        {dir.lideres && dir.lideres.length > 0 && (
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                                                <UserRound className="h-3 w-3 shrink-0" />
                                                                {getLideresNames(dir.lideres)}
                                                            </span>
                                                        )}
                                                        {dir.descricao && (
                                                            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-xs">
                                                                — {dir.descricao}
                                                            </span>
                                                        )}
                                                        <span className="ml-2 text-xs text-muted-foreground shrink-0">
                                                            {dirAreas.length} área{dirAreas.length !== 1 ? "s" : ""}
                                                        </span>
                                                    </button>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                            title="Ver colaboradores"
                                                            onClick={() => navigate(`/areas/diretorias/${dir.id}`)}
                                                        >
                                                            <BarChart2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 text-xs text-muted-foreground hover:text-primary gap-1"
                                                            onClick={() => {
                                                                openAddArea(dir.id);
                                                                setExpandedDiretorias((prev) => new Set([...prev, dir.id]));
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3" /> Área
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                            onClick={() => { setDirEditTarget(dir); setDirFormOpen(true); }}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setDirDeleteTarget(dir)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Areas list */}
                                                {expanded && (
                                                    <div className="border-t">
                                                        {filteredAreas.length === 0 ? (
                                                            <p className="px-8 py-4 text-sm text-muted-foreground">
                                                                Nenhuma área nesta diretoria.
                                                            </p>
                                                        ) : (
                                                            filteredAreas.map((area) => (
                                                                <AreaRow key={area.id} area={area} />
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Unassigned areas */}
                                    {unassignedAreas.length > 0 && (
                                        <div className="bg-card rounded-xl border border-dashed shadow-sm overflow-hidden">
                                            <div
                                                className="flex items-center gap-2 px-4 py-3 bg-muted/10 cursor-pointer"
                                                onClick={() => toggleDiretoria("__unassigned__")}
                                            >
                                                {expandedDiretorias.has("__unassigned__")
                                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                <span className="font-medium text-muted-foreground text-sm">
                                                    Sem diretoria ({unassignedAreas.length})
                                                </span>
                                            </div>
                                            {expandedDiretorias.has("__unassigned__") && (
                                                <div className="border-t">
                                                    {unassignedAreas.map((area) => (
                                                        <AreaRow key={area.id} area={area} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                </div>
            </div>

            {/* Diretoria form */}
            <Dialog open={dirFormOpen} onOpenChange={(v) => { if (!v) { setDirFormOpen(false); setDirEditTarget(null); } }}>
                <DialogContent className="max-w-lg overflow-y-auto bg-white border border-[#e0e0e0] shadow-xl sm:rounded-[24px] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg text-[#262626] font-semibold tracking-normal">{dirEditTarget ? "Editar Diretoria" : "Nova Diretoria"}</DialogTitle>
                    </DialogHeader>
                    <DiretoriaForm
                        diretoria={dirEditTarget ?? undefined}
                        diretoresDeAreas={(() => {
                            if (!dirEditTarget) return [];
                            // Pega IDs de líderes das áreas desta diretoria que são Diretores
                            const dirAreas = getAreasByDiretoria(dirEditTarget.id);
                            const liderIds = dirAreas.flatMap((a) => a.lideres);
                            return allColaboradores
                                .filter((c) => liderIds.includes(c.id) && c.senioridade === "Diretor(a)")
                                .map((c) => c.id);
                        })()}
                        onSuccess={() => { setDirFormOpen(false); setDirEditTarget(null); }}
                        onSubmit={handleDirFormSubmit}
                        onCancel={() => { setDirFormOpen(false); setDirEditTarget(null); }}
                        isLoading={createDirMutation.isPending || updateDirMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Diretoria delete */}
            {dirDeleteTarget && (
                <DiretoriaDeleteDialog
                    diretoria={dirDeleteTarget}
                    open={!!dirDeleteTarget}
                    onOpenChange={(v) => { if (!v) setDirDeleteTarget(null); }}
                    onConfirm={() => deleteDirMutation.mutate(dirDeleteTarget.id)}
                    isLoading={deleteDirMutation.isPending}
                />
            )}

            {/* Area form */}
            <AreaForm
                open={areaFormOpen}
                onClose={() => { setAreaFormOpen(false); setAreaEditTarget(null); }}
                onSubmit={handleAreaFormSubmit}
                initialData={areaEditTarget ?? null}
                defaultDiretoriaId={areaFormDiretoriaId}
                existingEspecialidades={areaEditTarget ? getEspecialidadesByArea(areaEditTarget.id) : []}
                isLoading={createAreaMutation.isPending || updateAreaMutation.isPending}
            />

            {/* Area delete */}
            <AreaDeleteDialog
                open={!!areaDeleteTarget}
                onClose={() => setAreaDeleteTarget(null)}
                onConfirm={() => areaDeleteTarget && deleteAreaMutation.mutate(areaDeleteTarget.id)}
                nome={areaDeleteTarget?.nome ?? ""}
                isLoading={deleteAreaMutation.isPending}
            />

            {/* Especialidades dialog */}
            <Dialog
                open={!!espDialogArea}
                onOpenChange={(v) => { if (!v) { setEspDialogArea(null); setEspFormOpen(false); setEspEditTarget(null); setEspEditNome(""); } }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Especialidades — {espDialogArea?.nome}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {espDialogArea && getEspecialidadesByArea(espDialogArea.id).length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma especialidade cadastrada para esta área.
                                </p>
                            ) : (
                                espDialogArea && getEspecialidadesByArea(espDialogArea.id).map((esp) => (
                                    <div key={esp.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20">
                                        {espEditTarget?.id === esp.id ? (
                                            <>
                                                <Input
                                                    className="h-7 text-sm flex-1 mr-2"
                                                    value={espEditNome}
                                                    onChange={(e) => setEspEditNome(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && espEditNome.trim().length >= 3) {
                                                            updateEspMutation.mutate({ id: esp.id, nome: espEditNome.trim() });
                                                        }
                                                        if (e.key === "Escape") { setEspEditTarget(null); setEspEditNome(""); }
                                                    }}
                                                    autoFocus
                                                />
                                                <div className="flex items-center gap-0.5">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-green-600 hover:text-green-700"
                                                        disabled={espEditNome.trim().length < 3 || updateEspMutation.isPending}
                                                        onClick={() => updateEspMutation.mutate({ id: esp.id, nome: espEditNome.trim() })}
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => { setEspEditTarget(null); setEspEditNome(""); }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-sm font-medium">{esp.nome}</p>
                                                    {esp.descricao && <p className="text-xs text-muted-foreground">{esp.descricao}</p>}
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                        onClick={() => { setEspEditTarget(esp); setEspEditNome(esp.nome); }}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setEspDeleteTarget(esp)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        {espFormOpen ? (
                            <div className="border rounded-lg p-4 bg-muted/10">
                                <p className="text-sm font-medium mb-3">Nova Especialidade</p>
                                <EspecialidadeForm
                                    especialidade={espDialogArea ? { id: "", nome: "", area_id: espDialogArea.id } : undefined}
                                    areas={espDialogArea ? [espDialogArea] : []}
                                    onSubmit={async (values) => {
                                        if (!values.nome) return;
                                        await createEspMutation.mutateAsync({
                                            nome: values.nome,
                                            area_id: espDialogArea?.id ?? values.area_id,
                                            descricao: values.descricao,
                                        });
                                    }}
                                    onCancel={() => setEspFormOpen(false)}
                                    isLoading={createEspMutation.isPending}
                                />
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setEspFormOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Especialidade
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Especialidade delete */}
            {espDeleteTarget && (
                <EspecialidadeDeleteDialog
                    especialidade={espDeleteTarget}
                    open={!!espDeleteTarget}
                    onOpenChange={(v) => { if (!v) setEspDeleteTarget(null); }}
                    onConfirm={() => deleteEspMutation.mutate(espDeleteTarget.id)}
                    isLoading={deleteEspMutation.isPending}
                />
            )}

            {/* Diretoria detail panel */}
            <DiretoriaDetailPanel
                diretoria={detailDiretoria}
                open={!!detailDiretoria}
                onClose={() => setDetailDiretoria(null)}
                colaboradores={allColaboradores}
                areas={areas}
                especialidades={especialidades}
                torres={torres}
                squads={squads}
            />
        </PageLayout>
    );
}
