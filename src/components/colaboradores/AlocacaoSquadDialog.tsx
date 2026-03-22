import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Torre, type Squad } from "@/types/torre";
import { type BusinessUnit } from "@/types/businessUnit";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Squad atual do colaborador nesta alocação (null = nova alocação) */
  currentSquadId: string | null;
  torres: Torre[];
  squads: Squad[];
  businessUnits: BusinessUnit[];
  onSave: (newSquadId: string, oldSquadId: string | null) => Promise<void>;
  isLoading?: boolean;
}

export function AlocacaoSquadDialog({
  open,
  onClose,
  currentSquadId,
  torres,
  squads,
  businessUnits,
  onSave,
  isLoading,
}: Props) {
  const [selectedBuId, setSelectedBuId] = useState<string>("all");
  const [selectedTorreId, setSelectedTorreId] = useState<string>("");
  const [selectedSquadId, setSelectedSquadId] = useState<string>("");

  // Inicializa os selects com os valores atuais
  useEffect(() => {
    if (!open) return;
    if (currentSquadId) {
      const squad = squads.find((s) => s.id === currentSquadId);
      if (squad) {
        const torre = torres.find((t) => t.id === squad.torre_id);
        setSelectedSquadId(currentSquadId);
        setSelectedTorreId(squad.torre_id);
        setSelectedBuId(torre?.bu_id ?? "all");
        return;
      }
    }
    setSelectedBuId("all");
    setSelectedTorreId("");
    setSelectedSquadId("");
  }, [open, currentSquadId, squads, torres]);

  // Torres filtradas pela BU selecionada
  const torresFiltered = useMemo(() => {
    if (selectedBuId === "all") return torres;
    return torres.filter((t) => t.bu_id === selectedBuId);
  }, [torres, selectedBuId]);

  // Squads filtradas pela torre selecionada
  const squadsFiltered = useMemo(() => {
    if (!selectedTorreId) return [];
    return squads.filter((s) => s.torre_id === selectedTorreId);
  }, [squads, selectedTorreId]);

  const handleBuChange = (val: string) => {
    setSelectedBuId(val);
    setSelectedTorreId("");
    setSelectedSquadId("");
  };

  const handleTorreChange = (val: string) => {
    setSelectedTorreId(val);
    setSelectedSquadId("");
  };

  const handleSave = async () => {
    if (!selectedSquadId) return;
    await onSave(selectedSquadId, currentSquadId ?? null);
    onClose();
  };

  const canSave = !!selectedSquadId && selectedSquadId !== currentSquadId;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{currentSquadId ? "Alterar alocação" : "Adicionar alocação"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* BU (opcional, filtra torres) */}
          <div className="space-y-1.5">
            <Label>Business Unit (opcional)</Label>
            <Select value={selectedBuId} onValueChange={handleBuChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as BUs</SelectItem>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id}>{bu.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Torre */}
          <div className="space-y-1.5">
            <Label>Torre</Label>
            <Select value={selectedTorreId} onValueChange={handleTorreChange} disabled={torresFiltered.length === 0}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {torresFiltered.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Squad */}
          <div className="space-y-1.5">
            <Label>Squad</Label>
            <Select value={selectedSquadId} onValueChange={setSelectedSquadId} disabled={!selectedTorreId || squadsFiltered.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={!selectedTorreId ? "Selecione uma torre primeiro" : squadsFiltered.length === 0 ? "Nenhuma squad nesta torre" : "Selecione uma squad"} />
              </SelectTrigger>
              <SelectContent>
                {squadsFiltered.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!canSave || isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
