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

### Padrão de formulário (Adicionar Gasto e similares)

- Corpo rolável com campos (`TextField`, `ChipGroup` para categoria,
  `Toggle` para recorrência).
- Rodapé fixo (`ScreenFooter`): botão primário cheio + link secundário
  abaixo, sempre visível independente do scroll do formulário.

## Kit de componentes (Fase 1)

### Nota sobre tokens de cor (page vs. card)

Nos mockups aprovados, o fundo da tela é branco puro e os cards (saldo,
resumo, linhas de formulário) usam um tom levemente esverdeado/acinzentado
para se destacar da página — o inverso da relação atual em `theme.ts`,
onde `background` (`#F8FAF9`, o tom sutil) é o fundo da `SafeAreaView` e
`surface` (`#FFFFFF`) é reservado pra cards. A Fase 1 precisa decidir
entre (a) inverter o uso dos tokens existentes nas telas, ou (b)
introduzir um novo token (ex.: `surfaceMuted`) para o fill do card sem
mexer no significado de `background`/`surface` em outros lugares que já
os consomem. Sem novos valores de cor a criar — só a atribuição de qual
token vai em qual camada. Cards de destaque com fundo branco (ex. o
card de gráfico do Resumo) se diferenciam da página com borda +
sombra sutil, já que ambos ficam brancos.

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
| `ScreenFooter` | rodapé fixo com sombra superior sutil, para telas de formulário |

Possível adição de 1-2 tokens em `theme.ts` (ex: um valor de sombra
padrão para `Card`), sem quebrar os tokens existentes.

## Fases de implementação

**Fase 1 — Kit de componentes (isolado)**
Implementa os componentes acima. Fecha com uma tela de smoke-test
temporária dentro do próprio Expo (renderiza todos os componentes e
variantes) para verificação visual manual — removida antes de ir para
produção ou mantida como storybook simples, a decidir na hora. Nenhuma
tela real é tocada nesta fase.

**Fase 2 — Início, Resumo, Perfil**
Reconstrói as 3 telas mais usadas em cima do kit da Fase 1, seguindo o
desenho acima. Inclui o cálculo novo de variação percentual (ver nota
técnica abaixo) e o restyle do `ExportModal` (único componente
compartilhado hoje, usado só pela tela Resumo) para não destoar da
tela ao redor.

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
- Verificação visual manual via `npx expo start --web`, telas em light
  e dark mode.
- Se a Fase 2 introduzir lógica pura nova (cálculo de variação
  percentual), essa função ganha teste unitário via `node:test`,
  seguindo o padrão já usado em `MonetizationService.test.ts`.

## Fora de escopo

- Mudar a estrutura de navegação (continuam 3 tabs: Início, Resumo,
  Perfil).
- Trocar a biblioteca de ícones (`@expo/vector-icons`) ou adicionar
  lib de gráfico nova.
- Qualquer mudança na lógica de planos/monetização (já entregue
  separadamente).
- Testes automatizados de UI/snapshot (fora do padrão atual do
  projeto).
