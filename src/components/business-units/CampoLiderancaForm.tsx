import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampoLiderancaConfig } from "@/types/configuracaoTorre";

const SENIORIDADE_OPTIONS = [
  "C-level",
  "Diretor(a)",
  "Head",
  "Gerente",
  "Coordenador(a)",
  "Staf I",
  "Staf II",
  "Analista senior",
  "Analista pleno",
  "Analista junior",
] as const;

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  senioridade: z.string().min(1, "Senioridade é obrigatória"),
  diretoria_id: z.string().min(1, "Diretoria é obrigatória"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  campo?: CampoLiderancaConfig;
  diretorias: Array<{ id: string; nome: string }>;
  onSave: (campo: Omit<CampoLiderancaConfig, "id" | "ordem">) => void;
  onCancel: () => void;
}

export function CampoLiderancaForm({ campo, diretorias, onSave, onCancel }: Props) {
  const isEdit = !!campo;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: campo?.nome ?? "",
      senioridade: campo?.senioridade ?? "",
      diretoria_id: campo?.diretoria_id ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      nome: campo?.nome ?? "",
      senioridade: campo?.senioridade ?? "",
      diretoria_id: campo?.diretoria_id ?? "",
    });
  }, [campo]);

  const handleSubmit = form.handleSubmit((values) => {
    onSave(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Campo</FormLabel>
              <FormControl>
                <Input {...field} placeholder='Ex: "Head de Produto"' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="senioridade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senioridade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a senioridade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SENIORIDADE_OPTIONS.map((s) => (
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

        <FormField
          control={form.control}
          name="diretoria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diretoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a diretoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {diretorias.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {isEdit ? "Salvar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
