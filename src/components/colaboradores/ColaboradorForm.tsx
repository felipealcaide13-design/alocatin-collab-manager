import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PILARES,
  AREAS_POR_PILAR,
  SUBAREAS_POR_AREA,
  SENIORIDADES,
  type Colaborador,
  type Pilar,
} from "@/types/colaborador";

const schema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  documento: z.string().min(11, "CPF inválido").max(18),
  cargo: z.string().min(2, "Informe o cargo"),
  pilar: z.enum(["Engenharia", "Produto", "Financeiro", "RH", "Marketing"]),
  area: z.string().min(1, "Selecione uma área"),
  subarea: z.string().nullable().optional(),
  senioridade: z.enum([
    "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
    "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
  ]),
  status: z.enum(["Ativo", "Desligado"]),
  dataAdmissao: z.string().min(1, "Informe a data de admissão"),
  time: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ColaboradorFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initialData?: Colaborador | null;
  isLoading?: boolean;
}

export function ColaboradorForm({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: ColaboradorFormProps) {
  const isEdit = !!initialData;
  const isDesligado = initialData?.status === "Desligado";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: "",
      email: "",
      documento: "",
      cargo: "",
      pilar: "Engenharia",
      area: "",
      subarea: null,
      senioridade: "Analista pleno",
      status: "Ativo",
      dataAdmissao: new Date().toISOString().split("T")[0],
      time: null,
    },
  });

  const pilarValue = form.watch("pilar");
  const areaValue = form.watch("area");

  const areas = pilarValue ? AREAS_POR_PILAR[pilarValue as Pilar] || [] : [];
  const subareas = areaValue ? SUBAREAS_POR_AREA[areaValue] || [] : [];

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          nomeCompleto: initialData.nomeCompleto,
          email: initialData.email,
          documento: initialData.documento,
          cargo: initialData.cargo,
          pilar: initialData.pilar,
          area: initialData.area,
          subarea: initialData.subarea,
          senioridade: initialData.senioridade,
          status: initialData.status,
          dataAdmissao: initialData.dataAdmissao,
          time: initialData.time,
        });
      } else {
        form.reset({
          nomeCompleto: "",
          email: "",
          documento: "",
          cargo: "",
          pilar: "Engenharia",
          area: "",
          subarea: null,
          senioridade: "Analista pleno",
          status: "Ativo",
          dataAdmissao: new Date().toISOString().split("T")[0],
          time: null,
        });
      }
    }
  }, [open, initialData]);

  // Reset area when pilar changes
  useEffect(() => {
    if (!initialData || form.getValues("pilar") !== initialData.pilar) {
      form.setValue("area", "");
      form.setValue("subarea", null);
    }
  }, [pilarValue]);

  // Reset subarea when area changes
  useEffect(() => {
    if (!initialData || form.getValues("area") !== initialData.area) {
      form.setValue("subarea", null);
    }
  }, [areaValue]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Colaborador" : "Novo Colaborador"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome */}
              <FormField control={form.control} name="nomeCompleto" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: João Silva" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Email */}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="joao@alocatin.com" disabled={isDesligado} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* CPF */}
              <FormField control={form.control} name="documento" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="000.000.000-00" disabled={isDesligado} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Cargo */}
              <FormField control={form.control} name="cargo" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Cargo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Desenvolvedor Backend" disabled={isDesligado} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Pilar */}
              <FormField control={form.control} name="pilar" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilar *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDesligado}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PILARES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Área */}
              <FormField control={form.control} name="area" render={({ field }) => (
                <FormItem>
                  <FormLabel>Área *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDesligado || !pilarValue}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o pilar primeiro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Subárea */}
              {subareas.length > 0 && (
                <FormField control={form.control} name="subarea" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subárea</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "nenhuma" ? null : v)}
                      value={field.value ?? "nenhuma"}
                      disabled={isDesligado}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nenhuma">Nenhuma</SelectItem>
                        {subareas.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* Senioridade */}
              <FormField control={form.control} name="senioridade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senioridade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDesligado}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SENIORIDADES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Status */}
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Desligado">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Data de Admissão */}
              <FormField control={form.control} name="dataAdmissao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Admissão *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled={isDesligado} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Time */}
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Time / Squad</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      placeholder="Ex: Squad Alpha"
                      disabled={isDesligado}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {isDesligado && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                ⚠️ Colaborador desligado — apenas nome e status podem ser editados.
              </p>
            )}

            <DialogFooter className="gap-2">
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
