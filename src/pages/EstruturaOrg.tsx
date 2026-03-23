import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrgChart } from "d3-org-chart";
import { ZoomIn, ZoomOut, Maximize2, AlignCenter, LayoutList, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { colaboradorService } from "@/services/colaboradorService";
import { type Colaborador, type Senioridade } from "@/types/colaborador";

type Layout = "top" | "left" | "right" | "bottom";

interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  senioridade: Senioridade | "empresa";
  status?: string;
}

// Ordem hierárquica das senioridades (índice menor = mais alto)
const SENIORITY_ORDER: Senioridade[] = [
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
];

const SENIORITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "empresa":         { bg: "#0f172a", border: "#1e293b", text: "#f8fafc" },
  "C-level":         { bg: "#7c3aed", border: "#6d28d9", text: "#f5f3ff" },
  "Diretor(a)":      { bg: "#1d4ed8", border: "#1e40af", text: "#eff6ff" },
  "Head":            { bg: "#0369a1", border: "#075985", text: "#e0f2fe" },
  "Gerente":         { bg: "#0891b2", border: "#0e7490", text: "#ecfeff" },
  "Coordenador(a)":  { bg: "#0d9488", border: "#0f766e", text: "#f0fdfa" },
  "Staf I":          { bg: "#059669", border: "#047857", text: "#ecfdf5" },
  "Staf II":         { bg: "#16a34a", border: "#15803d", text: "#f0fdf4" },
  "Analista senior": { bg: "#65a30d", border: "#4d7c0f", text: "#f7fee7" },
  "Analista pleno":  { bg: "#ca8a04", border: "#a16207", text: "#fefce8" },
  "Analista junior": { bg: "#d97706", border: "#b45309", text: "#fffbeb" },
};

function seniorityIndex(s: Senioridade): number {
  return SENIORITY_ORDER.indexOf(s);
}

// Quais senioridades são gestores diretos válidos para cada grupo
const VALID_PARENT_SENIORITIES: Partial<Record<Senioridade, Senioridade[]>> = {
  "Diretor(a)":     ["C-level"],
  "Head":           ["Diretor(a)", "C-level"],
  "Gerente":        ["Head", "Diretor(a)", "C-level"],
  "Coordenador(a)": ["Gerente", "Head", "Diretor(a)", "C-level"],
  "Staf I":         ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Staf II":        ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Analista senior":["Coordenador(a)", "Gerente", "Diretor(a)", "C-level"],
  "Analista pleno": ["Coordenador(a)", "Gerente", "Diretor(a)", "C-level"],
  "Analista junior":["Coordenador(a)", "Gerente", "Diretor(a)", "C-level"],
};

/**
 * Builds org chart nodes from colaboradores.
 *
 * Strategy:
 * - Root: "empresa"
 * - C-level → parent: empresa
 * - Each seniority only accepts valid parent seniorities (see VALID_PARENT_SENIORITIES)
 * - Analistas NEVER report to Head directly — must go through Coordenador(a) or Gerente
 * - Within valid candidates, score by shared area/diretoria context
 */
function buildNodes(colaboradores: Colaborador[]): OrgNode[] {
  const ativos = colaboradores.filter((c) => c.status === "Ativo");

  const root: OrgNode = { id: "empresa", parentId: null, name: "Alocatin", senioridade: "empresa" };
  const nodes: OrgNode[] = [root];

  const sorted = [...ativos].sort(
    (a, b) => seniorityIndex(a.senioridade) - seniorityIndex(b.senioridade)
  );

  function findParent(colab: Colaborador): string {
    const validSeniorities = VALID_PARENT_SENIORITIES[colab.senioridade] ?? [];

    // Filter candidates to only valid parent seniorities
    const candidates = nodes.filter(
      (n) => n.senioridade !== "empresa" && validSeniorities.includes(n.senioridade as Senioridade)
    );

    if (candidates.length === 0) return "empresa";

    // Score by context match — prefer closer seniority + shared area/diretoria
    function score(n: OrgNode): number {
      const c = ativos.find((x) => x.id === n.id);
      if (!c) return 0;
      let s = 0;
      // Shared area is the strongest signal
      const sharedArea = colab.area_ids.some((a) => c.area_ids.includes(a));
      if (sharedArea) s += 10;
      // Same diretoria as secondary signal
      if (colab.diretoria_id && c.diretoria_id === colab.diretoria_id) s += 4;
      // Prefer the closest valid seniority (first in the validSeniorities list = most preferred)
      const preferenceIdx = validSeniorities.indexOf(n.senioridade as Senioridade);
      s += Math.max(0, (validSeniorities.length - preferenceIdx) * 2);
      return s;
    }

    const best = candidates.reduce((a, b) => (score(b) > score(a) ? b : a));
    return best.id;
  }

  for (const c of sorted) {
    const parentId = c.senioridade === "C-level" ? "empresa" : findParent(c);
    nodes.push({
      id: c.id,
      parentId,
      name: c.nomeCompleto,
      senioridade: c.senioridade,
      status: c.status,
    });
  }

  return nodes;
}

export default function EstruturaOrg() {
  const chartRef = useRef<OrgChart<OrgNode> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>("top");
  const [compact, setCompact] = useState(false);

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll().catch(() => []),
  });

  const nodes = useMemo(() => buildNodes(colaboradores), [colaboradores]);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    if (!chartRef.current) {
      chartRef.current = new OrgChart<OrgNode>();
    }

    const chart = chartRef.current;

    chart
      .container(containerRef.current as any)
      .data(nodes)
      .layout(layout)
      .compact(compact)
      .nodeWidth(() => 210)
      .nodeHeight(() => 76)
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 20)
      .compactMarginPair(() => 30)
      .siblingsMargin(() => 20)
      .nodeContent((d) => {
        const colors = SENIORITY_COLORS[d.data.senioridade] ?? SENIORITY_COLORS["Analista junior"];
        const isRoot = d.data.senioridade === "empresa";
        const initials = isRoot
          ? "A"
          : d.data.name
              .split(" ")
              .slice(0, 2)
              .map((w: string) => w[0])
              .join("")
              .toUpperCase();

        return `
          <div style="
            width:${d.width}px;
            height:${d.height}px;
            background:${colors.bg};
            border:2px solid ${colors.border};
            border-radius:10px;
            display:flex;
            align-items:center;
            gap:10px;
            padding:0 12px;
            box-sizing:border-box;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
            cursor:pointer;
          ">
            <div style="
              width:36px;height:36px;
              border-radius:50%;
              background:rgba(255,255,255,0.15);
              display:flex;align-items:center;justify-content:center;
              font-size:13px;font-weight:700;
              color:${colors.text};
              flex-shrink:0;
            ">${initials}</div>
            <div style="overflow:hidden;flex:1;">
              <div style="
                font-size:10px;
                color:${colors.text};
                opacity:0.75;
                letter-spacing:0.02em;
                letter-spacing:0.05em;
                margin-bottom:2px;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
              ">${isRoot ? "Empresa" : d.data.senioridade}</div>
              <div style="
                font-size:13px;
                font-weight:600;
                color:${colors.text};
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
              " title="${d.data.name}">${d.data.name}</div>
            </div>
          </div>
        `;
      })
      .render();

    setTimeout(() => chart.fit(), 100);
  }, [nodes, layout, compact]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Diretorias</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hierarquia de colaboradores ativos por senioridade
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout */}
          <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-sm">
            {(["top", "left", "right", "bottom"] as Layout[]).map((l) => (
              <Button
                key={l}
                variant={layout === l ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs capitalize"
                onClick={() => setLayout(l)}
              >
                {l}
              </Button>
            ))}
          </div>

          <Button
            variant={compact ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1"
            onClick={() => setCompact((v) => !v)}
          >
            <LayoutList className="h-4 w-4" />
            Compacto
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => chartRef.current?.fit()}>
            <Maximize2 className="h-4 w-4" />
            Fit
          </Button>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomIn()}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomOut()}>
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => chartRef.current?.expandAll().fit()}>
            <Network className="h-4 w-4" />
            Expandir
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => chartRef.current?.collapseAll().fit()}>
            <AlignCenter className="h-4 w-4" />
            Colapsar
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden relative">
        {isLoading ? (
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
