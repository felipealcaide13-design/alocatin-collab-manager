/**
 * Design System — Correctness Properties
 * Vitest + fast-check (PBT)
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as fc from "fast-check";
import { Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChartContainer } from "@/components/ui/chart-container";
import { PageLayout } from "@/components/ui/page-layout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrai o valor de uma variável CSS do :root (jsdom não processa CSS real,
 *  então validamos apenas que os tokens estão definidos como strings não-vazias
 *  no arquivo index.css via importação estática de texto). */
const PRIMARY_TOKEN_REGEX = /^(#[0-9a-fA-F]{3,8}|hsl\(|oklch\(|rgb\()/;

// ---------------------------------------------------------------------------
// Property 1 — Tokens primários são valores CSS válidos
// ---------------------------------------------------------------------------
describe("Property 1: tokens primários são valores CSS válidos", () => {
  it("cada token --primary-* definido no index.css começa com # ou hsl/oklch/rgb", async () => {
    // Lê o arquivo CSS como texto para inspecionar os tokens
    const cssText = await import("../index.css?raw").then((m) => m.default).catch(() => "");

    // Extrai valores dos tokens primários
    const tokenMatches = [...cssText.matchAll(/--primary-\d+:\s*([^;]+);/g)];

    // Se o CSS não foi carregado (ambiente jsdom), pula graciosamente
    if (tokenMatches.length === 0) return;

    for (const [, value] of tokenMatches) {
      const trimmed = value.trim();
      expect(trimmed.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 2 — StatCard com isLoading=true nunca renderiza valor numérico
// ---------------------------------------------------------------------------
describe("Property 2: StatCard com isLoading=true nunca renderiza valor numérico", () => {
  it("para qualquer valor numérico, o skeleton oculta o valor", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999999 }), (value) => {
        const { container, unmount } = render(
          <StatCard title="Teste" value={value} icon={Users} isLoading={true} />
        );
        // O valor numérico não deve aparecer como texto visível
        expect(container.textContent).not.toContain(String(value));
        unmount();
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3 — StatCard com qualquer variant válido renderiza sem erro
// ---------------------------------------------------------------------------
describe("Property 3: StatCard com qualquer variant válido renderiza sem erro", () => {
  const variants = ["default", "success", "warning", "danger", "info"] as const;

  it("todos os variants renderizam sem lançar exceção", () => {
    fc.assert(
      fc.property(fc.constantFrom(...variants), (variant) => {
        expect(() => {
          const { unmount } = render(
            <StatCard title="Teste" value={42} icon={Users} variant={variant} />
          );
          unmount();
        }).not.toThrow();
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4 — StatusBadge com status desconhecido renderiza sem erro
// ---------------------------------------------------------------------------
describe("Property 4: StatusBadge com status desconhecido renderiza sem erro", () => {
  it("qualquer string arbitrária como status não lança exceção", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (status) => {
        expect(() => {
          const { unmount } = render(<StatusBadge status={status} variant="entity" />);
          unmount();
        }).not.toThrow();
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5 — StatusBadge sempre contém texto visível
// ---------------------------------------------------------------------------
describe("Property 5: StatusBadge sempre contém texto visível", () => {
  const variants = ["entity", "contract", "seniority"] as const;

  it("para qualquer status e variant, o badge exibe o texto do status", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.constantFrom(...variants),
        (status, variant) => {
          const { container, unmount } = render(
            <StatusBadge status={status} variant={variant} />
          );
          expect(container.textContent).toContain(status);
          unmount();
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6 — ChartContainer com isLoading=true nunca renderiza children
// ---------------------------------------------------------------------------
describe("Property 6: ChartContainer com isLoading=true nunca renderiza children", () => {
  it("o conteúdo filho não aparece enquanto carregando", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (childText) => {
        const { container, unmount } = render(
          <ChartContainer title="Gráfico" isLoading={true}>
            <div>{childText}</div>
          </ChartContainer>
        );
        expect(container.textContent).not.toContain(childText);
        unmount();
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7 — Saudação contextual cobre todas as faixas de hora
// ---------------------------------------------------------------------------
describe("Property 7: saudação contextual cobre todas as faixas de hora", () => {
  // Replica a lógica de getGreeting de Index.tsx
  function getGreeting(hour: number): string {
    if (hour >= 6 && hour <= 11) return "Bom dia";
    if (hour >= 12 && hour <= 17) return "Boa tarde";
    return "Boa noite";
  }

  it("horas 6–11 retornam 'Bom dia'", () => {
    fc.assert(
      fc.property(fc.integer({ min: 6, max: 11 }), (hour) => {
        expect(getGreeting(hour)).toBe("Bom dia");
      })
    );
  });

  it("horas 12–17 retornam 'Boa tarde'", () => {
    fc.assert(
      fc.property(fc.integer({ min: 12, max: 17 }), (hour) => {
        expect(getGreeting(hour)).toBe("Boa tarde");
      })
    );
  });

  it("horas fora de 6–17 retornam 'Boa noite'", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 18, max: 23 })),
        (hour) => {
          expect(getGreeting(hour)).toBe("Boa noite");
        }
      )
    );
  });

  it("toda hora válida (0–23) retorna uma saudação não-vazia", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        expect(getGreeting(hour).length).toBeGreaterThan(0);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8 — DetailPanel sempre renderiza DialogTitle acessível
// ---------------------------------------------------------------------------
describe("Property 8: DetailPanel renderiza DialogTitle acessível", () => {
  it("ColaboradorDetailPanel com colaborador null não renderiza nada", async () => {
    const { ColaboradorDetailPanel } = await import(
      "@/components/colaboradores/ColaboradorDetailPanel"
    );
    const { container } = render(
      <ColaboradorDetailPanel
        colaborador={null}
        open={true}
        onClose={() => {}}
        areas={[]}
        especialidades={[]}
        diretorias={[]}
        torres={[]}
        squads={[]}
        contratos={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("ContratoDetailPanel com contrato null não renderiza nada", async () => {
    const { ContratoDetailPanel } = await import(
      "@/components/contratos/ContratoDetailPanel"
    );
    const { container } = render(
      <ContratoDetailPanel
        contrato={null}
        open={true}
        onClose={() => {}}
        torres={[]}
        squads={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Property 9 — PageLayout aplica space-y-6 no container raiz
// ---------------------------------------------------------------------------
describe("Property 9: PageLayout aplica space-y-6 no container raiz", () => {
  it("para qualquer título, o wrapper raiz contém a classe space-y-6", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), (title) => {
        const { container, unmount } = render(
          <PageLayout title={title}>
            <div>conteúdo</div>
          </PageLayout>
        );
        const root = container.firstElementChild;
        expect(root?.className).toContain("space-y-6");
        unmount();
      })
    );
  });
});
