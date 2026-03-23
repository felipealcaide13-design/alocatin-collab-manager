import { useState, useEffect, useRef } from "react";
import { Search, Users, FileText, Layers, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { colaboradorService } from "@/services/colaboradorService";
import { contratoService } from "@/services/contratoService";
import { torreService } from "@/services/torreService";

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  type: "colaborador" | "contrato" | "squad" | "torre";
};

const typeConfig = {
  colaborador: { icon: Users, color: "text-[var(--primary-600)]", label: "Colaborador" },
  contrato: { icon: FileText, color: "text-green-500", label: "Contrato" },
  squad: { icon: Layers, color: "text-purple-500", label: "Squad" },
  torre: { icon: Building2, color: "text-orange-500", label: "Torre" },
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = query.toLowerCase();
    setLoading(true);

    Promise.all([
      colaboradorService.getAll(),
      contratoService.getAll(),
      torreService.getAllSquads(),
      torreService.getAllTorres(),
    ]).then(([colaboradores, contratos, squads, torres]) => {
      const items: ResultItem[] = [];

      colaboradores
        .filter(
          (c) =>
            c.nomeCompleto.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        )
        .slice(0, 5)
        .forEach((c) =>
          items.push({
            id: c.id,
            label: c.nomeCompleto,
            sublabel: c.email ?? undefined,
            type: "colaborador",
          })
        );

      contratos
        .filter((c) => c.nome.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((c) =>
          items.push({
            id: c.id,
            label: c.nome,
            sublabel: c.status,
            type: "contrato",
          })
        );

      squads
        .filter((s) => s.nome.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((s) =>
          items.push({
            id: s.id,
            label: s.nome,
            sublabel: s.lider ?? undefined,
            type: "squad",
          })
        );

      torres
        .filter((t) => t.nome.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((t) =>
          items.push({
            id: t.id,
            label: t.nome,
            sublabel: t.descricao ?? undefined,
            type: "torre",
          })
        );

      setResults(items);
      setOpen(items.length > 0);
      setLoading(false);
    });
  }, [query]);

  const navigateTo = (item: ResultItem) => {
    setQuery("");
    setOpen(false);
    switch (item.type) {
      case "colaborador":
        navigate(`/colaboradores?openId=${item.id}`);
        break;
      case "contrato":
        navigate(`/contratos?search=${encodeURIComponent(item.label)}`);
        break;
      case "torre":
        navigate(`/business-units?tab=torres&openId=${item.id}`);
        break;
      case "squad":
        navigate(`/business-units?tab=squads&openId=${item.id}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigateTo(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar colaborador, contrato, squad ou torre..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-full border-0 bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background placeholder:text-muted-foreground"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado.</div>
          ) : (
            <ul>
              {results.map((item, idx) => {
                const { icon: Icon, color, label: typeLabel } = typeConfig[item.type];
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      onClick={() => navigateTo(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        idx === activeIndex ? "bg-accent" : "hover:bg-accent"
                      }`}
                    >
                      <Icon size={16} className={color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{typeLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
