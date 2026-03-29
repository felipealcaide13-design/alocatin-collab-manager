import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

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
    onCancel: () => void;
    onSubmit: (values: AreaFormValues) => Promise<void>;
    initialData?: Area | null;
    /** Pré-seleciona a diretoria ao criar nova área */
    defaultDiretoriaId?: string;
    /** Especialidades já cadastradas para esta área (usado na edição) */
    existingEspecialidades?: Especialidade[];
    isLoading?: boolean;
}

export function AreaForm({
    onCancel,
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
    }, [initialData, defaultDiretoriaId, existingEspecialidades]);

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
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-4">
                    {/* Nome */}
                    <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                            <FormItem>
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
                                <FormItem>
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

                    {/* Especialidades — chips */}
                    <FormField
                        control={form.control}
                        name="especialidades"
                        render={() => (
                            <FormItem>
                                <FormLabel>Especialidades</FormLabel>
                                <p className="text-xs text-muted-foreground -mt-1">
                                    Digite o nome e pressione Enter para adicionar.
                                </p>
                                <div className="flex bg-white border border-input rounded-full focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary items-center min-h-11 px-4 py-1.5 transition-all shadow-sm">
                                    <div className="flex flex-wrap gap-1.5 items-center flex-1">
                                        {especialidades.map((esp) => (
                                            <span
                                                key={esp}
                                                className="inline-flex items-center gap-1.5 bg-white border border-border shadow-sm text-foreground text-xs font-medium pl-2.5 pr-1 py-1 rounded-full group"
                                            >
                                                {esp}
                                                <button
                                                    type="button"
                                                    onClick={() => removeEsp(esp)}
                                                    className="hover:bg-destructive hover:text-white text-muted-foreground rounded-full p-0.5 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            className="flex-1 bg-transparent border-0 outline-none p-0 h-6 min-w-[120px] text-sm placeholder:text-muted-foreground"
                                            placeholder={especialidades.length === 0 ? "Ex: Frontend, Backend..." : ""}
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

                    <FormField
                        control={form.control}
                        name="lideres"
                        render={({ field }) => (
                            <FormItem>
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

                    {/* Descrição */}
                    <FormField
                        control={form.control}
                        name="descricao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Breve descrição da área..."
                                        rows={3}
                                        className="rounded-2xl bg-white border-input"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 sm:space-x-0 mt-4 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel} className="rounded-full border-[#0a678a] text-[#08526e] hover:bg-slate-50 px-6 font-medium h-10 w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="rounded-full bg-[#0a688a] hover:bg-[#08526e] px-6 font-medium h-10 text-white w-full sm:w-auto">
                        {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
