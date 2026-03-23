import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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
import { LideresAutocomplete } from "@/components/ui/lideres-autocomplete";
import { supabase } from "@/lib/supabase";
import { type Diretoria } from "@/types/diretoria";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    descricao: z.string().optional(),
    lideres: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface DiretoriaFormProps {
    diretoria?: Diretoria;
    /** IDs de Diretores já líderes de áreas desta diretoria (pré-selecionados automaticamente) */
    diretoresDeAreas?: string[];
    onSuccess: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function DiretoriaForm({
    diretoria,
    diretoresDeAreas = [],
    onSuccess: _onSuccess,
    onSubmit,
    onCancel,
    isLoading,
}: DiretoriaFormProps) {
    const isEdit = !!diretoria;

    const { data: colaboradores = [], isLoading: isColabsLoading } = useQuery({
        queryKey: ["colaboradores-diretoria-lideres"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("colaboradores")
                .select("id, nome_completo, senioridade")
                .in("senioridade", ["C-level", "Diretor(a)"])
                .eq("status", "Ativo");
            if (error) return [];
            return (data || []).map((c: any) => ({
                id: c.id,
                nomeCompleto: c.nome_completo,
                senioridade: c.senioridade,
            }));
        },
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: diretoria?.nome ?? "",
            descricao: diretoria?.descricao ?? "",
            lideres: diretoria?.lideres ?? [],
        },
    });

    useEffect(() => {
        // Mescla líderes salvos com diretores de áreas (sem duplicatas)
        const base = diretoria?.lideres ?? [];
        const merged = Array.from(new Set([...base, ...diretoresDeAreas]));
        form.reset({
            nome: diretoria?.nome ?? "",
            descricao: diretoria?.descricao ?? "",
            lideres: merged,
        });
    }, [diretoria, diretoresDeAreas]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit(values);
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white border rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4">Informações Gerais</h3>
                    
                    <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Diretoria *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Ex: Tecnologia" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="descricao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Breve descrição da diretoria..."
                                        rows={3}
                                        className="rounded-2xl"
                                    />
                                </FormControl>
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
                                    C-levels e Diretores ativos. Diretores de áreas vinculadas são adicionados automaticamente.
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

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="rounded-full">
                        {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
