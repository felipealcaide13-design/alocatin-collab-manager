import { useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/ui/page-layout";
import { ChevronLeft, ChevronRight, Edit2, Trash2, ArrowLeft, DollarSign, Calendar, CalendarOff, Briefcase, FileText, CloudDownload, FolderClock, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContratoForm } from "@/components/contratos/ContratoForm";
import { DeleteConfirmDialog } from "@/components/contratos/DeleteConfirmDialog";
import { HistoricoAlteracoesContrato } from "@/components/contratos/HistoricoAlteracoesContrato";

import { contratoService } from "@/services/contratoService";
import { torreService } from "@/services/torreService";
import { type Contrato } from "@/types/contrato";
import { useToast } from "@/hooks/use-toast";

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

export default function ContratoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contrato, isLoading } = useQuery({
    queryKey: ["contrato", id],
    queryFn: () => contratoService.getById(id!),
    enabled: !!id,
  });

  const { data: torres = [] } = useQuery({ queryKey: ["torres"], queryFn: () => torreService.getAllTorres().catch(() => []) });
  const { data: squads = [] } = useQuery({ queryKey: ["squads"], queryFn: () => torreService.getAllSquads().catch(() => []) });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Contrato, "id">> }) =>
      contratoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrato", id] });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["historico_contratos", id] });
      setFormOpen(false);
      toast({ title: "Contrato atualizado!", description: "Dados salvos com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (contratoId: string) => contratoService.remove(contratoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast({ title: "Contrato excluído", description: "O registro foi removido." });
      navigate("/contratos");
    },
    onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !contrato) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);

      // se já existir arquivo, exclui primeiro
      if (contrato.arquivo_url) {
        await contratoService.removeArquivo(contrato.arquivo_url);
      }

      const { url, nome } = await contratoService.uploadArquivo(file);

      await updateMutation.mutateAsync({
        id: contrato.id,
        data: {
          ...contrato,
          arquivo_url: url,
          arquivo_nome: nome
        }
      });

      toast({ title: "Sucesso!", description: "Arquivo adicionado." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async () => {
    if (!contrato || !contrato.arquivo_url) return;
    try {
      setIsUploading(true);
      await contratoService.removeArquivo(contrato.arquivo_url);
      await updateMutation.mutateAsync({
        id: contrato.id,
        data: {
          ...contrato,
          arquivo_url: null,
          arquivo_nome: null
        }
      });
      toast({ title: "Sucesso!", description: "Arquivo removido." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const duracao = useMemo(() => {
    if (!contrato || !contrato.data_inicio) return null;
    const inicio = new Date(contrato.data_inicio);
    const fim = contrato.data_fim ? new Date(contrato.data_fim) : new Date();
    const meses =
      (fim.getFullYear() - inicio.getFullYear()) * 12 +
      (fim.getMonth() - inicio.getMonth());
    return meses > 0 ? `${meses} mês${meses !== 1 ? "es" : ""}` : null;
  }, [contrato]);

  const { torresVinculadas, squadsVinculadas } = useMemo(() => {
    if (!contrato) return { torresVinculadas: [], squadsVinculadas: [] };
    const tVinc = torres.filter((t) => contrato.torres?.includes(t.id));
    const specificIds = contrato.squads_ids ?? [];
    const sVinc = specificIds.length > 0
      ? squads.filter((s) => specificIds.includes(s.id))
      : squads.filter((s) => s.contrato_id === contrato.id);
    return { torresVinculadas: tVinc, squadsVinculadas: sVinc };
  }, [contrato, torres, squads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground w-full">
        Carregando detalhes do contrato...
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 w-full">
        <p className="text-muted-foreground">Contrato não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/contratos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-auto">
      <div className="max-w-[1440px] w-full mx-auto space-y-6">

        {/* Header flex */}
        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#262626] leading-none tracking-normal truncate">
              {contrato.nome}
            </h1>
            {contrato.descricao && (
              <p className="text-sm text-[#737373] mt-1">{contrato.descricao}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-[#d1fae5] px-2.5 py-0.5 rounded-full">
                <span className="text-xs font-semibold text-[#059669]">
                  {contrato.status}
                </span>
              </div>
              {contrato.contract_type && (
                <div className="bg-[#e0e0e0]/50 px-2.5 py-0.5 rounded-full">
                  <span className="text-xs font-semibold text-[#262626]">
                    {contrato.contract_type}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-start w-full">
          {/* Valor card */}
          <div className="bg-[#0a678a] flex flex-col gap-3 p-6 rounded-[24px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full text-white md:col-span-2">
            <DollarSign className="h-5 w-5" />
            <div className="flex flex-col min-w-0">
              <p className="text-white/70 text-xs">Valor {contrato.contract_type === "Aberto" ? 'mensal' : 'total'}</p>
              <p className="text-white text-xl font-extrabold tracking-normal truncate">
                {formatCurrency(contrato.valor ?? contrato.valor_total)}
              </p>
            </div>
          </div>

          {/* Duracao */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3 min-h-[124px]">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><FolderClock size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Duração</p>
              <p className="text-[#262626] text-sm font-medium truncate">{duracao || "—"}</p>
            </div>
          </div>

          {/* Data inicio */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3 min-h-[124px]">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><Calendar size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Data de início</p>
              <p className="text-[#262626] text-sm font-medium truncate">{formatDate(contrato.data_inicio)}</p>
            </div>
          </div>

          {/* Data termino */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3 min-h-[124px]">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><CalendarOff size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Data de término</p>
              <p className="text-[#262626] text-sm font-medium truncate">{formatDate(contrato.data_fim)}</p>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-white p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3 min-h-[124px]">
            <div className="h-5 w-5 text-muted-foreground shrink-0"><Briefcase size={20} /></div>
            <div className="flex flex-col min-w-0">
              <p className="text-[#737373] text-xs">Cliente</p>
              <p className="text-[#262626] text-sm font-medium truncate">{contrato.cliente || "—"}</p>
            </div>
          </div>
        </div>

        {/* Second Row: Documents & Torres/Squads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
          {/* Documentos */}
          <div className="bg-white flex flex-col p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full h-full">
            <div className="flex flex-col gap-3 w-full h-full">
              <div className="flex items-center justify-between">
                <p className="text-[#262626] text-sm font-semibold">Documento(s)</p>
              </div>

              {contrato.arquivo_url && contrato.arquivo_nome ? (
                <div className="bg-[#ededed]/20 border border-transparent flex items-center justify-between px-4 py-4 rounded-[12px] w-full flex-grow">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#262626] truncate" title={contrato.arquivo_nome}>
                      {contrato.arquivo_nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => window.open(contrato.arquivo_url!, "_blank")}
                    >
                      <CloudDownload className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 text-destructive hover:text-destructive"
                      onClick={handleDeleteFile}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#ededed]/20 flex flex-col items-center justify-center p-6 rounded-[12px] w-full border-2 border-dashed border-gray-200 flex-grow">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-white"
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      {isUploading ? "Aguarde..." : "Fazer upload do contrato"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Nenhum documento anexado. (.pdf, .doc)</p>
                </div>
              )}
            </div>
          </div>

          {/* Torres e Squads */}
          <div className="bg-white flex flex-col p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full h-full">
            <div className="flex flex-col gap-3 w-full h-full">
              <p className="text-[#262626] text-sm font-semibold">Torres e Squads</p>

              <div className="bg-[#ededed]/20 flex flex-col justify-center gap-2 px-4 py-5 rounded-[12px] w-full flex-grow">
                {squadsVinculadas.length === 0 && torresVinculadas.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center my-auto">Sem vinculações diretas.</p>
                ) : (
                  <>
                    {squadsVinculadas.map(s => {
                      const torre = torres.find(t => t.id === s.torre_id);
                      return (
                        <div key={s.id} className="flex flex-wrap items-center text-sm">
                          <span className="text-[#737373]">Projeto</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#737373]/50 mx-2 shrink-0" />
                          <span className="text-[#737373]">{torre?.nome || "—"}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#737373]/50 mx-2 shrink-0" />
                          <span className="font-medium text-[#262626]">{s.nome}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Historico de Alteracoes */}
        <div className="bg-white flex flex-col p-6 rounded-[24px] border border-muted/30 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
          <HistoricoAlteracoesContrato
            contratoId={contrato.id}
            torres={torres}
            squads={squads}
          />
        </div>

        {/* Modals */}
        <ContratoForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({ id: contrato.id, data });
          }}
          initialData={contrato}
          isLoading={updateMutation.isPending}
        />

        <DeleteConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate(contrato.id)}
          nome={contrato.nome}
          isLoading={deleteMutation.isPending}
        />

      </div>
    </div>
  );
}
