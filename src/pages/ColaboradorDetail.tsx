import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Mail, FileText, Calendar, Building2, Layers, Network, ChevronRight,
  Briefcase, ArrowLeft, Edit2, Trash2, Plus, Pencil, X, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DetailSection, DetailRow } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { ColaboradorForm } from "@/components/colaboradores/ColaboradorForm";
import { DeleteConfirmDialog } from "@/components/colaboradores/DeleteConfirmDialog";
import { AlocacaoSquadDialog } from "@/components/colaboradores/AlocacaoSquadDialog";
import { HistoricoAlteracoes } from "@/components/colaboradores/HistoricoAlteracoes";
import { colaboradorService } from "@/services/colaboradorService";
import { areaService } from "@/services/areaService";
import { especialidadeService } from "@/services/especialidadeService";
import { diretoriaService } from "@/services/diretoriaService";
import { torreService } from "@/services/torreService";
import { contratoService } from "@/services/contratoService";
import { businessUnitService } from "@/services/businessUnitService";
import { type Colaborador } from "@/types/colaborador";
import { useToast } from "@/hooks/use-toast";

export default function ColaboradorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // null = nova alocação, string = editar alocação existente (squadId atual)
  const [alocacaoDialog, setAlocacaoDialog] = useState<{ open: boolean; currentSquadId: string | null }>({
    open: false,
    currentSquadId: null,
  });

  const { data: colaborador, isLoading } = useQuery({
    queryKey: ["colaborador", id],
    queryFn: () => colaboradorService.getById(id!),
    enabled: !!id,
  });

  const { data: areas = [] } = useQuery({ queryKey: ["areas"], queryFn: () => areaService.getAll() });
  const { data: especialidades = [] } = useQuery({ queryKey: ["especialidades"], queryFn: () => especialidadeService.getAll() });
  const { data: diretorias = [] } = useQuery({ queryKey: ["diretorias"], queryFn: () => diretoriaService.getAll().catch(() => []) });
  const { data: torres = [] } = useQuery({ queryKey: ["torres"], queryFn: () => torreService.getAllTorres().catch(() => []) });
  const { data: squads = [] } = useQuery({ queryKey: ["squads"], queryFn: () => torreService.getAllSquads().catch(() => []) });
  const { data: contratos = [] } = useQuery({ queryKey: ["contratos"], queryFn: () => contratoService.getAll().catch(() => []) });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnits"], queryFn: () => businessUnitService.getAll().catch(() => []) });
  const { data: todosColaboradores = [] } = useQuery({ queryKey: ["colaboradores"], queryFn: () => colaboradorService.getAll().catch(() => []) });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["colaborador", id] });
    queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
    queryClient.invalidateQueries({ queryKey: ["squads"] });
    queryClient.invalidateQueries({ queryKey: ["torres"] });
    queryClient.invalidateQueries({ queryKey: ["historico", id] });
  };

  const alocacaoMutation = useMutation({
    mutationFn: async ({ newSquadId, oldSquadId }: { newSquadId: string; oldSquadId: string | null }) => {
      if (!colaborador) return;
      const currentIds: string[] = colaborador.squad_ids ?? [];
      // Remove a squad antiga e adiciona a nova
      const updated = oldSquadId
        ? currentIds.filter((sid) => sid !== oldSquadId).concat(newSquadId)
        : [...currentIds, newSquadId];
      await colaboradorService.update(colaborador.id, { squad_ids: [...new Set(updated)] });
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Alocação atualizada!", description: "Squad atualizada com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar alocação", description: e.message, variant: "destructive" }),
  });

  const removeAlocacaoMutation = useMutation({
    mutationFn: async (squadId: string) => {
      if (!colaborador) return;
      const updated = (colaborador.squad_ids ?? []).filter((sid) => sid !== squadId);
      await colaboradorService.update(colaborador.id, { squad_ids: updated });
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Alocação removida", description: "Colaborador removido da squad." });
    },
    onError: (e: Error) => toast({ title: "Erro ao remover alocação", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Colaborador, "id">> }) =>
      colaboradorService.update(id, data),
    onSuccess: () => {
      invalidateAll();
      setFormOpen(false);
      toast({ title: "Colaborador atualizado!", description: "Dados salvos com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (colaboradorId: string) => colaboradorService.remove(colaboradorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast({ title: "Colaborador excluído", description: "O registro foi removido." });
      navigate("/colaboradores");
    },
    onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const data = useMemo(() => {
    if (!colaborador) return null;

    const diretoria = diretorias.find((d) => d.id === colaborador.diretoria_id);
    const lider = colaborador.lider_id ? todosColaboradores.find((c) => c.id === colaborador.lider_id) : null;
    const colabAreas = areas.filter((a) => colaborador.area_ids.includes(a.id));
    const especialidade = especialidades.find((e) => e.id === colaborador.especialidade_id);

    const colabSquads = squads.filter((sq) => (colaborador.squad_ids ?? []).includes(sq.id));

    const squadDetails = colabSquads.map((sq) => {
      const torre = torres.find((t) => t.id === sq.torre_id);
      const contrato = sq.contrato_id ? contratos.find((c) => c.id === sq.contrato_id) : null;
      const bu = torre?.bu_id ? businessUnits.find((b) => b.id === torre.bu_id) : null;
      return { squad: sq, torre, contrato, bu };
    });

    const uniqueContratos = Array.from(
      new Map(
        squadDetails.filter((d) => d.contrato).map((d) => [d.contrato!.id, d.contrato!])
      ).values()
    );

    return { diretoria, lider, colabAreas, especialidade, squadDetails, uniqueContratos };
  }, [colaborador, diretorias, areas, especialidades, squads, torres, contratos, businessUnits]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!colaborador || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Colaborador não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/colaboradores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  const { diretoria, lider, colabAreas, especialidade, squadDetails, uniqueContratos } = data;

  const initials = colaborador.nomeCompleto
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/colaboradores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Colaboradores
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      {/* Avatar + nome */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-xl shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground leading-tight">{colaborador.nomeCompleto}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={colaborador.senioridade} variant="seniority" />
            <StatusBadge status={colaborador.status} variant="entity" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Dados cadastrais */}
      <DetailSection icon={User} title="Dados cadastrais">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={Mail} label="E-mail" value={colaborador.email} />
          <DetailRow icon={FileText} label="CPF / Documento" value={colaborador.documento} />
          <DetailRow
            icon={Calendar}
            label="Data de admissão"
            value={new Date(colaborador.dataAdmissao + "T00:00:00").toLocaleDateString("pt-BR")}
          />
          <DetailRow icon={Building2} label="Diretoria" value={diretoria?.nome} />
          <DetailRow
            icon={UserCheck}
            label="Líder direto"
            value={lider ? `${lider.nomeCompleto} (${lider.senioridade})` : undefined}
          />
        </div>
      </DetailSection>

      {/* Área(s) e Especialidade */}
      <DetailSection icon={Layers} title={`Área${colabAreas.length !== 1 ? "s" : ""} e Especialidade`}>
        {colabAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem área associada.</p>
        ) : (
          <div className="space-y-1.5">
            {colabAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20">
                <span className="text-sm font-medium text-foreground">{area.nome}</span>
                {especialidade && especialidade.area_id === area.id && (
                  <Badge variant="secondary" className="ml-2 text-xs">{especialidade.nome}</Badge>
                )}
              </div>
            ))}
            {especialidade && !colabAreas.some((a) => a.id === especialidade.area_id) && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20">
                <span className="text-sm text-muted-foreground">Especialidade:</span>
                <Badge variant="secondary">{especialidade.nome}</Badge>
              </div>
            )}
          </div>
        )}
      </DetailSection>

      {/* Torres e Squads */}
      <DetailSection
        icon={Network}
        title="Torres e Squads"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setAlocacaoDialog({ open: true, currentSquadId: null })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
        }
      >
        {squadDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não alocado em nenhuma squad.</p>
        ) : (
          <div className="space-y-1.5">
            {squadDetails.map(({ squad, torre, contrato, bu }) => (
              <div key={squad.id} className="rounded-lg border px-3 py-2 bg-muted/20 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
                    {bu && (
                      <>
                        <span className="text-muted-foreground shrink-0">{bu.nome}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      </>
                    )}
                    <span className="text-muted-foreground shrink-0">{torre?.nome ?? "—"}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="font-medium text-foreground">{squad.nome}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      title="Alterar squad"
                      onClick={() => setAlocacaoDialog({ open: true, currentSquadId: squad.id })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Remover da squad"
                      onClick={() => removeAlocacaoMutation.mutate(squad.id)}
                      disabled={removeAlocacaoMutation.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {contrato && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-0.5">
                    <Briefcase className="h-3 w-3 shrink-0" />
                    <span>{contrato.nome}</span>
                    <StatusBadge status={contrato.status} variant="contract" className="ml-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {/* Contratos únicos (resumo) */}
      {uniqueContratos.length > 1 && (
        <DetailSection icon={Briefcase} title="Contratos associados">
          <div className="space-y-1.5">
            {uniqueContratos.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/20">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.cliente}</p>
                </div>
                <StatusBadge status={c.status} variant="contract" className="ml-2 shrink-0" />
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Histórico de Alterações */}
      <HistoricoAlteracoes
        colaboradorId={colaborador.id}
        torres={torres}
        squads={squads}
        diretorias={diretorias}
        businessUnits={businessUnits}
      />

      {/* Modals */}
      <ColaboradorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync({ id: colaborador.id, data: values });
        }}
        initialData={colaborador}
        isLoading={updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(colaborador.id)}
        nome={colaborador.nomeCompleto}
        isLoading={deleteMutation.isPending}
      />

      <AlocacaoSquadDialog
        open={alocacaoDialog.open}
        onClose={() => setAlocacaoDialog({ open: false, currentSquadId: null })}
        currentSquadId={alocacaoDialog.currentSquadId}
        torres={torres}
        squads={squads}
        businessUnits={businessUnits}
        onSave={async (newSquadId, oldSquadId) => {
          await alocacaoMutation.mutateAsync({ newSquadId, oldSquadId });
        }}
        isLoading={alocacaoMutation.isPending}
      />
    </div>
  );
}
