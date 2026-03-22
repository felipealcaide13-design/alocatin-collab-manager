import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { OrgChart } from "d3-org-chart";
import { ZoomIn, ZoomOut, Maximize2, AlignCenter, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type BusinessUnit } from "@/types/businessUnit";
import { type Torre, type Squad } from "@/types/torre";
import { type Colaborador } from "@/types/colaborador";

type Layout = "top" | "left" | "right" | "bottom";
type NodeKind = "bu" | "torre" | "squad" | "root";

interface MemberInfo {
  id: string;
  name: string;
  initials: string;
  senioridade: string;
  subtitle?: string; // usado para exibir info extra (ex: "2 torres")
}

interface ChartNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  subtitle: string;
  members: MemberInfo[];
}

const KIND_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  bu:    { bg: "#1e1b4b", border: "#3730a3", text: "#e0e7ff", badge: "#4338ca" },
  torre: { bg: "#0c4a6e", border: "#0369a1", text: "#e0f2fe", badge: "#0284c7" },
  squad: { bg: "#064e3b", border: "#059669", text: "#d1fae5", badge: "#10b981" },
};

const KIND_LABEL: Record<string, string> = {
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

const ROOT_ID = "__root__";
const NODE_BASE_H = 72;
const MEMBER_ROW_H = 26;
const MEMBERS_SECTION_PADDING = 14;

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function buildNodes(
  businessUnits: BusinessUnit[],
  torres: Torre[],
  squads: Squad[],
  colaboradores: Colaborador[]
): ChartNode[] {
  const nodes: ChartNode[] = [];

  // Mapa: bu_id -> lista de torre ids dessa BU
  const torreIdsByBU = new Map<string, string[]>();
  for (const t of torres) {
    if (!t.bu_id) continue;
    if (!torreIdsByBU.has(t.bu_id)) torreIdsByBU.set(t.bu_id, []);
    torreIdsByBU.get(t.bu_id)!.push(t.id);
  }

  const membersBySquad = new Map<string, MemberInfo[]>();
  const membersByTorre = new Map<string, MemberInfo[]>();
  const membersByBU = new Map<string, MemberInfo[]>();

  for (const c of colaboradores) {
    if (c.status !== "Ativo") continue;
    const info: MemberInfo = {
      id: c.id,
      name: c.nomeCompleto,
      initials: getInitials(c.nomeCompleto),
      senioridade: c.senioridade,
    };

    if (c.squad_ids && c.squad_ids.length > 0) {
      for (const sid of c.squad_ids) {
        if (!membersBySquad.has(sid)) membersBySquad.set(sid, []);
        membersBySquad.get(sid)!.push(info);
      }
    } else if (c.torre_ids && c.torre_ids.length > 0) {
      // Regra Head: se cobre TODAS as torres de alguma BU, vai para essa BU
      if (c.senioridade === "Head") {
        // Descobre a qual BU as torres pertencem (infere mesmo sem bu_id no colaborador)
        const buIdFromTorres = torres.find((t) => c.torre_ids.includes(t.id) && t.bu_id)?.bu_id ?? null;
        const targetBuId = c.bu_id ?? buIdFromTorres;

        if (targetBuId) {
          const buTorreIds = torreIdsByBU.get(targetBuId) ?? [];
          const coversAll =
            buTorreIds.length > 0 &&
            buTorreIds.every((tid) => c.torre_ids.includes(tid));

          if (coversAll) {
            const torreCount = buTorreIds.length;
            const infoWithSub: MemberInfo = {
              ...info,
              subtitle: torreCount + " torre" + (torreCount !== 1 ? "s" : ""),
            };
            if (!membersByBU.has(targetBuId)) membersByBU.set(targetBuId, []);
            membersByBU.get(targetBuId)!.push(infoWithSub);
          } else {
            for (const tid of c.torre_ids) {
              if (!membersByTorre.has(tid)) membersByTorre.set(tid, []);
              membersByTorre.get(tid)!.push(info);
            }
          }
        } else {
          for (const tid of c.torre_ids) {
            if (!membersByTorre.has(tid)) membersByTorre.set(tid, []);
            membersByTorre.get(tid)!.push(info);
          }
        }
      } else {
        for (const tid of c.torre_ids) {
          if (!membersByTorre.has(tid)) membersByTorre.set(tid, []);
          membersByTorre.get(tid)!.push(info);
        }
      }
    } else if (c.bu_id) {
      if (!membersByBU.has(c.bu_id)) membersByBU.set(c.bu_id, []);
      membersByBU.get(c.bu_id)!.push(info);
    }
  }

  // No raiz virtual
  nodes.push({ id: ROOT_ID, parentId: null, name: "root", kind: "root", subtitle: "", members: [] });

  for (const bu of [...businessUnits].sort((a, b) => a.nome.localeCompare(b.nome))) {
    const buMembers = membersByBU.get(bu.id) ?? [];
    const buTorresCount = torres.filter((t) => t.bu_id === bu.id).length;
    nodes.push({
      id: "bu-" + bu.id,
      parentId: ROOT_ID,
      name: bu.nome,
      kind: "bu",
      subtitle: buTorresCount + " torre" + (buTorresCount !== 1 ? "s" : ""),
      members: buMembers,
    });

    const buTorres = torres
      .filter((t) => t.bu_id === bu.id)
      .sort((a, b) => a.nome.localeCompare(b.nome));

    for (const t of buTorres) {
      const torreSquads = squads
        .filter((s) => s.torre_id === t.id)
        .sort((a, b) => a.nome.localeCompare(b.nome));
      const torreMembers = membersByTorre.get(t.id) ?? [];

      nodes.push({
        id: "torre-" + t.id,
        parentId: "bu-" + bu.id,
        name: t.nome,
        kind: "torre",
        subtitle: torreSquads.length + " squad" + (torreSquads.length !== 1 ? "s" : ""),
        members: torreMembers,
      });

      for (const s of torreSquads) {
        const squadMembers = membersBySquad.get(s.id) ?? [];
        nodes.push({
          id: "squad-" + s.id,
          parentId: "torre-" + t.id,
          name: s.nome,
          kind: "squad",
          subtitle: squadMembers.length + " membro" + (squadMembers.length !== 1 ? "s" : ""),
          members: squadMembers,
        });
      }
    }
  }

  // Torres sem BU
  for (const t of torres) {
    if (nodes.some((n) => n.id === "torre-" + t.id)) continue;
    const torreSquads = squads.filter((s) => s.torre_id === t.id);
    const torreMembers = membersByTorre.get(t.id) ?? [];
    nodes.push({
      id: "torre-" + t.id,
      parentId: ROOT_ID,
      name: t.nome,
      kind: "torre",
      subtitle: torreSquads.length + " squad" + (torreSquads.length !== 1 ? "s" : ""),
      members: torreMembers,
    });
    for (const s of torreSquads) {
      const squadMembers = membersBySquad.get(s.id) ?? [];
      nodes.push({
        id: "squad-" + s.id,
        parentId: "torre-" + t.id,
        name: s.nome,
        kind: "squad",
        subtitle: squadMembers.length + " membro" + (squadMembers.length !== 1 ? "s" : ""),
        members: squadMembers,
      });
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  return nodes.filter((n) => n.parentId === null || nodeIds.has(n.parentId));
}

function nodeHeight(d: any): number {
  if (d.data.id === ROOT_ID) return 1;
  const members: MemberInfo[] = d.data.members ?? [];
  if (members.length === 0) return NODE_BASE_H;
  return NODE_BASE_H + MEMBERS_SECTION_PADDING + members.length * MEMBER_ROW_H;
}

function nodeContent(d: any): string {
  if (d.data.id === ROOT_ID) return "<div style='display:none'></div>";
  const c = KIND_COLORS[d.data.kind];
  const label = KIND_LABEL[d.data.kind] ?? "";
  const initials = d.data.name.split(" ").slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase();
  const members: MemberInfo[] = d.data.members ?? [];

  const subtitleHtml = d.data.subtitle
    ? "<div style='font-size:10px;color:" + c.text + ";opacity:0.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;'>" + d.data.subtitle + "</div>"
    : "";

  const membersHtml = members.length > 0
    ? "<div style='border-top:1px solid rgba(255,255,255,0.15);margin-top:6px;padding-top:6px;display:flex;flex-direction:column;gap:3px;'>" +
      members.map((m) =>
        "<div style='display:flex;align-items:center;gap:6px;min-width:0;'>" +
        "<div style='width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:" + c.text + ";flex-shrink:0;'>" + m.initials + "</div>" +
        "<div style='overflow:hidden;flex:1;min-width:0;'>" +
        "<div style='font-size:10px;color:" + c.text + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>" + m.name + "</div>" +
        (m.subtitle ? "<div style='font-size:8px;color:" + c.text + ";opacity:0.6;white-space:nowrap;'>" + m.subtitle + "</div>" : "") +
        "</div>" +
        "<span style='font-size:8px;color:" + c.text + ";opacity:0.6;white-space:nowrap;flex-shrink:0;'>" + m.senioridade + "</span>" +
        "</div>"
      ).join("") +
      "</div>"
    : "";

  return (
    "<div style='width:" + d.width + "px;height:" + d.height + "px;background:" + c.bg + ";border:2px solid " + c.border + ";border-radius:10px;padding:0 12px;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;overflow:hidden;'>" +
    "<div style='display:flex;align-items:center;gap:10px;height:" + NODE_BASE_H + "px;'>" +
    "<div style='width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:" + c.text + ";flex-shrink:0;'>" + initials + "</div>" +
    "<div style='overflow:hidden;flex:1;'>" +
    "<div style='display:inline-block;font-size:9px;font-weight:600;color:" + c.text + ";background:" + c.badge + ";border-radius:4px;padding:1px 5px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;'>" + label + "</div>" +
    "<div style='font-size:13px;font-weight:600;color:" + c.text + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>" + d.data.name + "</div>" +
    subtitleHtml +
    "</div>" +
    "</div>" +
    (members.length > 0 ? "<div style='padding:0 0 8px 0;'>" + membersHtml + "</div>" : "") +
    "</div>"
  );
}

interface Props {
  businessUnits: BusinessUnit[];
  torres: Torre[];
  squads: Squad[];
  colaboradores: Colaborador[];
  isLoading: boolean;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
}

export function BUOrgChart({ businessUnits, torres, squads, colaboradores, isLoading, layout, onLayoutChange }: Props) {
  const chartRef = useRef<OrgChart<ChartNode> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperSize, setWrapperSize] = useState<{ w: number; h: number } | null>(null);

  const nodes = useMemo(
    () => buildNodes(businessUnits, torres, squads, colaboradores),
    [businessUnits, torres, squads, colaboradores]
  );

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setWrapperSize({ w: width, h: height });
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !wrapperSize || nodes.length === 0) return;

    if (!chartRef.current) {
      chartRef.current = new OrgChart<ChartNode>();
    }

    const chart = chartRef.current;
    chart
      .container(containerRef.current as any)
      .data(nodes)
      .layout(layout)
      .compact(false)
      .svgWidth(wrapperSize.w)
      .svgHeight(wrapperSize.h)
      .nodeWidth((d: any) => d.data.id === ROOT_ID ? 1 : 240)
      .nodeHeight((d: any) => nodeHeight(d))
      .childrenMargin((d: any) => d.data.id === ROOT_ID ? 20 : 48)
      .siblingsMargin(() => 16)
      .compactMarginBetween(() => 16)
      .compactMarginPair(() => 24)
      .nodeContent(nodeContent)
      .render();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => chart.fit());
    });
  }, [nodes, layout, wrapperSize]);

  const handleFit = useCallback(() => {
    if (!chartRef.current || !wrapperRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = wrapperRef.current;
    chartRef.current.svgWidth(w).svgHeight(h).fit();
  }, []);

  const legend: { kind: string; label: string }[] = [
    { kind: "bu", label: "Business Unit" },
    { kind: "torre", label: "Torre" },
    { kind: "squad", label: "Squad" },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-sm">
          {(["top", "bottom", "left", "right"] as Layout[]).map((l) => (
            <Button
              key={l}
              variant={layout === l ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onLayoutChange(l)}
            >
              {LAYOUT_LABELS[l]}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleFit}>
          <Maximize2 className="h-4 w-4" /> Ajustar
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomIn()}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => chartRef.current?.zoomOut()}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => { chartRef.current?.expandAll(); handleFit(); }}
        >
          <Network className="h-4 w-4" /> Expandir
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => { chartRef.current?.collapseAll(); handleFit(); }}
        >
          <AlignCenter className="h-4 w-4" /> Recolher
        </Button>
      </div>

      <div ref={wrapperRef} className="flex-1 min-h-0 bg-card border rounded-xl shadow-sm overflow-hidden relative">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-16 w-48 mx-auto" />
            <div className="flex justify-center gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-40" />)}
            </div>
          </div>
        ) : nodes.length <= 1 ? (
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
