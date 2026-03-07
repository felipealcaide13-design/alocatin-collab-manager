import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { AreaForm } from "@/components/areas/AreaForm";
import { DeleteConfirmDialog } from "@/components/areas/DeleteConfirmDialog";
import { areaService } from "@/services/areaService";
import { supabase } from "@/lib/supabase";
import { PILARES, type Pilar } from "@/types/colaborador";
import { type Area } from "@/types/area";

type SortField = "nome" | "pilar";
type SortDir = "asc" | "desc";

export default function Areas() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState("");
    const [filterPilar, setFilterPilar] = useState<string>("all");

    // Sorting
    const [sortField, setSortField] = useState<SortField>("nome");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Pagination (Server side or client side, I will implement client side over fetching all to mirror Colaboradores)
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    // Modals
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Area | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);

    const { data: areas = [], isLoading } = useQuery({
        queryKey: ["areas"],
        queryFn: async () => {
            try {
                const res = await areaService.getAll();
                return res;
            } catch (err) {
                console.warn("Failed to fetch areas from Supabase, maybe not seeded?", err);
                return [];
            }
        },
    });

    const { data: colaboradores = [] } = useQuery({
        queryKey: ["colaboradores-lideres"],
        queryFn: async () => {
            const { data, error } = await supabase.from('colaboradores').select('id, nomeCompleto');
            if (error) return [];
            return data || [];
        },
    });

    const getLideresNames = (lideresIds: string[]) => {
        if (!lideresIds || lideresIds.length === 0) return "-";
        return lideresIds
            .map((id) => colaboradores.find((c) => c.id === id)?.nomeCompleto || "?")
            .join(", ");
    };

    const createMutation = useMutation({
        mutationFn: (data: Omit<Area, "id" | "created_at">) => areaService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
            setFormOpen(false);
            toast({ title: "Área cadastrada!", description: "Nova área adicionada com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Area, "id" | "created_at">> }) =>
            areaService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
            setFormOpen(false);
            setEditTarget(null);
            toast({ title: "Área atualizada!", description: "Dados salvos com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => areaService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
            setDeleteTarget(null);
            toast({ title: "Área excluída", description: "O registro foi removido." });
        },
        onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });

    const filtered = useMemo(() => {
        return areas
            .filter((a) => {
                const matchSearch = search
                    ? a.nome.toLowerCase().includes(search.toLowerCase())
                    : true;
                const matchPilar = filterPilar !== "all" ? a.pilar === filterPilar : true;
                return matchSearch && matchPilar;
            })
            .sort((a, b) => {
                const av = a[sortField] ?? "";
                const bv = b[sortField] ?? "";
                return sortDir === "asc"
                    ? String(av).localeCompare(String(bv))
                    : String(bv).localeCompare(String(av));
            });
    }, [areas, search, filterPilar, sortField, sortDir]);

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

    const handleFormSubmit = async (values: Omit<Area, "id" | "created_at">) => {
        if (editTarget) {
            await updateMutation.mutateAsync({ id: editTarget.id, data: values });
        } else {
            await createMutation.mutateAsync(values);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Áreas</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isLoading ? "Carregando..." : `${filtered.length} área(s) encontrada(s)`}
                    </p>
                </div>
                <Button
                    onClick={() => { setEditTarget(null); setFormOpen(true); }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Área
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9"
                        />
                    </div>

                    <Select value={filterPilar} onValueChange={(v) => { setFilterPilar(v); setPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os pilares" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os pilares</SelectItem>
                            {PILARES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

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
                                        onClick={() => handleSort("pilar")}
                                        className="flex items-center hover:text-foreground transition-colors"
                                    >
                                        Pilar <SortIcon field="pilar" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                    Líderes
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">
                                    Subáreas Possíveis
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
                                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                                    </tr>
                                ))
                                : paginated.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                                Nenhuma área encontrada com os filtros aplicados. Tente cadastrar uma ou rodar o Seed.
                                            </td>
                                        </tr>
                                    )
                                    : paginated.map((a) => (
                                        <tr
                                            key={a.id}
                                            className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{a.nome}</div>
                                                <div className="text-xs text-muted-foreground md:hidden">{a.pilar}</div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.pilar}</td>
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell min-w-[200px] max-w-[300px] truncate">
                                                {getLideresNames(a.lideres)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {a.subareas_possiveis && a.subareas_possiveis.length > 0
                                                        ? a.subareas_possiveis.map(sa => (
                                                            <span key={sa} className="inline-flex bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                                                                {sa}
                                                            </span>
                                                        ))
                                                        : "-"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => { setEditTarget(a); setFormOpen(true); }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteTarget(a)}
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
            <AreaForm
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
        </div>
    );
}
