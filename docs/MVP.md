# MVP - CronosAI Ops

## Principio Guía

> "Hacer menos, pero hacerlo perfecto."

El MVP debe demostrar UNA cosa clara:
**Cada capability es un micro-servicio pagado via x402.**

---

## Alcance Estricto del MVP

### ✅ SÍ incluye (no negociable)
- 3 capabilities funcionando
- x402 cobrando por cada capability
- UI que muestra precio ANTES de ejecutar
- Respuestas claras con warnings apropiados

### ❌ NO incluye (post-hackathon)
- Ejecución real de transacciones
- Wallet connect
- Telegram bot
- Más de 3 capabilities
- Persistencia de datos

---

## Las 3 Capabilities del MVP

### 1. `contract.scan` - $0.01
**Qué hace:** Analiza un contrato y devuelve señales de riesgo.

**Input:** Address del contrato (0x...)

**Output:**
```json
{
  "risk_level": "medium",
  "signals": [
    { "type": "warning", "message": "Contrato no verificado en explorer" },
    { "type": "info", "message": "Creado hace 3 días" }
  ],
  "recommendation": "Proceder con precaución"
}
```

**Fuente de datos:** Cronos Explorer API + heurísticas básicas

**Limitaciones (mostrar al usuario):**
- "Este análisis es orientativo, no garantiza seguridad"
- "Verificar siempre en fuentes oficiales"

---

### 2. `wallet.approvals` - $0.02
**Qué hace:** Lista los token approvals activos de una wallet.

**Input:** Address de wallet (0x...)

**Output:**
```json
{
  "approvals": [
    {
      "token": "USDC",
      "spender": "0xVVS...",
      "spender_name": "VVS Finance",
      "amount": "unlimited",
      "risk": "low"
    },
    {
      "token": "CRO", 
      "spender": "0xUnknown...",
      "spender_name": "Unknown",
      "amount": "unlimited",
      "risk": "high"
    }
  ],
  "high_risk_count": 1,
  "recommendation": "Revocar approval de contrato desconocido"
}
```

**Fuente de datos:** Lectura directa de blockchain (events Transfer/Approval)

**Limitaciones:**
- "La clasificación de riesgo es estimada"
- "Contratos nuevos pueden no estar en nuestra base"

---

### 3. `tx.simulate` - $0.03
**Qué hace:** Simula una operación y muestra qué pasaría.

**Input:** 
```json
{
  "action": "swap",
  "params": {
    "token_in": "CRO",
    "token_out": "USDC", 
    "amount": 100
  }
}
```

**Output:**
```json
{
  "simulation": {
    "input": "100 CRO",
    "output_expected": "9.85 USDC",
    "price_impact": "0.15%",
    "fees": "0.3%",
    "route": ["CRO", "USDC"]
  },
  "warnings": [],
  "safe_to_proceed": true
}
```

**Fuente de datos:** VVS Finance router (getAmountsOut)

**Limitaciones:**
- "Simulación basada en estado actual, puede variar"
- "No incluye gas fees"

---

## Etapas de Desarrollo

### ETAPA 1: Foundation (Día 1-2)
**Objetivo:** Proyecto corriendo con estructura base

**Tareas:**
- [ ] Inicializar proyecto Node.js + TypeScript
- [ ] Estructura de carpetas
- [ ] Express server con `/health`
- [ ] Configurar variables de entorno
- [ ] Cliente Claude funcionando

**Entregable:** `GET /health` responde OK

---

### ETAPA 2: Primera Capability (Día 3-4)
**Objetivo:** `contract.scan` funcionando sin x402

**Tareas:**
- [ ] Crear servicio de scan de contratos
- [ ] Conectar a Cronos Explorer API
- [ ] Implementar heurísticas básicas de riesgo
- [ ] Endpoint `POST /api/capabilities/contract-scan`
- [ ] Integrar con Claude para respuesta conversacional

**Entregable:** Puedo escanear un contrato y recibir análisis

---

### ETAPA 3: x402 Integration (Día 5-6)
**Objetivo:** Pagos funcionando para la primera capability

**Tareas:**
- [ ] Instalar @x402/express
- [ ] Configurar middleware por capability
- [ ] Wallet de recepción configurada
- [ ] Flujo completo: request → 402 → pago → respuesta
- [ ] Logging de transacciones

**Entregable:** `contract.scan` cobra $0.01 via x402

---

### ETAPA 4: Capabilities 2 y 3 (Día 7-8)
**Objetivo:** Las 3 capabilities funcionando con x402

**Tareas:**
- [ ] `wallet.approvals` - lectura de approvals
- [ ] `tx.simulate` - simulación con VVS
- [ ] Cada una con su precio en x402
- [ ] Tests básicos

**Entregable:** 3 capabilities operativas con pricing

---

### ETAPA 5: Frontend (Día 9-10)
**Objetivo:** UI usable para demo

**Tareas:**
- [ ] Setup React + Vite + Tailwind
- [ ] Componente de chat
- [ ] Selector de capabilities con precios
- [ ] Mostrar resultados con formato
- [ ] Warnings y disclaimers visibles

**Entregable:** UI funcional para grabar demo

---

### ETAPA 6: Demo & Submission (Día 11-12)
**Objetivo:** Entregables completos

**Tareas:**
- [ ] Grabar video (3 min)
- [ ] README final
- [ ] Screenshots
- [ ] Deploy (Vercel/Railway)
- [ ] Submit en DoraHacks

**Entregable:** Submission completo

---

## Criterios de Calidad (No Negociables)

### Seguridad
- [ ] NUNCA dar falsa confianza
- [ ] Siempre mostrar limitaciones
- [ ] Disclaimers en cada respuesta
- [ ] No prometer "100% seguro"

### UX
- [ ] Precio visible ANTES de pagar
- [ ] Explicar qué hace cada capability
- [ ] Lenguaje simple, no técnico
- [ ] Resultados accionables

### Técnico
- [ ] Manejo de errores en todas las APIs
- [ ] Timeouts configurados (10s máx)
- [ ] Logging de todo
- [ ] Graceful degradation

---

## Lo Que NO Hacer

| ❌ Evitar | ✅ En cambio |
|-----------|-------------|
| Agregar features "por si acaso" | Pulir las 3 capabilities |
| Prometer seguridad absoluta | Dar información para decidir |
| UI compleja con muchas opciones | UI simple con flujo claro |
| Depender de APIs no testeadas | Usar solo fuentes verificadas |
| Código sin manejo de errores | Try/catch en todo |

---

## Métricas de Éxito del MVP

| Métrica | Target |
|---------|--------|
| Capabilities funcionando | 3/3 |
| x402 cobrando correctamente | 100% |
| Tiempo de respuesta | <5s |
| Errores no manejados | 0 |
| Demo grabado | Sí |
| Jurado entiende en 30s | Sí |

---

## Timeline Visual

```
Día 1-2:   [████] Foundation
Día 3-4:   [████] Primera Capability  
Día 5-6:   [████] x402 Integration
Día 7-8:   [████] Capabilities 2 y 3
Día 9-10:  [████] Frontend
Día 11-12: [████] Demo & Submit
```

**Total: 12 días de trabajo enfocado**
