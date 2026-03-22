import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BusinessUnit } from "@/types/businessUnit";
import { BUFormConfig } from "@/types/configuracaoTorre";
import { configuracaoBUService } from "@/services/configuracaoBUService";
import { colaboradorService } from "@/services/colaboradorService";

const schema = z.object({
  nome: z.string().min(2, "O nome deve ter ao menos 2 caracteres"),
  descricao: z.string().nullable().optional(),
  liderancas: z.record(z.string(), z.string().nullable().optional()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initialData?: BusinessUnit | null;
  isLoading?: boolean;
}

export function BusinessUnitForm({ open, onClose, onSubmit, initialData, isLoading }: Props) {
  const isEdit = !!initialData;

  const [buFormConfig, setBuFormConfig] = useState<BUFormConfig>({ descricao_habilitada: false, campos_lideranca: [] });
  const [configLoaded, setConfigLoaded] = useState(false);

  const { data: colaboradores = [] } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll(),
  });

  // Load BU form config once when dialog opens
  const loadedRef = useRef(false);
  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true;
      configuracaoBUService.get()
        .then(setBuFormConfig)
        .catch(() => {})
        .finally(() => setConfigLoaded(true));
    }
    if (!open) {
      loadedRef.current = false;
      setConfigLoaded(false);
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", liderancas: {} },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialData
          ? { nome: initialData.nome, descricao: initialData.descricao || "", liderancas: initialData.liderancas ?? {} }
          : { nome: "", descricao: "", liderancas: {} }
      );
    }
  }, [open, initialData, form]);

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Business Unit" : "Nova Business Unit"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Descrição — only if enabled in config */}
            {buFormConfig.descricao_habilitada && (
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Descrição opcional..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Dynamic leadership fields */}
            {configLoaded && buFormConfig.campos_lideranca.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Liderança</p>
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
            )}

            <DialogFooter className="gap-2 mt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar BU"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
