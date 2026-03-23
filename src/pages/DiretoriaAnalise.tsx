import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrgChart } from "d3-org-chart";
import {
  ArrowLeft, Users, BarChart2, Briefcase, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, AlignCenter, LayoutList, Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailSection } from "@/components/ui/detail-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { diretoriaService } from "@/services/diretoriaService";
import { especialidadeService } from "@/services/especialidadeService";
import { torreService } from "@/services/torreService";
import { colaboradorService } from "@/services/colaboradorService";
import { type Colaborador, type Senioridade } from "@/types/colaborador";

type Layout = "cima" | "esquerda" | "direita" | "baixo";
type D3Layout = "top" | "left" | "right" | "bottom";

const LAYOUT_MAP: Record<Layout, D3Layout> = {
  cima: "top", esquerda: "left", direita: "right", baixo: "bottom",
};

interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  senioridade: Senioridade | "diretoria";
}

const SENIORITY_ORDER: Senioridade[] = [
  "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
  "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
];

const SENIORITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "diretoria":       { bg: "#0f172a", border: "#1e293b", text: "#f8fafc" },
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

const VALID_PARENT_SENIORITIES: Partial<Record<Senioridade, Senioridade[]>> = {
  "Diretor(a)":      ["C-level"],
  "Head":            ["Diretor(a)", "C-level"],
  "Gerente":         ["Head", "Diretor(a)", "C-level"],
  "Coordenador(a)":  ["Gerente", "Head", "Diretor(a)", "C-level"],
  "Staf I":          ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Staf II":         ["Coordenador(a)", "Gerente", "Head", "Diretor(a)", "C-level"],
  "Analista senior": ["Coordenador(a)", "Gerente", "Diretor(a)", "C-level"],
  "Analista pleno":  ["Coordenador(a)", "Gerente", "Diretor(a)", "C-level"],
  "Analista junior": ["Coordenador(a)", "Gerente", "Diretor(a)", "C-level"],
};

function seniorityIndex(s: Senioridade): number {
  return SENIORITY_ORDER.indexOf(s);
}

function buildDiretoriaNodes(colaboradores: Colaborador[], diretoriaId: string, diretoriaNome: string): OrgNode[] {
  const ativos = colaboradores.filter((c) => c.status === "Ativo" && c.diretoria_id === diretoriaId);
  const root: OrgNode = { id: "diretoria-root", parentId: null, name: diretoriaNome, senioridade: "diretoria" };
  const nodes: OrgNode[] = [root];

  const sorted = [...ativos].sort((a, b) => seniorityIndex(a.senioridade) - seniorityIndex(b.senioridade));

  function findParent(colab: Colaborador): string {
    const validSeniorities = VALID_PARENT_SENIORITIES[colab.senioridade] ?? [];
    const candidates = nodes.filter(
      (n) => n.senioridade !== "diretoria" && validSeniorities.includes(n.senioridade as Senioridade)
    );
    if (candidates.length === 0) return "diretoria-root";

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

  for (const c of sorted) {
    const parentId = c.senioridade === "C-level" ? "diretoria-root" : findParent(c);
    nodes.push({ id: c.id, parentId, name: c.nomeCompleto, senioridade: c.senioridade });
  }

  return nodes;
}

function nodeContent(d: any): string {
  const colors = SENIORITY_COLORS[d.data.senioridade] ?? SENIORITY_COLORS["Analista junior"];
  const isRoot = d.data.senioridade === "diretoria";
  const initials = isRoot
    ? d.data.name.slice(0, 2).toUpperCase()
    : d.data.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return `
    <div style="
      width:${d.width}px;height:${d.height}px;
      background:${colors.bg};border:2px solid ${colors.border};
      border-radius:10px;display:flex;align-items:center;
      gap:10px;padding:0 12px;box-sizing:border-box;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
    ">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:rgba(255,255,255,0.15);
        display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:700;color:${colors.text};flex-shrink:0;
      ">${initials}</div>
      <div style="overflow:hidden;flex:1;">
        <div style="
          font-size:10px;color:${colors.text};opacity:0.75;
          letter-spacing:0.02em;
          margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        ">${isRoot ? "Diretoria" : d.data.senioridade}</div>
        <div style="
          font-size:13px;font-weight:600;color:${colors.text};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        " title="${d.data.name}">${d.data.name}</div>
      </div>
    </div>
  `;
}

export default function DiretoriaAnalise() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const chartRef = useRef<OrgChart<OrgNode> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>("cima");
  const [compact, setCompact] = useState(false);
  const [wrapperSize, setWrapperSize] = useState<{ w: number; h: number } | null>(null);

  const { data: diretorias = [] } = useQuery({
    queryKey: ["diretorias"],
    queryFn: () => diretoriaService.getAll().catch(() => []),
  });

  const { data: colaboradores = [], isLoading: loadingColabs } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll().catch(() => []),
  });

  const { data: especialidades = [] } = useQuery({
    queryKey: ["especialidades"],
    queryFn: () => especialidadeService.getAll().catch(() => []),
  });

  const { data: torres = [] } = useQuery({
    queryKey: ["torres"],
    queryFn: () => torreService.getAllTorres().catch(() => []),
  });

  const { data: squads = [] } = useQuery({
    queryKey: ["squads"],
    queryFn: () => torreService.getAllSquads().catch(() => []),
  });

  const diretoria = useMemo(() => diretorias.find((d) => d.id === id) ?? null, [diretorias, id]);

  const dirColabs = useMemo(() => {
    if (!id) return [];
    return colaboradores.filter((c) => c.diretoria_id === id && c.status === "Ativo");
  }, [colaboradores, id]);

  const bySenioridade = useMemo(() => {
    const map = new Map<string, number>();
    dirColabs.forEach((c) => map.set(c.senioridade, (map.get(c.senioridade) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dirColabs]);

  const byEspecialidade = useMemo(() => {
    const map = new Map<string, number>();
    dirColabs.forEach((c) => {
      const key = c.especialidade_id
        ? (especialidades.find((e) => e.id === c.especialidade_id)?.nome ?? "Sem especialidade")
        : "Sem especialidade";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dirColabs, especialidades]);

  const squadAllocations = useMemo(() => {
    return squads
      .map((sq) => {
        const count = dirColabs.filter((c) => (sq.membros ?? []).includes(c.id)).length;
        if (count === 0) return null;
        const torre = torres.find((t) => t.id === sq.torre_id);
        return { squad: sq, torre, count };
      })
      .filter(Boolean) as { squad: any; torre: any; count: number }[];
  }, [dirColabs, squads, torres]);

  const nodes = useMemo(
    () => (diretoria ? buildDiretoriaNodes(colaboradores, diretoria.id, diretoria.nome) : []),
    [colaboradores, diretoria]
  );

  // ResizeObserver para o wrapper do chart
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setWrapperSize({ w: width, h: height });
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Renderiza o chart
  useEffect(() => {
    if (!containerRef.current || !wrapperSize || nodes.length === 0) return;
    if (!chartRef.current) chartRef.current = new OrgChart<OrgNode>();

    chartRef.current
      .container(containerRef.current as any)
      .data(nodes)
      .layout(LAYOUT_MAP[layout])
      .compact(compact)
      .svgWidth(wrapperSize.w)
      .svgHeight(wrapperSize.h)
      .nodeWidth(() => 210)
      .nodeHeight(() => 76)
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 20)
      .compactMarginPair(() => 30)
      .siblingsMargin(() => 20)
      .nodeContent(nodeContent)
      .render();

    requestAnimationFrame(() => requestAnimationFrame(() => chartRef.current?.fit()));
  }, [nodes, layout, compact, wrapperSize]);

  const handleFit = useCallback(() => {
    if (!chartRef.current || !wrapperRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = wrapperRef.current;
    chartRef.current.svgWidth(w).svgHeight(h).fit();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/areas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {diretoria?.nome ?? "Diretoria"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {dirColabs.length} colaborador{dirColabs.length !== 1 ? "es" : ""} ativo{dirColabs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* Left — informações */}
        <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-1">
          {loadingColabs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : dirColabs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum colaborador ativo nesta diretoria.
            </div>
          ) : (
            <>
              <DetailSection icon={BarChart2} title="Por senioridade">
                <div className="flex flex-wrap gap-2">
                  {bySenioridade.map(([sen, count]) => (
                    <span key={sen} className="inline-flex items-center gap-1.5">
                      <StatusBadge status={sen} variant="seniority" />
                      <span className="text-xs font-bold text-foreground">{count}</span>
                    </span>
                  ))}
                </div>
              </DetailSection>

              {squadAllocations.length > 0 && (
                <DetailSection icon={ChevronRight} title="Alocação em torres e squads">
                  <div className="space-y-1.5">
                    {squadAllocations.map(({ squad, torre, count }) => (
                      <div key={squad.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted/20 text-sm">
                        <span className="text-muted-foreground shrink-0">{torre?.nome ?? "—"}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="font-medium text-foreground flex-1 truncate">{squad.nome}</span>
                        <Badge variant="secondary" className="shrink-0">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection icon={Users} title="Colaboradores">
                <div className="space-y-1">
                  {dirColabs.map((c) => {
                    const esp = especialidades.find((e) => e.id === c.especialidade_id);
                    const squadNames = squads
                      .filter((sq) => (sq.membros ?? []).includes(c.id))
                      .map((sq) => sq.nome)
                      .join(", ");
                    return (
                      <div key={c.id} className="flex items-start justify-between rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.nomeCompleto}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {esp?.nome ?? "—"}{squadNames ? ` · ${squadNames}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={c.senioridade} variant="seniority" className="ml-3 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </DetailSection>
            </>
          )}
        </div>

        {/* Right — chart */}
        <div className="w-1/2 flex flex-col gap-3 min-h-0">
          {/* Chart controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
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

          {/* Chart board */}
          <div ref={wrapperRef} className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden relative min-h-0">
            {loadingColabs ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-20 w-48 mx-auto" />
                <div className="flex justify-center gap-6">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-40" />)}
                </div>
              </div>
            ) : nodes.length <= 1 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Nenhum colaborador ativo para exibir no chart.
              </div>
            ) : (
              <div ref={containerRef} className="w-full h-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
