import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { CONTRATO_STATUS, type Contrato } from "@/types/contrato";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    cliente: z.string().min(2, "Digite o nome do cliente"),
    valor_total: z.coerce.number().nullable().optional(), // Using coerce number to handle string -> number input
    data_inicio: z.string().min(1, "Data de início é obrigatória"),
    data_fim: z.string().nullable().optional(),
    status: z.enum(["Ativo", "Encerrado", "Pausado"]),
    descricao: z.string().nullable().optional(),
    torres: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface ContratoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    initialData?: Contrato | null;
    isLoading?: boolean;
}

export function ContratoForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading,
}: ContratoFormProps) {
    const isEdit = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            cliente: "",
            valor_total: null,
            data_inicio: new Date().toISOString().split("T")[0],
            data_fim: null,
            status: "Ativo",
            descricao: "",
            torres: [],
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    cliente: initialData.cliente,
                    valor_total: initialData.valor_total,
                    data_inicio: initialData.data_inicio,
                    data_fim: initialData.data_fim,
                    status: initialData.status,
                    descricao: initialData.descricao || "",
                    torres: initialData.torres || [],
                });
            } else {
                form.reset({
                    nome: "",
                    cliente: "",
                    valor_total: null,
                    data_inicio: new Date().toISOString().split("T")[0],
                    data_fim: null,
                    status: "Ativo",
                    descricao: "",
                    torres: [],
                });
            }
        }
    }, [open, initialData, form]);

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

                            {/* Valor */}
                            <FormField
                                control={form.control}
                                name="valor_total"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Total (R$)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                type="number"
                                                step="0.01"
                                                placeholder="Ex: 2500000.00"
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
                                        <FormLabel>Data de Fim (Opcional)</FormLabel>
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

                            {/* Torres (Futuro) */}
                            <FormField
                                control={form.control}
                                name="torres"
                                render={() => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Torres (Apenas visualização futura)</FormLabel>
                                        <div className="border rounded-md bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                                            <p>Módulo de Torres/Squads em desenvolvimento.</p>
                                            <p>As futuras associações aparecerão aqui.</p>
                                        </div>
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
