import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { diffCamposRastreaveis, historicoService } from "@/services/historicoService";
import { CAMPOS_RASTREAVEIS, ROTULOS_CAMPOS } from "@/types/historico";
import type { Colaborador } from "@/types/colaborador";
import type { CampoRastreavel } from "@/types/historico";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeColaborador(overrides: Partial<Colaborador> = {}): Colaborador {
  return {
    id: "colab-1",
    nomeCompleto: "João Silva",
    email: null,
    documento: null,
    diretoria_id: "dir-1",
    area_ids: [],
    especialidade_id: null,
    torre_ids: ["torre-1"],
    squad_ids: ["squad-1"],
    bu_id: "bu-1",
    lider_id: null,
    senioridade: "Analista pleno",
    status: "Ativo",
    dataAdmissao: "2024-01-01",
    ...overrides,
  };
}

// ─── Unit tests — 3.3 ─────────────────────────────────────────────────────────

describe("historicoService — exports e estrutura (Req 3.4, 5.4)", () => {
  it("getByColaborador é uma função exportada pelo historicoService (Req 3.4)", () => {
    expect(historicoService.getByColaborador).toBeTypeOf("function");
  });

  it("registrar é uma função exportada pelo historicoService", () => {
    expect(historicoService.registrar).toBeTypeOf("function");
  });

  it("alterado_em não está presente no payload de INSERT — campo ausente nos eventos gerados (Req 5.4)", () => {
    const anterior = makeColaborador({ senioridade: "Analista pleno" });
    const eventos = diffCamposRastreaveis(anterior, { senioridade: "Analista senior" });

    expect(eventos.length).toBe(1);
    // O evento não deve conter id nem alterado_em
    expect(eventos[0]).not.toHaveProperty("id");
    expect(eventos[0]).not.toHaveProperty("alterado_em");
  });
});

// ─── Unit tests — diffCamposRastreaveis ──────────────────────────────────────

describe("diffCamposRastreaveis — exemplos concretos", () => {
  it("retorna evento quando senioridade muda", () => {
    const anterior = makeColaborador({ senioridade: "Analista pleno" });
    const eventos = diffCamposRastreaveis(anterior, { senioridade: "Analista senior" });

    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({
      colaborador_id: "colab-1",
      campo: "senioridade",
      valor_anterior: "Analista pleno",
      novo_valor: "Analista senior",
      autor_alteracao: "sistema",
    });
  });

  it("retorna evento quando status muda", () => {
    const anterior = makeColaborador({ status: "Ativo" });
    const eventos = diffCamposRastreaveis(anterior, { status: "Desligado" });

    expect(eventos).toHaveLength(1);
    expect(eventos[0].campo).toBe("status");
    expect(eventos[0].valor_anterior).toBe("Ativo");
    expect(eventos[0].novo_valor).toBe("Desligado");
  });

  it("serializa torre_ids como JSON.stringify", () => {
    const anterior = makeColaborador({ torre_ids: ["t1"] });
    const eventos = diffCamposRastreaveis(anterior, { torre_ids: ["t1", "t2"] });

    expect(eventos).toHaveLength(1);
    expect(eventos[0].valor_anterior).toBe('["t1"]');
    expect(eventos[0].novo_valor).toBe('["t1","t2"]');
  });

  it("serializa squad_ids como JSON.stringify", () => {
    const anterior = makeColaborador({ squad_ids: ["s1", "s2"] });
    const eventos = diffCamposRastreaveis(anterior, { squad_ids: [] });

    expect(eventos).toHaveLength(1);
    expect(eventos[0].valor_anterior).toBe('["s1","s2"]');
    expect(eventos[0].novo_valor).toBe("[]");
  });

  it("retorna array vazio quando nenhum campo rastreável está no patch", () => {
    const anterior = makeColaborador();
    const eventos = diffCamposRastreaveis(anterior, { nomeCompleto: "Outro Nome" });
    expect(eventos).toHaveLength(0);
  });

  it("omite campo quando valor não mudou", () => {
    const anterior = makeColaborador({ senioridade: "Analista pleno" });
    const eventos = diffCamposRastreaveis(anterior, { senioridade: "Analista pleno" });
    expect(eventos).toHaveLength(0);
  });

  it("retorna múltiplos eventos quando vários campos mudam", () => {
    const anterior = makeColaborador({ senioridade: "Analista pleno", status: "Ativo" });
    const eventos = diffCamposRastreaveis(anterior, {
      senioridade: "Analista senior",
      status: "Desligado",
    });
    expect(eventos).toHaveLength(2);
  });

  it("trata null como valor válido — diretoria_id null → novo valor", () => {
    const anterior = makeColaborador({ diretoria_id: null });
    const eventos = diffCamposRastreaveis(anterior, { diretoria_id: "dir-2" });
    expect(eventos).toHaveLength(1);
    expect(eventos[0].valor_anterior).toBeNull();
    expect(eventos[0].novo_valor).toBe("dir-2");
  });

  it("trata null → null como sem mudança", () => {
    const anterior = makeColaborador({ diretoria_id: null });
    const eventos = diffCamposRastreaveis(anterior, { diretoria_id: null });
    expect(eventos).toHaveLength(0);
  });
});

// ─── Property 2: Omissão quando valor não muda (Task 3.1) ────────────────────
// Feature: historico-alteracoes-colaborador, Property 2: Omissão de registro quando valor não muda

describe("P2 — diffCamposRastreaveis omite campos sem mudança (Req 1.6)", () => {
  /**
   * Property 2: Omissão de registro quando valor não muda
   * Validates: Requirements 1.6
   *
   * Para qualquer patch onde todos os campos rastreáveis presentes têm o mesmo
   * valor que o estado atual, diffCamposRastreaveis deve retornar array vazio.
   */
  it("P2 — patch com mesmos valores rastreáveis retorna array vazio", () => {
    const arbSenioridade = fc.constantFrom(
      "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
      "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior"
    ) as fc.Arbitrary<Colaborador["senioridade"]>;

    const arbStatus = fc.constantFrom("Ativo", "Desligado") as fc.Arbitrary<Colaborador["status"]>;

    const arbColaborador = fc.record({
      id: fc.uuid(),
      nomeCompleto: fc.string(),
      email: fc.option(fc.emailAddress(), { nil: null }),
      documento: fc.option(fc.string({ minLength: 11, maxLength: 14 }), { nil: null }),
      diretoria_id: fc.option(fc.uuid(), { nil: null }),
      area_ids: fc.array(fc.uuid()),
      especialidade_id: fc.option(fc.uuid(), { nil: null }),
      torre_ids: fc.array(fc.uuid()),
      squad_ids: fc.array(fc.uuid()),
      bu_id: fc.option(fc.uuid(), { nil: null }),
      lider_id: fc.option(fc.uuid(), { nil: null }),
      senioridade: arbSenioridade,
      status: arbStatus,
      dataAdmissao: fc.constant("2024-01-01"),
    });

    fc.assert(
      fc.property(arbColaborador, (colaborador) => {
        // Patch com exatamente os mesmos valores rastreáveis
        const patch = {
          senioridade: colaborador.senioridade,
          diretoria_id: colaborador.diretoria_id,
          status: colaborador.status,
          bu_id: colaborador.bu_id,
          torre_ids: [...colaborador.torre_ids],
          squad_ids: [...colaborador.squad_ids],
        };

        const eventos = diffCamposRastreaveis(colaborador, patch);
        return eventos.length === 0;
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: Serialização JSON round-trip (Task 3.2) ─────────────────────
// Feature: historico-alteracoes-colaborador, Property 7: Serialização JSON de arrays é round-trip

describe("P7 — serialização JSON de arrays é round-trip (Req 5.3)", () => {
  /**
   * Property 7: Serialização JSON de arrays é round-trip
   * Validates: Requirements 5.3
   *
   * Para qualquer array de strings (incluindo vazio),
   * JSON.parse(JSON.stringify(arr)) deve produzir array equivalente ao original.
   */
  it("P7 — JSON.parse(JSON.stringify(arr)) é equivalente ao original", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (arr) => {
        const serializado = JSON.stringify(arr);
        const deserializado = JSON.parse(serializado) as string[];
        // Deve ter o mesmo comprimento
        if (deserializado.length !== arr.length) return false;
        // Cada elemento deve ser igual
        return arr.every((item, i) => item === deserializado[i]);
      }),
      { numRuns: 200 }
    );
  });

  it("P7 — array vazio serializa e deserializa corretamente", () => {
    const arr: string[] = [];
    const resultado = JSON.parse(JSON.stringify(arr)) as string[];
    expect(resultado).toEqual([]);
  });

  it("P7 — diffCamposRastreaveis usa JSON.stringify para arrays — round-trip verificado", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        (torreIdsAnterior, torreIdsNovo) => {
          const anterior = makeColaborador({ torre_ids: torreIdsAnterior });
          const eventos = diffCamposRastreaveis(anterior, { torre_ids: torreIdsNovo });

          const serialAnterior = JSON.stringify(torreIdsAnterior);
          const serialNovo = JSON.stringify(torreIdsNovo);

          if (serialAnterior === serialNovo) {
            // Sem mudança → sem evento
            return eventos.length === 0;
          } else {
            // Com mudança → evento com valores serializados corretamente
            if (eventos.length !== 1) return false;
            return (
              eventos[0].valor_anterior === serialAnterior &&
              eventos[0].novo_valor === serialNovo
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
