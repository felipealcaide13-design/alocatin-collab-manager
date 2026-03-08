import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO: Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INITIAL_COLABORADORES = [
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
];

const MOCK_AREAS = [
    { id: uuidv4(), nome: "Backend", pilar: "Engenharia", subareas_possiveis: ["Core", "API"], descricao: "Equipe de Backend", lideres: [] as string[] },
    { id: uuidv4(), nome: "Frontend", pilar: "Engenharia", subareas_possiveis: ["Web", "Mobile"], descricao: "Equipe de Frontend", lideres: [] as string[] },
    { id: uuidv4(), nome: "DevOps", pilar: "Engenharia", subareas_possiveis: ["Cloud", "SRE"], descricao: "Equipe de Infraestrutura", lideres: [] as string[] },
    { id: uuidv4(), nome: "Segurança", pilar: "Engenharia", subareas_possiveis: ["SecOps", "RedTeam"], descricao: "Equipe de Segurança da Informação", lideres: [] as string[] },
    { id: uuidv4(), nome: "Dados", pilar: "Engenharia", subareas_possiveis: ["Engenharia de Dados", "BI"], descricao: "Equipe de Dados", lideres: [] as string[] },

    { id: uuidv4(), nome: "Produto", pilar: "Produto", subareas_possiveis: ["Growth", "Core"], descricao: "Equipe de Produto", lideres: [] as string[] },
    { id: uuidv4(), nome: "PX", pilar: "Produto", subareas_possiveis: ["QA", "Tech Writer"], descricao: "Product Experience", lideres: [] as string[] },
    { id: uuidv4(), nome: "Product Design", pilar: "Produto", subareas_possiveis: ["Design System", "UX/UI"], descricao: "Equipe de Design de Produto", lideres: [] as string[] },
    { id: uuidv4(), nome: "Projeto", pilar: "Produto", subareas_possiveis: ["Agile", "PMO"], descricao: "Gerenciamento de Projetos", lideres: [] as string[] },
    { id: uuidv4(), nome: "Pesquisa", pilar: "Produto", subareas_possiveis: ["UX Research"], descricao: "Pesquisa com usuários", lideres: [] as string[] },

    { id: uuidv4(), nome: "Financeiro", pilar: "Financeiro", subareas_possiveis: ["Contabilidade", "Tesouraria"], descricao: "Equipe Financeira", lideres: [] as string[] },
    { id: uuidv4(), nome: "Financeiro Ops", pilar: "Financeiro", subareas_possiveis: ["Faturamento"], descricao: "Operações Financeiras", lideres: [] as string[] },
    { id: uuidv4(), nome: "Legal", pilar: "Financeiro", subareas_possiveis: ["Contratos"], descricao: "Equipe Jurídica", lideres: [] as string[] },

    { id: uuidv4(), nome: "Talent", pilar: "RH", subareas_possiveis: ["Tech Recruiter", "Generalista"], descricao: "Aquisição de Talentos", lideres: [] as string[] },
    { id: uuidv4(), nome: "Business Partner", pilar: "RH", subareas_possiveis: ["Engenharia", "Marketing"], descricao: "Parceiros de Negócio", lideres: [] as string[] },
    { id: uuidv4(), nome: "Departamento Pessoal", pilar: "RH", subareas_possiveis: ["Folha"], descricao: "Departamento Pessoal", lideres: [] as string[] },
    { id: uuidv4(), nome: "Cultura", pilar: "RH", subareas_possiveis: ["Eventos", "Comunicação"], descricao: "Cultura e Engajamento", lideres: [] as string[] },

    { id: uuidv4(), nome: "Growth", pilar: "Marketing", subareas_possiveis: ["Performance", "SEO"], descricao: "Growth e Performance", lideres: [] as string[] },
    { id: uuidv4(), nome: "PMM", pilar: "Marketing", subareas_possiveis: ["Lançamentos"], descricao: "Product Marketing", lideres: [] as string[] },
    { id: uuidv4(), nome: "Branding", pilar: "Marketing", subareas_possiveis: ["Social Media", "PR"], descricao: "Marca e Relações Públicas", lideres: [] as string[] },
];

const MOCK_CONTRATOS = [
    { id: uuidv4(), nome: "BancoX Core Banking", cliente: "BancoX", valor_total: 2500000.00, data_inicio: "2023-01-15", data_fim: null, status: "Ativo", descricao: "Modernização do core banking", torres: [] },
    { id: uuidv4(), nome: "StartupY MVP", cliente: "StartupY", valor_total: 180000.00, data_inicio: "2023-05-10", data_fim: null, status: "Pausado", descricao: "Desenvolvimento de MVP", torres: [] },
    { id: uuidv4(), nome: "VarejoZ App", cliente: "VarejoZ", valor_total: 500000.00, data_inicio: "2023-02-01", data_fim: "2023-08-30", status: "Encerrado", descricao: "App e-commerce B2C", torres: [] },
    { id: uuidv4(), nome: "Tech Corp ERP", cliente: "Tech Corp", valor_total: 1200000.00, data_inicio: "2023-03-20", data_fim: null, status: "Ativo", descricao: "Implantação ERP", torres: [] },
    { id: uuidv4(), nome: "Governo Digital", cliente: "Gov BR", valor_total: 3500000.00, data_inicio: "2023-01-05", data_fim: null, status: "Ativo", descricao: "Digitalização de serviços", torres: [] },
    { id: uuidv4(), nome: "Saúde Mais App", cliente: "Saúde Mais", valor_total: 800000.00, data_inicio: "2023-04-12", data_fim: null, status: "Ativo", descricao: "Telemedicina", torres: [] },
    { id: uuidv4(), nome: "Logística Express CMS", cliente: "CargoLtda", valor_total: 450000.00, data_inicio: "2023-06-01", data_fim: null, status: "Pausado", descricao: "Painel de fretes", torres: [] },
    { id: uuidv4(), nome: "Banco Alfa Pix", cliente: "Banco Alfa", valor_total: 900000.00, data_inicio: "2022-11-15", data_fim: "2023-05-15", status: "Encerrado", descricao: "Integração Pix B2B", torres: [] },
    { id: uuidv4(), nome: "EducaTech LMS", cliente: "EducaTech", valor_total: 600000.00, data_inicio: "2023-07-10", data_fim: null, status: "Ativo", descricao: "Plataforma EAD", torres: [] },
    { id: uuidv4(), nome: "Agro IoT", cliente: "AgroLtda", valor_total: 1500000.00, data_inicio: "2023-08-01", data_fim: null, status: "Ativo", descricao: "Sensores e dados no campo", torres: [] },
    { id: uuidv4(), nome: "Imobiliária Hub", cliente: "ImobSA", valor_total: 300000.00, data_inicio: "2023-01-20", data_fim: null, status: "Ativo", descricao: "Portal imobiliário", torres: [] },
    { id: uuidv4(), nome: "Cripto Exchange", cliente: "CoinBR", valor_total: 2100000.00, data_inicio: "2023-05-01", data_fim: null, status: "Pausado", descricao: "Plataforma de trading", torres: [] },
    { id: uuidv4(), nome: "StreamingX", cliente: "Midia Corp", valor_total: 3200000.00, data_inicio: "2022-10-01", data_fim: "2023-10-01", status: "Ativo", descricao: "Plataforma de streaming SVOD", torres: [] },
    { id: uuidv4(), nome: "Seguradora Auto", cliente: "SafeSeg", valor_total: 750000.00, data_inicio: "2023-02-15", data_fim: "2023-09-15", status: "Encerrado", descricao: "App para sinistros", torres: [] },
    { id: uuidv4(), nome: "Rede Social Niche", cliente: "Connect", valor_total: 400000.00, data_inicio: "2023-09-01", data_fim: null, status: "Ativo", descricao: "Rede para gamers", torres: [] },
];

async function seed() {
    console.log("Iniciando Seed de Dados...");

    try {
        // 1. Criar tabelas se não existirem (via RPC ou assumindo DDL já feito manualmente)
        // Supabase JS doesn't do schema DDL directly unless using postgres functions, 
        // we assume the user already ran the schema SQL provided in the prompt.

        console.log("Inserindo colaboradores mock...");
        const { error: errorColabs } = await supabase.from('colaboradores').upsert(INITIAL_COLABORADORES);
        if (errorColabs) {
            console.warn("Erro ao inserir colaboradores. Certifique-se de que rodou o SQL Schema antes! Detalhe:", errorColabs.message);
        } else {
            console.log("Colaboradores inseridos com sucesso.");
        }

        // Associe líderes mock às áreas (pegando IDs aleatórios)
        const engLiders = INITIAL_COLABORADORES.filter(c => c.pilar === "Engenharia").map(c => c.id);
        const prodLiders = INITIAL_COLABORADORES.filter(c => c.pilar === "Produto").map(c => c.id);

        MOCK_AREAS.forEach(a => {
            // randomly assign 1 leader from same pilar
            if (a.pilar === "Engenharia" && engLiders.length > 0) a.lideres = [engLiders[Math.floor(Math.random() * engLiders.length)]];
            if (a.pilar === "Produto" && prodLiders.length > 0) a.lideres = [prodLiders[Math.floor(Math.random() * prodLiders.length)]];
        });

        console.log("Inserindo 20 áreas mock...");
        const { error: errorAreas } = await supabase.from('areas').upsert(MOCK_AREAS);
        if (errorAreas) {
            console.warn("Erro ao inserir áreas. Detalhe:", errorAreas.message);
        } else {
            console.log("Áreas inseridas com sucesso.");
        }

        // Insert relations Colaborador <-> Area
        console.log("Inserindo relações colaborador_areas...");
        for (const colab of INITIAL_COLABORADORES) {
            const area = MOCK_AREAS.find(a => a.nome === colab.area);
            if (area) {
                await supabase.from('colaborador_areas').upsert({
                    colaborador_id: colab.id,
                    area_id: area.id
                });
            }
        }
        console.log("Relações inseridas com sucesso.");

        // Atualizar colaboradores existentes com lideres via mock (already done above)

        console.log("Inserindo 15 contratos mock...");
        const { error: errorContratos } = await supabase.from('contratos').upsert(MOCK_CONTRATOS);
        if (errorContratos) {
            console.warn("Erro ao inserir contratos. Detalhe:", errorContratos.message);
        } else {
            console.log("Contratos inseridos com sucesso.");
        }

        console.log("Seed finalizado com sucesso!");

    } catch (err) {
        console.error("Failed to execute seed:", err);
    }
}

seed();
