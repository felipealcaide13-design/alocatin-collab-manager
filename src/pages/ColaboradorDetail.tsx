import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/ui/page-layout";
import { ChevronLeft, Building2, Briefcase, Mail, FileText, Calendar, UserCheck, Layers, Pencil, Plus, Trash2, ChevronRight, History, ArrowLeft, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ColaboradorForm } from "@/components/colaboradores/ColaboradorForm";
import { DeleteConfirmDialog } from "@/components/colaboradores/DeleteConfirmDialog";
import { AlocacaoSquadDialog } from "@/components/colaboradores/AlocacaoSquadDialog";
import { HistoricoAlteracoes } from "@/components/colaboradores/HistoricoAlteracoes";

function formatarCPF(cpf?: string | null) {
  if (!cpf) return "—";
  const str = String(cpf).replace(/\D/g, "");
  if (str.length !== 11) return cpf;
  return str.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

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
      <div className="flex items-center justify-center p-8 text-muted-foreground w-full">
        Carregando detalhes do colaborador...
      </div>
    );
  }

  if (!colaborador || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 w-full">
        <p className="text-muted-foreground">Colaborador não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/colaboradores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
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
    <div className="w-full h-full flex flex-col p-6 overflow-auto">
      <div className="max-w-[1440px] w-full mx-auto space-y-6">

        {/* Header flex */}
        <div className="flex items-end justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-[#e1ebef] rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#08526e] text-xl font-bold">{initials}</span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-2xl font-semibold text-[#262626] leading-none tracking-normal">
                {colaborador.nomeCompleto}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-[#d1fae5] px-2.5 py-0.5 rounded-full">
                  <span className="text-xs font-semibold text-[#059669]">
                    {colaborador.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setFormOpen(true)}
              className="bg-[#e1ecf0] hover:bg-[#cddce3] text-[#08526e] font-medium h-9 rounded-full px-4 border-0"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              onClick={() => setDeleteOpen(true)}
              className="bg-[#dc2626] hover:bg-[#b01e1e] text-white font-medium h-9 rounded-full px-4 border-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* 6 Cards Grid for basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 w-full">
          {/* Senioridade */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><Layers size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Senioridade</p>
              <p className="text-[#262626] text-sm font-medium truncate" title={colaborador.senioridade}>{colaborador.senioridade || "—"}</p>
            </div>
          </div>

          {/* Diretoria */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><Building2 size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Diretoria</p>
              <p className="text-[#262626] text-sm font-medium truncate" title={diretoria?.nome}>{diretoria?.nome || "—"}</p>
            </div>
          </div>

          {/* Líder */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><UserCheck size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Líder direto</p>
              <p className="text-[#262626] text-sm font-medium truncate" title={lider ? `${lider.nomeCompleto} (${lider.senioridade})` : ""}>
                {lider ? `${lider.nomeCompleto} (${lider.senioridade})` : "—"}
              </p>
            </div>
          </div>

          {/* Data admissão */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><Calendar size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Data de admissão</p>
              <p className="text-[#262626] text-sm font-medium truncate" title={colaborador.dataAdmissao ? new Date(colaborador.dataAdmissao + "T00:00:00").toLocaleDateString("pt-BR") : ""}>
                {colaborador.dataAdmissao ? new Date(colaborador.dataAdmissao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
              </p>
            </div>
          </div>

          {/* E-mail */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><Mail size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">E-mail</p>
              <p className="text-[#262626] text-sm font-medium truncate" title={colaborador.email}>{colaborador.email || "—"}</p>
            </div>
          </div>

          {/* CPF / Documento */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><FileText size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">CPF / Documento</p>
              <p className="text-[#262626] text-sm font-medium truncate" title={formatarCPF(colaborador.documento)}>{formatarCPF(colaborador.documento)}</p>
            </div>
          </div>
        </div>

        {/* Areas & Torres grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
          {/* Área e Especialidade */}
          <div className="bg-white flex flex-col p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
            <div className="flex flex-col gap-3 w-full">
              <p className="text-[#262626] text-sm font-semibold">Área e Especialidade</p>

              {colabAreas.length === 0 ? (
                <div className="bg-muted flex items-center p-4 rounded-xl w-full">
                  <span className="text-sm font-medium text-[#262626]">Sem área associada.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  {colabAreas.map((area) => (
                    <div key={area.id} className="bg-muted flex items-center justify-between p-4 rounded-xl w-full">
                      <span className="text-sm font-medium text-[#262626]">{area.nome}</span>
                      {especialidade && especialidade.area_id === area.id && (
                        <div className="bg-[#e6e6e6] px-3 py-1 rounded-full flex items-center justify-center border border-transparent">
                          <span className="text-[#262626] text-xs font-semibold">{especialidade.nome}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {especialidade && !colabAreas.some((a) => a.id === especialidade.area_id) && (
                    <div className="bg-muted flex items-center justify-between p-4 rounded-xl w-full">
                      <span className="text-sm text-[#737373]">Especialidade</span>
                      <div className="bg-[#e6e6e6] px-3 py-1 rounded-full flex items-center justify-center border border-transparent">
                        <span className="text-[#262626] text-xs font-semibold">{especialidade.nome}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Torres e Squads */}
          <div className="bg-white flex flex-col p-6 gap-3 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
            <div className="flex items-center justify-between">
              <p className="text-[#262626] text-sm font-semibold">Torres e Squads</p>
            </div>
            {squadDetails.length === 0 ? (
              <div className="bg-muted flex items-center p-4 rounded-xl w-full">
                <span className="text-sm text-muted-foreground">Não alocado em nenhuma squad.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {squadDetails.map(({ squad, torre, contrato, bu }) => (
                  <div key={squad.id} className="bg-muted flex items-center justify-between p-4 rounded-xl w-full gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      {bu && (
                        <>
                          <span className="text-[#737373] text-sm shrink-0">...</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#737373]/50 shrink-0" />
                        </>
                      )}
                      <span className="text-[#737373] text-sm shrink-0 truncate max-w-[100px] xl:max-w-[140px]">{torre?.nome ?? "—"}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#737373]/50 shrink-0" />
                      <span className="text-[#262626] text-sm font-medium shrink-0 truncate max-w-[120px] xl:max-w-[160px]">{squad.nome}</span>
                    </div>

                    {contrato && (
                      <div className="flex items-center justify-end gap-1.5 min-w-0 flex-1">
                        <Briefcase className="h-3.5 w-3.5 text-[#737373] shrink-0" />
                        <span className="text-[#737373] text-xs truncate" title={contrato.nome}>
                          {contrato.nome}
                        </span>
                        <div className="ml-1 shrink-0">
                          <StatusBadge status={contrato.status} variant="contract" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exibir contratos associados se for mais de 1 (antes era com DetailSection, agora como card) */}
        {uniqueContratos.length > 1 && (
          <div className="bg-white flex flex-col p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full gap-3">
            <p className="text-[#262626] text-sm font-semibold">Contratos associados</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uniqueContratos.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-muted">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-[#262626] truncate">{c.nome}</p>
                    <p className="text-xs text-[#737373]">{c.cliente}</p>
                  </div>
                  <StatusBadge status={c.status} variant="contract" className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historico de Alteracoes (Full width bg-white card) */}
        <div className="bg-white flex flex-col p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
          <HistoricoAlteracoes
            colaboradorId={colaborador.id}
            torres={torres}
            squads={squads}
            diretorias={diretorias}
            businessUnits={businessUnits}
          />
        </div>

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
    </div>
  );
}
