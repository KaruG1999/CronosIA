# Capabilities - CronosAI Ops

## Filosofía

> Una capability = Un problema específico = Un precio claro

Cada capability es:
- **Atómica**: Hace UNA cosa
- **Transparente**: Usuario sabe qué obtiene
- **Limitada**: Declaramos qué NO puede hacer
- **Pagada**: Precio fijo via x402

---

## Registry de Capabilities

```typescript
// src/core/capabilities/registry.ts

export const CAPABILITIES = {
  'contract.scan': {
    price: '$0.01',
    priceUSDC: 0.01,
    name: 'Scan de Contrato',
    description: 'Analiza un contrato para detectar señales de riesgo',
    limitations: [
      'No garantiza seguridad al 100%',
      'Basado en heurísticas y datos públicos',
      'Contratos nuevos pueden no tener historial',
    ],
  },
  'wallet.approvals': {
    price: '$0.02',
    priceUSDC: 0.02,
    name: 'Check de Approvals',
    description: 'Lista los token approvals activos y detecta riesgos',
    limitations: [
      'Clasificación de riesgo es estimada',
      'No cubre todos los tipos de permisos',
      'Contratos nuevos pueden no estar clasificados',
    ],
  },
  'tx.simulate': {
    price: '$0.03',
    priceUSDC: 0.03,
    name: 'Simulación de Transacción',
    description: 'Simula una operación para ver el resultado esperado',
    limitations: [
      'Resultado puede variar si el estado cambia',
      'No incluye gas fees en el cálculo',
      'Solo soporta swaps en VVS Finance',
    ],
  },
} as const;
```

---

## Capability 1: contract.scan

### Propósito
Dar al usuario información para DECIDIR si un contrato es confiable.

**NO** decidir por él.

### Input Schema
```typescript
const contractScanInput = z.object({
  address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Dirección inválida'),
});
```

### Proceso
```typescript
async function executeContractScan(input: { address: string }): Promise<CapabilityResult> {
  const signals: Signal[] = [];
  
  // 1. Verificar si existe
  const code = await provider.getCode(input.address);
  if (code === '0x') {
    return {
      success: true,
      data: { is_contract: false },
      warnings: [{ level: 'info', message: 'Esta dirección no es un contrato' }],
      limitations: CAPABILITIES['contract.scan'].limitations,
    };
  }
  
  // 2. Consultar Explorer
  const explorerData = await explorer.getContractInfo(input.address);
  
  // 3. Analizar señales
  if (!explorerData.verified) {
    signals.push({
      type: 'warning',
      code: 'NOT_VERIFIED',
      message: 'Contrato no verificado en el explorer',
      weight: 30,
    });
  }
  
  if (explorerData.age_days < 7) {
    signals.push({
      type: 'warning', 
      code: 'NEW_CONTRACT',
      message: `Contrato creado hace ${explorerData.age_days} días`,
      weight: 20,
    });
  }
  
  if (explorerData.tx_count < 10) {
    signals.push({
      type: 'info',
      code: 'LOW_ACTIVITY',
      message: 'Pocas transacciones registradas',
      weight: 10,
    });
  }
  
  // 4. Calcular risk score
  const riskScore = calculateRiskScore(signals);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    success: true,
    data: {
      address: input.address,
      is_contract: true,
      verified: explorerData.verified,
      age_days: explorerData.age_days,
      tx_count: explorerData.tx_count,
      risk_score: riskScore,
      risk_level: riskLevel,
      signals,
    },
    warnings: signals.filter(s => s.type === 'warning').map(s => ({
      level: 'warning',
      message: s.message,
    })),
    limitations: CAPABILITIES['contract.scan'].limitations,
  };
}
```

### Risk Score Calculation
```typescript
function calculateRiskScore(signals: Signal[]): number {
  // Base score: 0 (sin riesgo detectable)
  // Máximo: 100 (alto riesgo)
  return Math.min(100, signals.reduce((sum, s) => sum + s.weight, 0));
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 20) return 'low';
  if (score < 50) return 'medium';
  return 'high';
}
```

### Output Ejemplo
```json
{
  "success": true,
  "data": {
    "address": "0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae",
    "is_contract": true,
    "verified": true,
    "age_days": 547,
    "tx_count": 1250000,
    "risk_score": 0,
    "risk_level": "low",
    "signals": []
  },
  "warnings": [],
  "limitations": [
    "No garantiza seguridad al 100%",
    "Basado en heurísticas y datos públicos"
  ]
}
```

---

## Capability 2: wallet.approvals

### Propósito
Mostrar al usuario qué contratos tienen permiso para mover sus tokens.

### Input Schema
```typescript
const walletApprovalsInput = z.object({
  address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Dirección inválida'),
});
```

### Proceso
```typescript
async function executeWalletApprovals(input: { address: string }): Promise<CapabilityResult> {
  // 1. Obtener tokens del usuario
  const tokens = await getTokenBalances(input.address);
  
  // 2. Para cada token, buscar approvals
  const approvals: Approval[] = [];
  
  for (const token of tokens) {
    const tokenApprovals = await getTokenApprovals(token.address, input.address);
    
    for (const approval of tokenApprovals) {
      const spenderInfo = await identifySpender(approval.spender);
      const risk = classifyApprovalRisk(approval, spenderInfo);
      
      approvals.push({
        token: token.symbol,
        token_address: token.address,
        spender: approval.spender,
        spender_name: spenderInfo.name || 'Desconocido',
        spender_verified: spenderInfo.verified,
        amount: approval.amount,
        amount_formatted: formatAmount(approval.amount, token.decimals),
        is_unlimited: approval.amount === MaxUint256,
        risk,
      });
    }
  }
  
  // 3. Ordenar por riesgo
  approvals.sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);
  
  const highRiskCount = approvals.filter(a => a.risk === 'high').length;
  
  return {
    success: true,
    data: {
      wallet: input.address,
      total_approvals: approvals.length,
      high_risk_count: highRiskCount,
      approvals,
    },
    warnings: highRiskCount > 0 
      ? [{ level: 'danger', message: `Tenés ${highRiskCount} approval(s) de alto riesgo` }]
      : [],
    limitations: CAPABILITIES['wallet.approvals'].limitations,
  };
}
```

### Risk Classification
```typescript
function classifyApprovalRisk(approval: RawApproval, spender: SpenderInfo): 'low' | 'medium' | 'high' {
  // Alto riesgo
  if (!spender.verified && approval.amount === MaxUint256) {
    return 'high';
  }
  if (spender.flagged) {
    return 'high';
  }
  
  // Riesgo medio
  if (!spender.verified) {
    return 'medium';
  }
  if (approval.amount === MaxUint256 && spender.age_days < 30) {
    return 'medium';
  }
  
  // Bajo riesgo
  return 'low';
}
```

### Known Spenders Database
```typescript
// Base de datos local de spenders conocidos en Cronos
const KNOWN_SPENDERS: Record<string, SpenderInfo> = {
  '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae': {
    name: 'VVS Finance Router',
    verified: true,
    category: 'DEX',
    flagged: false,
  },
  '0xeAdf7c01DA7E93FdB5f16B0aa9ee85f978e89E95': {
    name: 'Tectonic tCRO',
    verified: true,
    category: 'Lending',
    flagged: false,
  },
  // ... más contratos conocidos
};
```

### Output Ejemplo
```json
{
  "success": true,
  "data": {
    "wallet": "0x123...",
    "total_approvals": 3,
    "high_risk_count": 1,
    "approvals": [
      {
        "token": "USDC",
        "spender": "0xUnknown...",
        "spender_name": "Desconocido",
        "spender_verified": false,
        "amount_formatted": "Unlimited",
        "is_unlimited": true,
        "risk": "high"
      },
      {
        "token": "CRO",
        "spender": "0x145863...",
        "spender_name": "VVS Finance Router",
        "spender_verified": true,
        "amount_formatted": "1,000 CRO",
        "is_unlimited": false,
        "risk": "low"
      }
    ]
  },
  "warnings": [
    { "level": "danger", "message": "Tenés 1 approval(s) de alto riesgo" }
  ]
}
```

---

## Capability 3: tx.simulate

### Propósito
Mostrar al usuario qué pasaría si ejecuta una operación.

### Input Schema
```typescript
const txSimulateInput = z.object({
  action: z.enum(['swap']),  // MVP: solo swap
  params: z.object({
    token_in: z.string(),
    token_out: z.string(),
    amount: z.number().positive(),
  }),
});
```

### Proceso
```typescript
async function executeTxSimulate(input: TxSimulateInput): Promise<CapabilityResult> {
  if (input.action !== 'swap') {
    throw new CapabilityError(
      'Action not supported',
      'UNSUPPORTED_ACTION',
      'Por ahora solo soportamos simulación de swaps',
      true
    );
  }
  
  const { token_in, token_out, amount } = input.params;
  
  // 1. Resolver tokens
  const tokenIn = resolveToken(token_in);
  const tokenOut = resolveToken(token_out);
  
  if (!tokenIn || !tokenOut) {
    throw Errors.TOKEN_NOT_FOUND;
  }
  
  // 2. Obtener quote de VVS
  const amountIn = parseUnits(amount.toString(), tokenIn.decimals);
  const path = [tokenIn.address, tokenOut.address];
  
  const router = new Contract(VVS_ROUTER, VVS_ROUTER_ABI, provider);
  const amounts = await router.getAmountsOut(amountIn, path);
  const amountOut = amounts[amounts.length - 1];
  
  // 3. Calcular price impact
  const spotPrice = await getSpotPrice(tokenIn, tokenOut);
  const executionPrice = Number(amountOut) / Number(amountIn);
  const priceImpact = Math.abs((executionPrice - spotPrice) / spotPrice) * 100;
  
  // 4. Generar warnings si es necesario
  const warnings: Warning[] = [];
  
  if (priceImpact > 1) {
    warnings.push({
      level: 'warning',
      message: `Price impact alto: ${priceImpact.toFixed(2)}%. Considerá reducir el monto.`,
    });
  }
  
  if (priceImpact > 5) {
    warnings.push({
      level: 'danger',
      message: `Price impact muy alto: ${priceImpact.toFixed(2)}%. Podrías perder valor significativo.`,
    });
  }
  
  return {
    success: true,
    data: {
      action: 'swap',
      input: {
        token: tokenIn.symbol,
        amount: amount,
        amount_formatted: `${amount} ${tokenIn.symbol}`,
      },
      output: {
        token: tokenOut.symbol,
        amount: formatUnits(amountOut, tokenOut.decimals),
        amount_formatted: `${formatUnits(amountOut, tokenOut.decimals)} ${tokenOut.symbol}`,
      },
      execution_price: executionPrice,
      price_impact_percent: priceImpact,
      route: path.map(p => getTokenSymbol(p)),
      dex: 'VVS Finance',
    },
    warnings,
    limitations: CAPABILITIES['tx.simulate'].limitations,
  };
}
```

### Token Registry
```typescript
// Tokens soportados en MVP
const TOKENS: Record<string, TokenInfo> = {
  'CRO': {
    symbol: 'CRO',
    name: 'Cronos',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    decimals: 18,
  },
  'WCRO': {
    symbol: 'WCRO',
    name: 'Wrapped CRO',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    decimals: 18,
  },
  'USDC': {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
    decimals: 6,
  },
  'USDT': {
    symbol: 'USDT',
    name: 'Tether',
    address: '0x66e428c3f67a68878562e79A0234c1F83c208770',
    decimals: 6,
  },
};
```

### Output Ejemplo
```json
{
  "success": true,
  "data": {
    "action": "swap",
    "input": {
      "token": "CRO",
      "amount": 100,
      "amount_formatted": "100 CRO"
    },
    "output": {
      "token": "USDC",
      "amount": "9.85",
      "amount_formatted": "9.85 USDC"
    },
    "execution_price": 0.0985,
    "price_impact_percent": 0.15,
    "route": ["CRO", "USDC"],
    "dex": "VVS Finance"
  },
  "warnings": [],
  "limitations": [
    "Resultado puede variar si el estado cambia",
    "No incluye gas fees en el cálculo"
  ]
}
```

---

## Testing de Capabilities

### Test Cases Mínimos

```typescript
// tests/capabilities.test.ts

describe('contract.scan', () => {
  it('should detect unverified contract', async () => {
    const result = await contractScan.execute({ 
      address: '0xUnverifiedContract' 
    });
    expect(result.data.verified).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  
  it('should handle non-contract address', async () => {
    const result = await contractScan.execute({ 
      address: '0xRegularWallet' 
    });
    expect(result.data.is_contract).toBe(false);
  });
  
  it('should reject invalid address', async () => {
    await expect(
      contractScan.execute({ address: 'invalid' })
    ).rejects.toThrow();
  });
});

describe('wallet.approvals', () => {
  it('should detect high risk approvals', async () => {
    const result = await walletApprovals.execute({ 
      address: '0xWalletWithRiskyApprovals' 
    });
    expect(result.data.high_risk_count).toBeGreaterThan(0);
  });
  
  it('should identify known spenders', async () => {
    const result = await walletApprovals.execute({ 
      address: '0xWalletWithVVSApproval' 
    });
    const vvsApproval = result.data.approvals.find(
      a => a.spender_name === 'VVS Finance Router'
    );
    expect(vvsApproval).toBeDefined();
    expect(vvsApproval.risk).toBe('low');
  });
});

describe('tx.simulate', () => {
  it('should simulate CRO to USDC swap', async () => {
    const result = await txSimulate.execute({
      action: 'swap',
      params: { token_in: 'CRO', token_out: 'USDC', amount: 100 },
    });
    expect(result.data.output.token).toBe('USDC');
    expect(Number(result.data.output.amount)).toBeGreaterThan(0);
  });
  
  it('should warn on high price impact', async () => {
    const result = await txSimulate.execute({
      action: 'swap',
      params: { token_in: 'CRO', token_out: 'USDC', amount: 1000000 },
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
```
