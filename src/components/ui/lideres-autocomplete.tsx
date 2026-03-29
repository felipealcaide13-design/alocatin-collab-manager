import { useState, useRef, useEffect } from "react";
import { X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface Lider {
  id: string;
  nomeCompleto: string;
  senioridade: string;
}

interface LideresAutocompleteProps {
  value: string[];
  onChange: (ids: string[]) => void;
  options: Lider[];
  isLoading?: boolean;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

const SENIORITY_BADGE: Record<string, string> = {
  "C-level":      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  "Diretor(a)":   "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  "Head":         "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800",
  "Gerente":      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800",
  "Coordenador(a)": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
};

const FALLBACK_BADGE = "bg-muted text-muted-foreground border-transparent";

export function LideresAutocomplete({
  value,
  onChange,
  options,
  isLoading,
  placeholder = "Buscar líderes...",
  error,
  className,
}: LideresAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => {
    if (value.includes(o.id)) return false;
    if (!query) return true;
    return o.nomeCompleto.toLowerCase().includes(query.toLowerCase());
  });

  const selected = options.filter((o) => value.includes(o.id));

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
      setQuery("");
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input box com chips */}
      <div
        className={cn(
          "flex flex-wrap gap-1.5 items-center min-h-11 px-4 py-2 rounded-full border bg-white shadow-sm",
          "cursor-text transition-all duration-200",
          open ? "ring-2 ring-primary/20 border-primary" : "hover:border-primary/50",
          error && "border-destructive ring-destructive/20"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {selected.map((lider) => (
          <div
            key={lider.id}
            className="inline-flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-full bg-white border border-border shadow-sm group"
          >
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0", 
              SENIORITY_BADGE[lider.senioridade] || FALLBACK_BADGE
            )}>
              {lider.senioridade}
            </span>
            <span className="text-xs font-medium max-w-[120px] truncate text-foreground">
              {lider.nomeCompleto}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggle(lider.id); }}
              className="hover:bg-destructive hover:text-white text-muted-foreground rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
          placeholder={selected.length === 0 ? placeholder : ""}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />

        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-auto opacity-50" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-popover shadow-lg animate-in fade-in zoom-in-95 duration-200">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {query ? "Nenhum resultado." : "Todos já selecionados."}
            </p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.map((lider) => (
                <li
                  key={lider.id}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors border-b last:border-0 border-muted/20"
                  onMouseDown={(e) => { e.preventDefault(); toggle(lider.id); }}
                >
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0", 
                    SENIORITY_BADGE[lider.senioridade] || FALLBACK_BADGE
                  )}>
                    {lider.senioridade}
                  </span>
                  <span className="font-medium truncate">{lider.nomeCompleto}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
