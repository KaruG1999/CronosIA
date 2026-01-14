# CronosAI Ops

> Pay-per-capability AI Agent Infrastructure for Cronos

**El primer agente donde cada acción es un micro-servicio con precio explícito, liquidado vía x402.**

---

## El Problema

Los usuarios de Cronos/Crypto.com pierden dinero por:
- Aprobar contratos maliciosos sin saberlo
- No simular operaciones antes de ejecutar
- Firmar transacciones sin entender el riesgo

Las herramientas existentes (De.Fi, scanners) son:
- Técnicas y confusas
- Todo-o-nada (no modulares)
- Sin modelo económico granular

## La Solución

CronosAI Ops convierte cada análisis de seguridad en un **micro-servicio pagado via x402**:

```
Usuario: "¿Es seguro hacer swap en este DEX?"

CronosAI Ops: "Puedo verificar esto por vos:

  □ Scan del contrato       $0.01
  □ Check de approvals      $0.02
  □ Simular operación       $0.03

  Total: $0.06

  [Ejecutar verificación]"
```

**Sin x402, este producto no existe.**

---

## Quick Start (Testnet)

### 1. Prerequisites

- Node.js >= 18
- A MetaMask wallet for receiving payments
- Testnet tokens:
  - **TCRO** (for gas): [Cronos Faucet](https://cronos.org/faucet)
  - **devUSDCe** (for payments): Request from community or use testnet bridge

### 2. Installation

```bash
git clone <repo>
cd cronosai-ops
npm install
```

### 3. Configuration

```bash
# Copy testnet example config
cp .env.testnet.example .env

# Edit .env with your values:
# - ANTHROPIC_API_KEY: Get from https://console.anthropic.com/
# - RECIPIENT_ADDRESS: Your MetaMask wallet address (receives payments)
```

### 4. Run

```bash
# Start backend
npm run dev

# In another terminal, start frontend
cd web && npm run dev
```

Open http://localhost:5173 - you should see "TESTNET" badge in the header.

### 5. Test the Flow

1. Select a capability (e.g., Contract Scan)
2. Enter a contract address
3. You'll receive a 402 response with payment requirements
4. Pay with devUSDCe (testnet)
5. Receive the analysis result

---

## Mainnet (Production)

> **MAINNET uses REAL funds. Proceed with caution.**

### Enabling Mainnet

Mainnet requires explicit opt-in as a safety measure:

```bash
# Copy mainnet example config
cp .env.mainnet.example .env

# Required settings:
NETWORK_MODE=mainnet
ENABLE_MAINNET=true  # Explicit opt-in required
ANTHROPIC_API_KEY=sk-ant-...
RECIPIENT_ADDRESS=0x...  # Your mainnet wallet
```

### Mainnet Differences

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| Network | cronos-testnet (338) | cronos-mainnet (25) |
| Payment Token | devUSDCe | USDCe |
| RPC | evm-t3.cronos.org | evm.cronos.org |
| Real Funds | No | **Yes** |

---

## Security Notes

### Wallet Security

- **Dedicated Wallet**: Create a NEW wallet specifically for this project
- **No Private Keys**: The server only needs the recipient ADDRESS (public)
- **Separate Concerns**: Never use a wallet with significant funds

### Network Safety

- **Testnet Default**: The app defaults to testnet to prevent accidents
- **Mainnet Opt-In**: Requires `ENABLE_MAINNET=true` to run on mainnet
- **Clear Warnings**: UI shows prominent warnings when on mainnet

### Rate Limiting

- Capability endpoints: 30 requests/minute per IP
- Health/info endpoints: 100 requests/minute per IP
- Payment attempts: 10 requests/minute per IP

---

## Stack

| Layer | Technology |
|-------|------------|
| AI | Claude API (Anthropic) |
| Payments | x402 Protocol via @crypto.com/facilitator-client |
| Blockchain | Cronos EVM + ethers.js |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TailwindCSS |

## Capabilities

| Capability | Price | Description |
|------------|-------|-------------|
| `contract-scan` | $0.01 | Analyze contract for risk signals |
| `wallet-approvals` | $0.02 | List and assess token approvals |
| `tx-simulate` | $0.03 | Simulate swap before execution |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/network` | GET | Current network configuration |
| `/capability` | GET | List available capabilities |
| `/capability/:slug` | POST | Execute capability (402 → pay → result) |

## Project Structure

```
cronosai-ops/
├── src/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── x402.ts         # Payment middleware
│   │   │   ├── rateLimit.ts    # Rate limiting
│   │   │   └── error.ts        # Error handling
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   └── capabilities.ts
│   │   └── index.ts            # Express server
│   ├── core/
│   │   ├── capabilities/       # Capability implementations
│   │   ├── ai/                 # Claude integration
│   │   └── orchestrator.ts     # Execution coordinator
│   ├── services/
│   │   ├── explorer.ts         # Cronos Explorer API
│   │   └── blockchain.ts       # RPC provider
│   └── shared/
│       ├── config.ts           # Configuration (Zod validated)
│       ├── network.ts          # Network constants
│       ├── types.ts
│       └── errors.ts
├── web/                        # React frontend
├── .env.testnet.example
├── .env.mainnet.example
└── package.json
```

## Documentation

| Document | Description |
|----------|-------------|
| [MVP](./docs/MVP.md) | Scope and development stages |
| [Architecture](./docs/ARCHITECTURE.md) | Technical design |
| [Capabilities](./docs/CAPABILITIES.md) | Micro-service definitions |
| [x402 Integration](./docs/X402.md) | Payment implementation |
| [Prompts](./docs/PROMPTS.md) | AI agent prompts |
| [UX Guidelines](./docs/UX.md) | Experience principles |

## Links

- [Cronos x402 Facilitator Docs](https://docs.cronos.org/cronos-x402-facilitator)
- [@crypto.com/facilitator-client](https://www.npmjs.com/package/@crypto.com/facilitator-client)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Cronos Faucet](https://cronos.org/faucet)

## License

MIT
