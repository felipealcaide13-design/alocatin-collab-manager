import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Torre } from "@/types/torre";
import { colaboradorService } from "@/services/colaboradorService";
import { contratoService } from "@/services/contratoService";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    contrato_id: z.string().min(1, "Selecione um contrato").nullable(),
    responsavel_negocio: z.string().nullable().optional(),
    head_tecnologia: z.string().nullable().optional(),
    head_produto: z.string().nullable().optional(),
    gerente_produto: z.string().nullable().optional(),
    gerente_design: z.string().nullable().optional(),
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

    const { data: contratos = [] } = useQuery({
        queryKey: ["contratos"],
        queryFn: () => contratoService.getAll(),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            contrato_id: null,
            responsavel_negocio: null,
            head_tecnologia: null,
            head_produto: null,
            gerente_produto: null,
            gerente_design: null,
            descricao: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    contrato_id: initialData.contrato_id,
                    responsavel_negocio: initialData.responsavel_negocio,
                    head_tecnologia: initialData.head_tecnologia,
                    head_produto: initialData.head_produto,
                    gerente_produto: initialData.gerente_produto,
                    gerente_design: initialData.gerente_design,
                    descricao: initialData.descricao || "",
                });
            } else {
                form.reset({
                    nome: "",
                    contrato_id: null,
                    responsavel_negocio: null,
                    head_tecnologia: null,
                    head_produto: null,
                    gerente_produto: null,
                    gerente_design: null,
                    descricao: "",
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

                            {/* Contrato */}
                            <FormField control={form.control} name="contrato_id" render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Contrato Relacionado *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um contrato" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {contratos.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.nome} ({c.cliente})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Responsável Negócio */}
                            <FormField control={form.control} name="responsavel_negocio" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Responsável pelo Negócio</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {colaboradores.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Head de Tecnologia */}
                            <FormField control={form.control} name="head_tecnologia" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Head de Tecnologia</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {colaboradores.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Head Produto */}
                            <FormField control={form.control} name="head_produto" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Head de Produto</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {colaboradores.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Gerente Produto */}
                            <FormField control={form.control} name="gerente_produto" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gerente de Produto</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {colaboradores.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Gerente Design (Opcional) */}
                            <FormField control={form.control} name="gerente_design" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gerente de Design</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {colaboradores.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nomeCompleto}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Descrição */}
                            <FormField control={form.control} name="descricao" render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value || ""} placeholder="Descrição opcional..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
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
