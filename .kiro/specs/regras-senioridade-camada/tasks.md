# Plano de Implementação: Regras de Senioridade por Camada

## Overview

Implementar o módulo central de validação `senioridadeCamadas.ts` com funções puras, integrá-lo ao `ColaboradorForm` para campos dinâmicos e validação, e ao `BUOrgChart` para filtro por camada no organograma.

## Tasks

- [x] 1. Criar módulo central `src/utils/senioridadeCamadas.ts`
  - Definir o tipo `Camada = "BU" | "Torre" | "Squad"`
  - Exportar a constante `REGRAS_SENIORIDADE_CAMADA: Record<Senioridade, Camada[]>` com todas as 10 senioridades mapeadas conforme tabela de regras
  - Implementar `getCamadasPermitidas(senioridade: Senioridade): Camada[]`
  - Implementar `isCamadaPermitida(senioridade: Senioridade, camada: Camada): boolean`
  - Implementar `validarCamadasPorSenioridade(senioridade, camadas): { valido: boolean; mensagem?: string }` — retorna erro descritivo para camadas inválidas ou array vazio
  - Implementar `parsearRegrasSenioridade(json: string): Record<Senioridade, Camada[]>` — lança `Error` com mensagem identificando o valor inválido para senioridades ou camadas desconhecidas
  - _Requirements: 1.1–1.12, 4.1–4.5, 5.1–5.5_

  - [ ]* 1.1 Escrever testes unitários para o módulo central
    - Smoke test: verificar que todas as funções são exportadas (Req 4.4)
    - Exemplo: `C-level` com `["BU"]` → válido; `C-level` com `["Torre"]` → inválido (Req 1.1)
    - Exemplo: `Diretor(a)` com `["BU", "Torre"]` → válido; `Diretor(a)` com `["Squad"]` → inválido (Req 1.2)
    - Exemplo: `Analista pleno` com `["Squad"]` → válido; `Analista pleno` com `["Torre"]` → inválido (Req 1.9)
    - Exemplo: `validarCamadasPorSenioridade` com array vazio → `{ valido: false, mensagem: "..." }` (Req 1.11)
    - Exemplo: `parsearRegrasSenioridade` com JSON válido retorna objeto correto (Req 5.1, 5.2)
    - Exemplo: `parsearRegrasSenioridade` com senioridade inválida lança erro descritivo (Req 5.4)
    - Exemplo: `parsearRegrasSenioridade` com camada inválida lança erro descritivo (Req 5.5)
    - _Requirements: 1.1–1.12, 4.4, 5.1–5.5_

  - [ ]* 1.2 Escrever testes de propriedade para o módulo central (arquivo `src/test/regras-senioridade-camada.test.ts`)
    - **Property 1: Validação por senioridade é consistente com o mapa de regras**
    - **Validates: Requirements 1.1–1.11**
    - **Property 2: Pureza e idempotência da função de validação**
    - **Validates: Requirements 1.12, 4.2**
    - **Property 3: Completude do mapa REGRAS_SENIORIDADE_CAMADA**
    - **Validates: Requirements 4.3, 4.5**
    - **Property 6: Round-trip de serialização das regras**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - **Property 7: Erro descritivo no parse para entradas inválidas**
    - **Validates: Requirements 5.4, 5.5**
    - Usar `fc.constantFrom(...SENIORIDADES)` e `fc.subarray(["BU","Torre","Squad"])` como arbitrários; mínimo 100 iterações por propriedade

- [x] 2. Checkpoint — Garantir que todos os testes do módulo central passam
  - Garantir que todos os testes passam; perguntar ao usuário se houver dúvidas.

- [x] 3. Integrar módulo ao `ColaboradorForm.tsx`
  - Substituir a lógica de `showSquad / showArea / showEspecialidade` baseada em `SENIORIDADE_GRUPOS` por derivações a partir de `getCamadasPermitidas(senioridade)`
  - Adicionar campo de seleção de **BU** (novo) para senioridades que incluem `"BU"` nas camadas permitidas (`C-level`, `Diretor(a)`)
  - Adicionar campo de seleção de **Torre** (novo) para senioridades que incluem `"Torre"` nas camadas permitidas
  - Manter campo de **Squad** apenas para senioridades que incluem `"Squad"` nas camadas permitidas
  - No `useEffect` de reset ao mudar senioridade, limpar os campos de camadas que se tornaram inválidos para a nova senioridade
  - Ao abrir o formulário em modo edição, derivar as camadas ativas do colaborador e chamar `validarCamadasPorSenioridade`; se inválido, exibir `<Alert>` amarelo com a mensagem de inconsistência (Req 2.9)
  - No `handleSubmit`, chamar `validarCamadasPorSenioridade` antes de submeter; se inválido, exibir toast de erro e cancelar a submissão (Req 2.8)
  - _Requirements: 2.1–2.9_

  - [ ]* 3.1 Escrever testes de propriedade para campos dinâmicos do formulário
    - **Property 4: Campos dinâmicos do formulário refletem exatamente as camadas permitidas**
    - **Validates: Requirements 2.1, 2.7**
    - Verificar que para qualquer senioridade, os campos visíveis correspondem exatamente a `getCamadasPermitidas(senioridade)` e campos ocultos têm valores limpos

- [x] 4. Integrar módulo ao `BUOrgChart.tsx` — função `buildNodes`
  - Nos nós `bu`: filtrar `colaboradores` por `isCamadaPermitida(c.senioridade, "BU")` antes de incluí-los como membros do nó BU
  - Nos nós `torre`: filtrar por `isCamadaPermitida(c.senioridade, "Torre")` para os responsáveis da torre
  - Nos nós `squad`: filtrar por `isCamadaPermitida(c.senioridade, "Squad")` para os membros do squad
  - Colaboradores com senioridade incompatível com a camada do nó devem ser omitidos silenciosamente (sem erro de runtime)
  - Um colaborador com senioridade `Diretor(a)` deve aparecer tanto no nó BU quanto no nó Torre onde está alocado (Req 3.5)
  - _Requirements: 3.1–3.6_

  - [ ]* 4.1 Escrever testes de propriedade para o filtro do organograma
    - **Property 5: Filtro do organograma respeita regras de senioridade por camada**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**
    - Verificar que para qualquer conjunto de colaboradores e qualquer nó de camada, todos os exibidos satisfazem `isCamadaPermitida(colaborador.senioridade, camada) === true`

  - [ ]* 4.2 Escrever testes unitários para edge cases do organograma
    - Edge case: colaborador com dados inconsistentes não aparece em nó incompatível (Req 3.6)
    - Edge case: `Diretor(a)` alocado em BU e Torre aparece em ambos os nós (Req 3.5)
    - Edge case: colaborador sem camadas ativas não aparece em nenhum nó e não gera erro de runtime
    - _Requirements: 3.5, 3.6_

- [x] 5. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam; perguntar ao usuário se houver dúvidas.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- O módulo `senioridadeCamadas.ts` é puramente funcional — sem dependências de estado externo
- Testes de propriedade usam `fast-check`; instalar se necessário: `npm install --save-dev fast-check`
- Nenhuma migração de banco é necessária — a feature é inteiramente frontend
