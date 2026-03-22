import { useState, useEffect } from "react";
import { Lock, ChevronUp, ChevronDown, Pencil, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { configuracaoTorreService } from "@/services/configuracaoTorreService";
import { configuracaoBUService } from "@/services/configuracaoBUService";
import { diretoriaService } from "@/services/diretoriaService";
import { CampoLiderancaForm } from "./CampoLiderancaForm";
import { useToast } from "@/hooks/use-toast";
import { BUTorreConfig, BUFormConfig, CampoLiderancaConfig } from "@/types/configuracaoTorre";

interface Props {
  businessUnits: Array<{ id: string; nome: string }>;
}

// Reusable leadership fields manager
interface LiderancaSectionProps {
  campos: CampoLiderancaConfig[];
  diretorias: Array<{ id: string; nome: string }>;
  onChange: (campos: CampoLiderancaConfig[]) => void;
}

function LiderancaSection({ campos, diretorias, onChange }: LiderancaSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function getDiretoriaNome(id: string) {
    return diretorias.find((d) => d.id === id)?.nome ?? id;
  }

  function handleAdd(values: Omit<CampoLiderancaConfig, "id" | "ordem">) {
    const novo: CampoLiderancaConfig = { ...values, id: crypto.randomUUID(), ordem: campos.length };
    onChange([...campos, novo]);
    setShowAddForm(false);
  }

  function handleEdit(id: string, values: Omit<CampoLiderancaConfig, "id" | "ordem">) {
    onChange(campos.map((c) => (c.id === id ? { ...c, ...values } : c)));
    setEditingId(null);
  }

  function handleRemove(id: string) {
    onChange(campos.filter((c) => c.id !== id).map((c, i) => ({ ...c, ordem: i })));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...campos];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next.map((c, i) => ({ ...c, ordem: i })));
  }

  function handleMoveDown(index: number) {
    if (index === campos.length - 1) return;
    const next = [...campos];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next.map((c, i) => ({ ...c, ordem: i })));
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Campos de Liderança
      </h3>

      {campos.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground mb-3">Nenhum campo de liderança configurado.</p>
      )}

      <div className="space-y-2">
        {campos.map((campo, index) => {
          if (editingId === campo.id) {
            return (
              <Card key={campo.id} className="border-primary/40">
                <CardContent className="p-4">
                  <CampoLiderancaForm
                    campo={campo}
                    diretorias={diretorias}
                    onSave={(v) => handleEdit(campo.id, v)}
                    onCancel={() => setEditingId(null)}
                  />
                </CardContent>
              </Card>
            );
          }
          return (
            <Card key={campo.id}>
              <CardContent className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{campo.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {campo.senioridade} · {getDiretoriaNome(campo.diretoria_id)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => handleMoveUp(index)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === campos.length - 1} onClick={() => handleMoveDown(index)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingId(campo.id); setShowAddForm(false); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(campo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddForm && (
        <Card className="mt-2 border-primary/40">
          <CardContent className="p-4">
            <CampoLiderancaForm
              diretorias={diretorias}
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {!showAddForm && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => { setShowAddForm(true); setEditingId(null); }}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Campo
        </Button>
      )}
    </div>
  );
}

export function BUTorreConfigTab({ businessUnits }: Props) {
  const { toast } = useToast();
  const [diretorias, setDiretorias] = useState<Array<{ id: string; nome: string }>>([]);

  // Torre config state
  const [selectedBuId, setSelectedBuId] = useState<string | null>(null);
  const [torreConfig, setTorreConfig] = useState<BUTorreConfig | null>(null);
  const [torreLoading, setTorreLoading] = useState(false);
  const [torreSaving, setTorreSaving] = useState(false);

  // BU config state (global, not per-BU)
  const [buConfig, setBuConfig] = useState<BUFormConfig>({ descricao_habilitada: false, campos_lideranca: [] });
  const [buLoading, setBuLoading] = useState(false);
  const [buSaving, setBuSaving] = useState(false);

  useEffect(() => {
    diretoriaService.getAll().then((data) => {
      setDiretorias(data.map((d) => ({ id: d.id, nome: d.nome })));
    }).catch(() => {});
  }, []);

  // Load BU form config once
  useEffect(() => {
    setBuLoading(true);
    configuracaoBUService.get()
      .then(setBuConfig)
      .catch(() => {})
      .finally(() => setBuLoading(false));
  }, []);

  // Load Torre config when BU changes
  useEffect(() => {
    if (!selectedBuId) { setTorreConfig(null); return; }
    setTorreLoading(true);
    configuracaoTorreService.getByBuId(selectedBuId)
      .then((data) => setTorreConfig(data ?? { bu_id: selectedBuId, campos_lideranca: [], descricao_habilitada: false }))
      .catch(() => setTorreConfig({ bu_id: selectedBuId, campos_lideranca: [], descricao_habilitada: false }))
      .finally(() => setTorreLoading(false));
  }, [selectedBuId]);

  async function handleSaveTorre() {
    if (!torreConfig) return;
    setTorreSaving(true);
    try {
      await configuracaoTorreService.upsert(torreConfig);
      toast({ title: "Configuração salva!", description: "Configuração de Torre salva com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setTorreSaving(false);
    }
  }

  async function handleSaveBU() {
    setBuSaving(true);
    try {
      await configuracaoBUService.upsert(buConfig);
      toast({ title: "Configuração salva!", description: "Configuração de BU salva com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setBuSaving(false);
    }
  }

  return (
    <Tabs defaultValue="torre" className="space-y-4">
      <TabsList className="bg-muted/40 border">
        <TabsTrigger value="torre">Configuração de Torre</TabsTrigger>
        <TabsTrigger value="bu">Configuração de BU</TabsTrigger>
      </TabsList>

      {/* ── TORRE CONFIG ── */}
      <TabsContent value="torre" className="space-y-6 outline-none">
        <div className="w-full max-w-sm">
          <Select
            value={selectedBuId ?? ""}
            onValueChange={(v) => setSelectedBuId(v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma Business Unit..." />
            </SelectTrigger>
            <SelectContent>
              {businessUnits.map((bu) => (
                <SelectItem key={bu.id} value={bu.id}>{bu.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedBuId && (
          <div className="rounded-xl border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
            Selecione uma Business Unit para configurar os campos do formulário de Torre.
          </div>
        )}

        {selectedBuId && torreLoading && (
          <div className="text-muted-foreground text-sm">Carregando configuração...</div>
        )}

        {selectedBuId && !torreLoading && torreConfig && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Campos Fixos</h3>
              <div className="flex flex-wrap gap-3">
                <Card className="border-dashed">
                  <CardContent className="flex items-center gap-2 px-4 py-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Nome da Torre</span>
                    <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="flex items-center gap-2 px-4 py-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Business Unit</span>
                    <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="torre-descricao-toggle"
                checked={torreConfig.descricao_habilitada}
                onCheckedChange={(checked) => setTorreConfig({ ...torreConfig, descricao_habilitada: checked })}
              />
              <Label htmlFor="torre-descricao-toggle" className="cursor-pointer">Incluir campo Descrição</Label>
            </div>

            <LiderancaSection
              campos={torreConfig.campos_lideranca}
              diretorias={diretorias}
              onChange={(campos) => setTorreConfig({ ...torreConfig, campos_lideranca: campos })}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveTorre} disabled={torreSaving}>
                {torreSaving ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {/* ── BU CONFIG ── */}
      <TabsContent value="bu" className="space-y-6 outline-none">
        {buLoading ? (
          <div className="text-muted-foreground text-sm">Carregando configuração...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Campos Fixos</h3>
              <Card className="border-dashed w-fit">
                <CardContent className="flex items-center gap-2 px-4 py-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Nome</span>
                  <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="bu-descricao-toggle"
                checked={buConfig.descricao_habilitada}
                onCheckedChange={(checked) => setBuConfig({ ...buConfig, descricao_habilitada: checked })}
              />
              <Label htmlFor="bu-descricao-toggle" className="cursor-pointer">Incluir campo Descrição</Label>
            </div>

            <LiderancaSection
              campos={buConfig.campos_lideranca}
              diretorias={diretorias}
              onChange={(campos) => setBuConfig({ ...buConfig, campos_lideranca: campos })}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveBU} disabled={buSaving}>
                {buSaving ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
