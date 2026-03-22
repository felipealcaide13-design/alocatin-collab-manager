# Documento de Requisitos

## Introdução

Esta feature implementa o rastreamento completo de eventos ocorridos em Business Units (BUs), Torres e Squads. Cada criação, alteração de dados, configuração de campos de liderança, adição/alteração de pessoa em cargo de liderança e deleção é registrada com data/hora e dados suficientes para reconstruir o organograma em qualquer data passada (time-travel). O histórico é exibido na página de Business Units em uma aba chamada "Histórico", organizada por data.

Não há retroativo: apenas eventos ocorridos a partir da implantação desta feature serão registrados.

---

## Glossário

- **BU (Business Unit)**: Unidade de negócio que agrupa Torres.
- **Torre**: Entidade organizacional vinculada a uma BU.
- **Squad**: Equipe vinculada a uma Torre.
- **Evento_BU_Torre_Squad**: Registro individual de um acontecimento em uma BU, Torre ou Squad, contendo tipo de evento, entidade afetada, snapshot dos dados relevantes, data/hora e autor.
- **Tipo_Evento**: Classificação do evento ocorrido. Valores possíveis: `bu_criada`, `bu_alterada`, `bu_deletada`, `torre_criada`, `torre_alterada`, `torre_deletada`, `squad_criado`, `squad_alterado`, `squad_deletado`, `campo_lideranca_criado`, `campo_lideranca_alterado`, `campo_lideranca_removido`, `lideranca_atribuida`, `lideranca_alterada`, `lideranca_removida`.
- **Snapshot_Dados**: Objeto JSON armazenado junto ao evento contendo o estado completo da entidade no momento do evento, suficiente para reconstrução do organograma.
- **Historico_BU_Torre_Squad**: Tabela no banco de dados que armazena os Eventos_BU_Torre_Squad.
- **HistoricoBUService**: Serviço TypeScript responsável por gravar e consultar registros na tabela `historico_bu_torre_squad`.
- **Organograma_Snapshot**: Estrutura reconstruída de BUs → Torres → Squads com seus respectivos líderes, válida para uma data específica no passado.
- **BU_History_Tab**: Aba "Histórico" exibida na página Business Units.
- **Autor_Alteracao**: Identificador textual de quem realizou a mudança. Armazenado como `"sistema"` até que o módulo de usuários seja implementado.

---

## Requisitos

### Requisito 1: Registro de eventos de BU

**User Story:** Como gestor, quero que toda criação, alteração e deleção de uma Business Unit seja registrada automaticamente, para que eu tenha um histórico auditável das mudanças.

#### Critérios de Aceitação

1. WHEN uma BU é criada via `businessUnitService.create`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"bu_criada"`, `entidade_tipo` = `"bu"`, `entidade_id` = ID da BU criada, `snapshot_dados` contendo `nome` e `descricao` da BU, e `ocorrido_em` (timestamp UTC gerado pelo servidor).
2. WHEN os dados de uma BU são alterados via `businessUnitService.update`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"bu_alterada"`, incluindo no `snapshot_dados` os valores anteriores e novos dos campos alterados (`nome`, `descricao`).
3. WHEN uma BU é deletada via `businessUnitService.remove`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"bu_deletada"` e `snapshot_dados` contendo o estado completo da BU no momento da deleção, antes de executar o DELETE.
4. IF a gravação do evento falhar, THEN THE HistoricoBUService SHALL lançar um erro que impeça a conclusão da operação principal, mantendo consistência entre os dados atuais e o histórico.

---

### Requisito 2: Registro de eventos de Torre

**User Story:** Como gestor, quero que toda criação, alteração e deleção de uma Torre seja registrada automaticamente, para que eu possa rastrear a evolução da estrutura de Torres ao longo do tempo.

#### Critérios de Aceitação

1. WHEN uma Torre é criada via `torreService.createTorre`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"torre_criada"`, `entidade_tipo` = `"torre"`, `entidade_id` = ID da Torre criada, `entidade_pai_id` = `bu_id` da Torre, e `snapshot_dados` contendo `nome`, `descricao`, `bu_id` e `liderancas` da Torre.
2. WHEN os dados de uma Torre são alterados via `torreService.updateTorre`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"torre_alterada"`, incluindo no `snapshot_dados` os valores anteriores e novos dos campos alterados.
3. WHEN uma Torre é deletada via `torreService.removeTorre`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"torre_deletada"` e `snapshot_dados` contendo o estado completo da Torre antes da deleção.
4. IF a gravação do evento falhar, THEN THE HistoricoBUService SHALL lançar um erro que impeça a conclusão da operação principal.

---

### Requisito 3: Registro de eventos de Squad

**User Story:** Como gestor, quero que toda criação, alteração e deleção de um Squad seja registrada automaticamente, para que eu possa rastrear a composição das equipes ao longo do tempo.

#### Critérios de Aceitação

1. WHEN um Squad é criado via `torreService.createSquad`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"squad_criado"`, `entidade_tipo` = `"squad"`, `entidade_id` = ID do Squad criado, `entidade_pai_id` = `torre_id` do Squad, e `snapshot_dados` contendo `nome`, `descricao`, `torre_id`, `contrato_id`, `lider` e `membros` do Squad.
2. WHEN os dados de um Squad são alterados via `torreService.updateSquad`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"squad_alterado"`, incluindo no `snapshot_dados` os valores anteriores e novos dos campos alterados.
3. WHEN um Squad é deletado via `torreService.removeSquad`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"squad_deletado"` e `snapshot_dados` contendo o estado completo do Squad antes da deleção.
4. IF a gravação do evento falhar, THEN THE HistoricoBUService SHALL lançar um erro que impeça a conclusão da operação principal.

---

### Requisito 4: Registro de eventos de campos de liderança

**User Story:** Como gestor, quero que a criação, alteração e remoção de campos de liderança configurados em BUs e Torres seja registrada, para que eu saiba quando a estrutura de cargos foi modificada.

#### Critérios de Aceitação

1. WHEN um campo de liderança é adicionado à configuração de uma BU ou Torre via `configuracaoBUService.upsert` ou `configuracaoTorreService.upsert`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"campo_lideranca_criado"`, `entidade_tipo` = `"bu"` ou `"torre"` conforme aplicável, `entidade_id` = ID da BU ou Torre, e `snapshot_dados` contendo o nome, senioridade-filtro e diretoria-filtro do campo adicionado.
2. WHEN um campo de liderança existente é editado, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"campo_lideranca_alterado"` e `snapshot_dados` contendo os valores anteriores e novos do campo.
3. WHEN um campo de liderança é removido da configuração, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"campo_lideranca_removido"` e `snapshot_dados` contendo os dados do campo removido.
4. THE HistoricoBUService SHALL comparar a lista de campos anterior com a nova para identificar quais campos foram adicionados, alterados ou removidos, registrando um evento separado por campo modificado.

---

### Requisito 5: Registro de eventos de liderança (pessoas em cargos)

**User Story:** Como gestor, quero que a atribuição, alteração e remoção de pessoas em cargos de liderança de BUs, Torres e Squads seja registrada, para que eu possa rastrear quem ocupou cada cargo ao longo do tempo.

#### Critérios de Aceitação

1. WHEN o campo `liderancas` de uma BU é alterado via `businessUnitService.update` e um cargo passa a ter um colaborador atribuído onde antes estava vazio, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"lideranca_atribuida"`, `entidade_tipo` = `"bu"`, `entidade_id` = ID da BU, e `snapshot_dados` contendo o nome do cargo, o ID do colaborador atribuído e o nome do cargo.
2. WHEN o campo `liderancas` de uma BU é alterado e um cargo já preenchido recebe um colaborador diferente, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"lideranca_alterada"` e `snapshot_dados` contendo o nome do cargo, o ID do colaborador anterior e o ID do novo colaborador.
3. WHEN o campo `liderancas` de uma BU é alterado e um cargo preenchido passa a ficar vazio, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"lideranca_removida"` e `snapshot_dados` contendo o nome do cargo e o ID do colaborador removido.
4. WHEN o campo `liderancas` de uma Torre é alterado, THE Historico_BU_Torre_Squad SHALL aplicar as mesmas regras dos critérios 1, 2 e 3 com `entidade_tipo` = `"torre"`.
5. WHEN o campo `lider` de um Squad é alterado via `torreService.updateSquad`, THE Historico_BU_Torre_Squad SHALL registrar um Evento_BU_Torre_Squad com `tipo_evento` = `"lideranca_atribuida"`, `"lideranca_alterada"` ou `"lideranca_removida"` conforme o caso, com `entidade_tipo` = `"squad"` e `snapshot_dados` contendo o cargo `"lider"`, o ID anterior e o novo ID do colaborador.
6. THE HistoricoBUService SHALL comparar o estado anterior e o novo do campo `liderancas` para identificar quais cargos foram afetados, registrando um evento separado por cargo modificado.

---

### Requisito 6: Estrutura de dados do histórico

**User Story:** Como desenvolvedor, quero uma tabela dedicada no banco de dados para armazenar o histórico de BUs, Torres e Squads, para que os dados sejam persistidos de forma estruturada e consultável para time-travel.

#### Critérios de Aceitação

1. THE Historico_BU_Torre_Squad SHALL conter os campos: `id` (UUID PK), `tipo_evento` (text NOT NULL), `entidade_tipo` (text NOT NULL — valores: `"bu"`, `"torre"`, `"squad"`), `entidade_id` (UUID NOT NULL), `entidade_pai_id` (UUID nullable — ID da BU para Torres, ID da Torre para Squads), `snapshot_dados` (jsonb NOT NULL), `ocorrido_em` (timestamptz NOT NULL DEFAULT now()), `autor_alteracao` (text nullable).
2. THE Historico_BU_Torre_Squad SHALL ter um índice no campo `entidade_id` para garantir performance nas consultas por entidade.
3. THE Historico_BU_Torre_Squad SHALL ter um índice no campo `ocorrido_em` para suportar consultas de time-travel por data.
4. THE Historico_BU_Torre_Squad SHALL ter um índice no campo `entidade_tipo` para suportar filtragem por tipo de entidade.
5. THE Historico_BU_Torre_Squad SHALL ter um índice composto em (`entidade_tipo`, `ocorrido_em`) para otimizar consultas de reconstrução do organograma em uma data específica.
6. THE Historico_BU_Torre_Squad SHALL armazenar o campo `autor_alteracao` como `"sistema"` enquanto o módulo de usuários não estiver implementado.

---

### Requisito 7: Consulta e reconstrução do organograma por data (time-travel)

**User Story:** Como gestor, quero poder consultar o estado do organograma em qualquer data passada, para que eu entenda como a estrutura estava organizada em um momento específico.

#### Critérios de Aceitação

1. THE HistoricoBUService SHALL expor uma função `getOrganigramaSnapshot(dataReferencia: Date): Promise<OrganigramaSnapshot>` que retorna a estrutura completa de BUs → Torres → Squads com seus líderes, reconstruída a partir dos eventos registrados até a `dataReferencia`.
2. WHEN `getOrganigramaSnapshot` é chamada, THE HistoricoBUService SHALL processar todos os eventos em ordem cronológica até a `dataReferencia`, aplicando cada evento ao estado acumulado para reconstruir o organograma.
3. THE HistoricoBUService SHALL expor uma função `getEventosByPeriodo(dataInicio: Date, dataFim: Date): Promise<EventoBUTorreSquad[]>` que retorna todos os eventos ocorridos no período, ordenados por `ocorrido_em` decrescente.
4. THE HistoricoBUService SHALL expor uma função `getEventosByEntidade(entidadeId: string): Promise<EventoBUTorreSquad[]>` que retorna todos os eventos de uma entidade específica, ordenados por `ocorrido_em` decrescente.
5. IF nenhum evento existir até a `dataReferencia`, THEN THE HistoricoBUService SHALL retornar um `OrganigramaSnapshot` vazio (sem BUs, Torres ou Squads).

---

### Requisito 8: Exibição do histórico na aba "Histórico" da página Business Units

**User Story:** Como gestor, quero visualizar o histórico de eventos de BUs, Torres e Squads em uma aba dedicada na página Business Units, organizada por data, para que eu tenha visibilidade completa das mudanças estruturais.

#### Critérios de Aceitação

1. THE BU_History_Tab SHALL ser exibida como uma aba chamada "Histórico" na página Business Units, ao lado das abas existentes (BUs, Torres, Squads, Hierarquia, Configuração).
2. WHEN o usuário acessa a aba "Histórico", THE BU_History_Tab SHALL exibir todos os eventos registrados, agrupados por data (dia), em ordem decrescente (eventos mais recentes primeiro).
3. WHEN um evento é exibido, THE BU_History_Tab SHALL mostrar: o tipo de evento em linguagem natural (ex: "BU criada", "Torre alterada", "Liderança atribuída"), o nome da entidade afetada, os dados relevantes do `snapshot_dados` e o horário do evento formatado em pt-BR (ex: "14/03/2026 às 15:30").
4. THE BU_History_Tab SHALL exibir um ícone ou badge colorido diferente para cada `entidade_tipo` (`bu`, `torre`, `squad`), facilitando a identificação visual.
5. THE BU_History_Tab SHALL permitir que o usuário filtre os eventos por `entidade_tipo` (BU, Torre, Squad ou Todos).
6. THE BU_History_Tab SHALL permitir que o usuário filtre os eventos por intervalo de datas (data início e data fim).
7. WHILE os eventos estão sendo carregados, THE BU_History_Tab SHALL exibir um indicador de carregamento (skeleton).
8. IF não existirem eventos registrados, THEN THE BU_History_Tab SHALL exibir a mensagem "Nenhum evento registrado ainda."
9. IF ocorrer um erro ao buscar os eventos, THEN THE BU_History_Tab SHALL exibir a mensagem "Não foi possível carregar o histórico." sem bloquear as demais abas.
10. THE BU_History_Tab SHALL exibir o nome do autor da alteração quando o campo `autor_alteracao` contiver um valor diferente de `"sistema"`.

---

### Requisito 9: Integridade e consistência dos dados de histórico

**User Story:** Como desenvolvedor, quero garantir que o histórico seja consistente e confiável, para que futuras consultas de time-travel sejam precisas.

#### Critérios de Aceitação

1. THE HistoricoBUService SHALL registrar os Eventos_BU_Torre_Squad de forma atômica junto com a operação principal (create/update/delete), garantindo que não haja entidade modificada sem evento correspondente.
2. IF a operação de gravação do evento falhar, THEN THE HistoricoBUService SHALL lançar um erro que impeça a conclusão da operação principal, mantendo consistência entre os dados atuais e o histórico.
3. THE Historico_BU_Torre_Squad SHALL armazenar o campo `ocorrido_em` gerado pelo servidor de banco de dados (PostgreSQL `now()`), não pelo cliente, para evitar inconsistências de fuso horário.
4. FOR ALL Eventos_BU_Torre_Squad do tipo `bu_deletada`, `torre_deletada` ou `squad_deletado`, o `snapshot_dados` SHALL conter o estado completo da entidade imediatamente antes da deleção, permitindo reconstrução mesmo após a remoção do registro original.
5. THE HistoricoBUService SHALL garantir que eventos de deleção sejam gravados antes da execução do DELETE no banco de dados, para que o snapshot seja capturado enquanto os dados ainda existem.
