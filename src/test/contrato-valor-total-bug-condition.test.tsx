/**
 * Teste de Exploração do Bug Condition — Tarefa 1
 *
 * Property 1: Bug Condition - Campo Valor Total sem formatação de milhares
 *
 * CRITICAL: Este teste DEVE FALHAR no código não corrigido.
 * A falha confirma que o bug existe.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContratoForm } from "@/components/contratos/ContratoForm";
import type { Contrato } from "@/types/contrato";

// Minimal mock para evitar erros de módulos externos não relevantes ao teste
vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const baseContrato: Contrato = {
  id: "test-id",
  nome: "Contrato Teste",
  cliente: "Cliente Teste",
  valor_total: 1000000,
  data_inicio: "2024-01-01",
  data_fim: null,
  status: "Ativo",
  descricao: null,
  torres: [],
};

function renderForm(valorTotal: number | null) {
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ContratoForm
      open={true}
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={{ ...baseContrato, valor_total: valorTotal }}
    />
  );
}

/**
 * Retorna o input do campo "Valor Total" no DOM.
 */
function getValorInput(): HTMLInputElement {
  // O label é "Valor Total (R$)"
  return screen.getByLabelText(/valor total/i) as HTMLInputElement;
}

describe("Bug Condition — Campo Valor Total sem formatação de milhares", () => {
  /**
   * Validates: Requirements 1.2
   * isBugCondition: valor_total = 1000000 (IS NOT NULL AND > 0)
   * Esperado: exibir "1.000.000"
   * Bug: exibe "1000000" sem separadores
   */
  it("deve exibir 1000000 formatado como '1.000.000' ao abrir o formulário de edição", () => {
    renderForm(1000000);
    const input = getValorInput();
    expect(input.value).toBe("1.000.000");
  });

  /**
   * Validates: Requirements 1.2
   * isBugCondition: valor_total = 100000000 (IS NOT NULL AND > 0)
   * Esperado: exibir "100.000.000"
   * Bug: exibe "100000000" sem separadores
   */
  it("deve exibir 100000000 formatado como '100.000.000' ao abrir o formulário de edição", () => {
    renderForm(100000000);
    const input = getValorInput();
    expect(input.value).toBe("100.000.000");
  });

  /**
   * Validates: Requirements 1.1
   * Simular digitação de "2500000" e verificar que o valor exibido contém pontos separadores
   * Esperado: exibir "2.500.000"
   * Bug: exibe "2500000" sem separadores
   */
  it("deve formatar para '2.500.000' ao digitar '2500000' no campo", () => {
    renderForm(null);
    const input = getValorInput();
    fireEvent.change(input, { target: { value: "2500000" } });
    expect(input.value).toBe("2.500.000");
  });

  /**
   * Validates: Requirements 1.3
   * O campo NÃO deve aceitar entrada de decimais.
   * Esperado: "2500000.50" deve ser rejeitado (valor exibido não contém ponto decimal como separador decimal)
   * Bug: campo type="number" com step="0.01" aceita decimais
   */
  it("deve rejeitar entrada de decimais — '2500000.50' não deve ser aceito como valor válido", () => {
    renderForm(null);
    const input = getValorInput();
    fireEvent.change(input, { target: { value: "2500000.50" } });
    // O campo corrigido deve exibir apenas dígitos com pontos de milhar, sem vírgula/ponto decimal
    // O valor não deve conter separador decimal (vírgula ou ponto no final)
    expect(input.value).not.toMatch(/[,]|\.\d{1,2}$/);
    // E o campo não deve ser do tipo "number" (que aceita decimais via step)
    expect(input.type).not.toBe("number");
  });
});
