import { v4 as uuidv4 } from "uuid";
import type { Colaborador, ColaboradorInput } from "@/types/colaborador";

const INITIAL_DATA: Colaborador[] = [
  { id: uuidv4(), nomeCompleto: "João Silva", email: "joao.silva@alocatin.com", documento: "123.456.789-00", cargo: "Desenvolvedor Backend Sênior", pilar: "Engenharia", area: "Backend", subarea: null, senioridade: "Staf II", status: "Ativo", dataAdmissao: "2021-03-15", time: "Squad Alpha" },
  { id: uuidv4(), nomeCompleto: "Maria Oliveira", email: "maria.oliveira@alocatin.com", documento: "234.567.890-11", cargo: "QA Engineer", pilar: "Produto", area: "PX", subarea: "QA", senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2022-07-01", time: "Squad Beta" },
  { id: uuidv4(), nomeCompleto: "Carlos Mendes", email: "carlos.mendes@alocatin.com", documento: "345.678.901-22", cargo: "Tech Lead Frontend", pilar: "Engenharia", area: "Frontend", subarea: null, senioridade: "Staf I", status: "Ativo", dataAdmissao: "2020-11-20", time: "Squad Alpha" },
  { id: uuidv4(), nomeCompleto: "Ana Ferreira", email: "ana.ferreira@alocatin.com", documento: "456.789.012-33", cargo: "Product Designer", pilar: "Produto", area: "Product Design", subarea: "Design System", senioridade: "Analista senior", status: "Ativo", dataAdmissao: "2022-01-10", time: "Squad Design" },
  { id: uuidv4(), nomeCompleto: "Pedro Costa", email: "pedro.costa@alocatin.com", documento: "567.890.123-44", cargo: "DevOps Engineer", pilar: "Engenharia", area: "DevOps", subarea: null, senioridade: "Coordenador(a)", status: "Ativo", dataAdmissao: "2019-06-05", time: null },
  { id: uuidv4(), nomeCompleto: "Fernanda Lima", email: "fernanda.lima@alocatin.com", documento: "678.901.234-55", cargo: "CFO", pilar: "Financeiro", area: "Financeiro", subarea: null, senioridade: "C-level", status: "Ativo", dataAdmissao: "2018-02-01", time: null },
  { id: uuidv4(), nomeCompleto: "Lucas Rocha", email: "lucas.rocha@alocatin.com", documento: "789.012.345-66", cargo: "Tech Writer", pilar: "Produto", area: "PX", subarea: "Tech Writer", senioridade: "Analista junior", status: "Ativo", dataAdmissao: "2023-04-12", time: "Squad Beta" },
  { id: uuidv4(), nomeCompleto: "Isabela Santos", email: "isabela.santos@alocatin.com", documento: "890.123.456-77", cargo: "Talent Acquisition", pilar: "RH", area: "Talent", subarea: null, senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2021-09-08", time: null },
  { id: uuidv4(), nomeCompleto: "Rafael Nunes", email: "rafael.nunes@alocatin.com", documento: "901.234.567-88", cargo: "Growth Hacker", pilar: "Marketing", area: "Growth", subarea: null, senioridade: "Analista senior", status: "Ativo", dataAdmissao: "2022-05-15", time: null },
  { id: uuidv4(), nomeCompleto: "Camila Torres", email: "camila.torres@alocatin.com", documento: "012.345.678-99", cargo: "Product Manager", pilar: "Produto", area: "Produto", subarea: null, senioridade: "Gerente", status: "Ativo", dataAdmissao: "2020-08-03", time: "Squad Alpha" },
  { id: uuidv4(), nomeCompleto: "Bruno Alves", email: "bruno.alves@alocatin.com", documento: "111.222.333-44", cargo: "Desenvolvedor Frontend", pilar: "Engenharia", area: "Frontend", subarea: null, senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2023-01-17", time: "Squad Beta" },
  { id: uuidv4(), nomeCompleto: "Tatiane Gomes", email: "tatiane.gomes@alocatin.com", documento: "222.333.444-55", cargo: "Business Partner RH", pilar: "RH", area: "Business Partner", subarea: null, senioridade: "Analista senior", status: "Ativo", dataAdmissao: "2021-11-22", time: null },
  { id: uuidv4(), nomeCompleto: "Diego Cardoso", email: "diego.cardoso@alocatin.com", documento: "333.444.555-66", cargo: "Analista Financeiro", pilar: "Financeiro", area: "Financeiro Ops", subarea: null, senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2022-03-28", time: null },
  { id: uuidv4(), nomeCompleto: "Priscila Melo", email: "priscila.melo@alocatin.com", documento: "444.555.666-77", cargo: "PMM Lead", pilar: "Marketing", area: "PMM", subarea: null, senioridade: "Head", status: "Ativo", dataAdmissao: "2019-10-14", time: null },
  { id: uuidv4(), nomeCompleto: "Thiago Barbosa", email: "thiago.barbosa@alocatin.com", documento: "555.666.777-88", cargo: "CTO", pilar: "Engenharia", area: "Backend", subarea: null, senioridade: "C-level", status: "Ativo", dataAdmissao: "2017-04-01", time: null },
  { id: uuidv4(), nomeCompleto: "Juliana Pinto", email: "juliana.pinto@alocatin.com", documento: "666.777.888-99", cargo: "Project Manager", pilar: "Produto", area: "Projeto", subarea: null, senioridade: "Coordenador(a)", status: "Ativo", dataAdmissao: "2020-12-07", time: "Squad Alpha" },
  { id: uuidv4(), nomeCompleto: "Marcos Rezende", email: "marcos.rezende@alocatin.com", documento: "777.888.999-00", cargo: "DevOps Sênior", pilar: "Engenharia", area: "DevOps", subarea: null, senioridade: "Staf I", status: "Desligado", dataAdmissao: "2019-07-19", time: null },
  { id: uuidv4(), nomeCompleto: "Aline Fonseca", email: "aline.fonseca@alocatin.com", documento: "888.999.000-11", cargo: "Diretora de Marketing", pilar: "Marketing", area: "Growth", subarea: null, senioridade: "Diretor(a)", status: "Ativo", dataAdmissao: "2018-09-03", time: null },
  { id: uuidv4(), nomeCompleto: "Eduardo Vaz", email: "eduardo.vaz@alocatin.com", documento: "999.000.111-22", cargo: "Backend Junior", pilar: "Engenharia", area: "Backend", subarea: null, senioridade: "Analista junior", status: "Ativo", dataAdmissao: "2023-08-21", time: "Squad Beta" },
  { id: uuidv4(), nomeCompleto: "Natalia Cruz", email: "natalia.cruz@alocatin.com", documento: "101.202.303-33", cargo: "Product Design Lead", pilar: "Produto", area: "Product Design", subarea: "Product Design", senioridade: "Head", status: "Ativo", dataAdmissao: "2020-04-16", time: "Squad Design" },
  { id: uuidv4(), nomeCompleto: "Felipe Martins", email: "felipe.martins@alocatin.com", documento: "202.303.404-44", cargo: "Analista de RH", pilar: "RH", area: "Talent", subarea: null, senioridade: "Analista junior", status: "Ativo", dataAdmissao: "2023-06-05", time: null },
  { id: uuidv4(), nomeCompleto: "Vanessa Ramos", email: "vanessa.ramos@alocatin.com", documento: "303.404.505-55", cargo: "Gerente Financeiro", pilar: "Financeiro", area: "Financeiro", subarea: null, senioridade: "Gerente", status: "Desligado", dataAdmissao: "2018-12-10", time: null },
  { id: uuidv4(), nomeCompleto: "Rodrigo Leal", email: "rodrigo.leal@alocatin.com", documento: "404.505.606-66", cargo: "Frontend Sênior", pilar: "Engenharia", area: "Frontend", subarea: null, senioridade: "Analista senior", status: "Ativo", dataAdmissao: "2021-05-30", time: "Squad Alpha" },
  { id: uuidv4(), nomeCompleto: "Bianca Duarte", email: "bianca.duarte@alocatin.com", documento: "505.606.707-77", cargo: "PMM Analyst", pilar: "Marketing", area: "PMM", subarea: null, senioridade: "Analista pleno", status: "Ativo", dataAdmissao: "2022-10-18", time: null },
  { id: uuidv4(), nomeCompleto: "Henrique Braga", email: "henrique.braga@alocatin.com", documento: "606.707.808-88", cargo: "Diretor de Engenharia", pilar: "Engenharia", area: "Backend", subarea: null, senioridade: "Diretor(a)", status: "Ativo", dataAdmissao: "2017-11-27", time: null },
];

// In-memory store
let colaboradores: Colaborador[] = [...INITIAL_DATA];

// Simulate async delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const colaboradorService = {
  async getAll(): Promise<Colaborador[]> {
    await delay(200);
    return [...colaboradores];
  },

  async getById(id: string): Promise<Colaborador | null> {
    await delay(100);
    return colaboradores.find((c) => c.id === id) ?? null;
  },

  async create(input: ColaboradorInput): Promise<Colaborador> {
    await delay(300);

    // Check duplicate CPF
    const cpfExists = colaboradores.some((c) => c.documento === input.documento);
    if (cpfExists) throw new Error("CPF já cadastrado. (409)");

    // Check duplicate email
    const emailExists = colaboradores.some((c) => c.email.toLowerCase() === input.email.toLowerCase());
    if (emailExists) throw new Error("E-mail já cadastrado. (409)");

    const novo: Colaborador = { ...input, id: uuidv4() };
    colaboradores = [novo, ...colaboradores];
    return novo;
  },

  async update(id: string, input: Partial<ColaboradorInput>): Promise<Colaborador> {
    await delay(300);

    const index = colaboradores.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Colaborador não encontrado.");

    // Check duplicate CPF (excluding self)
    if (input.documento) {
      const cpfExists = colaboradores.some((c) => c.documento === input.documento && c.id !== id);
      if (cpfExists) throw new Error("CPF já cadastrado. (409)");
    }

    if (input.email) {
      const emailExists = colaboradores.some((c) => c.email.toLowerCase() === input.email!.toLowerCase() && c.id !== id);
      if (emailExists) throw new Error("E-mail já cadastrado. (409)");
    }

    const updated: Colaborador = { ...colaboradores[index], ...input };
    colaboradores = colaboradores.map((c) => (c.id === id ? updated : c));
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay(200);
    const exists = colaboradores.some((c) => c.id === id);
    if (!exists) throw new Error("Colaborador não encontrado.");
    colaboradores = colaboradores.filter((c) => c.id !== id);
  },
};
