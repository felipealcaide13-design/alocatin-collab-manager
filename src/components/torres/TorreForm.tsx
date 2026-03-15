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
import { areaService } from "@/services/areaService";
import { businessUnitService } from "@/services/businessUnitService";
import { filterColaboradores, filterColaboradoresBySenioridades } from "@/utils/filterColaboradores";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    bu_id: z.string().nullable().optional(),
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

    const { data: colaboradores = [], isLoading: colaboradoresLoading } = useQuery({
        queryKey: ["colaboradores"],
        queryFn: () => colaboradorService.getAll(),
    });

    const { data: areas = [], isLoading: areasLoading } = useQuery({
        queryKey: ["areas"],
        queryFn: () => areaService.getAll(),
    });

    const { data: businessUnits = [] } = useQuery({
        queryKey: ["business_units"],
        queryFn: () => businessUnitService.getAll(),
    });

    const headsTecnologia = filterColaboradores(colaboradores, areas, "Head", "tecnologia");
    const headsProduto = filterColaboradores(colaboradores, areas, "Head", "produto");
    const gerentesProduto = filterColaboradores(colaboradores, areas, "Gerente", "produto");
    const gerentesDesign = filterColaboradores(colaboradores, areas, "Gerente", "design");
    const responsaveisNegocio = filterColaboradoresBySenioridades(colaboradores, ["C-level", "Diretor(a)", "Head"]);


    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            bu_id: null,
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
                    bu_id: initialData.bu_id,
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
                    bu_id: null,
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
        const payload = { ...values };
        if (payload.bu_id === "none") payload.bu_id = null;
        if (payload.responsavel_negocio === "none") payload.responsavel_negocio = null;
        if (payload.head_tecnologia === "none") payload.head_tecnologia = null;
        if (payload.head_produto === "none") payload.head_produto = null;
        if (payload.gerente_produto === "none") payload.gerente_produto = null;
        if (payload.gerente_design === "none") payload.gerente_design = null;
        await onSubmit(payload);
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

                            {/* Business Unit */}
                            <FormField control={form.control} name="bu_id" render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Business Unit</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione a BU" /></SelectTrigger>
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


                            {/* Responsável Negócio */}
                            <FormField control={form.control} name="responsavel_negocio" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Responsável pelo Negócio</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger disabled={colaboradoresLoading || areasLoading}><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {responsaveisNegocio.map((c) => (
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
                                            <SelectTrigger disabled={colaboradoresLoading || areasLoading}><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {headsTecnologia.map((c) => (
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
                                            <SelectTrigger disabled={colaboradoresLoading || areasLoading}><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {headsProduto.map((c) => (
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
                                            <SelectTrigger disabled={colaboradoresLoading || areasLoading}><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {gerentesProduto.map((c) => (
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
                                            <SelectTrigger disabled={colaboradoresLoading || areasLoading}><SelectValue placeholder="Selecione o Colaborador" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {gerentesDesign.map((c) => (
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
