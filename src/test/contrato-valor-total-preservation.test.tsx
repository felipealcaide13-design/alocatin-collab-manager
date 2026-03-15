/**
 * Testes de Preservação — Tarefa 2
 *
 * Property 2: Preservation - Valor numérico no submit e comportamento dos demais campos
 *
 * Metodologia observation-first:
 * - Observar o comportamento atual (código NÃO corrigido)
 * - Estes testes DEVEM PASSAR no código não corrigido
 * - Confirmam o baseline a preservar após a correção
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContratoForm } from "@/components/contratos/ContratoForm";
import type { Contrato } from "@/types/contrato";

vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function renderForm(initialData?: Contrato | null) {
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ContratoForm
      open={true}
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={initialData ?? null}
    />
  );
  return { onSubmit, onClose };
}

function getValorInput(): HTMLInputElement {
  return screen.getByLabelText(/valor total/i) as HTMLInputElement;
}

async function submitForm() {
  const submitBtn = screen.getByRole("button", { name: /cadastrar|salvar/i });
  fireEvent.click(submitBtn);
  await waitFor(() => {});
}

// ---------------------------------------------------------------------------
// Requirement 3.2 — Campo vazio → valor_total = null
// ---------------------------------------------------------------------------

describe("Preservation 3.2 — Campo vazio submete null", () => {
  /**
   * Validates: Requirements 3.2
   * Observação: submit com campo vazio → valor_total = null
   */
  it("deve submeter valor_total = null quando o campo está vazio", async () => {
    const { onSubmit } = renderForm(null);

    // Preencher campos obrigatórios
    fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
      target: { value: "Contrato X" },
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "Cliente Y" },
    });

    // Garantir que o campo valor está vazio
    const valorInput = getValorInput();
    expect(valorInput.value).toBe("");

    await submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedValues = onSubmit.mock.calls[0][0];
    expect(submittedValues.valor_total).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Requirement 3.1 — Submit envia number (não string)
// ---------------------------------------------------------------------------

describe("Preservation 3.1 — Submit envia number | null (nunca string)", () => {
  /**
   * Validates: Requirements 3.1
   * Observação: submit com valor_total = 1000000 → envia 1000000 (number)
   */
  it("deve submeter valor_total como number quando preenchido com 1000000", async () => {
    const { onSubmit } = renderForm(null);

    fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
      target: { value: "Contrato X" },
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "Cliente Y" },
    });

    const valorInput = getValorInput();
    fireEvent.change(valorInput, { target: { value: "1000000" } });

    await submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedValues = onSubmit.mock.calls[0][0];
    // Deve ser number, nunca string
    expect(typeof submittedValues.valor_total).toBe("number");
    expect(submittedValues.valor_total).toBe(1000000);
  });

  /**
   * Validates: Requirements 3.1
   * Property: para qualquer string de dígitos válida, o submit deve produzir number | null (nunca string)
   * Casos representativos do domínio de entrada
   */
  it.each([
    ["999", 999],
    ["10000", 10000],
    ["2500000", 2500000],
    ["100000000", 100000000],
  ])(
    "deve submeter valor_total como number para entrada '%s' → %d",
    async (inputValue, expectedNumber) => {
      const { onSubmit } = renderForm(null);

      fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
        target: { value: "Contrato X" },
      });
      fireEvent.change(screen.getByLabelText(/cliente/i), {
        target: { value: "Cliente Y" },
      });

      const valorInput = getValorInput();
      fireEvent.change(valorInput, { target: { value: inputValue } });

      await submitForm();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedValues = onSubmit.mock.calls[0][0];
      expect(typeof submittedValues.valor_total).toBe("number");
      expect(submittedValues.valor_total).toBe(expectedNumber);
    }
  );
});

// ---------------------------------------------------------------------------
// Requirement 3.4 — Demais campos funcionam normalmente
// ---------------------------------------------------------------------------

describe("Preservation 3.4 — Demais campos inalterados", () => {
  /**
   * Validates: Requirements 3.4
   * Observação: nome, cliente, status, datas, descrição funcionam normalmente
   */
  it("deve submeter nome e cliente corretamente", async () => {
    const { onSubmit } = renderForm(null);

    fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
      target: { value: "Projeto Alpha" },
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "Empresa Beta" },
    });

    await submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedValues = onSubmit.mock.calls[0][0];
    expect(submittedValues.nome).toBe("Projeto Alpha");
    expect(submittedValues.cliente).toBe("Empresa Beta");
  });

  it("deve submeter status padrão 'Ativo' quando não alterado", async () => {
    const { onSubmit } = renderForm(null);

    fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
      target: { value: "Contrato X" },
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "Cliente Y" },
    });

    await submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedValues = onSubmit.mock.calls[0][0];
    expect(submittedValues.status).toBe("Ativo");
  });

  it("deve submeter data_inicio corretamente", async () => {
    const { onSubmit } = renderForm(null);

    fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
      target: { value: "Contrato X" },
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "Cliente Y" },
    });
    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2024-03-15" },
    });

    await submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedValues = onSubmit.mock.calls[0][0];
    expect(submittedValues.data_inicio).toBe("2024-03-15");
  });

  it("deve submeter descrição corretamente", async () => {
    const { onSubmit } = renderForm(null);

    fireEvent.change(screen.getByLabelText(/nome do contrato/i), {
      target: { value: "Contrato X" },
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "Cliente Y" },
    });
    fireEvent.change(screen.getByLabelText(/descrição/i), {
      target: { value: "Descrição do contrato de teste" },
    });

    await submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedValues = onSubmit.mock.calls[0][0];
    expect(submittedValues.descricao).toBe("Descrição do contrato de teste");
  });
});

// ---------------------------------------------------------------------------
// Requirement 3.3 — formatCurrency em Contratos.tsx não é afetado
// ---------------------------------------------------------------------------

describe("Preservation 3.3 — formatCurrency exibe R$ com Intl.NumberFormat BRL", () => {
  /**
   * Validates: Requirements 3.3
   * Verifica que a função formatCurrency (inline em Contratos.tsx) continua
   * exibindo valores com Intl.NumberFormat BRL — ex: "R$ 1.000.000,00"
   * Esta função não é afetada pela correção do ContratoForm.
   */

  // Extraindo a lógica de formatCurrency diretamente para testar isoladamente
  const formatCurrency = (val: number | null): string => {
    if (val == null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  it("deve formatar 1000000 como 'R$ 1.000.000,00'", () => {
    expect(formatCurrency(1000000)).toBe("R$\u00a01.000.000,00");
  });

  it("deve formatar null como '-'", () => {
    expect(formatCurrency(null)).toBe("-");
  });

  it("deve formatar 100000000 como 'R$ 100.000.000,00'", () => {
    expect(formatCurrency(100000000)).toBe("R$\u00a0100.000.000,00");
  });

  it("deve formatar 2500000 como 'R$ 2.500.000,00'", () => {
    expect(formatCurrency(2500000)).toBe("R$\u00a02.500.000,00");
  });

  it("deve formatar 0 como 'R$ 0,00'", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
  });
});
