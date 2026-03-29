import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Building2, Network, Eye, Layers, GitBranch, ChevronUp, ChevronDown, ChevronsUpDown, History, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageLayout, FilterBar } from "@/components/ui/page-layout";

import { torreService } from "@/services/torreService";
import { colaboradorService } from "@/services/colaboradorService";
import { contratoService } from "@/services/contratoService";
import { areaService } from "@/services/areaService";
import { especialidadeService } from "@/services/especialidadeService";
import { businessUnitService } from "@/services/businessUnitService";

import { TorreForm } from "@/components/torres/TorreForm";
import { SquadForm } from "@/components/torres/SquadForm";
import { TorreDetailPanel } from "@/components/torres/TorreDetailPanel";
import { SquadDetailPanel } from "@/components/torres/SquadDetailPanel";
import { DeleteConfirmDialog as TorreDeleteDialog } from "@/components/torres/DeleteConfirmDialog";
import { BusinessUnitForm } from "@/components/business-units/BusinessUnitForm";
import { BusinessUnitDetailPanel } from "@/components/business-units/BusinessUnitDetailPanel";
import { DeleteConfirmDialog as BUDeleteDialog } from "@/components/business-units/DeleteConfirmDialog";
import { BUTorreConfigTab } from "@/components/business-units/BUTorreConfigTab";

import { type Torre, type Squad } from "@/types/torre";
import { type BusinessUnit } from "@/types/businessUnit";

const PAGE_SIZE = 10;

export default function BusinessUnits() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "bus");
    const [configModalOpen, setConfigModalOpen] = useState(false);

    // BU state
    const [searchBU, setSearchBU] = useState("");
    const [buFormOpen, setBuFormOpen] = useState(false);
    const [editBUTarget, setEditBUTarget] = useState<BusinessUnit | null>(null);
    const [deleteBUTarget, setDeleteBUTarget] = useState<BusinessUnit | null>(null);
    const [detailBU, setDetailBU] = useState<BusinessUnit | null>(null);

    // Chart layout state
    const [chartLayout, setChartLayout] = useState<"top" | "left" | "right" | "bottom">("top");

    // Sort state
    type SortDir = "asc" | "desc";
    const [sortBU, setSortBU] = useState<{ key: string; dir: SortDir } | null>(null);
    const [sortTorre, setSortTorre] = useState<{ key: string; dir: SortDir } | null>(null);
    const [sortSquad, setSortSquad] = useState<{ key: string; dir: SortDir } | null>(null);

    function toggleSort(
        current: { key: string; dir: SortDir } | null,
        key: string,
        setter: (v: { key: string; dir: SortDir } | null) => void
    ) {
        if (current?.key === key) {
            setter(current.dir === "asc" ? { key, dir: "desc" } : null);
        } else {
            setter({ key, dir: "asc" });
        }
    }

    function SortIcon({ col, sort }: { col: string; sort: { key: string; dir: SortDir } | null }) {
        if (sort?.key !== col) return <ChevronsUpDown className="inline ml-1 h-3.5 w-3.5 opacity-40" />;
        return sort.dir === "asc"
            ? <ChevronUp className="inline ml-1 h-3.5 w-3.5 text-primary" />
            : <ChevronDown className="inline ml-1 h-3.5 w-3.5 text-primary" />;
    }

    // Torres state
    const [searchTorre, setSearchTorre] = useState("");
    const [pageTorre, setPageTorre] = useState(1);
    const [torreFormOpen, setTorreFormOpen] = useState(false);
    const [editTorreTarget, setEditTorreTarget] = useState<Torre | null>(null);
    const [deleteTorreTarget, setDeleteTorreTarget] = useState<Torre | null>(null);
    const [detailTorre, setDetailTorre] = useState<Torre | null>(null);

    // Squads state
    const [searchSquad, setSearchSquad] = useState("");
    const [filterSquadTorre, setFilterSquadTorre] = useState("all");
    const [filterSquadContrato, setFilterSquadContrato] = useState("all");
    const [pageSquad, setPageSquad] = useState(1);
    const [squadFormOpen, setSquadFormOpen] = useState(false);
    const [editSquadTarget, setEditSquadTarget] = useState<Squad | null>(null);
    const [deleteSquadTarget, setDeleteSquadTarget] = useState<Squad | null>(null);
    const [detailSquad, setDetailSquad] = useState<Squad | null>(null);

    // Queries
    const { data: businessUnits = [], isLoading: loadingBUs } = useQuery({
        queryKey: ["business_units"],
        queryFn: () => businessUnitService.getAll().catch(() => []),
    });

    const { data: torres = [], isLoading: loadingTorres } = useQuery({
        queryKey: ["torres"],
        queryFn: () => torreService.getAllTorres().catch(() => []),
    });

    const { data: squads = [], isLoading: loadingSquads } = useQuery({
        queryKey: ["squads"],
        queryFn: () => torreService.getAllSquads().catch(() => []),
    });

    const { data: colaboradores = [] } = useQuery({
        queryKey: ["colaboradores"],
        queryFn: () => colaboradorService.getAll().catch(() => []),
    });

    const { data: contratos = [] } = useQuery({
        queryKey: ["contratos"],
        queryFn: () => contratoService.getAll().catch(() => []),
    });

    const { data: areas = [] } = useQuery({
        queryKey: ["areas"],
        queryFn: () => areaService.getAll().catch(() => []),
    });

    const { data: especialidades = [] } = useQuery({
        queryKey: ["especialidades"],
        queryFn: () => especialidadeService.getAll().catch(() => []),
    });

    // Open detail from global search
    useEffect(() => {
        const openId = searchParams.get("openId");
        const tab = searchParams.get("tab");
        if (!openId) return;
        if (tab === "squads" && squads.length > 0) {
            const found = squads.find((s) => s.id === openId);
            if (found) { setDetailSquad(found); setSearchParams({}, { replace: true }); }
        } else if (torres.length > 0) {
            const found = torres.find((t) => t.id === openId);
            if (found) { setDetailTorre(found); setSearchParams({}, { replace: true }); }
        }
    }, [torres, squads, searchParams]);

    // BU mutations
    const createBUMutation = useMutation({
        mutationFn: (data: any) => businessUnitService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["business_units"] });
            setBuFormOpen(false);
            toast({ title: "BU criada!", description: "Business Unit adicionada com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao criar", description: e.message, variant: "destructive" }),
    });

    const updateBUMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => businessUnitService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["business_units"] });
            setBuFormOpen(false);
            setEditBUTarget(null);
            toast({ title: "BU atualizada!", description: "Dados salvos com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
    });

    const deleteBUMutation = useMutation({
        mutationFn: (id: string) => businessUnitService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["business_units"] });
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
            setDeleteBUTarget(null);
            toast({ title: "BU excluída", description: "O registro foi removido." });
        },
        onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });

    // Torre mutations
    const createTorreMutation = useMutation({
        mutationFn: (data: any) => torreService.createTorre(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            setTorreFormOpen(false);
            toast({ title: "Torre cadastrada!", description: "Nova torre adicionada com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
    });

    const updateTorreMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => torreService.updateTorre(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            setTorreFormOpen(false);
            setEditTorreTarget(null);
            toast({ title: "Torre atualizada!", description: "Dados salvos com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
    });

    const deleteTorreMutation = useMutation({
        mutationFn: (id: string) => torreService.removeTorre(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
            setDeleteTorreTarget(null);
            toast({ title: "Torre excluída", description: "O registro foi removido." });
        },
        onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });

    // Squad mutations
    const createSquadMutation = useMutation({
        mutationFn: (data: any) => torreService.createSquad(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            queryClient.invalidateQueries({ queryKey: ["contratos"] });
            setSquadFormOpen(false);
            toast({ title: "Squad cadastrado!", description: "Novo squad adicionado com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
    });

    const updateSquadMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => torreService.updateSquad(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            queryClient.invalidateQueries({ queryKey: ["contratos"] });
            setSquadFormOpen(false);
            setEditSquadTarget(null);
            toast({ title: "Squad atualizado!", description: "Dados salvos com sucesso." });
        },
        onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
    });

    const deleteSquadMutation = useMutation({
        mutationFn: (id: string) => torreService.removeSquad(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["squads"] });
            queryClient.invalidateQueries({ queryKey: ["torres"] });
            queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
            setDeleteSquadTarget(null);
            toast({ title: "Squad excluído", description: "O registro foi removido." });
        },
        onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });

    // Filtered lists
    const filteredBUs = useMemo(() => {
        const list = businessUnits.filter((b) => !searchBU || b.nome.toLowerCase().includes(searchBU.toLowerCase()));
        if (!sortBU) return list.sort((a, b) => a.nome.localeCompare(b.nome));
        return [...list].sort((a, b) => {
            const av = sortBU.key === "torres" ? torres.filter(t => t.bu_id === a.id).length : (a as any)[sortBU.key] ?? "";
            const bv = sortBU.key === "torres" ? torres.filter(t => t.bu_id === b.id).length : (b as any)[sortBU.key] ?? "";
            const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
            return sortBU.dir === "asc" ? cmp : -cmp;
        });
    }, [businessUnits, searchBU, sortBU, torres]);

    const filteredTorres = useMemo(() => {
        const list = torres.filter((t) => !searchTorre || t.nome.toLowerCase().includes(searchTorre.toLowerCase()));
        if (!sortTorre) return list.sort((a, b) => a.nome.localeCompare(b.nome));
        return [...list].sort((a, b) => {
            let av: any, bv: any;
            if (sortTorre.key === "bu") {
                av = businessUnits.find(bu => bu.id === a.bu_id)?.nome ?? "";
                bv = businessUnits.find(bu => bu.id === b.bu_id)?.nome ?? "";
            } else {
                av = (a as any)[sortTorre.key] ?? "";
                bv = (b as any)[sortTorre.key] ?? "";
            }
            const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
            return sortTorre.dir === "asc" ? cmp : -cmp;
        });
    }, [torres, searchTorre, sortTorre, businessUnits]);

    const filteredSquads = useMemo(() => {
        const list = squads.filter((s) => {
            if (searchSquad && !s.nome.toLowerCase().includes(searchSquad.toLowerCase())) return false;
            if (filterSquadTorre !== "all" && s.torre_id !== filterSquadTorre) return false;
            if (filterSquadContrato !== "all" && (s as any).contrato_id !== filterSquadContrato) return false;
            return true;
        });
        if (!sortSquad) return list.sort((a, b) => a.nome.localeCompare(b.nome));
        return [...list].sort((a, b) => {
            let av: any, bv: any;
            if (sortSquad.key === "torre") {
                av = torres.find(t => t.id === a.torre_id)?.nome ?? "";
                bv = torres.find(t => t.id === b.torre_id)?.nome ?? "";
            } else if (sortSquad.key === "contrato") {
                av = (a as any).contratos?.nome ?? "";
                bv = (b as any).contratos?.nome ?? "";
            } else if (sortSquad.key === "membros") {
                av = colaboradores.filter(c => (c.squad_ids ?? []).includes(a.id)).length;
                bv = colaboradores.filter(c => (c.squad_ids ?? []).includes(b.id)).length;
            } else {
                av = (a as any)[sortSquad.key] ?? "";
                bv = (b as any)[sortSquad.key] ?? "";
            }
            const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
            return sortSquad.dir === "asc" ? cmp : -cmp;
        });
    }, [squads, searchSquad, filterSquadTorre, filterSquadContrato, sortSquad, torres]);

    const paginatedTorres = filteredTorres.slice((pageTorre - 1) * PAGE_SIZE, pageTorre * PAGE_SIZE);
    const paginatedSquads = filteredSquads.slice((pageSquad - 1) * PAGE_SIZE, pageSquad * PAGE_SIZE);

    return (
        <PageLayout
            title="Business Units"
            subtitle="Gerencie BUs, Torres e Squads."
            action={
                <div className="flex gap-4 items-center">
                    <Button variant="soft" className="rounded-full" onClick={() => navigate("/business-units/organograma")}>
                        <GitBranch className="h-4 w-4" /> Organograma
                    </Button>
                    <Button variant="soft" className="rounded-full" onClick={() => navigate("/business-units/historico")}>
                        <History className="h-4 w-4" /> Histórico
                    </Button>
                </div>
            }
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="bus">
                        <Layers className="mr-2 h-4 w-4" /> BUs
                    </TabsTrigger>
                    <TabsTrigger value="torres">
                        <Building2 className="mr-2 h-4 w-4" /> Torres
                    </TabsTrigger>
                    <TabsTrigger value="squads">
                        <Network className="mr-2 h-4 w-4" /> Squads
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bus" className="outline-none">
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button className="rounded-full w-full md:w-auto px-6 font-medium bg-[#0a688a] hover:bg-[#08526e]" onClick={() => { setEditBUTarget(null); setBuFormOpen(true); }}>
                                    <Plus className="h-4 w-4" /> Nova BU
                                </Button>
                                <Button variant="soft" size="icon" className="rounded-full" onClick={() => setConfigModalOpen(true)}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative w-full max-w-[200px] shrink-0">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar BU" value={searchBU}
                                    onChange={(e) => setSearchBU(e.target.value)} className="pl-9 bg-muted border-0 rounded-full" />
                            </div>
                        </div>

                        <div className="bg-white rounded-[16px] border border-[#EDEDED] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortBU, "nome", setSortBU)}>
                                                    Nome<SortIcon col="nome" sort={sortBU} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortBU, "torres", setSortBU)}>
                                                    Torres<SortIcon col="torres" sort={sortBU} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Descrição</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingBUs ? (
                                            [...Array(3)].map((_, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-10" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-48" /></td>
                                                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : filteredBUs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                                                    Nenhuma Business Unit encontrada.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBUs.map((bu) => (
                                                <tr key={bu.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground">{bu.nome}</td>
                                                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                        {torres.filter(t => t.bu_id === bu.id).length}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-xs">
                                                        {bu.descricao || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setDetailBU(bu)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditBUTarget(bu); setBuFormOpen(true); }}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteBUTarget(bu)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TORRES TAB */}
                <TabsContent value="torres" className="outline-none">
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button className="rounded-full w-full md:w-auto px-6 font-medium bg-[#0a688a] hover:bg-[#08526e]" onClick={() => { setEditTorreTarget(null); setTorreFormOpen(true); }}>
                                    <Plus className="h-4 w-4" /> Nova torre
                                </Button>
                                <Button variant="soft" size="icon" className="rounded-full" onClick={() => setConfigModalOpen(true)}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative w-full max-w-[200px] shrink-0">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar torre" value={searchTorre}
                                    onChange={(e) => { setSearchTorre(e.target.value); setPageTorre(1); }} className="pl-9 bg-muted border-0 rounded-full" />
                            </div>
                        </div>

                        <div className="bg-white rounded-[16px] border border-[#EDEDED] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortTorre, "nome", setSortTorre)}>
                                                    Nome da Torre<SortIcon col="nome" sort={sortTorre} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortTorre, "bu", setSortTorre)}>
                                                    BU<SortIcon col="bu" sort={sortTorre} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortTorre, "squads_count", setSortTorre)}>
                                                    Squads<SortIcon col="squads_count" sort={sortTorre} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Contratos</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingTorres ? (
                                            [...Array(3)].map((_, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : paginatedTorres.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhuma torre encontrada.</td>
                                            </tr>
                                        ) : (
                                            paginatedTorres.map((t) => {
                                                const torreSquads = squads.filter(s => s.torre_id === t.id);
                                                const torreContratos = [...new Set(torreSquads.map(s => s.contrato_id).filter(Boolean))]
                                                    .map(cid => contratos.find(c => c.id === cid)?.nome)
                                                    .filter(Boolean);
                                                return (
                                                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                                                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                            {businessUnits.find(b => b.id === t.bu_id)?.nome ?? "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{t.squads_count}</td>
                                                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                            {torreContratos.length > 0 ? torreContratos.join(", ") : "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setDetailTorre(t)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditTorreTarget(t); setTorreFormOpen(true); }}>
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTorreTarget(t)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* SQUADS TAB */}
                <TabsContent value="squads" className="outline-none">
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border space-y-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <Button className="rounded-full w-full md:w-auto px-6 font-medium bg-[#0a688a] hover:bg-[#08526e]" onClick={() => { setEditSquadTarget(null); setSquadFormOpen(true); }} disabled={torres.length === 0}>
                                <Plus className="h-4 w-4" /> Nova squad
                            </Button>

                            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                                <Select value={filterSquadTorre} onValueChange={(v) => { setFilterSquadTorre(v); setPageSquad(1); }}>
                                    <SelectTrigger className="w-full md:w-[180px] h-10 rounded-full font-normal">
                                        <SelectValue placeholder="Todas as Torres" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Torres</SelectItem>
                                        {torres.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterSquadContrato} onValueChange={(v) => { setFilterSquadContrato(v); setPageSquad(1); }}>
                                    <SelectTrigger className="w-full md:w-[180px] h-10 rounded-full font-normal">
                                        <SelectValue placeholder="Todos os Contratos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Contratos</SelectItem>
                                        {contratos.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative w-full max-w-[200px] shrink-0">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar squad"
                                        value={searchSquad}
                                        onChange={(e) => { setSearchSquad(e.target.value); setPageSquad(1); }}
                                        className="pl-9 bg-muted border-0 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[16px] border border-[#EDEDED] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortSquad, "nome", setSortSquad)}>
                                                    Nome da Squad<SortIcon col="nome" sort={sortSquad} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortSquad, "torre", setSortSquad)}>
                                                    Torre<SortIcon col="torre" sort={sortSquad} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortSquad, "contrato", setSortSquad)}>
                                                    Contrato<SortIcon col="contrato" sort={sortSquad} />
                                                </button>
                                            </th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort(sortSquad, "membros", setSortSquad)}>
                                                    Membros<SortIcon col="membros" sort={sortSquad} />
                                                </button>
                                            </th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingSquads ? (
                                            [...Array(3)].map((_, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></td>
                                                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : paginatedSquads.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhuma squad encontrada.</td>
                                            </tr>
                                        ) : (
                                            paginatedSquads.map((s) => (
                                                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground">{s.nome}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{torres.find(t => t.id === s.torre_id)?.nome || "—"}</td>
                                                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{(s as any).contratos?.nome || "—"}</td>
                                                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{colaboradores.filter(c => (c.squad_ids ?? []).includes(s.id)).length}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setDetailSquad(s)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditSquadTarget(s); setSquadFormOpen(true); }}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteSquadTarget(s)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Config Modal */}
            <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#e0e0e0] shadow-xl sm:rounded-[24px] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg text-[#262626] font-semibold tracking-normal">{activeTab === "bus" ? "Configuração de BU" : "Configuração de Torre"}</DialogTitle>
                        <DialogDescription>
                            Configure os campos que serão solicitados no formulário.
                        </DialogDescription>
                    </DialogHeader>
                    {configModalOpen && (
                        <BUTorreConfigTab 
                            businessUnits={businessUnits} 
                            defaultTab={activeTab === "bus" ? "bu" : "torre"} 
                            hideTabs={true} 
                            onCancel={() => setConfigModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Business Unit creation/edit modal */}
            <Dialog open={buFormOpen} onOpenChange={(v) => { if (!v) { setBuFormOpen(false); setEditBUTarget(null); } }}>
                <DialogContent className="max-w-lg overflow-y-auto bg-white border border-[#e0e0e0] shadow-xl sm:rounded-[24px] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg text-[#262626] font-semibold tracking-normal">{editBUTarget ? "Editar Business Unit" : "Nova Business Unit"}</DialogTitle>
                    </DialogHeader>
                    <BusinessUnitForm
                        onCancel={() => { setBuFormOpen(false); setEditBUTarget(null); }}
                        onSubmit={async (values) => {
                            if (editBUTarget) await updateBUMutation.mutateAsync({ id: editBUTarget.id, data: values });
                            else await createBUMutation.mutateAsync(values);
                            setBuFormOpen(false);
                            setEditBUTarget(null);
                        }}
                        initialData={editBUTarget}
                        isLoading={createBUMutation.isPending || updateBUMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            <BUDeleteDialog
                open={!!deleteBUTarget}
                nome={deleteBUTarget?.nome ?? ""}
                onClose={() => setDeleteBUTarget(null)}
                onConfirm={() => deleteBUTarget && deleteBUMutation.mutate(deleteBUTarget.id)}
                isLoading={deleteBUMutation.isPending}
            />

            <BusinessUnitDetailPanel
                bu={detailBU}
                open={!!detailBU}
                onClose={() => setDetailBU(null)}
                torres={torres}
                squads={squads}
                colaboradores={colaboradores}
            />

            {/* Torre creation/edit modal */}
            <Dialog open={torreFormOpen} onOpenChange={(v) => { if (!v) { setTorreFormOpen(false); setEditTorreTarget(null); } }}>
                <DialogContent className="max-w-lg overflow-y-auto bg-white border border-[#e0e0e0] shadow-xl sm:rounded-[24px] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg text-[#262626] font-semibold tracking-normal">{editTorreTarget ? "Editar Torre" : "Nova Torre"}</DialogTitle>
                    </DialogHeader>
                    <TorreForm
                        onCancel={() => { setTorreFormOpen(false); setEditTorreTarget(null); }}
                        onSubmit={async (values) => {
                            if (editTorreTarget) await updateTorreMutation.mutateAsync({ id: editTorreTarget.id, data: values });
                            else await createTorreMutation.mutateAsync(values);
                            setTorreFormOpen(false);
                            setEditTorreTarget(null);
                        }}
                        initialData={editTorreTarget}
                        isLoading={createTorreMutation.isPending || updateTorreMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            <TorreDeleteDialog
                open={!!deleteTorreTarget}
                type="torre"
                onClose={() => setDeleteTorreTarget(null)}
                onConfirm={() => deleteTorreTarget && deleteTorreMutation.mutate(deleteTorreTarget.id)}
                nome={deleteTorreTarget?.nome ?? ""}
                isLoading={deleteTorreMutation.isPending}
            />

            <TorreDetailPanel
                torre={detailTorre}
                open={!!detailTorre}
                onClose={() => setDetailTorre(null)}
                squads={squads}
                colaboradores={colaboradores}
                contratos={contratos}
                businessUnits={businessUnits}
            />

            {/* Squad creation/edit modal */}
            <Dialog open={squadFormOpen} onOpenChange={(v) => { if (!v) { setSquadFormOpen(false); setEditSquadTarget(null); } }}>
                <DialogContent className="max-w-lg overflow-y-auto bg-white border border-[#e0e0e0] shadow-xl sm:rounded-[24px] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg text-[#262626] font-semibold tracking-normal">{editSquadTarget ? "Editar Squad" : "Novo Squad"}</DialogTitle>
                    </DialogHeader>
                    <SquadForm
                        onCancel={() => { setSquadFormOpen(false); setEditSquadTarget(null); }}
                        onSubmit={async (values) => {
                            if (editSquadTarget) {
                                // Calcula membros anteriores (fonte da verdade: colaboradores)
                                const oldMemberIds = colaboradores
                                    .filter((c) => (c.squad_ids ?? []).includes(editSquadTarget.id))
                                    .map((c) => c.id);
                                await updateSquadMutation.mutateAsync({ id: editSquadTarget.id, data: values });
                                await colaboradorService.syncSquadMembers(editSquadTarget.id, oldMemberIds, values.membros ?? []);
                                queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
                            } else {
                                await createSquadMutation.mutateAsync(values);
                            }
                            setSquadFormOpen(false);
                            setEditSquadTarget(null);
                        }}
                        initialData={editSquadTarget}
                        isLoading={createSquadMutation.isPending || updateSquadMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            <TorreDeleteDialog
                open={!!deleteSquadTarget}
                type="squad"
                onClose={() => setDeleteSquadTarget(null)}
                onConfirm={() => deleteSquadTarget && deleteSquadMutation.mutate(deleteSquadTarget.id)}
                nome={deleteSquadTarget?.nome ?? ""}
                isLoading={deleteSquadMutation.isPending}
            />

            <SquadDetailPanel
                squad={detailSquad}
                open={!!detailSquad}
                onClose={() => setDetailSquad(null)}
                torres={torres}
                colaboradores={colaboradores}
                contratos={contratos}
                areas={areas}
                especialidades={especialidades}
            />
        </PageLayout>
    );
}
