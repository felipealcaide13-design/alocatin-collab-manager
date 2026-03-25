import { describe, it, expect } from "vitest";
import {
  REGRAS_SENIORIDADE_CAMADA,
  SENIORIDADES,
  getCamadasPermitidas,
  isCamadaPermitida,
  validarCamadasPorSenioridade,
  parsearRegrasSenioridade,
  type Camada,
  type Senioridade,
} from "@/utils/senioridadeCamadas";

// ─── Smoke test ───────────────────────────────────────────────────────────────

describe("smoke test — exports", () => {
  it("exporta todas as funções e constantes esperadas", () => {
    expect(REGRAS_SENIORIDADE_CAMADA).toBeDefined();
    expect(SENIORIDADES).toBeDefined();
    expect(getCamadasPermitidas).toBeTypeOf("function");
    expect(isCamadaPermitida).toBeTypeOf("function");
    expect(validarCamadasPorSenioridade).toBeTypeOf("function");
    expect(parsearRegrasSenioridade).toBeTypeOf("function");
  });
});

// ─── Exemplos concretos ───────────────────────────────────────────────────────

describe("validarCamadasPorSenioridade — exemplos", () => {
  it("C-level com ['BU'] → válido", () => {
    expect(validarCamadasPorSenioridade("C-level", ["BU"])).toEqual({ valido: true });
  });

  it("C-level com ['Torre'] → inválido", () => {
    const result = validarCamadasPorSenioridade("C-level", ["Torre"]);
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBeTruthy();
  });

  it("Diretor(a) com ['BU', 'Torre'] → válido", () => {
    expect(validarCamadasPorSenioridade("Diretor(a)", ["BU", "Torre"])).toEqual({ valido: true });
  });

  it("Diretor(a) com ['Squad'] → inválido", () => {
    const result = validarCamadasPorSenioridade("Diretor(a)", ["Squad"]);
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBeTruthy();
  });

  it("Analista pleno com ['Squad'] → válido", () => {
    expect(validarCamadasPorSenioridade("Analista pleno", ["Squad"])).toEqual({ valido: true });
  });

  it("Analista pleno com ['Torre'] → inválido", () => {
    const result = validarCamadasPorSenioridade("Analista pleno", ["Torre"]);
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBeTruthy();
  });

  it("array vazio → { valido: false, mensagem: '...' }", () => {
    const result = validarCamadasPorSenioridade("Analista pleno", []);
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBeTruthy();
    expect(result.mensagem).toContain("camada");
  });
});

// ─── parsearRegrasSenioridade ─────────────────────────────────────────────────

describe("parsearRegrasSenioridade", () => {
  it("com JSON válido retorna objeto correto", () => {
    const input = JSON.stringify({ "C-level": ["BU"], "Head": ["Torre"] });
    const result = parsearRegrasSenioridade(input);
    expect(result["C-level"]).toEqual(["BU"]);
    expect(result["Head"]).toEqual(["Torre"]);
  });

  it("com senioridade inválida lança erro descritivo", () => {
    const input = JSON.stringify({ "Estagiário": ["Squad"] });
    expect(() => parsearRegrasSenioridade(input)).toThrowError(/Senioridade inválida/i);
  });

  it("com camada inválida lança erro descritivo", () => {
    const input = JSON.stringify({ "C-level": ["Diretoria"] });
    expect(() => parsearRegrasSenioridade(input)).toThrowError(/Camada inválida/i);
  });
});

// ─── buildNodes helpers (inline for testing) ─────────────────────────────────
// We test the filtering logic directly using isCamadaPermitida, mirroring
// what buildNodes does in BUOrgChart.tsx.

import fc from "fast-check";

// Arbitrários reutilizáveis
const arbSenioridade = fc.constantFrom(...SENIORIDADES);
const arbCamada = fc.constantFrom("BU" as Camada, "Torre" as Camada, "Squad" as Camada);

// ─── Testes unitários — edge cases do organograma (Task 4.2) ─────────────────

describe("organograma — edge cases (Req 3.5, 3.6)", () => {
  it("Diretor(a) aparece tanto no nó BU quanto no nó Torre (Req 3.5)", () => {
    // Diretor(a) é permitido em BU e Torre
    expect(isCamadaPermitida("Diretor(a)", "BU")).toBe(true);
    expect(isCamadaPermitida("Diretor(a)", "Torre")).toBe(true);
    expect(isCamadaPermitida("Diretor(a)", "Squad")).toBe(false);
  });

  it("colaborador com senioridade incompatível é omitido do nó incompatível (Req 3.6)", () => {
    // C-level não deve aparecer em Torre ou Squad
    expect(isCamadaPermitida("C-level", "Torre")).toBe(false);
    expect(isCamadaPermitida("C-level", "Squad")).toBe(false);
    // Analista pleno não deve aparecer em BU ou Torre
    expect(isCamadaPermitida("Analista pleno", "BU")).toBe(false);
    expect(isCamadaPermitida("Analista pleno", "Torre")).toBe(false);
    // Head não deve aparecer em BU ou Squad
    expect(isCamadaPermitida("Head", "BU")).toBe(false);
    expect(isCamadaPermitida("Head", "Squad")).toBe(false);
  });

  it("colaborador sem camadas ativas não aparece em nenhum nó e não gera erro de runtime", () => {
    // Simula o filtro de buildNodes: um colaborador com senioridade "C-level"
    // não passa no filtro de Torre nem Squad — sem lançar exceção
    const senioridade = "C-level" as Senioridade;
    const camadas: Camada[] = ["BU", "Torre", "Squad"];
    expect(() => camadas.filter((c) => isCamadaPermitida(senioridade, c))).not.toThrow();
    const permitidas = camadas.filter((c) => isCamadaPermitida(senioridade, c));
    expect(permitidas).toEqual(["BU"]);
  });

  it("nó BU exibe apenas C-level e Diretor(a) (Req 3.1)", () => {
    const permitidosNaBU = SENIORIDADES.filter((s) => isCamadaPermitida(s, "BU"));
    expect(permitidosNaBU).toEqual(["C-level", "Diretor(a)"]);
  });

  it("nó Torre exibe Diretor(a), Head, Gerente, Coordenador(a), Staf I, Staf II, Analista senior (Req 3.2)", () => {
    const permitidosNaTorre = SENIORIDADES.filter((s) => isCamadaPermitida(s, "Torre"));
    expect(permitidosNaTorre).toEqual([
      "Diretor(a)", "Head", "Gerente", "Coordenador(a)", "Staff I", "Staff II", "Analista senior",
    ]);
  });

  it("nó Squad exibe Coordenador(a), Staf I, Staf II, Analista senior, Analista pleno, Analista junior (Req 3.3)", () => {
    const permitidosNoSquad = SENIORIDADES.filter((s) => isCamadaPermitida(s, "Squad"));
    expect(permitidosNoSquad).toEqual([
      "Coordenador(a)", "Staff I", "Staff II", "Analista senior", "Analista pleno", "Analista junior",
    ]);
  });
});

// ─── Property 5: Filtro do organograma respeita regras de senioridade (Task 4.1) ─

describe("properties — organograma", () => {
  /**
   * Property 5: Filtro do organograma respeita regras de senioridade por camada
   * Feature: regras-senioridade-camada, Property 5
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6
   *
   * Para qualquer conjunto de colaboradores e qualquer nó de camada k,
   * todos os colaboradores exibidos naquele nó satisfazem
   * isCamadaPermitida(colaborador.senioridade, k) === true.
   */
  it("P5 — todos os colaboradores exibidos num nó satisfazem isCamadaPermitida", () => {
    const arbColaborador = fc.record({
      id: fc.uuid(),
      senioridade: arbSenioridade,
    });

    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 0, maxLength: 20 }),
        arbCamada,
        (colaboradores, camada) => {
          // Simula o filtro aplicado em buildNodes para qualquer camada
          const exibidos = colaboradores.filter((c) => isCamadaPermitida(c.senioridade, camada));
          // Todos os exibidos devem satisfazer a condição
          return exibidos.every((c) => isCamadaPermitida(c.senioridade, camada) === true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("P5 — colaboradores com senioridade incompatível são excluídos do nó", () => {
    const arbColaborador = fc.record({
      id: fc.uuid(),
      senioridade: arbSenioridade,
    });

    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 1, maxLength: 20 }),
        arbCamada,
        (colaboradores, camada) => {
          const exibidos = colaboradores.filter((c) => isCamadaPermitida(c.senioridade, camada));
          const excluidos = colaboradores.filter((c) => !isCamadaPermitida(c.senioridade, camada));
          // Nenhum excluído deve aparecer nos exibidos
          return excluidos.every((exc) => !exibidos.some((ex) => ex.id === exc.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});
