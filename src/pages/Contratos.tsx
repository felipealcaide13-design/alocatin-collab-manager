import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Download, Eye } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";

import { ContratoForm } from "@/components/contratos/ContratoForm";
import { ContratoDetailPanel } from "@/components/contratos/ContratoDetailPanel";
import { DeleteConfirmDialog } from "@/components/contratos/DeleteConfirmDialog";
import { contratoService } from "@/services/contratoService";
import { torreService } from "@/services/torreService";
import { type Contrato, CONTRATO_STATUS } from "@/types/contrato";

type SortField = "nome" | "cliente" | "status" | "valor" | "data_fim";
type SortDir = "asc" | "desc";

export default function Contratos() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters
    const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterCliente, setFilterCliente] = useState<string>("all");

    // Sorting
    const [sortField, setSortField] = useState<SortField>("nome");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    // Modals
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Contrato | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Contrato | null>(null);
    const [detailTarget, setDetailTarget] = useState<Contrato | null>(null);

    const { data: contratos = [], isLoading } = useQuery({
        queryKey: ["contratos"],
        queryFn: () => contratoService.getAll(),
    });

    const { data: torres = [] } = useQuery({
        queryKey: ["torres"],
        queryFn: () => torreService.getAllTorres().catch(() => []),
    });

    const { data: squads = [] } = useQuery({
        queryKey: ["squads"],
        queryFn: () => torreService.getAllSquads().catch(() => []),
    });

    // Clear URL param after applying search from global search
    useEffect(() => {
        if (searchParams.get("search")) {
            setSearchParams({}, { replace: true });
        }
    }, []);

    const createMutation = useMutation({
        mutationFn: (data: Omit<Contrato, "id" | "created_at">) => contratoService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contratos"] });
            setFormOpen(false);
            toast({ title: "Contrato cadastrado!", description: "Novo contrato adicionado." });
        },
        onError: (e: Error) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Contrato, "id" | "created_at">> }) =>
            contratoService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contratos"] });
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            setFormOpen(false);
            setEditTarget(null);
            toast({ title: "Contrato atualizado!", description: "Dados alterados com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => contratoService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contratos"] });
            setDeleteTarget(null);
            toast({ title: "Contrato removido", description: "Registro excluído permanentemente." });
        },
        onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });

    const uniqueClientes = useMemo(() => Array.from(new Set(contratos.map(c => c.cliente))).sort(), [contratos]);

    const filtered = useMemo(() => {
        return contratos
            .filter((c) => {
                const matchSearch = search
                    ? c.nome.toLowerCase().includes(search.toLowerCase()) || c.cliente.toLowerCase().includes(search.toLowerCase())
                    : true;
                const matchStatus = filterStatus !== "all" ? c.status === filterStatus : true;
                const matchCliente = filterCliente !== "all" ? c.cliente === filterCliente : true;
                return matchSearch && matchStatus && matchCliente;
            })
            .sort((a, b) => {
                const av = a[sortField] ?? "";
                const bv = b[sortField] ?? "";

                if (sortField === "valor") {
                    return sortDir === "asc" ? (Number(av) || 0) - (Number(bv) || 0) : (Number(bv) || 0) - (Number(av) || 0);
                }

                return sortDir === "asc"
                    ? String(av).localeCompare(String(bv))
                    : String(bv).localeCompare(String(av));
            });
    }, [contratos, search, filterStatus, filterCliente, sortField, sortDir]);

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

    const handleExportCSV = () => {
        if (filtered.length === 0) {
            toast({ title: "Sem dados", description: "Nenhum contrato para exportar." });
            return;
        }
        const header = ["Nome", "Cliente", "Status", "Valor Total", "Data Início", "Data Fim"];
        const rows = filtered.map(c => [
            `"${c.nome}"`,
            `"${c.cliente}"`,
            c.status,
            c.valor || 0,
            c.data_inicio,
            c.data_fim || ""
        ]);

        const csvStr = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `contratos-${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val: number | null) => {
        if (val == null) return "-";
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        // Using string manipulation to return correct format ignoring timezones
        const [year, month, day] = dateString.split("-");
        if (!year || !month || !day) return dateString;
        return `${day}/${month}/${year}`;
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Ativo': return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case 'Encerrado': return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
            case 'Pausado': return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const handleFormSubmit = async (values: Omit<Contrato, "id" | "created_at">) => {
        if (editTarget) {
            await updateMutation.mutateAsync({ id: editTarget.id, data: values });
        } else {
            await createMutation.mutateAsync(values);
        }
    };

    return (
        <PageLayout
            title="Projetos Contratuais"
            subtitle={isLoading ? "Carregando..." : `${filtered.length} contrato(s) encontrado(s)`}
            action={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Contrato
                    </Button>
                </div>
            }
        >
            {/* Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou cliente..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9"
                        />
                    </div>

                    <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            {CONTRATO_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterCliente} onValueChange={(v) => { setFilterCliente(v); setPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos clientes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos clientes</SelectItem>
                            {uniqueClientes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                                    <button
                                        onClick={() => handleSort("nome")}
                                        className="flex items-center hover:text-foreground transition-colors"
                                    >
                                        Nome <SortIcon field="nome" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                                    <button
                                        onClick={() => handleSort("cliente")}
                                        className="flex items-center hover:text-foreground transition-colors"
                                    >
                                        Cliente <SortIcon field="cliente" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    <button
                                        onClick={() => handleSort("status")}
                                        className="flex items-center hover:text-foreground transition-colors"
                                    >
                                        Status <SortIcon field="status" />
                                    </button>
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                    <button
                                        onClick={() => handleSort("valor")}
                                        className="flex items-center justify-end hover:text-foreground transition-colors ml-auto"
                                    >
                                        Valor <SortIcon field="valor" />
                                    </button>
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                    Fim
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                                    </tr>
                                ))
                                : paginated.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                Nenhum contrato encontrado.
                                            </td>
                                        </tr>
                                    )
                                    : paginated.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{c.nome}</div>
                                                <div className="text-xs text-muted-foreground md:hidden">{c.cliente}</div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.cliente}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-right font-mono text-xs">
                                                <div>{formatCurrency(c.valor)}</div>
                                                <div className="text-[10px] opacity-60">{c.contract_type === "Aberto" ? "mensal" : "total"}</div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-right text-xs">
                                                {formatDate(c.data_fim)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        title="Ver detalhes"
                                                        onClick={() => setDetailTarget(c)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => { setEditTarget(c); setFormOpen(true); }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteTarget(c)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Próxima
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ContratoForm
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditTarget(null); }}
                onSubmit={handleFormSubmit}
                initialData={editTarget}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                nome={deleteTarget?.nome ?? ""}
                isLoading={deleteMutation.isPending}
            />

            <ContratoDetailPanel
                contrato={detailTarget}
                open={!!detailTarget}
                onClose={() => setDetailTarget(null)}
                torres={torres}
                squads={squads}
            />
        </PageLayout>
    );
}
