import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrgChart } from "d3-org-chart";
import { ZoomIn, ZoomOut, Maximize2, AlignCenter, LayoutList, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { colaboradorService } from "@/services/colaboradorService";
import { diretoriaService } from "@/services/diretoriaService";
import { type Colaborador, type Senioridade } from "@/types/colaborador";
import { type Diretoria } from "@/types/diretoria";

type Layout = "cima" | "esquerda" | "direita" | "baixo";
type D3Layout = "top" | "left" | "right" | "bottom";

const LAYOUT_MAP: Record<Layout, D3Layout> = {
  cima: "top",
  esquerda: "left",
  direita: "right",
  baixo: "bottom",
};

interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  senioridade: Senioridade | "diretoria" | "sem-diretoria";
  status?: string;
}

const SENIORITY_ORDER: Senioridade[] = [
  "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
  "Staff I", "Staff II", "Analista senior", "Analista pleno", "Analista junior",
];

const SENIORITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "diretoria":       { bg: "#0f172a", border: "#1e293b", text: "#f8fafc" },
  "sem-diretoria":   { bg: "#374151", border: "#4b5563", text: "#f9fafb" },
  "C-level":         { bg: "#7c3aed", border: "#6d28d9", text: "#f5f3ff" },
  "Diretor(a)":      { bg: "#1d4ed8", border: "#1e40af", text: "#eff6ff" },
  "Head":            { bg: "#0369a1", border: "#075985", text: "#e0f2fe" },
  "Gerente":         { bg: "#0891b2", border: "#0e7490", text: "#ecfeff" },
  "Coordenador(a)":  { bg: "#0d9488", border: "#0f766e", text: "#f0fdfa" },
  "Staff I":          { bg: "#059669", border: "#047857", text: "#ecfdf5" },
  "Staff II":         { bg: "#16a34a", border: "#15803d", text: "#f0fdf4" },
  "Analista senior": { bg: "#65a30d", border: "#4d7c0f", text: "#f7fee7" },
  "Analista pleno":  { bg: "#ca8a04", border: "#a16207", text: "#fefce8" },
  "Analista junior": { bg: "#d97706", border: "#b45309", text: "#fffbeb" },
};

const VALID_PARENT_SENIORITIES: Partial<Record<Senioridade, Senioridade[]>> = {
  "Diretor(a)":     ["C-level"],
  "Head":           ["Diretor(a)", "C-level"],
  "Gerente":        ["Head", "Diretor(a)", "C-level"],
  "Coordenador(a)": ["Gerente", "Head", "Diretor(a)", "C-level"],
  "Staff I":         ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Staff II":        ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Analista senior":["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Analista pleno": ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Analista junior":["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
};

function seniorityIndex(s: Senioridade): number {
  return SENIORITY_ORDER.indexOf(s);
}

const VIRTUAL_ROOT_ID = "__root__";

function buildNodes(colaboradores: Colaborador[], diretorias: Diretoria[]): OrgNode[] {
  const ativos = colaboradores.filter((c) => c.status === "Ativo");

  // Nó raiz virtual — necessário porque d3-org-chart exige exatamente um parentId: null
  const nodes: OrgNode[] = [
    { id: VIRTUAL_ROOT_ID, parentId: null, name: "root", senioridade: "diretoria" },
  ];

  // Índice rápido: id → nó já inserido (para resolver lider_id cross-group)
  const nodeById = new Map<string, OrgNode>();

  // Ordena globalmente: líderes antes de subordinados (topological sort por lider_id)
  function topoSort(list: Colaborador[]): Colaborador[] {
    const idMap = new Map(list.map((c) => [c.id, c]));
    const result: Colaborador[] = [];
    const visited = new Set<string>();

    function visit(c: Colaborador) {
      if (visited.has(c.id)) return;
      // Processa o líder primeiro, se existir na lista
      if (c.lider_id && idMap.has(c.lider_id)) {
        visit(idMap.get(c.lider_id)!);
      }
      visited.add(c.id);
      result.push(c);
    }

    for (const c of list) visit(c);
    return result;
  }

  const sorted = topoSort(
    [...ativos].sort((a, b) => seniorityIndex(a.senioridade) - seniorityIndex(b.senioridade))
  );

  // Agrupa colaboradores por diretoria_id
  const byDiretoria = new Map<string | null, Colaborador[]>();
  for (const c of sorted) {
    const key = c.diretoria_id ?? null;
    if (!byDiretoria.has(key)) byDiretoria.set(key, []);
    byDiretoria.get(key)!.push(c);
  }

  function addNode(node: OrgNode) {
    nodes.push(node);
    nodeById.set(node.id, node);
  }

  function findParent(colab: Colaborador, groupNodes: OrgNode[], rootId: string): string {
    // Líder direto definido — busca primeiro no grupo, depois no índice global
    if (colab.lider_id) {
      if (nodeById.has(colab.lider_id)) return colab.lider_id;
    }

    const validSeniorities = VALID_PARENT_SENIORITIES[colab.senioridade] ?? [];
    const candidates = groupNodes.filter(
      (n) => n.senioridade !== "diretoria" && n.senioridade !== "sem-diretoria"
        && validSeniorities.includes(n.senioridade as Senioridade)
    );
    if (candidates.length === 0) return rootId;

    function score(n: OrgNode): number {
      const c = ativos.find((x) => x.id === n.id);
      if (!c) return 0;
      let s = 0;
      if (colab.area_ids.some((a) => c.area_ids.includes(a))) s += 10;
      const preferenceIdx = validSeniorities.indexOf(n.senioridade as Senioridade);
      s += Math.max(0, (validSeniorities.length - preferenceIdx) * 2);
      return s;
    }

    return candidates.reduce((a, b) => (score(b) > score(a) ? b : a)).id;
  }

  // Subtree por diretoria — cada nó de diretoria é filho do root virtual
  // Primeiro cria todos os nós de diretoria
  const dirNodeIds = new Map<string, string>();
  for (const diretoria of [...diretorias].sort((a, b) => a.nome.localeCompare(b.nome))) {
    const members = byDiretoria.get(diretoria.id) ?? [];
    if (members.length === 0) continue;
    const dirNodeId = `diretoria-${diretoria.id}`;
    const dirNode: OrgNode = { id: dirNodeId, parentId: VIRTUAL_ROOT_ID, name: diretoria.nome, senioridade: "diretoria" };
    addNode(dirNode);
    dirNodeIds.set(diretoria.id, dirNodeId);
  }

  // Nó "Sem Diretoria" se necessário
  const semDiretoria = byDiretoria.get(null) ?? [];
  if (semDiretoria.length > 0) {
    addNode({ id: "sem-diretoria", parentId: VIRTUAL_ROOT_ID, name: "Sem Diretoria", senioridade: "sem-diretoria" });
  }

  // Processa colaboradores em ordem topológica (líderes antes de subordinados)
  // Isso garante que lider_id cross-diretoria funcione corretamente
  for (const c of sorted) {
    const dirNodeId = c.diretoria_id
      ? (dirNodeIds.get(c.diretoria_id) ?? VIRTUAL_ROOT_ID)
      : (semDiretoria.length > 0 ? "sem-diretoria" : VIRTUAL_ROOT_ID);

    // Para o fallback por score, usa colaboradores ativos da mesma diretoria já inseridos
    const sameGroupNodes = nodes.filter(
      (n) => n.id !== VIRTUAL_ROOT_ID && n.id !== dirNodeId && n.id !== "sem-diretoria"
        && ativos.find((x) => x.id === n.id)?.diretoria_id === c.diretoria_id
    );

    const parentId = findParent(c, sameGroupNodes, dirNodeId);
    addNode({ id: c.id, parentId, name: c.nomeCompleto, senioridade: c.senioridade, status: c.status });
  }

  return nodes;
}

function nodeContent(d: any): string {
  // Nó raiz virtual — invisível
  if (d.data.id === VIRTUAL_ROOT_ID) {
    return `<div style="width:${d.width}px;height:${d.height}px;opacity:0;pointer-events:none;"></div>`;
  }

  const colors = SENIORITY_COLORS[d.data.senioridade] ?? SENIORITY_COLORS["Analista junior"];
  const isDiretoria = d.data.senioridade === "diretoria" || d.data.senioridade === "sem-diretoria";
  const initials = d.data.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const label = isDiretoria ? "Diretoria" : d.data.senioridade;

  return `
    <div style="
      width:${d.width}px;height:${d.height}px;
      background:${colors.bg};border:2px solid ${colors.border};
      border-radius:10px;display:flex;align-items:center;
      gap:10px;padding:0 12px;box-sizing:border-box;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;
    ">
      <div style="
        width:36px;height:36px;border-radius:${isDiretoria ? "8px" : "50%"};
        background:rgba(255,255,255,0.15);
        display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:700;color:${colors.text};flex-shrink:0;
      ">${initials}</div>
      <div style="overflow:hidden;flex:1;">
        <div style="
          font-size:10px;color:${colors.text};opacity:0.75;
          letter-spacing:0.02em;
          margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        ">${label}</div>
        <div style="
          font-size:13px;font-weight:600;color:${colors.text};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        " title="${d.data.name}">${d.data.name}</div>
      </div>
    </div>
  `;
}

export function OrgChartView() {
  const chartRef = useRef<OrgChart<OrgNode> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>("cima");
  const [compact, setCompact] = useState(false);
  // Dimensões reais do wrapper, detectadas via ResizeObserver
  const [wrapperSize, setWrapperSize] = useState<{ w: number; h: number } | null>(null);

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll().catch(() => []),
  });

  const { data: diretorias = [], isLoading: loadingDiretorias } = useQuery({
    queryKey: ["diretorias"],
    queryFn: () => diretoriaService.getAll().catch(() => []),
  });

  const nodes = useMemo(() => buildNodes(colaboradores, diretorias), [colaboradores, diretorias]);

  // Observa o wrapper para detectar quando ele tem dimensões reais
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setWrapperSize({ w: width, h: height });
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Renderiza/atualiza o chart sempre que os dados, layout, compact ou dimensões mudarem
  useEffect(() => {
    if (!containerRef.current || !wrapperSize || nodes.length === 0) return;

    if (!chartRef.current) {
      chartRef.current = new OrgChart<OrgNode>();
    }

    const chart = chartRef.current;
    chart
      .container(containerRef.current as any)
      .data(nodes)
      .layout(LAYOUT_MAP[layout])
      .compact(compact)
      .svgWidth(wrapperSize.w)
      .svgHeight(wrapperSize.h)
      .nodeWidth(() => 210)
      .nodeHeight((d: any) => d.data.id === VIRTUAL_ROOT_ID ? 1 : 76)
      .childrenMargin((d: any) => d.data.id === VIRTUAL_ROOT_ID ? 20 : 50)
      .compactMarginBetween(() => 20)
      .compactMarginPair(() => 30)
      .siblingsMargin(() => 20)
      .nodeContent(nodeContent)
      .render();

    // Aguarda o render completar antes de fazer fit
    requestAnimationFrame(() => {
      requestAnimationFrame(() => chart.fit());
    });
  }, [nodes, layout, compact, wrapperSize]);

  const handleFit = useCallback(() => {
    if (!chartRef.current || !wrapperRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = wrapperRef.current;
    chartRef.current.svgWidth(w).svgHeight(h).fit();
  }, []);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-sm">
          {(["cima", "esquerda", "direita", "baixo"] as Layout[]).map((l) => (
            <Button key={l} variant={layout === l ? "default" : "ghost"} size="sm"
              className="h-7 px-2 text-xs capitalize" onClick={() => setLayout(l)}>
              {l}
            </Button>
          ))}
        </div>
        <Button variant={compact ? "default" : "outline"} size="sm" className="h-8 gap-1"
          onClick={() => setCompact((v) => !v)}>
          <LayoutList className="h-4 w-4" /> Compacto
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleFit}>
          <Maximize2 className="h-4 w-4" /> Ajustar
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomIn()}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomOut()}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1"
          onClick={() => { chartRef.current?.expandAll(); handleFit(); }}>
          <Network className="h-4 w-4" /> Expandir
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1"
          onClick={() => { chartRef.current?.collapseAll(); handleFit(); }}>
          <AlignCenter className="h-4 w-4" /> Recolher
        </Button>
      </div>

      {/* Board — ref no wrapper para o ResizeObserver medir as dimensões reais */}
      <div ref={wrapperRef} className="min-h-0 flex-1 bg-card border rounded-xl shadow-sm overflow-hidden relative">
        {isLoading || loadingDiretorias ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-20 w-48 mx-auto" />
            <div className="flex justify-center gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-40" />)}
            </div>
          </div>
        ) : nodes.length <= 1 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum colaborador ativo cadastrado.
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
