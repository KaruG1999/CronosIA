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

## Quick Start

```bash
git clone <repo>
cd cronosai-ops
npm install
cp .env.example .env
# Configurar ANTHROPIC_API_KEY y PRIVATE_KEY
npm run dev
```

## Stack

| Capa | Tecnología |
|------|------------|
| AI | Claude API (Anthropic) |
| Payments | x402 Protocol |
| Blockchain | Cronos EVM + ethers.js |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TailwindCSS |

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [MVP](./docs/MVP.md) | Alcance y etapas de desarrollo |
| [Arquitectura](./docs/ARCHITECTURE.md) | Diseño técnico |
| [Capabilities](./docs/CAPABILITIES.md) | Definición de micro-servicios |
| [x402 Integration](./docs/X402.md) | Implementación de pagos |
| [Prompts](./docs/PROMPTS.md) | System prompts del agente |
| [UX Guidelines](./docs/UX.md) | Principios de experiencia |

## Capabilities MVP

| Capability | Precio | Descripción |
|------------|--------|-------------|
| `contract.scan` | $0.01 | Análisis básico de contrato |
| `wallet.approvals` | $0.02 | Detectar approvals peligrosos |
| `tx.simulate` | $0.03 | Simular operación antes de ejecutar |

## Links

- [Cronos x402 Facilitator](https://docs.cronos.org/cronos-x402-facilitator)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Hackathon DoraHacks](https://dorahacks.io/hackathon/cronos-x402)

## Licencia

MIT
