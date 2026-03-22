import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { torreService } from "@/services/torreService";
import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CONTRATO_STATUS, CONTRACT_TYPES, type Contrato, type TorreSquadSelection } from "@/types/contrato";
import type { Torre, Squad } from "@/types/torre";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    cliente: z.string().min(2, "Digite o nome do cliente"),
    contract_type: z.enum(["Aberto", "Fechado"]),
    valor: z.preprocess(
        (v) => {
            if (v === "" || v === null || v === undefined) return null;
            const cleaned = String(v).replace(/\./g, "");
            const n = parseInt(cleaned, 10);
            return isNaN(n) ? null : n;
        },
        z.number().int().nullable().optional()
    ),
    data_inicio: z.string().min(1, "Data de início é obrigatória"),
    data_fim: z.string().nullable().optional(),
    status: z.enum(["Ativo", "Encerrado", "Pausado"]),
    descricao: z.string().nullable().optional(),
    torres: z.array(z.string()).default([]),
    squads_ids: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
    if (data.contract_type === "Fechado" && !data.data_fim) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Data de Fim é obrigatória para contratos Fechados",
            path: ["data_fim"],
        });
    }
});

type FormValues = z.infer<typeof schema>;

interface ContratoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    initialData?: Contrato | null;
    isLoading?: boolean;
}

const formatarMilhares = (digits: string): string => {
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ─── Torre+Squad row component ───────────────────────────────────────────────

interface TorreRowProps {
    torres: Torre[];
    usedTorreIds: string[];
    selection: TorreSquadSelection;
    onChange: (sel: TorreSquadSelection) => void;
    onRemove: () => void;
}

function TorreRow({ torres, usedTorreIds, selection, onChange, onRemove }: TorreRowProps) {
    const torre = torres.find((t) => t.id === selection.torre_id);
    const squads: Squad[] = torre?.squads ?? [];

    const availableTorres = torres.filter(
        (t) => t.id === selection.torre_id || !usedTorreIds.includes(t.id)
    );

    const handleTorreChange = (torreId: string) => {
        onChange({ torre_id: torreId, squad_ids: [] });
    };

    const toggleSquad = (squadId: string) => {
        const current = selection.squad_ids;
        const next = current.includes(squadId)
            ? current.filter((id) => id !== squadId)
            : [...current, squadId];
        onChange({ ...selection, squad_ids: next });
    };

    const squadLabel = () => {
        if (!torre) return "Selecionar squads...";
        if (selection.squad_ids.length === 0) return "Todas as squads";
        return squads
            .filter((s) => selection.squad_ids.includes(s.id))
            .map((s) => s.nome)
            .join(", ");
    };

    return (
        <div className="flex items-start gap-2 rounded-lg border bg-muted/10 p-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Torre select */}
                <Select value={selection.torre_id} onValueChange={handleTorreChange}>
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecionar torre..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTorres.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Squad multi-select */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            type="button"
                            disabled={!torre}
                            className={cn(
                                "h-9 w-full justify-between font-normal text-left",
                                !torre && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span className="truncate text-sm">
                                {selection.squad_ids.length === 0
                                    ? <span className="text-muted-foreground">Todas as squads</span>
                                    : squadLabel()}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                        <ScrollArea className="max-h-52">
                            {squads.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                    Nenhuma squad nesta torre.
                                </p>
                            ) : (
                                <>
                                    <p className="px-3 py-2 text-xs text-muted-foreground border-b">
                                        Deixe vazio para incluir todas
                                    </p>
                                    {squads.map((squad) => {
                                        const selected = selection.squad_ids.includes(squad.id);
                                        return (
                                            <button
                                                key={squad.id}
                                                type="button"
                                                onClick={() => toggleSquad(squad.id)}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4 shrink-0",
                                                        selected ? "opacity-100 text-primary" : "opacity-0"
                                                    )}
                                                />
                                                {squad.nome}
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ContratoForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading,
}: ContratoFormProps) {
    const isEdit = !!initialData;
    const [displayValor, setDisplayValor] = useState("");
    const [torreSelections, setTorreSelections] = useState<TorreSquadSelection[]>([]);

    const { data: torres = [] } = useQuery({
        queryKey: ["torres"],
        queryFn: () => torreService.getAllTorres().catch(() => []),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            cliente: "",
            contract_type: "Fechado",
            valor: null,
            data_inicio: new Date().toISOString().split("T")[0],
            data_fim: null,
            status: "Ativo",
            descricao: "",
            torres: [],
            squads_ids: [],
        },
    });

    const contractType = form.watch("contract_type");

    // Build TorreSquadSelection[] from initialData
    const buildSelectionsFromInitial = (data: Contrato, allTorres: Torre[]): TorreSquadSelection[] => {
        const torreIds = data.torres ?? [];
        const squadIds = data.squads_ids ?? [];
        return torreIds.map((torreId) => {
            const torre = allTorres.find((t) => t.id === torreId);
            const torresSquadIds = (torre?.squads ?? []).map((s) => s.id);
            const selectedSquads = squadIds.filter((id) => torresSquadIds.includes(id));
            return { torre_id: torreId, squad_ids: selectedSquads };
        });
    };

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    cliente: initialData.cliente,
                    contract_type: initialData.contract_type ?? "Fechado",
                    valor: initialData.valor ?? initialData.valor_total,
                    data_inicio: initialData.data_inicio,
                    data_fim: initialData.data_fim,
                    status: initialData.status,
                    descricao: initialData.descricao || "",
                    torres: initialData.torres || [],
                    squads_ids: initialData.squads_ids || [],
                });
                const v = initialData.valor ?? initialData.valor_total;
                setDisplayValor(v != null ? formatarMilhares(String(v)) : "");
                setTorreSelections(buildSelectionsFromInitial(initialData, torres));
            } else {
                form.reset({
                    nome: "",
                    cliente: "",
                    contract_type: "Fechado",
                    valor: null,
                    data_inicio: new Date().toISOString().split("T")[0],
                    data_fim: null,
                    status: "Ativo",
                    descricao: "",
                    torres: [],
                    squads_ids: [],
                });
                setDisplayValor("");
                setTorreSelections([]);
            }
        }
    }, [open, initialData, torres, form]);

    // Sync torreSelections → form fields
    useEffect(() => {
        const torreIds = torreSelections.map((s) => s.torre_id).filter(Boolean);
        const squadIds = torreSelections.flatMap((s) => s.squad_ids);
        form.setValue("torres", torreIds);
        form.setValue("squads_ids", squadIds);
    }, [torreSelections, form]);

    const usedTorreIds = torreSelections.map((s) => s.torre_id);

    const addTorreRow = () => {
        const available = torres.find((t) => !usedTorreIds.includes(t.id));
        if (!available) return;
        setTorreSelections((prev) => [...prev, { torre_id: available.id, squad_ids: [] }]);
    };

    const updateTorreRow = (index: number, sel: TorreSquadSelection) => {
        setTorreSelections((prev) => prev.map((s, i) => (i === index ? sel : s)));
    };

    const removeTorreRow = (index: number) => {
        setTorreSelections((prev) => prev.filter((_, i) => i !== index));
    };

    const handleValorChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldOnChange: (value: string) => void
    ) => {
        const digits = e.target.value.replace(/\D/g, "");
        const formatted = formatarMilhares(digits);
        setDisplayValor(formatted);
        fieldOnChange(formatted);
    };

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit(values);
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Nome */}
                            <FormField
                                control={form.control}
                                name="nome"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Nome do Contrato *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: BancoX Core Banking" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Cliente */}
                            <FormField
                                control={form.control}
                                name="cliente"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cliente *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: BancoX" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Tipo de Contrato */}
                            <FormField
                                control={form.control}
                                name="contract_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Contrato *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CONTRACT_TYPES.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Valor */}
                            <FormField
                                control={form.control}
                                name="valor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {contractType === "Aberto" ? "Valor Mensal (R$)" : "Valor Total (R$)"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                value={displayValor}
                                                onChange={(e) => handleValorChange(e, field.onChange)}
                                                placeholder="Ex: 2.500.000"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Data Inicio */}
                            <FormField
                                control={form.control}
                                name="data_inicio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Início *</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Data Fim */}
                            <FormField
                                control={form.control}
                                name="data_fim"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Data de Fim {contractType === "Fechado" ? "*" : "(Opcional)"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CONTRATO_STATUS.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Descrição */}
                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} value={field.value || ""} placeholder="Breve descrição do contrato..." rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Torres + Squads */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium">Torres e Squads</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addTorreRow}
                                    disabled={usedTorreIds.length >= torres.length || torres.length === 0}
                                    className="h-8 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Adicionar Torre
                                </Button>
                            </div>

                            {torreSelections.length === 0 ? (
                                <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-center">
                                    Nenhuma torre vinculada. Clique em "Adicionar Torre" para associar.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {torreSelections.map((sel, idx) => (
                                        <TorreRow
                                            key={idx}
                                            torres={torres}
                                            usedTorreIds={usedTorreIds}
                                            selection={sel}
                                            onChange={(updated) => updateTorreRow(idx, updated)}
                                            onRemove={() => removeTorreRow(idx)}
                                        />
                                    ))}
                                </div>
                            )}

                            {torreSelections.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Deixe o campo de squads vazio para incluir todas as squads da torre no contrato.
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
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
