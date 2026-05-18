# Saldo — PRD (MVP)

## Visão
Aplicativo mobile de organização financeira pessoal focado em simplicidade
extrema. Inspirado em Nubank + Notion. O usuário deve entender sua situação
financeira em menos de 10 segundos e registrar um gasto em menos de 5.

## Stack
- **Mobile**: React Native + Expo (Expo Router, SDK 54)
- **Auth**: Firebase Authentication (Email/Password) — projeto `app-financas-d5b1f`
- **Banco**: Cloud Firestore (coleções `users/{uid}` e `users/{uid}/expenses/{id}`)
- **Persistência de sessão**: `getReactNativePersistence(AsyncStorage)`
- **Tema**: verde minimalista (Sage/Emerald), suporta light/dark/system

## Funcionalidades (MVP)
1. **Auth**: cadastro e login por email/senha; sessão persistente via AsyncStorage.
2. **Onboarding**: definir renda mensal e contas fixas; salva no Firestore.
3. **Home Dashboard**:
   - HERO: saldo restante do mês
   - Alerta inteligente (success/warning/danger) com mensagens humanas
   - Cards: Gastos no mês, Limite por dia, Média diária, Projeção mensal
   - Lista das 5 gastos recentes
   - FAB "+" para adicionar gasto rapidamente
4. **Add Expense (modal)**: valor grande, descrição opcional, chips de categoria,
   **auto-sugestão** de categoria por palavras-chave (debounce 250ms).
5. **Resumo**: tabela elegante (Salário, Contas fixas, Gastos atuais,
   Média diária, Projeção mensal, Saldo previsto).
6. **Perfil**: editar renda e contas fixas, alternar tema, logout com confirmação
   in-app.

## Fórmulas
- `media_diaria = total_gasto / dias_passados`
- `projecao_mensal = media_diaria * dias_do_mes`
- `saldo_restante = salario - contas_fixas - total_gasto`
- `limite_diario = max(0, saldo_restante / dias_restantes)`
- `ideal_diario = (salario - contas_fixas) / dias_do_mes`

## Arquitetura em camadas
```
/app/frontend/
├── app/                     # Rotas (Expo Router file-based)
│   ├── _layout.tsx          # Auth Gate + Providers
│   ├── (auth)/login.tsx
│   ├── (auth)/register.tsx
│   ├── onboarding.tsx
│   ├── (tabs)/index.tsx     # Home
│   ├── (tabs)/resumo.tsx
│   ├── (tabs)/perfil.tsx
│   └── add-expense.tsx      # Modal
└── src/
    ├── config/firebase.config.ts
    ├── models/              # User, Expense, Category
    ├── services/            # AuthService (Firebase Auth wrapper)
    ├── repositories/        # UserRepository, ExpenseRepository (Firestore)
    ├── providers/           # AuthProvider, ThemeProvider, ExpensesProvider
    └── utils/               # finance (cálculos), format, validation, theme
```

## Firestore Security Rules
Ver `/app/firestore.rules`: cada usuário só lê/escreve seus próprios documentos
em `users/{uid}` e `users/{uid}/expenses/{id}`.

## Preparado para futuro (não implementado)
- IA financeira (sugestões inteligentes)
- Entrada por voz (Expo Speech)
- Leitura de comprovantes (Camera + OCR)
- Notificações inteligentes (Expo Notifications)
- Metas financeiras e contas fixas recorrentes
