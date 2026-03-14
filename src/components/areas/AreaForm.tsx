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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { type Area } from "@/types/area";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    lideres: z.array(z.string()).default([]),
    descricao: z.string().optional(),
    subareas_possiveis: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface AreaFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    initialData?: Area | null;
    isLoading?: boolean;
}

export function AreaForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading,
}: AreaFormProps) {
    const isEdit = !!initialData;
    const [subareaInput, setSubareaInput] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            lideres: [],
            descricao: "",
            subareas_possiveis: [],
        },
    });

    const { data: colaboradores = [], isLoading: isColabsLoading } = useQuery({
        queryKey: ["colaboradores-lideres"],
        queryFn: async () => {
            const { data, error } = await supabase.from('colaboradores').select('id, nome_completo');
            if (error) {
                console.warn('Erro ao buscar líderes do Supabase:', error);
                return [];
            }
            return (data || []).map((c: any) => ({ id: c.id, nomeCompleto: c.nome_completo }));
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    lideres: initialData.lideres,
                    descricao: initialData.descricao || "",
                    subareas_possiveis: initialData.subareas_possiveis,
                });
            } else {
                form.reset({
                    nome: "",
                    lideres: [],
                    descricao: "",
                    subareas_possiveis: [],
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit(values);
    });

    const subareas = form.watch("subareas_possiveis");

    const addSubarea = () => {
        const val = subareaInput.trim();
        if (val && !subareas.includes(val)) {
            form.setValue("subareas_possiveis", [...subareas, val]);
        }
        setSubareaInput("");
    };

    const handleSubareaKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSubarea();
        }
    };

    const removeSubarea = (subarea: string) => {
        form.setValue(
            "subareas_possiveis",
            subareas.filter((s) => s !== subarea)
        );
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

                            {/* Subáreas - Chips Input */}
                            <FormField
                                control={form.control}
                                name="subareas_possiveis"
                                render={() => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Subáreas (Opcional)</FormLabel>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex bg-background border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 items-center p-1 px-2">
                                                <div className="flex flex-wrap gap-1 items-center flex-1">
                                                    {subareas.map((sa) => (
                                                        <span
                                                            key={sa}
                                                            className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                                                        >
                                                            {sa}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSubarea(sa)}
                                                                className="hover:bg-primary/20 rounded-full p-0.5"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <Input
                                                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8 min-w-[120px]"
                                                        placeholder="Digite e aperte Enter..."
                                                        value={subareaInput}
                                                        onChange={(e) => setSubareaInput(e.target.value)}
                                                        onKeyDown={handleSubareaKeyDown}
                                                        onBlur={addSubarea}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Líderes - Multi Select */}
                            <FormField
                                control={form.control}
                                name="lideres"
                                render={() => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Líderes</FormLabel>
                                        <div className="border rounded-md">
                                            <ScrollArea className="h-[150px] w-full p-4">
                                                {isColabsLoading ? (
                                                    <p className="text-sm text-muted-foreground p-2 text-center">Carregando...</p>
                                                ) : colaboradores.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground p-2 text-center">Nenhum colaborador encontrado.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {colaboradores.map((colab) => (
                                                            <FormField
                                                                key={colab.id}
                                                                control={form.control}
                                                                name="lideres"
                                                                render={({ field }) => {
                                                                    return (
                                                                        <FormItem
                                                                            key={colab.id}
                                                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                                                                        >
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(colab.id)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                            ? field.onChange([...field.value, colab.id])
                                                                                            : field.onChange(
                                                                                                field.value?.filter((value) => value !== colab.id)
                                                                                            );
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <div className="space-y-1 leading-none">
                                                                                <FormLabel className="font-normal cursor-pointer">
                                                                                    {colab.nomeCompleto}
                                                                                </FormLabel>
                                                                            </div>
                                                                        </FormItem>
                                                                    );
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
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
