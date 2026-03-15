/**
 * Testes para src/utils/dashboardRH.ts
 * Inclui property-based tests (fast-check) e testes unitários para edge cases.
 *
 * Feature: dashboard-gestao-rh
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calcWorkforceMetrics,
  calcSenioridadeData,
  calcDiretoriaData,
  calcTorresData,
  calcRecentAdmissions,
  calcAlerts,
  formatDateBR,
} from "@/utils/dashboardRH";
import type { Colaborador, Senioridade, Status } from "@/types/colaborador";
import type { Diretoria } from "@/types/diretoria";
import type { Torre, Squad } from "@/types/torre";
import type { Area } from "@/types/area";

// ─── Geradores fast-check ────────────────────────────────────────────────────

const SENIORIDADES: Senioridade[] = [
  "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
  "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
];

const arbUuid = fc.uuid();
const arbNome = fc.string({ minLength: 3, maxLength: 40 });
const arbSenioridade = fc.constantFrom(...SENIORIDADES);
const arbStatus = fc.constantFrom<Status>("Ativo", "Desligado");

/** Gera uma data ISO YYYY-MM-DD entre 2000-01-01 e 2026-12-31 usando inteiros */
const arbIsoDate = fc
  .tuple(
    fc.integer({ min: 2000, max: 2026 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }), // usa 28 para evitar dias inválidos em qualquer mês
  )
  .map(([y, m, d]) => {
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  });

const arbColaborador = fc.record<Colaborador>({
  id: arbUuid,
  nomeCompleto: arbNome,
  email: fc.option(fc.emailAddress(), { nil: null }),
  documento: fc.option(fc.string({ minLength: 11, maxLength: 14 }), { nil: null }),
  diretoria_id: fc.option(arbUuid, { nil: null }),
  area_ids: fc.array(arbUuid, { minLength: 0, maxLength: 3 }),
  especialidade_id: fc.option(arbUuid, { nil: null }),
  squad_ids: fc.array(arbUuid, { minLength: 0, maxLength: 3 }),
  senioridade: arbSenioridade,
  status: arbStatus,
  dataAdmissao: arbIsoDate,
});

const arbColaboradorAtivo = arbColaborador.map((c) => ({ ...c, status: "Ativo" as Status }));

const arbDiretoria = fc.record<Diretoria>({
  id: arbUuid,
  nome: arbNome,
  descricao: fc.option(arbNome, { nil: null }),
});

const arbArea = fc.record<Area>({
  id: arbUuid,
  nome: arbNome,
  diretoria_id: fc.option(arbUuid, { nil: null }),
  subareas_possiveis: fc.array(arbNome, { minLength: 0, maxLength: 3 }),
  lideres: fc.array(arbUuid, { minLength: 0, maxLength: 2 }),
  descricao: arbNome,
});

const arbSquad = fc.record<Squad>({
  id: arbUuid,
  nome: arbNome,
  torre_id: arbUuid,
  contrato_id: fc.option(arbUuid, { nil: null }),
  lider: fc.option(arbUuid, { nil: null }),
  membros: fc.option(fc.array(arbUuid, { minLength: 0, maxLength: 10 }), { nil: null }),
  descricao: fc.option(arbNome, { nil: null }),
});

const arbTorre = (squads?: fc.Arbitrary<Squad[]>) =>
  fc.record<Torre>({
    id: arbUuid,
    nome: arbNome,
    bu_id: fc.option(arbUuid, { nil: null }),
    responsavel_negocio: fc.option(arbUuid, { nil: null }),
    head_tecnologia: fc.option(arbUuid, { nil: null }),
    head_produto: fc.option(arbUuid, { nil: null }),
    gerente_produto: fc.option(arbUuid, { nil: null }),
    gerente_design: fc.option(arbUuid, { nil: null }),
    descricao: fc.option(arbNome, { nil: null }),
    squads: squads ?? fc.array(arbSquad, { minLength: 0, maxLength: 5 }),
    squads_count: fc.integer({ min: 0, max: 10 }),
  });

// ─── Property 1: taxaOcupacao consistente ────────────────────────────────────

describe("Property 1: taxaOcupacao é consistente com os dados de colaboradores", () => {
  /**
   * Validates: Requirements 1.4
   */
  it("Feature: dashboard-gestao-rh, Property 1", () => {
    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 0, maxLength: 30 }),
        fc.array(arbDiretoria, { minLength: 0, maxLength: 5 }),
        fc.array(arbArea, { minLength: 0, maxLength: 5 }),
        (colaboradores, diretorias, areas) => {
          const metrics = calcWorkforceMetrics(colaboradores, diretorias, areas);
          const ativos = colaboradores.filter((c) => c.status === "Ativo");
          const totalAtivos = ativos.length;

          if (totalAtivos === 0) {
            expect(metrics.taxaOcupacao).toBe(0);
          } else {
            const comSquad = ativos.filter((c) => c.squad_ids.length > 0).length;
            const expected = (comSquad / totalAtivos) * 100;
            expect(metrics.taxaOcupacao).toBeCloseTo(expected, 10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 2: totalDiretoriasAtivas ≤ diretorias.length ───────────────────

describe("Property 2: Contagem de diretorias ativas é subconjunto das diretorias existentes", () => {
  /**
   * Validates: Requirements 1.5
   */
  it("Feature: dashboard-gestao-rh, Property 2", () => {
    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 0, maxLength: 30 }),
        fc.array(arbDiretoria, { minLength: 0, maxLength: 10 }),
        fc.array(arbArea, { minLength: 0, maxLength: 5 }),
        (colaboradores, diretorias, areas) => {
          const metrics = calcWorkforceMetrics(colaboradores, diretorias, areas);
          expect(metrics.totalDiretoriasAtivas).toBeLessThanOrEqual(diretorias.length);
          expect(metrics.totalDiretoriasAtivas).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: soma senioridadeData.value === totalAtivos ──────────────────

describe("Property 3: Distribuição por senioridade cobre todos os ativos", () => {
  /**
   * Validates: Requirements 2.1, 2.4
   */
  it("Feature: dashboard-gestao-rh, Property 3", () => {
    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 0, maxLength: 30 }),
        fc.array(arbDiretoria, { minLength: 0, maxLength: 5 }),
        fc.array(arbArea, { minLength: 0, maxLength: 5 }),
        (colaboradores, diretorias, areas) => {
          const metrics = calcWorkforceMetrics(colaboradores, diretorias, areas);
          const senioridadeData = calcSenioridadeData(colaboradores);
          const soma = senioridadeData.reduce((acc, item) => acc + item.value, 0);
          expect(soma).toBe(metrics.totalAtivos);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 4: soma diretoriaData.value === totalAtivos ────────────────────

describe("Property 4: Distribuição por diretoria cobre todos os ativos (incluindo sem diretoria)", () => {
  /**
   * Validates: Requirements 3.1, 3.4
   */
  it("Feature: dashboard-gestao-rh, Property 4", () => {
    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 0, maxLength: 30 }),
        fc.array(arbDiretoria, { minLength: 0, maxLength: 5 }),
        fc.array(arbArea, { minLength: 0, maxLength: 5 }),
        (colaboradores, diretorias, areas) => {
          const metrics = calcWorkforceMetrics(colaboradores, diretorias, areas);
          const diretoriaData = calcDiretoriaData(colaboradores, diretorias);
          const soma = diretoriaData.reduce((acc, item) => acc + item.value, 0);
          expect(soma).toBe(metrics.totalAtivos);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5: recentAdmissions ordenadas por dataAdmissao desc ────────────

describe("Property 5: Admissões recentes estão ordenadas por data decrescente", () => {
  /**
   * Validates: Requirements 5.1, 5.2, 5.3
   */
  it("Feature: dashboard-gestao-rh, Property 5", () => {
    fc.assert(
      fc.property(
        fc.array(arbColaborador, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 20 }),
        (colaboradores, limit) => {
          const admissions = calcRecentAdmissions(colaboradores, limit);
          for (let i = 0; i < admissions.length - 1; i++) {
            // dataAdmissao está formatada DD/MM/AAAA — comparar via ISO original
            // A ordenação é feita antes da formatação, então verificamos que
            // a lista tem no máximo `limit` itens e está em ordem decrescente
            // reconstruindo a data ISO a partir do formato BR
            const toISO = (br: string) => {
              const [d, m, y] = br.split("/");
              return `${y}-${m}-${d}`;
            };
            const dateA = toISO(admissions[i].dataAdmissao);
            const dateB = toISO(admissions[i + 1].dataAdmissao);
            expect(dateA >= dateB).toBe(true);
          }
          expect(admissions.length).toBeLessThanOrEqual(limit);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: torresData ordenadas por squadsCount desc ───────────────────

describe("Property 6: Torres ordenadas por squadsCount decrescente", () => {
  /**
   * Validates: Requirements 8.1
   */
  it("Feature: dashboard-gestao-rh, Property 6", () => {
    fc.assert(
      fc.property(
        fc.array(arbTorre(), { minLength: 0, maxLength: 10 }),
        (torres) => {
          const torresData = calcTorresData(torres);
          for (let i = 0; i < torresData.length - 1; i++) {
            expect(torresData[i].squadsCount).toBeGreaterThanOrEqual(torresData[i + 1].squadsCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: totalMembros === soma de membros dos squads da torre ─────────

describe("Property 7: Total de membros por torre é a soma dos membros dos squads", () => {
  /**
   * Validates: Requirements 8.4
   */
  it("Feature: dashboard-gestao-rh, Property 7", () => {
    fc.assert(
      fc.property(
        fc.array(arbTorre(), { minLength: 0, maxLength: 10 }),
        (torres) => {
          const torresData = calcTorresData(torres);
          for (const torre of torres) {
            const item = torresData.find((t) => t.id === torre.id);
            // calcTorresData inclui todas as torres, então item deve existir
            expect(item).toBeDefined();
            const squads = torre.squads ?? [];
            const expectedMembros = squads.reduce(
              (sum, s) => sum + (s.membros?.length ?? 0),
              0
            );
            expect(item!.totalMembros).toBe(expectedMembros);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 8: todos squads com lider===null aparecem em alertas ────────────

describe("Property 8: Alertas de squads sem líder são corretos", () => {
  /**
   * Validates: Requirements 7.1, 7.7
   */
  it("Feature: dashboard-gestao-rh, Property 8", () => {
    fc.assert(
      fc.property(
        fc.array(arbColaboradorAtivo, { minLength: 0, maxLength: 10 }),
        fc.array(arbSquad, { minLength: 0, maxLength: 10 }),
        (colaboradores, squads) => {
          const alerts = calcAlerts(colaboradores, squads);
          const semLiderAlerts = alerts.filter((a) => a.type === "Squad sem líder");

          // Todos os squads com lider===null devem ter alerta
          const squadsComLiderNull = squads.filter((s) => s.lider === null);
          expect(semLiderAlerts.length).toBe(squadsComLiderNull.length);

          // Nenhum squad com líder definido deve aparecer nessa categoria
          for (const alert of semLiderAlerts) {
            const squad = squads.find((s) => s.id === alert.itemId);
            expect(squad?.lider).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: formatDateBR(YYYY-MM-DD) retorna DD/MM/AAAA ─────────────────

describe("Property 9: Formatação de data de admissão", () => {
  /**
   * Validates: Requirements 5.5
   */
  it("Feature: dashboard-gestao-rh, Property 9", () => {
    fc.assert(
      fc.property(arbIsoDate, (isoDate) => {
        const result = formatDateBR(isoDate);
        const [year, month, day] = isoDate.split("-");
        expect(result).toBe(`${day}/${month}/${year}`);
        // Formato DD/MM/AAAA: deve ter exatamente 10 chars e dois "/"
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Testes unitários — edge cases ───────────────────────────────────────────

describe("Edge cases — taxaOcupacao com totalAtivos === 0", () => {
  it("retorna 0 quando não há colaboradores ativos", () => {
    const desligados: Colaborador[] = [
      {
        id: "1",
        nomeCompleto: "João",
        diretoria_id: null,
        area_ids: [],
        especialidade_id: null,
        squad_ids: ["s1"],
        senioridade: "Analista pleno",
        status: "Desligado",
        dataAdmissao: "2023-01-01",
      },
    ];
    const metrics = calcWorkforceMetrics(desligados, [], []);
    expect(metrics.taxaOcupacao).toBe(0);
    expect(metrics.totalAtivos).toBe(0);
  });

  it("retorna 0 quando a lista de colaboradores está vazia", () => {
    const metrics = calcWorkforceMetrics([], [], []);
    expect(metrics.taxaOcupacao).toBe(0);
  });
});

describe("Edge cases — colaborador sem diretoria_id agrupado em 'Sem Diretoria'", () => {
  it("colaborador ativo sem diretoria_id aparece em 'Sem Diretoria'", () => {
    const colaboradores: Colaborador[] = [
      {
        id: "1",
        nomeCompleto: "Maria",
        diretoria_id: null,
        area_ids: [],
        especialidade_id: null,
        squad_ids: [],
        senioridade: "Analista pleno",
        status: "Ativo",
        dataAdmissao: "2023-01-01",
      },
    ];
    const data = calcDiretoriaData(colaboradores, []);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Sem Diretoria");
    expect(data[0].value).toBe(1);
  });

  it("colaboradores com e sem diretoria são agrupados corretamente", () => {
    const diretorias: Diretoria[] = [{ id: "d1", nome: "Tecnologia" }];
    const colaboradores: Colaborador[] = [
      {
        id: "1", nomeCompleto: "Ana", diretoria_id: "d1",
        area_ids: [], especialidade_id: null, squad_ids: [],
        senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2023-01-01",
      },
      {
        id: "2", nomeCompleto: "Bob", diretoria_id: null,
        area_ids: [], especialidade_id: null, squad_ids: [],
        senioridade: "Analista junior", status: "Ativo", dataAdmissao: "2023-02-01",
      },
    ];
    const data = calcDiretoriaData(colaboradores, diretorias);
    const tecnologia = data.find((d) => d.name === "Tecnologia");
    const semDir = data.find((d) => d.name === "Sem Diretoria");
    expect(tecnologia?.value).toBe(1);
    expect(semDir?.value).toBe(1);
  });
});

describe("Edge cases — alerta de squad vazio", () => {
  it("squad com membros === null gera alerta 'Squad vazio'", () => {
    const squad: Squad = {
      id: "s1", nome: "Squad Alpha", torre_id: "t1",
      contrato_id: null, lider: "l1", membros: null, descricao: null,
    };
    const alerts = calcAlerts([], [squad]);
    const vazioAlerts = alerts.filter((a) => a.type === "Squad vazio");
    expect(vazioAlerts).toHaveLength(1);
    expect(vazioAlerts[0].itemId).toBe("s1");
  });

  it("squad com membros === [] gera alerta 'Squad vazio'", () => {
    const squad: Squad = {
      id: "s2", nome: "Squad Beta", torre_id: "t1",
      contrato_id: null, lider: "l1", membros: [], descricao: null,
    };
    const alerts = calcAlerts([], [squad]);
    const vazioAlerts = alerts.filter((a) => a.type === "Squad vazio");
    expect(vazioAlerts).toHaveLength(1);
    expect(vazioAlerts[0].itemId).toBe("s2");
  });

  it("squad com membros preenchidos não gera alerta 'Squad vazio'", () => {
    const squad: Squad = {
      id: "s3", nome: "Squad Gamma", torre_id: "t1",
      contrato_id: null, lider: "l1", membros: ["m1", "m2"], descricao: null,
    };
    const alerts = calcAlerts([], [squad]);
    const vazioAlerts = alerts.filter((a) => a.type === "Squad vazio");
    expect(vazioAlerts).toHaveLength(0);
  });
});

describe("Edge cases — alerta de colaborador sem diretoria", () => {
  it("colaborador ativo sem diretoria_id gera alerta 'Colaborador sem diretoria'", () => {
    const colaborador: Colaborador = {
      id: "c1", nomeCompleto: "Carlos", diretoria_id: null,
      area_ids: [], especialidade_id: null, squad_ids: [],
      senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2023-01-01",
    };
    const alerts = calcAlerts([colaborador], []);
    const semDirAlerts = alerts.filter((a) => a.type === "Colaborador sem diretoria");
    expect(semDirAlerts).toHaveLength(1);
    expect(semDirAlerts[0].itemId).toBe("c1");
    expect(semDirAlerts[0].itemName).toBe("Carlos");
  });

  it("colaborador desligado sem diretoria_id NÃO gera alerta", () => {
    const colaborador: Colaborador = {
      id: "c2", nomeCompleto: "Diana", diretoria_id: null,
      area_ids: [], especialidade_id: null, squad_ids: [],
      senioridade: "Analista pleno", status: "Desligado", dataAdmissao: "2023-01-01",
    };
    const alerts = calcAlerts([colaborador], []);
    const semDirAlerts = alerts.filter((a) => a.type === "Colaborador sem diretoria");
    expect(semDirAlerts).toHaveLength(0);
  });

  it("colaborador ativo com diretoria_id não gera alerta", () => {
    const colaborador: Colaborador = {
      id: "c3", nomeCompleto: "Eduardo", diretoria_id: "d1",
      area_ids: [], especialidade_id: null, squad_ids: [],
      senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2023-01-01",
    };
    const alerts = calcAlerts([colaborador], []);
    const semDirAlerts = alerts.filter((a) => a.type === "Colaborador sem diretoria");
    expect(semDirAlerts).toHaveLength(0);
  });
});

describe("Edge cases — formatação de datas", () => {
  it("formata data com mês e dia com zero à esquerda", () => {
    expect(formatDateBR("2023-01-05")).toBe("05/01/2023");
    expect(formatDateBR("2024-09-03")).toBe("03/09/2024");
  });

  it("formata data de ano bissexto (29/02)", () => {
    expect(formatDateBR("2024-02-29")).toBe("29/02/2024");
    expect(formatDateBR("2000-02-29")).toBe("29/02/2000");
  });

  it("formata data com mês dezembro (12)", () => {
    expect(formatDateBR("2023-12-31")).toBe("31/12/2023");
  });

  it("formata data com mês janeiro (01)", () => {
    expect(formatDateBR("2023-01-01")).toBe("01/01/2023");
  });
});
