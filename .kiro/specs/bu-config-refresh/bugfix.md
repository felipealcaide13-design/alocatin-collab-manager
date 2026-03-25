# Bugfix Requirements Document

## Introduction

Após salvar uma configuração na aba `BUTorreConfigTab` (configuração de Torre ou de BU), a página Business Units não revalida os dados em cache. Como resultado, os formulários de Torre e BU continuam exibindo e usando a configuração anterior até que o usuário recarregue manualmente a página. O impacto é que a próxima ação do usuário (ex.: abrir o formulário de criação/edição de Torre) reflete um estado desatualizado.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o usuário salva a configuração de Torre em `BUTorreConfigTab` (clica em "Salvar Configuração" na aba Torre) THEN o sistema persiste os dados no Supabase mas não invalida as queries relacionadas à configuração de torre, mantendo o cache desatualizado

1.2 WHEN o usuário salva a configuração de BU em `BUTorreConfigTab` (clica em "Salvar Configuração" na aba BU) THEN o sistema persiste os dados no Supabase mas não invalida as queries relacionadas à configuração de BU, mantendo o cache desatualizado

1.3 WHEN o usuário realiza uma ação subsequente na página (ex.: abre formulário de Torre ou BU) após salvar a configuração THEN o sistema exibe os campos e opções baseados na configuração anterior, não na recém-salva

### Expected Behavior (Correct)

2.1 WHEN o usuário salva a configuração de Torre com sucesso THEN o sistema SHALL invalidar as queries de configuração de torre (`configuracao_torre`) para que os dados em cache sejam revalidados imediatamente

2.2 WHEN o usuário salva a configuração de BU com sucesso THEN o sistema SHALL invalidar as queries de configuração de BU (`configuracao_bu`) para que os dados em cache sejam revalidados imediatamente

2.3 WHEN o usuário realiza uma ação subsequente na página após salvar a configuração THEN o sistema SHALL exibir os campos e opções baseados na configuração recém-salva

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o usuário salva a configuração e ocorre um erro THEN o sistema SHALL CONTINUE TO exibir a mensagem de erro via toast sem alterar o estado local

3.2 WHEN o usuário altera campos na interface sem salvar THEN o sistema SHALL CONTINUE TO manter o estado local editado sem disparar revalidação

3.3 WHEN o usuário seleciona uma BU diferente no seletor da aba Torre THEN o sistema SHALL CONTINUE TO carregar a configuração específica daquela BU normalmente

3.4 WHEN o usuário salva a configuração de Torre THEN o sistema SHALL CONTINUE TO não afetar os dados de configuração de BU e vice-versa
