import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LideresAutocomplete } from "@/components/ui/lideres-autocomplete";
import { supabase } from "@/lib/supabase";
import { type Area } from "@/types/area";
import { type Especialidade } from "@/types/especialidade";
import { diretoriaService } from "@/services/diretoriaService";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    diretoria_id: z.string().min(1, "Selecione uma Diretoria"),
    lideres: z.array(z.string()).default([]),
    descricao: z.string().optional(),
    especialidades: z.array(z.string()).default([]),
});

export type AreaFormValues = z.infer<typeof schema>;

interface AreaFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: AreaFormValues) => Promise<void>;
    initialData?: Area | null;
    /** Pré-seleciona a diretoria ao criar nova área */
    defaultDiretoriaId?: string;
    /** Especialidades já cadastradas para esta área (usado na edição) */
    existingEspecialidades?: Especialidade[];
    isLoading?: boolean;
}

export function AreaForm({
    open,
    onClose,
    onSubmit,
    initialData,
    defaultDiretoriaId,
    existingEspecialidades = [],
    isLoading,
}: AreaFormProps) {
    const isEdit = !!initialData?.id;
    const showDiretoriaField = isEdit || !defaultDiretoriaId;
    const [espInput, setEspInput] = useState("");

    const form = useForm<AreaFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            diretoria_id: "",
            lideres: [],
            descricao: "",
            especialidades: [],
        },
    });

    const { data: colaboradores = [], isLoading: isColabsLoading } = useQuery({
        queryKey: ["colaboradores-lideres"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("colaboradores")
                .select("id, nome_completo, senioridade")
                .in("senioridade", ["Diretor(a)", "Head", "Gerente"])
                .eq("status", "Ativo");
            if (error) return [];
            return (data || []).map((c: any) => ({
                id: c.id,
                nomeCompleto: c.nome_completo,
                senioridade: c.senioridade,
            }));
        },
    });

    const { data: diretorias = [] } = useQuery({
        queryKey: ["diretorias"],
        queryFn: () => diretoriaService.getAll(),
    });

    useEffect(() => {
        if (open) {
            const espNomes = existingEspecialidades.map((e) => e.nome);
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    diretoria_id: initialData.diretoria_id ?? "",
                    lideres: initialData.lideres,
                    descricao: initialData.descricao || "",
                    especialidades: espNomes,
                });
            } else {
                form.reset({
                    nome: "",
                    diretoria_id: defaultDiretoriaId ?? "",
                    lideres: [],
                    descricao: "",
                    especialidades: [],
                });
            }
            setEspInput("");
        }
    }, [open, initialData, defaultDiretoriaId, existingEspecialidades]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit(values);
    });

    const especialidades = form.watch("especialidades");

    const addEsp = () => {
        const val = espInput.trim();
        if (val && !especialidades.includes(val)) {
            form.setValue("especialidades", [...especialidades, val]);
        }
        setEspInput("");
    };

    const handleEspKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addEsp();
        }
    };

    const removeEsp = (nome: string) => {
        form.setValue("especialidades", especialidades.filter((s) => s !== nome));
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Área" : "Nova Área"}</DialogTitle>
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
                                        <FormLabel>Nome da Área *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: Engenharia" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Diretoria */}
                            {showDiretoriaField && (
                            <FormField
                                control={form.control}
                                name="diretoria_id"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Diretoria *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {diretorias.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            )}

                            {/* Descrição */}
                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder="Breve descrição da área..." rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Especialidades — chips */}
                            <FormField
                                control={form.control}
                                name="especialidades"
                                render={() => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Especialidades</FormLabel>
                                        <p className="text-xs text-muted-foreground -mt-1">
                                            Digite o nome e pressione Enter para adicionar.
                                        </p>
                                        <div className="flex bg-background border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 items-center p-1 px-2">
                                            <div className="flex flex-wrap gap-1 items-center flex-1">
                                                {especialidades.map((esp) => (
                                                    <span
                                                        key={esp}
                                                        className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                                                    >
                                                        {esp}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEsp(esp)}
                                                            className="hover:bg-primary/20 rounded-full p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <Input
                                                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8 min-w-[140px]"
                                                    placeholder="Ex: Frontend, Backend..."
                                                    value={espInput}
                                                    onChange={(e) => setEspInput(e.target.value)}
                                                    onKeyDown={handleEspKeyDown}
                                                    onBlur={addEsp}
                                                />
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Líderes */}
                            <FormField
                                control={form.control}
                                name="lideres"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Líderes</FormLabel>
                                        <p className="text-xs text-muted-foreground -mt-1">
                                            Gerentes, Heads e Diretores ativos.
                                        </p>
                                        <FormControl>
                                            <LideresAutocomplete
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={colaboradores}
                                                isLoading={isColabsLoading}
                                            />
                                        </FormControl>
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
