import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

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
import { type Especialidade } from "@/types/especialidade";
import { type Area } from "@/types/area";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    area_id: z.string().min(1, "Selecione uma Área"),
    descricao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EspecialidadeFormProps {
    especialidade?: Especialidade;
    areas: Area[];
    onSubmit: (values: FormValues) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function EspecialidadeForm({
    especialidade,
    areas,
    onSubmit,
    onCancel,
    isLoading,
}: EspecialidadeFormProps) {
    const isEdit = !!especialidade;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: especialidade?.nome ?? "",
            area_id: especialidade?.area_id ?? "",
            descricao: especialidade?.descricao ?? "",
        },
    });

    useEffect(() => {
        form.reset({
            nome: especialidade?.nome ?? "",
            area_id: especialidade?.area_id ?? "",
            descricao: especialidade?.descricao ?? "",
        });
    }, [especialidade, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        await onSubmit(values);
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Especialidade *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ex: Desenvolvimento Frontend" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="area_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Área *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma Área" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {areas.map((area) => (
                                        <SelectItem key={area.id} value={area.id}>
                                            {area.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    placeholder="Breve descrição da especialidade..."
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
