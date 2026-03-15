import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { CONTRATO_STATUS, CONTRACT_TYPES, type Contrato, type ContractType } from "@/types/contrato";

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

export function ContratoForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading,
}: ContratoFormProps) {
    const isEdit = !!initialData;
    const [displayValor, setDisplayValor] = useState("");

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
        },
    });

    const contractType = form.watch("contract_type");

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
                });
                const v = initialData.valor ?? initialData.valor_total;
                if (v != null) {
                    setDisplayValor(formatarMilhares(String(v)));
                } else {
                    setDisplayValor("");
                }
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
                });
                setDisplayValor("");
            }
        }
    }, [open, initialData, form]);

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
                                                    <SelectValue placeholder="Selecione" />
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
                                                    <SelectValue placeholder="Selecione" />
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

                            {/* Torres */}
                            <FormField
                                control={form.control}
                                name="torres"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Torres</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal",
                                                            !field.value?.length && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value?.length
                                                            ? torres
                                                                .filter((t) => field.value.includes(t.id))
                                                                .map((t) => t.nome)
                                                                .join(", ")
                                                            : "Selecionar torres..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <ScrollArea className="max-h-60">
                                                    {torres.length === 0 ? (
                                                        <p className="px-4 py-3 text-sm text-muted-foreground">
                                                            Nenhuma torre cadastrada.
                                                        </p>
                                                    ) : (
                                                        torres.map((torre) => {
                                                            const selected = field.value?.includes(torre.id);
                                                            return (
                                                                <button
                                                                    key={torre.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = field.value ?? [];
                                                                        field.onChange(
                                                                            selected
                                                                                ? current.filter((id) => id !== torre.id)
                                                                                : [...current, torre.id]
                                                                        );
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "h-4 w-4 shrink-0",
                                                                            selected ? "opacity-100 text-primary" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {torre.nome}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </ScrollArea>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
