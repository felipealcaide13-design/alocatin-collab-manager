import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Torre } from "@/types/torre";
import { colaboradorService } from "@/services/colaboradorService";
import { businessUnitService } from "@/services/businessUnitService";
import { configuracaoTorreService } from "@/services/configuracaoTorreService";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    bu_id: z.string().nullable().optional(),
    liderancas: z.record(z.string(), z.string().nullable().optional()).optional(),
    descricao: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TorreFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    initialData?: Torre | null;
    isLoading?: boolean;
}

export function TorreForm({ open, onClose, onSubmit, initialData, isLoading }: TorreFormProps) {
    const isEdit = !!initialData;

    const { data: colaboradores = [] } = useQuery({
        queryKey: ["colaboradores"],
        queryFn: () => colaboradorService.getAll(),
    });

    const { data: businessUnits = [] } = useQuery({
        queryKey: ["business_units"],
        queryFn: () => businessUnitService.getAll(),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            bu_id: null,
            liderancas: {},
            descricao: "",
        },
    });

    const watchedBuId = form.watch("bu_id");

    const { data: buConfig = null, isLoading: configLoading } = useQuery({
        queryKey: ["configuracao_torre", watchedBuId],
        queryFn: () => configuracaoTorreService.getByBuId(watchedBuId!),
        enabled: !!watchedBuId && watchedBuId !== "none",
    });

    // Reset liderancas when BU changes (but not on initial load)
    const prevBuIdRef = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        const prev = prevBuIdRef.current;
        if (prev !== undefined && prev !== watchedBuId) {
            form.setValue("liderancas", {});
        }
        prevBuIdRef.current = watchedBuId;
    }, [watchedBuId, form]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    bu_id: initialData.bu_id,
                    liderancas: ((initialData as any).liderancas as Record<string, string | null>) ?? {},
                    descricao: initialData.descricao || "",
                });
            } else {
                form.reset({
                    nome: "",
                    bu_id: null,
                    liderancas: {},
                    descricao: "",
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = { ...values };
        if (payload.bu_id === "none") payload.bu_id = null;

        // Normalize "none" values in liderancas to null
        if (payload.liderancas) {
            const normalized: Record<string, string | null> = {};
            for (const [key, val] of Object.entries(payload.liderancas)) {
                normalized[key] = val === "none" ? null : (val ?? null);
            }
            payload.liderancas = normalized;
        }

        await onSubmit(payload);
    });

    const showDescricao = buConfig !== null && buConfig.descricao_habilitada === true;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Torre" : "Nova Torre"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Nome */}
                            <FormField control={form.control} name="nome" render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Nome da Torre *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Torre Pagamentos" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Business Unit */}
                            <FormField control={form.control} name="bu_id" render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Business Unit</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma</SelectItem>
                                            {businessUnits.map((bu) => (
                                                <SelectItem key={bu.id} value={bu.id}>{bu.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Dynamic leadership fields */}
                            {buConfig && buConfig.campos_lideranca.length > 0 && (
                                <div className="sm:col-span-2 space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Liderança</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {buConfig.campos_lideranca.map((campo) => {
                                            const opcoes = colaboradores.filter((c) =>
                                                c.senioridade === campo.senioridade &&
                                                (campo.diretoria_id === "" || c.diretoria_id === campo.diretoria_id)
                                            );
                                            return (
                                                <FormField
                                                    key={campo.id}
                                                    control={form.control}
                                                    name={`liderancas.${campo.id}`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{campo.nome}</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                                <FormControl>
                                                                    <SelectTrigger disabled={configLoading}>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                                    {opcoes.map((c) => (
                                                                        <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Descrição — shown only if enabled in config (or no config) */}
                            {showDescricao && (
                                <FormField control={form.control} name="descricao" render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} value={field.value || ""} placeholder="Descrição opcional..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}
                        </div>

                        <DialogFooter className="gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Torre"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
