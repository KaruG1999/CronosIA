# Architecture - CronosAI

## Design Principle

> Simple > Complex. Functional > Elegant.

---

## General Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│                                                             │
│  "Is this contract safe?"                                  │
│  "Show me my approvals"                                    │
│  "Simulate this swap"                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│                   (React + Vite)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chat Interface                                      │   │
│  │  + Capability Selector (with prices)                │   │
│  │  + Results Display (with warnings)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       API                                    │
│                   (Express.js)                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ /health  │  │  /chat   │  │/capability│                │
│  └──────────┘  └────┬─────┘  └─────┬─────┘                │
│                     │              │                        │
│              ┌──────┴──────────────┴──────┐                │
│              │      x402 MIDDLEWARE       │                │
│              │   (charges BEFORE exec)    │                │
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
│  │  1. Receive request                                 │   │
│  │  2. Determine required capability                   │   │
│  │  3. Execute capability                              │   │
│  │  4. Format response with Claude                     │   │
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

## Folder Structure

```
cronosai-ops/
├── src/
│   ├── api/
│   │   ├── index.ts              # Express entry point
│   │   ├── routes/
│   │   │   ├── health.ts         # GET /health
│   │   │   ├── chat.ts           # POST /chat
│   │   │   └── capabilities.ts   # POST /capability/:name
│   │   └── middleware/
│   │       ├── x402.ts           # Payment middleware
│   │       └── error.ts          # Error handler
│   │
│   ├── core/
│   │   ├── orchestrator.ts       # Main orchestrator
│   │   ├── capabilities/
│   │   │   ├── index.ts          # Registry
│   │   │   ├── contract-scan.ts  # $0.01
│   │   │   ├── wallet-approvals.ts # $0.02
│   │   │   └── tx-simulate.ts    # $0.03
│   │   └── ai/
│   │       ├── claude.ts         # Claude client
│   │       └── prompts.ts        # System prompts
│   │
│   ├── services/
│   │   ├── explorer.ts           # Cronos Explorer API
│   │   ├── blockchain.ts         # RPC calls
│   │   └── vvs.ts                # VVS Finance
│   │
│   └── shared/
│       ├── types.ts              # TypeScript types
│       ├── config.ts             # Configuration
│       └── errors.ts             # Custom errors
│
├── web/                          # Frontend React (separate)
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

## Request Flow

### Normal Request (with x402 payment)

```
1. User sends request
   POST /capability/contract-scan
   { "address": "0x..." }

2. x402 Middleware intercepts
   - Checks for payment
   - No payment → returns 402 with instructions

3. User pays via x402
   - Wallet signs transaction
   - x402 Facilitator processes

4. User resends with payment proof
   POST /capability/contract-scan
   Headers: { "X-Payment": "..." }

5. x402 Middleware verifies payment
   - Valid payment → continues
   - Invalid payment → 402

6. Capability executes
   - contractScan.execute({ address })
   - Calls Cronos Explorer
   - Analyzes data
   - Generates result

7. Claude formats response
   - Converts technical data to human language
   - Adds appropriate warnings

8. Response to user
   {
     "success": true,
     "capability": "contract.scan",
     "cost": "$0.01",
     "result": { ... },
     "warnings": [ ... ]
   }
```

---

## Capability Definition

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

## x402 Configuration

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

## Claude Integration

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
          User asked: "${userQuery}"
          Capability executed: ${capability}
          Result: ${JSON.stringify(result)}
          
          Format the response clearly and in a user-friendly way.
          Include warnings prominently.
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

## Error Handling

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

// Predefined errors
export const Errors = {
  INVALID_ADDRESS: new CapabilityError(
    'Invalid address format',
    'INVALID_ADDRESS',
    'The entered address is not valid. Verify it is a Cronos address (0x...)',
    true
  ),
  
  EXPLORER_TIMEOUT: new CapabilityError(
    'Explorer API timeout',
    'EXPLORER_TIMEOUT',
    'The service is taking longer than expected. Try again in a few seconds.',
    true
  ),
  
  CONTRACT_NOT_FOUND: new CapabilityError(
    'Contract not found',
    'CONTRACT_NOT_FOUND',
    'I couldn\'t find this contract on Cronos. Verify the address.',
    true
  ),
};
```

---

## Environment Variables

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

# Service wallet (for queries, not for receiving payments)
PRIVATE_KEY=0x...

# App
PORT=3000
NODE_ENV=development
```

---

## Implemented Dependencies

### Backend
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@crypto.com/facilitator-client": "^1.0.4",
    "express": "^4.21.0",
    "ethers": "^6.16.0",
    "zod": "^3.23.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "tsx": "^4.19.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@tanstack/react-query": "^5.90.16",
    "wagmi": "^2.19.5",
    "viem": "^2.44.2"
  },
  "devDependencies": {
    "vite": "^7.2.4",
    "tailwindcss": "^3.4.19",
    "typescript": "~5.9.3"
  }
}
```

---

## Design Decisions

### Why NOT use the complete AI Agent SDK?

| Reason | Explanation |
|--------|-------------|
| Complexity | The SDK does many things, we do ONE |
| Control | We need full control over x402 pricing |
| Clarity | Simpler code = fewer bugs |
| Time | 12 days is not enough to master the SDK |

### Why Claude and not OpenAI?

| Reason | Explanation |
|--------|-------------|
| Consistency | We designed with Claude, we execute with Claude |
| Tool use | Better native support |
| Context | 200K tokens if needed |

### Why monolith and not microservices?

| Reason | Explanation |
|--------|-------------|
| Simplicity | One deploy, one process |
| Time | 12 days |
| MVP | We don't need to scale yet |
