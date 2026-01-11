# Prompt para Claude Code - CronosAI Ops

## Contexto

Estoy construyendo **CronosAI Ops** para la hackathon Cronos x402 PayTech.

**Concepto:** El primer AI agent donde cada capability es un micro-servicio pagado via x402.

**Deadline:** 23 Enero 2026

## El Diferenciador

NO es un "AI chat que cobra premium".
ES un marketplace de micro-servicios de seguridad pagados por uso.

```
Usuario: "¿Es seguro este contrato?"

Sistema: "Puedo analizarlo:
  □ Scan de contrato ($0.01)
  □ Check de approvals ($0.02)
  
  [Pagar y ejecutar]"
```

**Sin x402, el producto no existe.**

## Documentación Disponible

Lee estos archivos EN ORDEN antes de escribir código:

1. `docs/MVP.md` - Alcance estricto y etapas
2. `docs/ARCHITECTURE.md` - Estructura técnica
3. `docs/CAPABILITIES.md` - Las 3 capabilities del MVP
4. `docs/X402.md` - Integración de pagos
5. `docs/UX.md` - Principios de diseño
6. `docs/PROMPTS.md` - System prompts

## Stack

| Capa | Tech |
|------|------|
| AI | Claude API (@anthropic-ai/sdk) |
| Payments | x402 Protocol (@x402/express) |
| Blockchain | ethers.js v6 |
| Backend | Express + TypeScript |
| Frontend | React + Vite + Tailwind |

## Primera Tarea

Completar **ETAPA 1: Foundation** del MVP:

1. Inicializar proyecto Node.js + TypeScript
2. Crear estructura de carpetas (ver ARCHITECTURE.md)
3. Setup Express con `/health`
4. Configurar cliente Claude básico
5. Verificar que todo compila

## Estructura Esperada

```
cronosai-ops/
├── src/
│   ├── api/
│   │   ├── index.ts
│   │   ├── routes/
│   │   └── middleware/
│   ├── core/
│   │   ├── orchestrator.ts
│   │   ├── capabilities/
│   │   └── ai/
│   ├── services/
│   └── shared/
├── web/  (después, en etapa 5)
├── docs/
├── .env.example
├── package.json
└── tsconfig.json
```

## Criterios de Calidad (No Negociables)

- TypeScript estricto (no `any`)
- Manejo de errores en todo
- Logging claro
- Código simple > código elegante

## Lo Que NO Hacer

- NO agregar features extra
- NO usar frameworks pesados
- NO optimizar prematuramente
- NO ignorar los warnings de TypeScript

## Comandos que Deben Funcionar

```bash
npm install
npm run dev      # Inicia servidor en :3000
npm run build    # Compila sin errores
```

## Para Empezar

```bash
# Estás en la carpeta cronosai-ops
# Empezá creando package.json y tsconfig.json
```

Lee `docs/MVP.md` primero. Seguí las etapas en orden.

¡Empezá!
