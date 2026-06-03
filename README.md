# Saldo

Aplicativo mobile de organização financeira pessoal com Expo/React Native, Firebase Auth, Cloud Firestore e Firebase Functions.

## Stack principal

- Frontend: Expo SDK 54, React Native, Expo Router
- Auth: Firebase Authentication
- Banco: Cloud Firestore
- Backend operacional: Firebase Functions v2
- Node recomendado: `20.19.4` ou superior compatível com Expo/React Native atual

O diretório `backend/` contém uma API FastAPI/MongoDB legada/paralela. O app atual não consome essa API; para lançamento, trate Firebase como backend de produção ou remova/documente o backend legado antes do deploy final.

## Setup local

```bash
nvm use
cd frontend && npm install
cd ../functions && npm install
```

## Verificações

```bash
cd functions && npm run build
cd ../frontend && npm run lint
npx tsc --noEmit
```

## Segurança e monetização

- Gastos são criados e removidos por Cloud Functions (`addExpense`, `deleteExpense`). O cliente não tem permissão para criar, editar ou apagar `users/{uid}/expenses/{id}` diretamente.
- Plano Básico: até 30 gastos por mês e até 5 exportações por mês.
- Plano Standard/Pro ativo: gastos e exportações ilimitados enquanto a assinatura não estiver expirada.
- Uso mensal fica em `users/{uid}/usage/{YYYY-MM}` e só pode ser escrito pelo Admin SDK.
- Histórico de exportações fica em `users/{uid}/exports/{id}` e só pode ser escrito pelo Admin SDK.
- `paymentIntents` é bloqueado para cliente; assinatura só deve ser ativada via webhook autenticado.

## Variáveis das Firebase Functions

Configure antes de publicar pagamentos reais. O código atual lê variáveis de ambiente em `process.env`; use `.env` localmente e o mecanismo de env/secrets do Firebase no deploy.

Variáveis esperadas:

- `STANDARD_CHECKOUT_URL`: URL do checkout do Plano Standard. Sem ela, a função cria intenção de pagamento com status `configuration_required`.
- `PAYMENT_WEBHOOK_SECRET`: segredo HMAC SHA-256 exigido no header `x-saldo-signature` do webhook `paymentWebhook`.

Payload esperado no webhook assinado:

```json
{
  "paymentId": "id gerado em initSubscriptionPayment",
  "status": "paid",
  "externalId": "id do provedor"
}
```

`status` aceita `paid`, `canceled` ou `failed`. Apenas `paid` ativa a assinatura no documento do usuário.

## Deploy Firebase

```bash
cd functions && npm run build
cd ..
firebase deploy --only firestore:rules,functions
```

## Pendências para lançamento

- Escolher e integrar o provedor real de pagamento (Mercado Pago, Stripe, RevenueCat, Apple/Google IAP). A base segura de intenção/webhook já está preparada, mas ainda precisa criar checkout real no provedor.
- Rodar testes E2E depois do deploy das Functions, especialmente: limite de 30 gastos, deleção descontando uso, limite de 5 exportações e ativação de assinatura via webhook.
- Resolver vulnerabilidades moderadas transitivas reportadas por `npm audit` quando houver versão compatível do Expo/Firebase sem breaking change.
- Remover ou isolar o backend FastAPI/MongoDB se ele não fizer parte do produto lançado.
