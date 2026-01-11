# Arquitectura - CronosAI Ops

## Principio de Diseño

> Simple > Complejo. Funcional > Elegante.

---

## Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
│                                                             │
│  "¿Es seguro este contrato?"                               │
│  "Mostrame mis approvals"                                  │
│  "Simulá este swap"                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│                   (React + Vite)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chat Interface                                      │   │
│  │  + Capability Selector (con precios)                │   │
│  │  + Results Display (con warnings)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       API                                    │
│                   (Express.js)                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ /health  │  │  /chat   │  │/capability│                 │
│  └──────────┘  └────┬─────┘  └─────┬─────┘                 │
│                     │              │                        │
│              ┌──────┴──────────────┴──────┐                │
│              │      x402 MIDDLEWARE       │                │
│              │   (cobra ANTES de ejecutar) │                │
│              └──────────────┬─────────────┘                │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       CORE                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   ORCHESTRATOR                       │   │
│  │                                                      │   │
│  │  1. Recibe request                                  │   │
│  │  2. Determina capability necesaria                  │   │
│  │  3. Ejecuta capability                              │   │
│  │  4. Formatea respuesta con Claude                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ contract   │  │  wallet    │  │    tx      │           │
│  │   .scan    │  │ .approvals │  │ .simulate  │           │
│  │   $0.01    │  │   $0.02    │  │   $0.03    │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │               │               │                   │
└────────┼───────────────┼───────────────┼───────────────────┘
         │               │               │
         ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Cronos    │  │  Cronos    │  │    VVS     │           │
│  │  Explorer  │  │   RPC      │  │   Router   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
│  ┌────────────┐  ┌────────────┐                           │
│  │   Claude   │  │    x402    │                           │
│  │    API     │  │ Facilitator│                           │
│  └────────────┘  └────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
cronosai-ops/
├── src/
│   ├── api/
│   │   ├── index.ts              # Entry point Express
│   │   ├── routes/
│   │   │   ├── health.ts         # GET /health
│   │   │   ├── chat.ts           # POST /chat
│   │   │   └── capabilities.ts   # POST /capability/:name
│   │   └── middleware/
│   │       ├── x402.ts           # Payment middleware
│   │       └── error.ts          # Error handler
│   │
│   ├── core/
│   │   ├── orchestrator.ts       # Orquestador principal
│   │   ├── capabilities/
│   │   │   ├── index.ts          # Registry
│   │   │   ├── contract-scan.ts  # $0.01
│   │   │   ├── wallet-approvals.ts # $0.02
│   │   │   └── tx-simulate.ts    # $0.03
│   │   └── ai/
│   │       ├── claude.ts         # Cliente Claude
│   │       └── prompts.ts        # System prompts
│   │
│   ├── services/
│   │   ├── explorer.ts           # Cronos Explorer API
│   │   ├── blockchain.ts         # RPC calls
│   │   └── vvs.ts                # VVS Finance
│   │
│   └── shared/
│       ├── types.ts              # TypeScript types
│       ├── config.ts             # Configuración
│       └── errors.ts             # Custom errors
│
├── web/                          # Frontend React (separado)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── CapabilitySelector.tsx
│   │   │   └── ResultDisplay.tsx
│   │   └── hooks/
│   │       └── useCapability.ts
│   └── package.json
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Flujo de Request

### Request Normal (con pago x402)

```
1. Usuario envía request
   POST /capability/contract-scan
   { "address": "0x..." }

2. x402 Middleware intercepta
   - Verifica si hay pago
   - NO hay pago → devuelve 402 con instrucciones

3. Usuario paga via x402
   - Wallet firma transacción
   - x402 Facilitator procesa

4. Usuario re-envía con proof de pago
   POST /capability/contract-scan
   Headers: { "X-Payment": "..." }

5. x402 Middleware verifica pago
   - Pago válido → continúa
   - Pago inválido → 402

6. Capability se ejecuta
   - contractScan.execute({ address })
   - Llama a Cronos Explorer
   - Analiza datos
   - Genera resultado

7. Claude formatea respuesta
   - Convierte datos técnicos a lenguaje humano
   - Agrega warnings apropiados

8. Response al usuario
   {
     "success": true,
     "capability": "contract.scan",
     "cost": "$0.01",
     "result": { ... },
     "warnings": [ ... ]
   }
```

---

## Definición de Capability

```typescript
// src/core/capabilities/index.ts

interface Capability {
  name: string;
  price: string;           // "$0.01"
  priceUSDC: number;       // 0.01
  description: string;
  inputSchema: ZodSchema;
  execute: (input: any) => Promise<CapabilityResult>;
}

interface CapabilityResult {
  success: boolean;
  data: any;
  warnings: Warning[];
  limitations: string[];
}

interface Warning {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

// Registry
const capabilities: Map<string, Capability> = new Map([
  ['contract.scan', contractScanCapability],
  ['wallet.approvals', walletApprovalsCapability],
  ['tx.simulate', txSimulateCapability],
]);
```

---

## Configuración x402

```typescript
// src/api/middleware/x402.ts

import { paymentMiddleware } from '@x402/express';

const CAPABILITY_PRICES = {
  'contract.scan': {
    price: '$0.01',
    network: 'cronos',
    token: 'USDC',
    recipient: process.env.RECIPIENT_ADDRESS,
  },
  'wallet.approvals': {
    price: '$0.02',
    network: 'cronos',
    token: 'USDC',
    recipient: process.env.RECIPIENT_ADDRESS,
  },
  'tx.simulate': {
    price: '$0.03',
    network: 'cronos',
    token: 'USDC',
    recipient: process.env.RECIPIENT_ADDRESS,
  },
};

export const x402Config = Object.fromEntries(
  Object.entries(CAPABILITY_PRICES).map(([name, config]) => [
    `POST /capability/${name.replace('.', '-')}`,
    config,
  ])
);
```

---

## Integración Claude

```typescript
// src/core/ai/claude.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function formatCapabilityResult(
  capability: string,
  result: CapabilityResult,
  userQuery: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: CAPABILITY_RESPONSE_PROMPT,
    messages: [
      {
        role: 'user',
        content: `
          Usuario preguntó: "${userQuery}"
          Capability ejecutada: ${capability}
          Resultado: ${JSON.stringify(result)}
          
          Formateá la respuesta de forma clara y amigable.
          Incluí los warnings de forma prominente.
        `,
      },
    ],
  });

  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
}
```

---

## Manejo de Errores

```typescript
// src/shared/errors.ts

export class CapabilityError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

// Errores predefinidos
export const Errors = {
  INVALID_ADDRESS: new CapabilityError(
    'Invalid address format',
    'INVALID_ADDRESS',
    'La dirección ingresada no es válida. Verificá que sea una dirección de Cronos (0x...)',
    true
  ),
  
  EXPLORER_TIMEOUT: new CapabilityError(
    'Explorer API timeout',
    'EXPLORER_TIMEOUT',
    'El servicio está tardando más de lo normal. Intentá de nuevo en unos segundos.',
    true
  ),
  
  CONTRACT_NOT_FOUND: new CapabilityError(
    'Contract not found',
    'CONTRACT_NOT_FOUND',
    'No encontré este contrato en Cronos. Verificá la dirección.',
    true
  ),
};
```

---

## Variables de Entorno

```env
# .env.example

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Cronos
CRONOS_RPC_URL=https://evm.cronos.org
CRONOS_EXPLORER_API=https://api.cronoscan.com/api
CHAIN_ID=25

# x402
X402_FACILITATOR_URL=https://x402-facilitator.cronos.org
RECIPIENT_ADDRESS=0x...

# Wallet del servicio (para queries, no para recibir pagos)
PRIVATE_KEY=0x...

# App
PORT=3000
NODE_ENV=development
```

---

## Dependencias Mínimas

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@x402/express": "latest",
    "express": "^4.18.0",
    "ethers": "^6.0.0",
    "zod": "^3.23.0",
    "cors": "^2.8.0",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

---

## Decisiones de Diseño

### ¿Por qué NO usar el AI Agent SDK completo?

| Razón | Explicación |
|-------|-------------|
| Complejidad | El SDK hace muchas cosas, nosotros hacemos UNA |
| Control | Necesitamos control total sobre x402 pricing |
| Claridad | Código más simple = menos bugs |
| Tiempo | 12 días no alcanza para dominar el SDK |

### ¿Por qué Claude y no OpenAI?

| Razón | Explicación |
|-------|-------------|
| Consistencia | Diseñamos con Claude, ejecutamos con Claude |
| Tool use | Mejor soporte nativo |
| Contexto | 200K tokens si necesitamos |

### ¿Por qué monolito y no microservicios?

| Razón | Explicación |
|-------|-------------|
| Simplicidad | Un deploy, un proceso |
| Tiempo | 12 días |
| MVP | No necesitamos escalar todavía |
