/**
 * Teste de Exploração do Bug Condition — Tarefa 1
 *
 * Property 1: Bug Condition - Cache não invalidado após save de configuração
 *
 * CRITICAL: Este teste DEVE FALHAR no código não corrigido.
 * A falha confirma que o bug existe.
 *
 * O teste codifica o comportamento ESPERADO (correto):
 * - Após save bem-sucedido de Torre, `queryClient.invalidateQueries` DEVE ser chamado
 * - Após save bem-sucedido de BU, `queryClient.invalidateQueries` DEVE ser chamado
 *
 * No código não corrigido, esses testes FALHAM porque o componente
 * não importa nem usa `useQueryClient`, portanto nunca chama `invalidateQueries`.
 *
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BUTorreConfigTab } from "@/components/business-units/BUTorreConfigTab";

// ── Mocks de módulos externos ────────────────────────────────────────────────

vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

vi.mock("@/services/configuracaoTorreService", () => ({
  configuracaoTorreService: {
    getByBuId: vi.fn().mockResolvedValue({
      bu_id: "bu-1",
      descricao_habilitada: false,
      campos_lideranca: [],
    }),
    upsert: vi.fn().mockResolvedValue({
      bu_id: "bu-1",
      descricao_habilitada: false,
      campos_lideranca: [],
    }),
  },
}));

vi.mock("@/services/configuracaoBUService", () => ({
  configuracaoBUService: {
    get: vi.fn().mockResolvedValue({
      descricao_habilitada: false,
      campos_lideranca: [],
    }),
    upsert: vi.fn().mockResolvedValue({
      descricao_habilitada: false,
      campos_lideranca: [],
    }),
  },
}));

vi.mock("@/services/diretoriaService", () => ({
  diretoriaService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const businessUnits = [{ id: "bu-1", nome: "Financeiro" }];

// ── Testes ───────────────────────────────────────────────────────────────────

describe("Bug Condition — Cache não invalidado após save de configuração", () => {
  let queryClient: QueryClient;
  let invalidateQueriesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
  });

  /**
   * Caso 1 — Torre Save com invalidação (comportamento esperado após correção)
   *
   * Validates: Requirements 1.1
   * isBugCondition: handleSaveTorre chamado com upsert bem-sucedido
   * Esperado: `queryClient.invalidateQueries` é chamado com `["configuracao_torre", "bu-1"]`
   *
   * O Radix Select não funciona no jsdom. Usamos `hideTabs` + `defaultTab="torre"`
   * e simulamos a seleção de BU via `onValueChange` diretamente no estado interno
   * do componente, forçando a renderização do botão de save.
   */
  it("deve chamar invalidateQueries após save bem-sucedido de configuração de Torre", async () => {
    // Renderizar com uma BU já "selecionada" via prop selectedBuId não existe,
    // então usamos o tab BU (que não precisa de Select) para validar o padrão,
    // e para Torre usamos fireEvent no trigger do Select para simular a seleção.
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <BUTorreConfigTab businessUnits={businessUnits} defaultTab="torre" />
      </QueryClientProvider>
    );

    // Simular seleção de BU no Select via disparo de evento change no elemento nativo
    // O Radix Select renderiza um <select> nativo oculto para acessibilidade
    const nativeSelect = container.querySelector('select');
    if (nativeSelect) {
      fireEvent.change(nativeSelect, { target: { value: "bu-1" } });
    } else {
      // Fallback: disparar evento no trigger do Radix Select
      const trigger = container.querySelector('[role="combobox"]');
      if (trigger) {
        fireEvent.click(trigger);
        // Aguardar opções aparecerem e clicar na primeira
        await waitFor(() => {
          const option = document.querySelector('[role="option"]');
          if (option) fireEvent.click(option);
        }, { timeout: 1000 }).catch(() => {});
      }
    }

    // Aguardar o botão de save aparecer (indica que BU foi selecionada e config carregada)
    await waitFor(() => {
      expect(screen.getByText("Salvar Configuração")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Acionar o save de Torre
    fireEvent.click(screen.getByText("Salvar Configuração"));

    // DEVE PASSAR após correção: invalidateQueries é chamado
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verificar que invalidateQueries foi chamado com a key correta de Torre
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["configuracao_torre", "bu-1"] })
    );
  });

  /**
   * Caso 2 — BU Save sem invalidação
   *
   * Validates: Requirements 1.2
   * isBugCondition: handleSaveBU chamado com upsert bem-sucedido
   * Esperado: `queryClient.invalidateQueries` é chamado com `["configuracao_bu"]`
   * Bug: `invalidateQueries` NUNCA é chamado (componente não usa useQueryClient)
   *
   * Counterexample documentado:
   *   - handleSaveBU chama configuracaoBUService.upsert com sucesso
   *   - queryClient.invalidateQueries NÃO é chamado
   *   - Causa: BUTorreConfigTab não importa useQueryClient de @tanstack/react-query
   */
  it("deve chamar invalidateQueries após save bem-sucedido de configuração de BU", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BUTorreConfigTab businessUnits={businessUnits} defaultTab="bu" />
      </QueryClientProvider>
    );

    // Aguardar o carregamento da configuração de BU
    await waitFor(() => {
      expect(screen.getByText("Salvar Configuração")).toBeInTheDocument();
    });

    // Acionar o save de BU
    fireEvent.click(screen.getByText("Salvar Configuração"));

    // DEVE FALHAR: invalidateQueries não é chamado no código não corrigido
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verificar que invalidateQueries foi chamado com a key correta
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["configuracao_bu"] })
    );
  });
});
