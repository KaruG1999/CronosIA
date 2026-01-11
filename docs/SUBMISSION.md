# DoraHacks Submission - CronosAI Ops

## Project Info

**Name:** CronosAI Ops

**Tagline:** Pay-per-capability AI Agent Infrastructure for Cronos

**One-liner:** El primer agente donde cada acción de seguridad es un micro-servicio pagado via x402.

---

## Description

### Problema
Los usuarios de Cronos pierden dinero por:
- Aprobar contratos maliciosos sin entender el riesgo
- No verificar antes de interactuar
- Firmar transacciones a ciegas

Las herramientas existentes son técnicas, confusas, y no tienen modelo económico granular.

### Solución
CronosAI Ops convierte cada análisis de seguridad en un **micro-servicio con precio explícito, liquidado via x402**:

- **contract.scan** ($0.01) - Analizar un contrato
- **wallet.approvals** ($0.02) - Ver permisos activos
- **tx.simulate** ($0.03) - Simular antes de ejecutar

El usuario elige qué paga. Cada capability es atómica, transparente, y verificable on-chain.

### Por qué x402 es Core
Sin x402, este modelo no existe. Cada micro-servicio se paga individualmente. No hay suscripción forzada. No hay "premium chat". Cada acción tiene un precio claro y se liquida on-chain.

---

## Tracks

- ✅ **Main Track — x402 Applications (Broad Use Cases)**
- ✅ **Best x402 AI Agentic Finance Solution**
- ✅ **Best Cronos X Crypto.com Ecosystem Integration**

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| AI | Claude API (Anthropic) |
| Payments | x402 Protocol |
| Blockchain | Cronos EVM + ethers.js |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TailwindCSS |

---

## How It Works

```
1. Usuario pregunta: "¿Es seguro este contrato 0x...?"

2. Sistema identifica capability necesaria:
   → contract.scan ($0.01)

3. Usuario ve precio y confirma

4. x402 procesa pago (USDC en Cronos)

5. Capability se ejecuta:
   - Query a Cronos Explorer
   - Análisis de señales de riesgo
   - Formateo con Claude

6. Usuario recibe resultado con:
   - Risk level (low/medium/high)
   - Señales detectadas
   - Warnings y disclaimers
```

---

## Demo Script (3 min)

**[0:00-0:30] Intro**
"CronosAI Ops es el primer AI agent donde cada capability es un micro-servicio pagado via x402."

**[0:30-1:30] Demo: Contract Scan**
- Mostrar input de contrato
- Ver precio antes de pagar ($0.01)
- Pagar via x402
- Ver resultado con señales
- Destacar warnings

**[1:30-2:15] Demo: Wallet Approvals**
- Mostrar wallet con approval riesgoso
- Pagar $0.02
- Ver clasificación de riesgo
- "Este usuario evitó perder fondos por $0.02"

**[2:15-2:45] Arquitectura**
- Mostrar diagrama x402 flow
- "Cada capability es atómica y pagada"
- "Sin x402, esto no existe"

**[2:45-3:00] Cierre**
"CronosAI Ops demuestra x402 como primitiva económica real, no como add-on."

---

## Value Proposition

### Para Cronos/Crypto.com
- Demuestra x402 como primitiva económica real
- Aumenta actividad on-chain (muchas tx pequeñas)
- No compite con productos existentes (Cronos One, De.Fi)
- Showcase de lo que es posible con el stack

### Para Usuarios
- Paga solo lo que usa
- Información clara para decidir
- Reduce riesgo de pérdidas
- Sin suscripciones forzadas

---

## Why This Wins

| Criterio | CronosAI Ops |
|----------|--------------|
| x402 es core | ✅ Sin x402 no hay producto |
| Diferencial | ✅ Único modelo pay-per-capability |
| No compite | ✅ Complementa Cronos One y De.Fi |
| Ejecutable | ✅ MVP de 3 capabilities en 12 días |
| Demo clara | ✅ "Evitó perder $5000 por $0.05" |

---

## Links

- **GitHub:** [URL]
- **Demo Video:** [URL]
- **Live Demo:** [URL]

---

## Team

[Tu info]

---

## Checklist Pre-Submit

- [ ] Código en GitHub público
- [ ] Video de 3 minutos
- [ ] README con instrucciones
- [ ] Demo funcionando
- [ ] Screenshots/GIFs
