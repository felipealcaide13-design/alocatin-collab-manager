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
import { type Diretoria } from "@/types/diretoria";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    descricao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface DiretoriaFormProps {
    diretoria?: Diretoria;
    onSuccess: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function DiretoriaForm({
    diretoria,
    onSuccess: _onSuccess,
    onSubmit,
    onCancel,
    isLoading,
}: DiretoriaFormProps) {
    const isEdit = !!diretoria;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: diretoria?.nome ?? "",
            descricao: diretoria?.descricao ?? "",
        },
    });

    useEffect(() => {
        form.reset({
            nome: diretoria?.nome ?? "",
            descricao: diretoria?.descricao ?? "",
        });
    }, [diretoria, form]);

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
