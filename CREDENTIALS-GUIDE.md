# 🔑 Keys y Credenciales Necesarias para CronosAI

## Resumen Ejecutivo

Para que CronosAI funcione **SIN MOCKUP** necesitas **4 credenciales**. Actualmente tienes **1 con mocups**:

| Estado | Credencial | Criticidad | Tipo | Fuente |
|--------|------------|-----------|------|--------|
| ⚠️ FALTAN | ANTHROPIC_API_KEY | 🔴 CRÍTICA | API Key | Anthropic |
| ⚠️ FALTAN | CRONOS_EXPLORER_API_KEY | 🟡 IMPORTANTE | API Key | CronosScan |
| ⚠️ FALTAN | RECIPIENT_ADDRESS | 🔴 CRÍTICA | Wallet | Tu Cronos |
| ⚠️ FALTAN | PRIVATE_KEY | ⚠️ OPCIONAL | Private Key | Tu Cronos (solo si firmas tx) |
| ✅ CONFIGURADO | CRONOS_RPC_URL | ✅ OK | URL Pública | Cronos |
| ✅ CONFIGURADO | VVS_ROUTER/FACTORY | ✅ OK | Contratos | Cronos |

---

## 🔴 CRÍTICAS: Deben estar configuradas

### 1. **ANTHROPIC_API_KEY** 
**Propósito**: Acceso a Claude para análisis de contratos y capabilities  
**Sin esto**: ❌ El IA no funciona, todo depende de mockup

**Cómo obtenerlo**:
1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Navega a "API Keys"
4. Click en "Create Key"
5. Copia la clave (empieza con `sk-ant-`)

**En `.env`**:
```dotenv
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Verificar que funciona**:
```bash
curl -X POST "http://localhost:3000/capability/contract-scan" \
  -H "Content-Type: application/json" \
  -d '{"address":"0xc21223249ca28397b4b6541dffaecc539bff0c59"}'
```

---

### 2. **RECIPIENT_ADDRESS**
**Propósito**: Billetera que recibe los pagos por x402  
**Sin esto**: ❌ El protocolo x402 no funciona, todo cae en mockup

**Qué es**:
- Tu dirección de billetera en Cronos (empieza con `0x`)
- Es PÚBLICA (no sensible, como tu email)
- Recibe pagos cuando alguien usa las capabilities
- Debe ser diferente a PRIVATE_KEY

**Cómo obtenerlo**:
1. Crea una billetera en Cronos:
   - Opción A: Usar Metamask
   - Opción B: Usar Keplr
   - Opción C: Usar CLI: `ethers-cli wallet new`

2. Obtén la dirección (algo como: `0x742d35Cc6634C0532925a3b844Bc9e7595f52cE`)

3. Verifica que está en red Cronos Mainnet (chainId: 25)

**En `.env`**:
```dotenv
RECIPIENT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f52cE
```

**Verificar**:
- La dirección debe ser válida Ethereum (0x + 40 caracteres hex)
- Puedes verificarla en https://cronoscan.com/address/TU_DIRECCIÓN

---

## 🟡 IMPORTANTES: Altamente recomendadas

### 3. **CRONOS_EXPLORER_API_KEY**
**Propósito**: Acceso a la API de CronosScan para leer contratos  
**Sin esto**: ⚠️ Funciona pero sin datos reales de blockchain

**Qué permite**:
- Obtener código fuente de contratos
- Verificar balances
- Leer eventos de contratos

**Cómo obtenerlo**:
1. Ve a https://cronoscan.com/apis
2. Crea una cuenta
3. Copia la API key desde tu dashboard

**En `.env`**:
```dotenv
CRONOS_EXPLORER_API_KEY=YOUR_API_KEY_HERE
```

**Verificar**:
```bash
# Prueba si funciona
curl "https://api.cronoscan.com/api?module=account&action=balance&address=0x742d35Cc6634C0532925a3b844Bc9e7595f52cE&apikey=YOUR_KEY"
```

---

## ⚠️ OPCIONAL: Para transacciones complejas

### 4. **PRIVATE_KEY**
**Propósito**: Firma de transacciones on-chain (solo si tu IA firma txs)  
**Sin esto**: ✅ Funciona pero el IA no puede firmar transacciones

**Casos de uso**:
- El IA quiere ejecutar transacciones automáticamente
- Necesitas hacer simulaciones con transacciones reales
- Actualmente el proyecto NO lo usa (TODO)

**SEGURIDAD 🔒 CRÍTICA**:
- NUNCA compartas esta clave
- NUNCA la hagas pública
- NUNCA la comites a git (protegida por .gitignore)
- Usa una billetera con MÍNIMO de fondos

**Cómo obtenerlo**:
1. Accede a tu billetera (Metamask, etc)
2. Exporta la private key (guardada en .env, nunca en código)

**En `.env`**:
```dotenv
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**Verificar**:
```bash
# NO compartas este output!
node -e "require('ethers').Wallet.fromPrivateKey(process.env.PRIVATE_KEY).address"
```

---

## 📊 Componentes y sus Dependencias

### Contract Scan Capability
```
contract-scan/
  ├─ ANTHROPIC_API_KEY ✅ (Análisis con IA)
  ├─ CRONOS_EXPLORER_API_KEY ⚠️ (Código fuente del contrato)
  └─ CRONOS_RPC_URL ✅ (Ya configurado)
```
**Sin ANTHROPIC_API_KEY**: Falla 🔴

### Wallet Approvals Capability
```
wallet-approvals/
  ├─ CRONOS_RPC_URL ✅ (Lectura de approvals)
  ├─ ANTHROPIC_API_KEY ✅ (Análisis de riesgos)
  └─ Usa MOCK si falla ⚠️
```
**Fallback**: Retorna datos de mock

### Tx Simulate Capability
```
tx-simulate/
  ├─ CRONOS_RPC_URL ✅ (Conexión a blockchain)
  ├─ VVS_ROUTER/FACTORY ✅ (Contratos - ya configurados)
  └─ Usa MOCK si falla ⚠️
```
**Fallback**: Retorna precios de mock

### x402 Payment Protocol
```
x402/
  ├─ X402_FACILITATOR_URL ✅ (Ya configurado)
  ├─ RECIPIENT_ADDRESS 🔴 (Recibe pagos)
  └─ SKIP_X402=false (Activar pagos)
```
**Sin RECIPIENT_ADDRESS**: No funciona en producción

---

## ✅ Estado Actual vs. Requerido

### Actualmente (.env)
```dotenv
✅ CRONOS_RPC_URL=https://evm.cronos.org         (Público)
✅ CHAIN_ID=25                                    (Mainnet)
✅ CRONOS_EXPLORER_API=https://api.cronoscan.com/api (Público)
✅ X402_FACILITATOR_URL=https://x402-facilitator.cronos.org (Público)
✅ VVS_ROUTER_ADDRESS=0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae (Público)
✅ VVS_FACTORY_ADDRESS=0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15 (Público)

❌ ANTHROPIC_API_KEY=sk-ant-...                  (VACIO)
❌ CRONOS_EXPLORER_API_KEY=                      (VACIO)
❌ RECIPIENT_ADDRESS=0x...                       (VACIO)
⚠️  PRIVATE_KEY=0x...                            (OPCIONAL)
```

### Lo que falta
```
DEBE TENER ANTES DE IR A PRODUCCIÓN:
1. ✅ ANTHROPIC_API_KEY          (IR A: https://console.anthropic.com/)
2. ✅ CRONOS_EXPLORER_API_KEY    (IR A: https://cronoscan.com/apis)
3. ✅ RECIPIENT_ADDRESS          (CREAR: Nueva wallet en Cronos)
4. ⚠️  PRIVATE_KEY               (OPCIONAL: Para firmar txs)
```

---

## 🚀 Checklist para Ir a Producción

### Paso 1: Configurar Anthropic
- [ ] Visita https://console.anthropic.com/
- [ ] Crea API key
- [ ] Copia a `.env`: `ANTHROPIC_API_KEY=sk-ant-...`
- [ ] Prueba: `curl http://localhost:3000/capability/contract-scan -d '{"address":"0x..."}'`

### Paso 2: Configurar CronosScan
- [ ] Visita https://cronoscan.com/apis
- [ ] Crea API key
- [ ] Copia a `.env`: `CRONOS_EXPLORER_API_KEY=YOUR_KEY`
- [ ] Prueba: `curl "https://api.cronoscan.com/api?module=account&action=balance&address=0x...&apikey=YOUR_KEY"`

### Paso 3: Crear Billetera Recipient
- [ ] Abre Metamask o Keplr
- [ ] Crea nueva billetera en Cronos Mainnet
- [ ] Obtén dirección
- [ ] Copia a `.env`: `RECIPIENT_ADDRESS=0x...`
- [ ] Verifica en https://cronoscan.com/address/0x...

### Paso 4: (Opcional) Configurar Private Key
- [ ] Exporta private key de billetera
- [ ] Copia a `.env`: `PRIVATE_KEY=0x...`
- [ ] NUNCA lo hagas público

### Paso 5: Validación
```bash
# Backend (Terminal 1)
cd /home/karen/Escritorio/Web3/IA-Agent/files/CronosAI
npm run dev

# Frontend (Terminal 2)
cd web
npm run dev

# Prueba (Terminal 3)
curl -X POST "http://localhost:3000/capability/contract-scan" \
  -H "Content-Type: application/json" \
  -d '{"address":"0xc21223249ca28397b4b6541dffaecc539bff0c59"}'
```

---

## 🎯 Resumen de Criticidad

```
BLOQUEADORES (Sin estos NO funciona sin mockup):
  🔴 ANTHROPIC_API_KEY         - Sin IA, todo es mockup
  🔴 RECIPIENT_ADDRESS         - Sin esto, x402 no funciona

ALTAMENTE RECOMENDADO:
  🟡 CRONOS_EXPLORER_API_KEY   - Sin esto, datos limitados

OPCIONAL:
  ⚠️  PRIVATE_KEY              - Para transacciones firmadas
```

---

## 📞 Dónde Obtener Cada One

| Credencial | Sitio | Tiempo | Dificultad |
|-----------|-------|--------|-----------|
| ANTHROPIC_API_KEY | https://console.anthropic.com/ | 5 min | ⭐ Fácil |
| CRONOS_EXPLORER_API_KEY | https://cronoscan.com/apis | 5 min | ⭐ Fácil |
| RECIPIENT_ADDRESS | Crear wallet (Metamask) | 2 min | ⭐ Fácil |
| PRIVATE_KEY | Exportar de wallet | 1 min | ⭐ Fácil |

**Tiempo total**: ~15 minutos para tener TODO funcionando

---

## 🔐 Seguridad

- ✅ `.env` está en `.gitignore` - No se sube a GitHub
- ✅ `.env.example` muestra estructura sin secretos
- ✅ Pre-commit hook previene commits accidentales
- ✅ RECIPIENT_ADDRESS es público (no sensible)
- 🔒 PRIVATE_KEY es ultra-sensible, nunca compartir

---

**Última actualización**: 10 de Enero, 2026  
**Versión**: CronosAI v1.0
