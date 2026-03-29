import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BusinessUnit } from "@/types/businessUnit";
import { configuracaoBUService } from "@/services/configuracaoBUService";
import { colaboradorService } from "@/services/colaboradorService";

const schema = z.object({
  nome: z.string().min(2, "O nome deve ter ao menos 2 caracteres"),
  descricao: z.string().nullable().optional(),
  liderancas: z.record(z.string(), z.string().nullable().optional()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onCancel: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initialData?: BusinessUnit | null;
  isLoading?: boolean;
}

export function BusinessUnitForm({ onCancel, onSubmit, initialData, isLoading }: Props) {
  const isEdit = !!initialData;

  const { data: buFormConfig = { descricao_habilitada: false, campos_lideranca: [] }, isSuccess: configLoaded } = useQuery({
    queryKey: ["configuracao_bu"],
    queryFn: () => configuracaoBUService.get(),
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", liderancas: {} },
  });

  useEffect(() => {
    form.reset(
      initialData
        ? { nome: initialData.nome, descricao: initialData.descricao || "", liderancas: initialData.liderancas ?? {} }
        : { nome: "", descricao: "", liderancas: {} }
    );
  }, [initialData, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values };
    // Normalize "none" → null in liderancas
    if (payload.liderancas) {
      const normalized: Record<string, string | null> = {};
      for (const [key, val] of Object.entries(payload.liderancas)) {
        normalized[key] = val === "none" ? null : (val ?? null);
      }
      payload.liderancas = normalized;
    }
    await onSubmit(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome — always required */}
        <FormField control={form.control} name="nome" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Ex: BU Financeiro" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Dynamic leadership fields */}
        {configLoaded && buFormConfig.campos_lideranca.length > 0 && (
          <>
            <hr className="border-[#08526E] mt-4 mb-4" />
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#0a688a]">Liderança</h3>
            {buFormConfig.campos_lideranca.map((campo) => {
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
                          <SelectTrigger>
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
          </>
        )}

        {/* Descrição — only if enabled in config. Moved to LAST position */}
        {buFormConfig.descricao_habilitada && (
          <FormField control={form.control} name="descricao" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ""} 
                  placeholder="Descrição opcional..." 
                  className="rounded-2xl bg-white"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="flex justify-end gap-2 sm:space-x-0 mt-4 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full border-[#0a678a] text-[#08526e] hover:bg-slate-50 px-6 font-medium h-10 w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="rounded-full bg-[#0a688a] hover:bg-[#08526e] px-6 font-medium h-10 text-white w-full sm:w-auto">
            {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar BU"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
