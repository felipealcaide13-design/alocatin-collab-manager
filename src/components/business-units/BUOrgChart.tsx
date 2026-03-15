import { useEffect, useRef, useMemo } from "react";
import { OrgChart } from "d3-org-chart";
import { ZoomIn, ZoomOut, Maximize2, AlignCenter, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type BusinessUnit } from "@/types/businessUnit";
import { type Torre, type Squad } from "@/types/torre";

type Layout = "top" | "left" | "right" | "bottom";
type NodeKind = "bu" | "torre" | "squad";

interface ChartNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  subtitle: string;
}

const KIND_COLORS: Record<NodeKind, { bg: string; border: string; text: string; badge: string }> = {
  bu:    { bg: "#1e1b4b", border: "#3730a3", text: "#e0e7ff", badge: "#4338ca" },
  torre: { bg: "#0c4a6e", border: "#0369a1", text: "#e0f2fe", badge: "#0284c7" },
  squad: { bg: "#064e3b", border: "#059669", text: "#d1fae5", badge: "#10b981" },
};

const KIND_LABEL: Record<NodeKind, string> = {
  bu:    "Business Unit",
  torre: "Torre",
  squad: "Squad",
};

const LAYOUT_LABELS: Record<Layout, string> = {
  top:    "Cima",
  bottom: "Baixo",
  left:   "Esquerda",
  right:  "Direita",
};

function buildNodes(businessUnits: BusinessUnit[], torres: Torre[], squads: Squad[]): ChartNode[] {
  const nodes: ChartNode[] = [];
  for (const bu of [...businessUnits].sort((a, b) => a.nome.localeCompare(b.nome))) {
    nodes.push({ id: `bu-${bu.id}`, parentId: null, name: bu.nome, kind: "bu", subtitle: bu.descricao || "" });
    const buTorres = torres.filter((t) => t.bu_id === bu.id).sort((a, b) => a.nome.localeCompare(b.nome));
    for (const t of buTorres) {
      const torreSquads = squads.filter((s) => s.torre_id === t.id).sort((a, b) => a.nome.localeCompare(b.nome));
      nodes.push({
        id: `torre-${t.id}`,
        parentId: `bu-${bu.id}`,
        name: t.nome,
        kind: "torre",
        subtitle: `${torreSquads.length} squad${torreSquads.length !== 1 ? "s" : ""}`,
      });
      for (const s of torreSquads) {
        const memberCount = s.membros?.length ?? 0;
        nodes.push({
          id: `squad-${s.id}`,
          parentId: `torre-${t.id}`,
          name: s.nome,
          kind: "squad",
          subtitle: `${memberCount} membro${memberCount !== 1 ? "s" : ""}`,
        });
      }
    }
  }
  return nodes;
}

interface Props {
  businessUnits: BusinessUnit[];
  torres: Torre[];
  squads: Squad[];
  isLoading: boolean;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
}

export function BUOrgChart({ businessUnits, torres, squads, isLoading, layout, onLayoutChange }: Props) {
  const chartRef = useRef<OrgChart<ChartNode> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => buildNodes(businessUnits, torres, squads), [businessUnits, torres, squads]);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    if (!chartRef.current) chartRef.current = new OrgChart<ChartNode>();

    chartRef.current
      .container(containerRef.current as any)
      .data(nodes)
      .layout(layout)
      .compact(false)
      .nodeWidth(() => 220)
      .nodeHeight(() => 72)
      .childrenMargin(() => 48)
      .siblingsMargin(() => 16)
      .compactMarginBetween(() => 16)
      .compactMarginPair(() => 24)
      .nodeContent((d) => {
        const c = KIND_COLORS[d.data.kind];
        const label = KIND_LABEL[d.data.kind];
        const initials = d.data.name.split(" ").slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase();
        return `
          <div style="width:${d.width}px;height:${d.height}px;background:${c.bg};border:2px solid ${c.border};border-radius:10px;display:flex;align-items:center;gap:10px;padding:0 12px;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${c.text};flex-shrink:0;">${initials}</div>
            <div style="overflow:hidden;flex:1;">
              <div style="display:inline-block;font-size:9px;font-weight:600;color:${c.text};background:${c.badge};border-radius:4px;padding:1px 5px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">${label}</div>
              <div style="font-size:13px;font-weight:600;color:${c.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${d.data.name}">${d.data.name}</div>
              ${d.data.subtitle ? `<div style="font-size:10px;color:${c.text};opacity:0.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">${d.data.subtitle}</div>` : ""}
            </div>
          </div>`;
      })
      .render();

    setTimeout(() => chartRef.current?.fit(), 100);
  }, [nodes, layout]);

  const legend: { kind: NodeKind; label: string }[] = [
    { kind: "bu", label: "Business Unit" },
    { kind: "torre", label: "Torre" },
    { kind: "squad", label: "Squad" },
  ];

  // Header + título + tabs ocupam ~13rem. O chart preenche o restante.
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-sm">
          {(["top", "bottom", "left", "right"] as Layout[]).map((l) => (
            <Button key={l} variant={layout === l ? "default" : "ghost"} size="sm"
              className="h-7 px-2 text-xs" onClick={() => onLayoutChange(l)}>
              {LAYOUT_LABELS[l]}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => chartRef.current?.fit()}>
          <Maximize2 className="h-4 w-4" /> Ajustar
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomIn()}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomOut()}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => chartRef.current?.expandAll().fit()}>
          <Network className="h-4 w-4" /> Expandir
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => chartRef.current?.collapseAll().fit()}>
          <AlignCenter className="h-4 w-4" /> Recolher
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 shrink-0 flex-wrap">
        {legend.map(({ kind, label }) => {
          const c = KIND_COLORS[kind];
          return (
            <div key={kind} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1.5px solid ${c.border}` }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Área do gráfico — flex-1 + min-h-0 para crescer corretamente */}
      <div className="flex-1 min-h-0 bg-card border rounded-xl shadow-sm overflow-hidden relative">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-16 w-48 mx-auto" />
            <div className="flex justify-center gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-40" />)}
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Nenhuma BU cadastrada. Crie uma Business Unit para visualizar a hierarquia.
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
