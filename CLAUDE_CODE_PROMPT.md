# Prompt para Claude Code - CronosAI Ops

## Contexto

**CronosAI Ops** - Hackathon Cronos x402 PayTech.

**Concepto:** AI agent donde cada capability es un micro-servicio pagado via x402.

**Deadline:** 23 Enero 2026

## El Diferenciador

NO es un "AI chat que cobra premium".
ES un marketplace de micro-servicios de seguridad pagados por uso.

```
Usuario: "Es seguro este contrato?"

Sistema: "Puedo analizarlo:
  - Scan de contrato ($0.01)
  - Check de approvals ($0.02)

  [Pagar y ejecutar]"
```

## Estado Actual

El proyecto esta **funcional** con las 3 capabilities implementadas:
- `contract.scan` - $0.01
- `wallet.approvals` - $0.02
- `tx.simulate` - $0.03

Frontend y backend conectados. x402 integrado via Crypto.com Facilitator.

## Documentacion

1. `docs/MVP.md` - Alcance y etapas
2. `docs/ARCHITECTURE.md` - Estructura tecnica
3. `docs/CAPABILITIES.md` - Las 3 capabilities
4. `docs/X402.md` - Integracion de pagos
5. `docs/UX.md` - Principios de diseno
6. `docs/PROMPTS.md` - System prompts

## Stack Implementado

| Capa | Tech |
|------|------|
| AI | Claude API (@anthropic-ai/sdk) |
| Payments | Crypto.com Facilitator (@crypto.com/facilitator-client) |
| Blockchain | ethers.js v6, viem |
| Backend | Express + TypeScript + Zod |
| Frontend | React 19 + Vite + Tailwind + wagmi + react-query |

## Estructura Actual

```
cronosai-ops/
├── src/
│   ├── api/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── capabilities.ts
│   │   └── middleware/
│   │       ├── x402.ts
│   │       ├── error.ts
│   │       └── rateLimit.ts
│   ├── core/
│   │   ├── orchestrator.ts
│   │   ├── capabilities/
│   │   │   ├── index.ts
│   │   │   ├── contract-scan.ts
│   │   │   ├── wallet-approvals.ts
│   │   │   └── tx-simulate.ts
│   │   └── ai/
│   │       └── claude.ts
│   ├── services/
│   │   ├── explorer.ts
│   │   └── blockchain.ts
│   └── shared/
│       ├── config.ts
│       ├── errors.ts
│       └── network.ts
├── web/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── CapabilityCard.tsx
│   │   │   ├── ResultDisplay.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoadingAgent.tsx
│   │   │   ├── EmptyStateGuide.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   └── wallet/
│   │   ├── api/
│   │   │   └── capabilities.ts
│   │   ├── lib/
│   │   └── types/
│   └── package.json
├── scripts/
│   └── validate-credentials.sh
├── .env.mainnet.example
├── .env.testnet.example
├── package.json
└── tsconfig.json
```

## Criterios de Calidad

- TypeScript estricto (no `any`)
- Manejo de errores en todo
- Logging claro
- Codigo simple > codigo elegante

## Lo Que NO Hacer

- NO agregar features extra
- NO usar frameworks pesados
- NO optimizar prematuramente
- NO ignorar los warnings de TypeScript

## Comandos

```bash
# Backend
npm install
npm run dev      # Inicia servidor en :3000
npm run build    # Compila sin errores

# Frontend
cd web
npm install
npm run dev      # Inicia en :5173
npm run build
```

## Redes Soportadas

- Cronos Mainnet (Chain ID: 25)
- Cronos Testnet (Chain ID: 338)

Ver `.env.mainnet.example` y `.env.testnet.example` para configuracion.
