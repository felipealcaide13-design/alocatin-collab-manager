import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout, FilterBar } from "@/components/ui/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ColaboradorForm } from "@/components/colaboradores/ColaboradorForm";
import { colaboradorService } from "@/services/colaboradorService";
import { areaService } from "@/services/areaService";
import { especialidadeService } from "@/services/especialidadeService";
import { diretoriaService } from "@/services/diretoriaService";
import { type Colaborador } from "@/types/colaborador";
import { useToast } from "@/hooks/use-toast";

type SortField = "nomeCompleto" | "status" | "senioridade";
type SortDir = "asc" | "desc";

export default function Colaboradores() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterDiretoria, setFilterDiretoria] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterEspecialidade, setFilterEspecialidade] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("nomeCompleto");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll(),
  });

  // Navigate to detail page when coming from global search
  useEffect(() => {
    const openId = searchParams.get("openId");
    if (openId && colaboradores.length > 0) {
      const found = colaboradores.find((c) => c.id === openId);
      if (found) {
        setSearchParams({}, { replace: true });
        navigate(`/colaboradores/${found.id}`);
      }
    }
  }, [colaboradores, searchParams, navigate, setSearchParams]);

  const { data: fetchedAreas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: () => areaService.getAll(),
  });

  const { data: especialidades = [] } = useQuery({
    queryKey: ["especialidades"],
    queryFn: () => especialidadeService.getAll(),
  });

  const { data: diretorias = [] } = useQuery({
    queryKey: ["diretorias"],
    queryFn: () => diretoriaService.getAll().catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Colaborador, "id">) => colaboradorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      queryClient.invalidateQueries({ queryKey: ["torres"] });
      setFormOpen(false);
      toast({ title: "Colaborador cadastrado!", description: "Novo colaborador adicionado com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
  });

  // Áreas filtradas pela diretoria selecionada
  const areasFiltradas = useMemo(() => {
    if (filterDiretoria === "all") return fetchedAreas;
    return fetchedAreas.filter((a) => a.diretoria_id === filterDiretoria);
  }, [fetchedAreas, filterDiretoria]);

  // Especialidades filtradas pela área selecionada
  const especialidadesFiltradas = useMemo(() => {
    if (filterArea === "all") {
      if (filterDiretoria !== "all") {
        const areaIds = areasFiltradas.map((a) => a.id);
        return especialidades.filter((e) => areaIds.includes(e.area_id));
      }
      return especialidades;
    }
    return especialidades.filter((e) => e.area_id === filterArea);
  }, [especialidades, filterArea, filterDiretoria, areasFiltradas]);

  const filtered = useMemo(() => {
    return colaboradores
      .filter((c) => {
        const matchSearch = search ? c.nomeCompleto.toLowerCase().includes(search.toLowerCase()) : true;
        const matchDiretoria = filterDiretoria !== "all"
          ? c.area_ids.some((id) => areasFiltradas.map((a) => a.id).includes(id))
          : true;
        const matchArea = filterArea !== "all" ? c.area_ids.includes(filterArea) : true;
        const matchEspecialidade = filterEspecialidade !== "all" ? c.especialidade_id === filterEspecialidade : true;
        const matchStatus = filterStatus !== "all" ? c.status === filterStatus : true;
        return matchSearch && matchDiretoria && matchArea && matchEspecialidade && matchStatus;
      })
      .sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
  }, [colaboradores, search, filterDiretoria, filterArea, filterEspecialidade, filterStatus, areasFiltradas, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 h-3 w-3" />
      : <ChevronDown className="ml-1 h-3 w-3" />;
  };

  return (
    <PageLayout
      title="Colaboradores"
      subtitle={isLoading ? "Carregando..." : `${filtered.length} colaborador(es) encontrado(s)`}
      action={
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Colaborador
        </Button>
      }
    >
      {/* Filters */}
      <FilterBar>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          <Select value={filterDiretoria} onValueChange={(v) => { setFilterDiretoria(v); setFilterArea("all"); setFilterEspecialidade("all"); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as diretorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as diretorias</SelectItem>
              {diretorias.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterArea} onValueChange={(v) => { setFilterArea(v); setFilterEspecialidade("all"); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {areasFiltradas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterEspecialidade} onValueChange={(v) => { setFilterEspecialidade(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as especialidades</SelectItem>
              {especialidadesFiltradas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Desligado">Desligado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("nomeCompleto")} className="flex items-center hover:text-foreground transition-colors">
                    Nome <SortIcon field="nomeCompleto" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Diretoria
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Área / Especialidade
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">
                  <button onClick={() => handleSort("senioridade")} className="flex items-center hover:text-foreground transition-colors">
                    Senioridade <SortIcon field="senioridade" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("status")} className="flex items-center hover:text-foreground transition-colors">
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-10 ml-auto" /></td>
                    </tr>
                  ))
                : paginated.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        Nenhum colaborador encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )
                : paginated.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{c.nomeCompleto}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {c.area_ids.length > 0
                              ? c.area_ids.map((id) => fetchedAreas.find((a) => a.id === id)?.nome).filter(Boolean).join(", ")
                              : "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {c.diretoria_id ? (diretorias.find((d) => d.id === c.diretoria_id)?.nome ?? "—") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {c.area_ids.length > 0
                          ? c.area_ids.map((id) => fetchedAreas.find((a) => a.id === id)?.nome).filter(Boolean).join(", ")
                          : "—"}
                        {c.especialidade_id && (
                          <span className="text-xs text-muted-foreground/70 block">
                            {especialidades.find((e) => e.id === c.especialidade_id)?.nome}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{c.senioridade}</td>
                      <td className="px-4 py-3">
                        <span className={c.status === "Ativo" ? "badge-active" : "badge-inactive"}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Ver detalhes"
                          onClick={() => navigate(`/colaboradores/${c.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} — {filtered.length} registros
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New colaborador form */}
      <ColaboradorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (values) => { await createMutation.mutateAsync(values as Omit<Colaborador, "id">); }}
        initialData={null}
        isLoading={createMutation.isPending}
      />
    </PageLayout>
  );
}
