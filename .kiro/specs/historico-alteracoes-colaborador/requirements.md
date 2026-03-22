# Documento de Requisitos

## Introdução

Esta feature implementa o rastreamento de alterações nos campos críticos de cada colaborador: senioridade, diretoria, status (Ativo/Desligado) e alocação (BU, Torres e Squads). Cada evento de mudança é registrado com data/hora, identificação de quem realizou a alteração (campo preparado para uso futuro com sistema de usuários), o valor anterior e o novo valor. O histórico é exibido na página de detalhes do colaborador (`ColaboradorDetailPanel`) e serve de base para futuras visualizações da estrutura organizacional em datas específicas.

Não há retroativo: apenas alterações realizadas a partir da implantação desta feature serão registradas.

---

## Glossário

- **Historico_Alteracoes**: Tabela no banco de dados que armazena cada evento de mudança de campo rastreável de um colaborador.
- **Evento_Alteracao**: Um registro individual que representa a mudança de um campo rastreável, contendo campo alterado, valor anterior, novo valor, data/hora e autor.
- **Campo_Rastreavel**: Qualquer um dos campos monitorados: `senioridade`, `diretoria_id`, `status`, `bu_id`, `torre_ids`, `squad_ids`.
- **Autor_Alteracao**: Identificador textual de quem realizou a mudança. Atualmente armazenado como string livre (ex: `"sistema"`) até que o módulo de usuários seja implementado.
- **ColaboradorDetailPanel**: Componente Dialog que exibe os detalhes completos de um colaborador na página `/colaboradores/:id`.
- **HistoricoService**: Serviço TypeScript responsável por gravar e consultar registros na tabela `historico_alteracoes`.
- **Snapshot_Organizacional**: Consulta futura que retorna o estado da estrutura da empresa em uma data específica, baseada nos registros do `Historico_Alteracoes`.

---

## Requisitos

### Requisito 1: Registro automático de alterações

**User Story:** Como gestor de RH, quero que toda alteração nos campos críticos de um colaborador seja registrada automaticamente, para que eu tenha um histórico auditável das mudanças.

#### Critérios de Aceitação

1. WHEN o campo `senioridade` de um colaborador é alterado via `colaboradorService.update`, THE Historico_Alteracoes SHALL registrar um Evento_Alteracao contendo: `colaborador_id`, `campo` = `"senioridade"`, `valor_anterior`, `novo_valor`, `alterado_em` (timestamp UTC) e `autor_alteracao`.
2. WHEN o campo `diretoria_id` de um colaborador é alterado via `colaboradorService.update`, THE Historico_Alteracoes SHALL registrar um Evento_Alteracao com os mesmos metadados do critério 1.
3. WHEN o campo `status` de um colaborador é alterado via `colaboradorService.update`, THE Historico_Alteracoes SHALL registrar um Evento_Alteracao com os mesmos metadados do critério 1.
4. WHEN o campo `bu_id` de um colaborador é alterado via `colaboradorService.update`, THE Historico_Alteracoes SHALL registrar um Evento_Alteracao com os mesmos metadados do critério 1.
5. WHEN os campos `torre_ids` ou `squad_ids` de um colaborador são alterados via `colaboradorService.update`, THE Historico_Alteracoes SHALL registrar um Evento_Alteracao por campo alterado, serializando os arrays como JSON.
6. IF o valor anterior e o novo valor de um campo rastreável forem idênticos, THEN THE HistoricoService SHALL omitir o registro desse campo, não criando um Evento_Alteracao desnecessário.
7. THE Historico_Alteracoes SHALL armazenar o campo `autor_alteracao` como `"sistema"` enquanto o módulo de usuários não estiver implementado.

---

### Requisito 2: Estrutura de dados do histórico

**User Story:** Como desenvolvedor, quero uma tabela dedicada no banco de dados para armazenar o histórico, para que os dados sejam persistidos de forma estruturada e consultável.

#### Critérios de Aceitação

1. THE Historico_Alteracoes SHALL conter os campos: `id` (UUID PK), `colaborador_id` (FK → colaboradores.id), `campo` (text), `valor_anterior` (text nullable), `novo_valor` (text nullable), `alterado_em` (timestamptz default now()), `autor_alteracao` (text nullable).
2. THE Historico_Alteracoes SHALL ter uma constraint de chave estrangeira com `ON DELETE CASCADE` para `colaboradores.id`, garantindo que ao excluir um colaborador seus registros de histórico sejam removidos automaticamente.
3. THE Historico_Alteracoes SHALL ter um índice no campo `colaborador_id` para garantir performance nas consultas de histórico por colaborador.
4. THE Historico_Alteracoes SHALL ter um índice no campo `alterado_em` para suportar consultas de snapshot organizacional por data.
5. WHERE o sistema de usuários for implementado no futuro, THE Historico_Alteracoes SHALL aceitar a adição de uma FK em `autor_alteracao` sem necessidade de migração destrutiva, pois o campo já existe como text.

---

### Requisito 3: Consulta do histórico por colaborador

**User Story:** Como gestor de RH, quero visualizar o histórico de alterações de um colaborador específico, para entender como o perfil dele evoluiu ao longo do tempo.

#### Critérios de Aceitação

1. WHEN o `ColaboradorDetailPanel` é aberto para um colaborador, THE HistoricoService SHALL buscar todos os Eventos_Alteracao associados ao `colaborador_id` ordenados por `alterado_em` decrescente (mais recente primeiro).
2. THE HistoricoService SHALL retornar os eventos com os campos: `id`, `campo`, `valor_anterior`, `novo_valor`, `alterado_em`, `autor_alteracao`.
3. IF não existirem Eventos_Alteracao para o colaborador, THEN THE ColaboradorDetailPanel SHALL exibir a mensagem "Nenhuma alteração registrada ainda." na seção de histórico.
4. THE HistoricoService SHALL expor uma função `getByColaborador(colaboradorId: string): Promise<EventoAlteracao[]>` que encapsula a consulta ao Supabase.

---

### Requisito 4: Exibição do histórico no ColaboradorDetailPanel

**User Story:** Como gestor de RH, quero ver o histórico de alterações diretamente na página de detalhes do colaborador, para ter contexto completo sem precisar navegar para outra tela.

#### Critérios de Aceitação

1. THE ColaboradorDetailPanel SHALL exibir uma seção "Histórico de Alterações" após as seções existentes de dados cadastrais, alocação e contratos.
2. WHEN um Evento_Alteracao é exibido, THE ColaboradorDetailPanel SHALL mostrar: o nome legível do campo alterado (ex: "Senioridade" em vez de `"senioridade"`), o valor anterior, o novo valor e a data/hora formatada em pt-BR (ex: "14/03/2026 às 15:30").
3. WHEN o campo `autor_alteracao` contiver um valor diferente de `"sistema"`, THE ColaboradorDetailPanel SHALL exibir o nome do autor junto ao evento.
4. WHILE o histórico está sendo carregado, THE ColaboradorDetailPanel SHALL exibir um indicador de carregamento (skeleton) na seção de histórico.
5. IF ocorrer um erro ao buscar o histórico, THEN THE ColaboradorDetailPanel SHALL exibir a mensagem "Não foi possível carregar o histórico." sem bloquear a exibição das demais informações do colaborador.
6. THE ColaboradorDetailPanel SHALL exibir os campos rastreáveis com os seguintes rótulos: `senioridade` → "Senioridade", `diretoria_id` → "Diretoria", `status` → "Status", `bu_id` → "Business Unit", `torre_ids` → "Torres", `squad_ids` → "Squads".
7. WHEN os campos `torre_ids` ou `squad_ids` são exibidos no histórico, THE ColaboradorDetailPanel SHALL resolver os IDs para os nomes correspondentes das torres/squads, exibindo os nomes separados por vírgula.
8. WHEN o campo `diretoria_id` ou `bu_id` é exibido no histórico, THE ColaboradorDetailPanel SHALL resolver o ID para o nome correspondente da diretoria/BU.

---

### Requisito 5: Integridade e consistência dos dados de histórico

**User Story:** Como desenvolvedor, quero garantir que o histórico seja consistente e confiável, para que futuras consultas de snapshot organizacional sejam precisas.

#### Critérios de Aceitação

1. THE HistoricoService SHALL registrar os Eventos_Alteracao de forma atômica junto com o `UPDATE` do colaborador, garantindo que não haja colaborador atualizado sem histórico correspondente.
2. IF a operação de gravação do histórico falhar, THEN THE HistoricoService SHALL lançar um erro que impeça a conclusão do `update` do colaborador, mantendo consistência entre os dados atuais e o histórico.
3. THE Historico_Alteracoes SHALL armazenar valores de campos do tipo array (`torre_ids`, `squad_ids`) como strings JSON (ex: `'["id1","id2"]'`) para garantir compatibilidade com o tipo `text` da coluna.
4. FOR ALL Eventos_Alteracao registrados, o campo `alterado_em` SHALL ser gerado pelo servidor de banco de dados (PostgreSQL `now()`), não pelo cliente, para evitar inconsistências de fuso horário.
