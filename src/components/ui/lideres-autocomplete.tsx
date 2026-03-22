import { useState, useRef, useEffect } from "react";
import { X, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const SENIORITY_BADGE: Record<string, string> = {
  "Diretor(a)": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Head":       "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "Gerente":    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
};

export function LideresAutocomplete({
  value,
  onChange,
  options,
  isLoading,
  placeholder = "Buscar líderes...",
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
    <div ref={containerRef} className="relative">
      {/* Input box com chips */}
      <div
        className={cn(
          "flex flex-wrap gap-1.5 items-center min-h-10 px-3 py-2 rounded-md border bg-background",
          "cursor-text transition-colors",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {selected.map((lider) => (
          <span
            key={lider.id}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
          >
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", SENIORITY_BADGE[lider.senioridade])}>
              {lider.senioridade}
            </span>
            {lider.nomeCompleto}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggle(lider.id); }}
              className="hover:bg-primary/20 rounded-full p-0.5 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={selected.length === 0 ? placeholder : ""}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />

        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {query ? "Nenhum resultado." : "Todos já selecionados."}
            </p>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.map((lider) => (
                <li
                  key={lider.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/60 transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); toggle(lider.id); }}
                >
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0", SENIORITY_BADGE[lider.senioridade])}>
                    {lider.senioridade}
                  </span>
                  <span className="truncate">{lider.nomeCompleto}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
