# Redesign visual do Saldo

Data: 2026-08-26
Status: aprovado para implementação (aguardando plano de execução)

## Contexto

O app usa hoje um `ThemeProvider` com tokens de light/dark em
`frontend/src/utils/theme.ts`, mas não existe biblioteca de componentes
compartilhados — cada tela (`app/(tabs)/index.tsx`, `resumo.tsx`,
`perfil.tsx`, `add-expense.tsx`, `fixed-bills.tsx`, `onboarding.tsx`,
telas de `(auth)/`, `plans.tsx`) define seu próprio `StyleSheet` isolado,
puxando só cor/spacing/radii/fontSize da `theme.ts`.

O pedido: modernizar todo o visual do app inspirado em 4 referências de
UI/UX fintech do Behance, mantendo a paleta verde/branco/preto existente
e sem comprometer leveza/fluidez (sem novas libs de gráfico, animação
pesada ou dependências grandes).

## Referências visuais (capturadas via screenshot real, não metadata)

- **Revolut** (dark mode): fundo quase preto, hero card em verde-limão
  vibrante com número grande, ações em pill preto/cinza translúcido,
  ícones em círculo escuro, listas ícone-círculo + label + valor.
- **Ledgerix** (light, dashboard SaaS): fundo branco/cinza claríssimo,
  cards com sombra suave, label pequeno em caixa-alta + número grande em
  negrito, gráfico discreto dentro do card, controle segmentado
  (Semana/Mês/Trimestre/Ano), acento verde usado com moderação.
- **Velto** (identidade + app): saudação "Boa tarde, Nome" + sino de
  notificação, "Saldo atual" com número grande, fileira de ações rápidas
  com ícones circulares, lista de últimas transações.
- **Qimah** (estrutura — paleta roxa, não usada): barra de progresso de
  limite/uso mensal embaixo do saldo, grid de ícones de ação, teclado
  numérico em pill.

## Direção validada (via companion visual, mockups reais)

Testamos 3 direções para a tela Início (Clean & Airy / Bold Hero dark /
Progress-first) e o usuário escolheu uma combinação: **estrutura da
Progress-first (Qimah) sem a barra de limite de gastos**, com o
**indicador de variação percentual da Clean & Airy (Ledgerix)**, valor e
percentual em **linhas separadas**. Confirmado também o mesmo tratamento
para a tela Resumo e para o padrão de formulário (rodapé fixo com CTA).
Nenhuma variação dark-mode dedicada foi mockada — ver "Dark mode" abaixo.

### Tela Início

- Cabeçalho: saudação ("Boa noite, {nome}") + data do dia + sino de
  notificação.
- Card de saldo: label caixa-alta "SALDO DO MÊS" → valor grande em
  negrito (linha própria) → selo de variação percentual vs. ciclo
  anterior (linha própria, abaixo do valor) → texto pequeno com o
  range do ciclo atual.
- Grid de 4 ações rápidas (ícone circular + label): Gasto, Contas,
  Exportar, Pro/Planos.
- Lista "Últimos gastos" com link "Ver tudo": linhas com ícone
  circular por categoria, título + horário/data, valor.

### Tela Resumo

- Cabeçalho: label "RESUMO" + mês/ano + subtítulo com range do ciclo.
- Pill de status do plano (substitui a barra atual).
- Card com as linhas de resumo financeiro atuais (Salário, Contas
  fixas, Gastos atuais, Saldo previsto) com o mesmo estilo de linha.
- Card de gráfico: cabeçalho (título + subtítulo + botão "Exportar" em
  pill) + gráfico de pizza existente (mesmo componente SVG, só
  reestilizado, menor) + legenda com pontos coloridos e percentuais.
- Bloco "Dica do dia" em destaque escuro (`background`/`textPrimary`
  dark tokens) para variar o ritmo visual da tela.

### Tela Perfil

Sem mockup dedicado — aplica o mesmo padrão de card/lista (dados de
conta, seção de plano, ações) usando os componentes da Fase 1. Revisão
manual antes de fechar a Fase 2.

### Fase 2 — resolvido (decisões tomadas durante a implementação)

- **Início tinha mais funcionalidade do que o mockup cobria.** A tela
  real já tinha um grid de 4 métricas (Gastos no mês, Limite por dia,
  Média diária, Projeção mensal) e um box de alerta inteligente
  (`snapshot.alert`, 4 níveis) — nenhum dos dois estava no mockup. Os
  dois foram **mantidos**, reestilizados em cima do `Card` do kit, por
  serem funcionalidades reais e já valiosas, não elementos decorativos.
- **Painel inline de contas fixas removido de Início** — duplicava
  integralmente a tela dedicada `/fixed-bills` (mesmos campos, mesmo
  `addFixedBill`/`deleteFixedBill`). A ação rápida "Contas" agora
  navega pra lá.
- **FAB removido de Início** — a ação rápida "Gasto" cobre a mesma
  função (`router.push("/add-expense")`).
- **Selo de variação percentual compara gastos, não saldo** —
  `percentChange(snapshot.total_spent, totalDoCicloAnterior)`, per a
  nota técnica abaixo. Confirmado revisitando o texto da spec durante o
  planejamento da Fase 2.
- **`ExportModal`**: o brief original da Fase 2 justificou um tamanho
  de ícone (40/20) alegando "igual ao `iconWrap` do `ListRow`" — isso
  está **errado**, o `iconWrap` do `ListRow` é 32/16. A implementação
  seguiu os números literais do brief (40/20), então o `ExportModal`
  fica com círculos de ícone maiores que o `ListRow`, não
  visualmente alinhado como a intenção original dizia. Decisão: manter
  40/20 como um tamanho deliberado e específico do modal (não uma
  cópia do `ListRow`), já que mudar agora seria puramente cosmético e
  de baixo valor — mas registrar aqui pra Fase 3 não repetir a alegação
  errada.

### Padrão de formulário (Adicionar Gasto e similares)

- Corpo rolável com campos (`TextField`, `ChipGroup` para categoria,
  `Toggle` para recorrência).
- Rodapé fixo (`ScreenFooter`): botão primário cheio + link secundário
  abaixo, sempre visível independente do scroll do formulário.

## Kit de componentes (Fase 1)

### Nota sobre tokens de cor (page vs. card) — resolvido na Fase 1

Nos mockups aprovados, o fundo da tela é branco puro e os cards (saldo,
resumo, linhas de formulário) usam um tom levemente esverdeado/acinzentado
para se destacar da página. Resolvido invertendo os dois valores hex do
modo claro em `theme.ts`: `background.light` agora é `#FFFFFF` (fundo de
página) e `surface.light` agora é `#F8FAF9` (fill de card). O modo escuro
não mudou — já tinha a relação certa. Todas as telas existentes herdam o
novo visual automaticamente, sem edição por tela (ver
`docs/superpowers/plans/2026-08-26-visual-redesign-fase1-component-kit.md`,
Task 1). Nenhum token novo foi criado para isso.

**Regra de aninhamento** (adicionada após a revisão final da Fase 1):
`surface` (`#F8FAF9`) e `surfaceAlt` (`#F1F5F4`) ficam ~4% próximos em
luminância no modo claro — um componente com fill `surfaceAlt` dentro de
um `Card` (fill `surface`) quase desaparece. Regra: componentes do kit
com fill `surfaceAlt`/`surface` (ex. o círculo de ícone do `ListRow`, o
track do `ChipGroup`/`SegmentedControl`) devem ficar direto sobre
`background` (a página), não aninhados dentro de outro `Card`. Quando
precisar aninhar, use um fill com mais contraste (ex. `ListRow` aceita
`iconBg?: string`, com default `primarySoft`, para ficar visível dentro
de cards — ver Fase 1, Fix 4 da revisão final).

**Extensão da regra (achado na revisão final da Fase 2):** `TextField`
também usa `colors.surface` como fill — aninhado dentro de um `Card`
(mesmo fill), fica só a borda de 1.5px pra separar visualmente. Hoje
isso é cosmético (a borda ainda funciona), mas é a mesma família de
problema do `SegmentedControl`/`ChipGroup`. A Fase 3 vai aninhar muitos
mais `TextField`s dentro de `Card`s (Adicionar Gasto, Contas Fixas,
Onboarding, telas de auth) — vale decidir antes de multiplicar o
padrão: manter a borda como diferenciador suficiente, ou dar ao
`TextField` um fill com mais contraste que `surface`.

Cards de destaque (ex. o card de gráfico do Resumo) se diferenciam da
página com **borda**, não sombra — ver decisão de sombras abaixo.

### Decisão: bordas em vez de sombra

Diferente do texto original desta spec ("sombra suave", "sombra superior
sutil"), a Fase 1 implementou todos os componentes do kit (`Card`,
`ScreenFooter`, etc.) usando apenas `borderWidth`/`borderColor` para
separação visual — sem `shadowColor`/`elevation`. Decisão deliberada,
confirmada na revisão final: bordas já dão contraste suficiente nos
mockups aprovados, e evitam a complexidade de sombras consistentes entre
iOS/Android/Web. Nenhum token de sombra foi criado em `theme.ts`. Fases
2/3 devem seguir o mesmo padrão (borda, não sombra) a menos que uma
necessidade visual concreta apareça.

Novo diretório `frontend/src/components/ui/`, todos consumindo
`useTheme()` (dark mode reaproveita os tokens existentes — não é uma
tela nova, é o mesmo componente com cores diferentes):

| Componente | Uso |
|---|---|
| `Card` | container base com fundo/borda/radius/sombra padronizados |
| `Button` | variantes `primary` (cheio), `secondary` (contorno), `ghost` (texto) |
| `TextField` | campo de texto com label, prefixo opcional (ex: "R$"), estado de foco |
| `ChipGroup` / `Chip` | seletor de categoria (single-select, estilo pill) |
| `Toggle` | switch on/off |
| `Badge` | selo pequeno (variantes soft/dark/danger) |
| `ListRow` | ícone circular + título + subtítulo opcional + valor |
| `QuickAction` | ícone + label, usado no grid de ações rápidas |
| `SegmentedControl` | alternância tipo pill (ex: períodos) |
| `ScreenFooter` | rodapé fixo com borda superior, insets de área segura (`useSafeAreaInsets`), para telas de formulário |

`theme.ts` ganhou dois tokens novos na Fase 1: `dangerSoft` (fundo suave
pra `Badge` variante "danger") e `onPrimary` (branco fixo pra texto/ícone
sobre `colors.primary`, usado por `Button`, `ChipGroup` e `Toggle`).
Nenhum token de sombra foi criado — ver "Decisão: bordas em vez de
sombra" acima.

## Fases de implementação

**Fase 1 — Kit de componentes (isolado)**
Implementa os componentes acima. Fecha com uma tela de smoke-test
temporária dentro do próprio Expo (renderiza todos os componentes e
variantes) para verificação visual manual — removida antes de ir para
produção ou mantida como storybook simples, a decidir na hora. Nenhuma
tela real é tocada nesta fase.

**Fase 2 — Início, Resumo, Perfil (concluída)**
Reconstrói as 3 telas mais usadas em cima do kit da Fase 1, seguindo o
desenho acima. Inclui o cálculo novo de variação percentual (ver nota
técnica abaixo) e o restyle do `ExportModal` (único componente
compartilhado hoje, usado só pela tela Resumo) para não destoar da
tela ao redor. Ver "Fase 2 — resolvido" acima pras decisões tomadas
durante a implementação (painel de contas fixas removido, FAB
removido, etc.).

**Fase 3 — telas restantes**
Login, Registro, Esqueci senha, Onboarding, Adicionar Gasto, Contas
Fixas, Planos (`plans.tsx`, já reestruturado no trabalho anterior —
só herda o visual, sem mudar a lógica de planos).

Cada fase é implementada, verificada manualmente (`npx expo start
--web` + revisão visual) e commitada separadamente antes de avançar
para a próxima.

## Nota técnica: selo de variação percentual

Hoje `ExpensesProvider` só assina (via `ExpenseRepository.subscribeMonth`)
os gastos do **ciclo atual** — não existe, em lugar nenhum, o total
gasto do ciclo anterior. O documento `usage/{cycleKey}` (escrito pelas
Cloud Functions) guarda só `expenseCount`, não valor total.

Para o selo "+12% vs {ciclo anterior}" funcionar, a Fase 2 inclui uma
busca pontual (não uma subscription ao vivo — dado histórico não muda)
dos gastos do ciclo anterior, somando o valor para comparar com
`snapshot.total_spent` do ciclo atual. Se não houver gastos no ciclo
anterior (conta nova, por exemplo), o selo não é exibido.

## Dark mode

Não foi mockado separadamente — todos os componentes do kit usam
`colors` de `useTheme()`, então dark mode herda automaticamente a
mesma estrutura com os tokens escuros já definidos em `theme.ts`
(`background`, `surface`, `surfaceAlt`, `textPrimary`, etc.). Revisão
manual em ambos os modos faz parte da verificação de cada fase.

## Testes e verificação

Não há testing-library de componentes no projeto (só `node:test` para
funções puras, usado no trabalho de planos). Para este redesign:

- `npx tsc --noEmit` limpo a cada fase.
- `eslint` limpo a cada fase (`./node_modules/.bin/eslint <arquivos> --max-warnings=0`)
  — **adicionado depois da Fase 2**: a Fase 1 e o plano original da
  Fase 2 só rodavam `tsc`/`npm test` por task, e um erro real de lint
  (`react/no-unescaped-entities`) só foi pego na revisão final, não em
  nenhuma task individual. Fase 3 deve rodar lint a cada task, não só
  no fim.
- Verificação visual manual via `npx expo start --web`, telas em light
  e dark mode. Telas atrás do `Gate` de autenticação (tudo exceto
  `/dev-ui-kit`) exigem login real ou um bypass temporário
  não-commitado do `Gate`, revertido logo depois — ver Fase 2, Task 8.
- Se uma fase introduzir lógica pura nova, essa função ganha teste
  unitário via `node:test`, seguindo o padrão já usado em
  `MonetizationService.test.ts`.

## Fora de escopo

- Mudar a estrutura de navegação (continuam 3 tabs: Início, Resumo,
  Perfil).
- Trocar a biblioteca de ícones (`@expo/vector-icons`) ou adicionar
  lib de gráfico nova.
- Qualquer mudança na lógica de planos/monetização (já entregue
  separadamente).
- Testes automatizados de UI/snapshot (fora do padrão atual do
  projeto).
