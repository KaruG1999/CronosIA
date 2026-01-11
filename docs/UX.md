# UX Guidelines - CronosAI Ops

## Principio Fundamental

> Dar información para DECIDIR, no decidir por el usuario.

El usuario es responsable de sus acciones.
Nosotros somos responsables de darle información clara.

---

## Los 5 Mandamientos de UX

### 1. NUNCA dar falsa confianza

❌ **Malo:**
> "Este contrato es seguro ✅"

✅ **Bueno:**
> "No detectamos señales de riesgo conocidas en este contrato. 
> Esto no garantiza que sea 100% seguro."

---

### 2. Precio SIEMPRE visible ANTES de pagar

❌ **Malo:**
- Ejecutar y después mostrar costo
- Precio en letra chica

✅ **Bueno:**
```
┌─────────────────────────────────────────┐
│  Scan de Contrato                       │
│                                         │
│  Costo: $0.01 USDC                     │
│                                         │
│  [Cancelar]  [Pagar y Ejecutar]        │
└─────────────────────────────────────────┘
```

---

### 3. Warnings prominentes, no escondidos

❌ **Malo:**
> Resultado del análisis: bajo riesgo
> ^(ver limitaciones en términos y condiciones)

✅ **Bueno:**
```
┌─────────────────────────────────────────┐
│ ⚠️ IMPORTANTE                           │
│                                         │
│ Este análisis:                          │
│ • Es orientativo, no definitivo         │
│ • No garantiza seguridad al 100%        │
│ • Se basa en datos públicos             │
│                                         │
│ Siempre verificá en fuentes oficiales.  │
└─────────────────────────────────────────┘

Resultado: Riesgo bajo detectado
```

---

### 4. Lenguaje humano, no técnico

❌ **Malo:**
> "El contrato tiene allowance infinito en el mapping _allowances para el spender 0x..."

✅ **Bueno:**
> "Este contrato tiene permiso para mover todos tus USDC sin límite. 
> Esto es común en DEXs, pero verificá que sea un contrato conocido."

---

### 5. Acciones claras, no ambiguas

❌ **Malo:**
> [OK] [Cancelar] [Más info] [Volver]

✅ **Bueno:**
> [Pagar $0.01 y analizar] [Cancelar]

---

## Componentes de UI

### Chat Message (Usuario)
```
┌─────────────────────────────────────────┐
│                          ┌────────────┐ │
│                          │ ¿Es seguro │ │
│                          │ este       │ │
│                          │ contrato?  │ │
│                          │ 0x123...   │ │
│                          └────────────┘ │
└─────────────────────────────────────────┘
```

### Chat Message (Sistema) - Pre-pago
```
┌─────────────────────────────────────────┐
│ ┌────────────────────────────────────┐  │
│ │ 🔍 Scan de Contrato               │  │
│ │                                    │  │
│ │ Voy a analizar el contrato        │  │
│ │ 0x123...abc                       │  │
│ │                                    │  │
│ │ ┌──────────────────────────────┐  │  │
│ │ │ Costo: $0.01 USDC           │  │  │
│ │ │                              │  │  │
│ │ │ Incluye:                     │  │  │
│ │ │ • Verificación en explorer   │  │  │
│ │ │ • Análisis de antigüedad     │  │  │
│ │ │ • Detección de señales       │  │  │
│ │ └──────────────────────────────┘  │  │
│ │                                    │  │
│ │ [Cancelar]  [Pagar y analizar]    │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Chat Message (Sistema) - Resultado
```
┌─────────────────────────────────────────┐
│ ┌────────────────────────────────────┐  │
│ │ ✅ Análisis completado            │  │
│ │                                    │  │
│ │ Contrato: 0x123...abc             │  │
│ │ Costo: $0.01 USDC (pagado)        │  │
│ │                                    │  │
│ │ ════════════════════════════════  │  │
│ │                                    │  │
│ │ 🟢 Riesgo: BAJO                   │  │
│ │                                    │  │
│ │ Señales detectadas:               │  │
│ │ ✓ Contrato verificado             │  │
│ │ ✓ Activo hace 547 días            │  │
│ │ ✓ +1M transacciones               │  │
│ │                                    │  │
│ │ ════════════════════════════════  │  │
│ │                                    │  │
│ │ ⚠️ Recordá:                       │  │
│ │ Este análisis es orientativo.     │  │
│ │ No garantiza seguridad al 100%.   │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Resultado con Riesgo Alto
```
┌─────────────────────────────────────────┐
│ ┌────────────────────────────────────┐  │
│ │ ⚠️ Análisis completado            │  │
│ │                                    │  │
│ │ ════════════════════════════════  │  │
│ │                                    │  │
│ │ 🔴 Riesgo: ALTO                   │  │
│ │                                    │  │
│ │ ┌──────────────────────────────┐  │  │
│ │ │ ⛔ ATENCIÓN                  │  │  │
│ │ │                              │  │  │
│ │ │ Detectamos señales de        │  │  │
│ │ │ riesgo significativas:       │  │  │
│ │ │                              │  │  │
│ │ │ • Contrato NO verificado    │  │  │
│ │ │ • Creado hace 2 días        │  │  │
│ │ │ • Solo 5 transacciones      │  │  │
│ │ │                              │  │  │
│ │ │ Recomendación: NO interactuar│  │  │
│ │ │ hasta verificar legitimidad  │  │  │
│ │ └──────────────────────────────┘  │  │
│ │                                    │  │
│ │ ⚠️ Recordá:                       │  │
│ │ Este análisis es orientativo.     │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Colores y Significados

| Color | Uso | Ejemplo |
|-------|-----|---------|
| 🟢 Verde | Riesgo bajo | "No detectamos señales de riesgo" |
| 🟡 Amarillo | Riesgo medio / Advertencia | "Proceder con precaución" |
| 🔴 Rojo | Riesgo alto / Peligro | "Detectamos señales de riesgo" |
| ⚪ Gris | Información neutral | "Contrato creado hace 30 días" |

---

## Textos Predefinidos

### Disclaimers (usar siempre)

```typescript
const DISCLAIMERS = {
  general: 'Este análisis es orientativo y no garantiza seguridad al 100%. Siempre verificá en fuentes oficiales.',
  
  contract_scan: 'El análisis se basa en datos públicos y heurísticas. Contratos nuevos pueden no tener suficiente historial.',
  
  wallet_approvals: 'La clasificación de riesgo es estimada. No todos los contratos están en nuestra base de datos.',
  
  tx_simulate: 'La simulación muestra el estado actual. El resultado real puede variar si las condiciones cambian.',
};
```

### Mensajes de Error

```typescript
const ERROR_MESSAGES = {
  invalid_address: 'La dirección ingresada no es válida. Verificá que sea una dirección de Cronos (0x seguido de 40 caracteres).',
  
  contract_not_found: 'No encontré este contrato en Cronos. Verificá la dirección e intentá de nuevo.',
  
  timeout: 'La solicitud está tardando más de lo normal. Intentá de nuevo en unos segundos.',
  
  payment_failed: 'No pudimos verificar el pago. Verificá tu wallet e intentá de nuevo.',
  
  unknown: 'Ocurrió un error inesperado. Intentá de nuevo. Si persiste, contactanos.',
};
```

### Mensajes de Éxito

```typescript
const SUCCESS_MESSAGES = {
  payment_confirmed: 'Pago confirmado. Procesando tu solicitud...',
  
  analysis_complete: 'Análisis completado.',
  
  low_risk: 'No detectamos señales de riesgo conocidas.',
  
  high_risk: 'Detectamos señales de riesgo. Revisá los detalles.',
};
```

---

## Flujo de Interacción

### Flujo Feliz
```
Usuario pregunta
    ↓
Sistema muestra capability + precio
    ↓
Usuario confirma pago
    ↓
Sistema procesa pago
    ↓
Sistema ejecuta capability
    ↓
Sistema muestra resultado + disclaimer
    ↓
Usuario tiene información para decidir
```

### Flujo con Error de Pago
```
Usuario pregunta
    ↓
Sistema muestra capability + precio
    ↓
Usuario confirma pago
    ↓
Pago falla
    ↓
Sistema muestra error claro
    ↓
Sistema ofrece reintentar
```

### Flujo con Riesgo Alto
```
Usuario pregunta
    ↓
[... pago procesado ...]
    ↓
Sistema detecta riesgo alto
    ↓
Sistema muestra WARNING prominente
    ↓
Sistema muestra detalles del riesgo
    ↓
Sistema muestra disclaimer
    ↓
Sistema NO recomienda acción específica
```

---

## Responsive Design

### Mobile First

```
Mobile (<640px):
- Una columna
- Botones full width
- Texto más grande
- Menos información por pantalla

Tablet (640px - 1024px):
- Dos columnas donde tenga sentido
- Botones inline
- Balance entre info y espacio

Desktop (>1024px):
- Layout óptimo
- Sidebar si es útil
- Más información visible
```

### Touch Targets

- Botones: mínimo 44x44px
- Links: área clicable generosa
- Espaciado: suficiente para no tocar accidentalmente

---

## Accesibilidad

### Requisitos Mínimos

- [ ] Contraste de colores WCAG AA
- [ ] Textos legibles (min 16px)
- [ ] Estados de focus visibles
- [ ] Errores comunicados claramente
- [ ] No depender solo de color para significado

### Testing

- Probar con lector de pantalla
- Probar navegación con teclado
- Probar con zoom 200%
