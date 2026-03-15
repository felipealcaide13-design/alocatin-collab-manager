import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { Squad } from "@/types/torre";
import { colaboradorService } from "@/services/colaboradorService";
import { contratoService } from "@/services/contratoService";
import { torreService } from "@/services/torreService";

const schema = z.object({
    nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres"),
    torre_id: z.string().min(1, "Selecione uma Torre"),
    contrato_id: z.string().nullable().optional(),
    lider: z.string().nullable().optional(),
    membros: z.array(z.string()).default([]),
    descricao: z.string().nullable().optional()
});

type FormValues = z.infer<typeof schema>;

interface SquadFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => Promise<void>;
    initialData?: Squad | null;
    isLoading?: boolean;
}

export function SquadForm({ open, onClose, onSubmit, initialData, isLoading }: SquadFormProps) {
    const isEdit = !!initialData;
    const [comboOpen, setComboOpen] = useState(false);

    const { data: colaboradores = [] } = useQuery({
        queryKey: ["colaboradores"],
        queryFn: () => colaboradorService.getAll(),
    });

    const { data: contratos = [] } = useQuery({
        queryKey: ["contratos"],
        queryFn: () => contratoService.getAll(),
    });

    const { data: torres = [] } = useQuery({
        queryKey: ["torres"],
        queryFn: () => torreService.getAllTorres(),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            torre_id: "",
            contrato_id: null,
            lider: null,
            membros: [],
            descricao: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    nome: initialData.nome,
                    torre_id: initialData.torre_id,
                    contrato_id: initialData.contrato_id || null,
                    lider: initialData.lider,
                    membros: initialData.membros || [],
                    descricao: initialData.descricao || "",
                });
            } else {
                form.reset({
                    nome: "",
                    torre_id: "",
                    contrato_id: null,
                    lider: null,
                    membros: [],
                    descricao: "",
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = { ...values };
        if (payload.contrato_id === "none") payload.contrato_id = null;
        await onSubmit(payload);
    });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Squad" : "Novo Squad"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <FormField control={form.control} name="nome" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Squad *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Ex: Squad Core Pagamentos" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="torre_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Torre Associada *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione uma Torre" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {torres.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="contrato_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contrato Relacionado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione um contrato" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {contratos.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.nome} ({c.cliente})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Multi-select Members */}
                        <FormField control={form.control} name="membros" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Membros ({field.value.length})</FormLabel>
                                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" aria-expanded={comboOpen} className={cn("justify-between w-full h-auto min-h-[40px] font-normal", !field.value.length && "text-muted-foreground")}>
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {field.value.length === 0 ? "Selecione membros..." : (
                                                        field.value.slice(0, 3).map((colabId) => {
                                                            const colab = colaboradores.find(c => c.id === colabId);
                                                            return (
                                                                <Badge key={colabId} variant="secondary" className="mr-1 mb-1 font-normal">
                                                                    {colab ? colab.nomeCompleto : "Desconhecido"}
                                                                    <button
                                                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted"
                                                                        onKeyDown={(e) => { if (e.key === "Enter") { field.onChange(field.value.filter(i => i !== colabId)); } }}
                                                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                        onClick={() => field.onChange(field.value.filter(i => i !== colabId))}
                                                                    >
                                                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                                    </button>
                                                                </Badge>
                                                            )
                                                        })
                                                    )}
                                                    {field.value.length > 3 && (
                                                        <Badge variant="secondary" className="mr-1 mb-1 font-normal">+{field.value.length - 3} outros</Badge>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar colaborador..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    <ScrollArea className="h-64">
                                                        {colaboradores.map((colab) => (
                                                            <CommandItem
                                                                key={colab.id}
                                                                value={colab.nomeCompleto}
                                                                onSelect={() => {
                                                                    if (field.value.includes(colab.id)) {
                                                                        field.onChange(field.value.filter((id) => id !== colab.id));
                                                                    } else {
                                                                        field.onChange([...field.value, colab.id]);
                                                                    }
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value.includes(colab.id) ? "opacity-100" : "opacity-0")} />
                                                                {colab.nomeCompleto} <span className="text-muted-foreground ml-2 text-xs">({colab.senioridade})</span>
                                                            </CommandItem>
                                                        ))}
                                                    </ScrollArea>
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="descricao" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Textarea {...field} value={field.value || ""} placeholder="Descrição opcional..." rows={3} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Squad"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
