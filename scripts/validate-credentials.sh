#!/bin/bash

# ===========================================
# CronosAI - Credentials Validation Script
# ===========================================
# Verifica qué credenciales faltan para producción

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔑 CronosAI - Credentials Validation Check             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load .env if exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}[WARN] .env file not found${NC}"
fi

# Counters
CRITICAL=0
IMPORTANT=0
OPTIONAL=0

echo -e "${BLUE}📋 Credenciales Requeridas${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. ANTHROPIC_API_KEY
echo -n "1. ANTHROPIC_API_KEY: "
if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "sk-ant-..." ]; then
    # Check if it looks like a valid key
    if [[ "$ANTHROPIC_API_KEY" =~ ^sk-ant-[a-zA-Z0-9]{40,}$ ]]; then
        echo -e "${GREEN}✅ Configurada${NC}"
        echo -e "   Valor: ${ANTHROPIC_API_KEY:0:20}...${NC}"
    else
        echo -e "${YELLOW}⚠️  Configurada pero formato sospechoso${NC}"
        echo -e "   Valor: ${ANTHROPIC_API_KEY:0:30}...${NC}"
    fi
else
    echo -e "${RED}❌ FALTAN${NC}"
    echo -e "   ${RED}🔴 CRÍTICA: Sin esto el IA no funciona${NC}"
    echo -e "   Obtén en: https://console.anthropic.com/api-keys${NC}"
    ((CRITICAL++))
fi
echo ""

# 2. RECIPIENT_ADDRESS
echo -n "2. RECIPIENT_ADDRESS: "
if [ -n "$RECIPIENT_ADDRESS" ] && [ "$RECIPIENT_ADDRESS" != "0x..." ]; then
    # Check if it looks like a valid address
    if [[ "$RECIPIENT_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        echo -e "${GREEN}✅ Configurada${NC}"
        echo -e "   Valor: ${RECIPIENT_ADDRESS:0:10}...${RECIPIENT_ADDRESS: -6}${NC}"
    else
        echo -e "${YELLOW}⚠️  Configurada pero formato inválido${NC}"
        echo -e "   Valor: $RECIPIENT_ADDRESS${NC}"
    fi
else
    echo -e "${RED}❌ FALTAN${NC}"
    echo -e "   ${RED}🔴 CRÍTICA: Sin esto x402 no funciona${NC}"
    echo -e "   Crea una wallet en Cronos Mainnet${NC}"
    ((CRITICAL++))
fi
echo ""

# 3. CRONOS_EXPLORER_API_KEY
echo -n "3. CRONOS_EXPLORER_API_KEY: "
if [ -n "$CRONOS_EXPLORER_API_KEY" ]; then
    echo -e "${GREEN}✅ Configurada${NC}"
    echo -e "   Valor: ${CRONOS_EXPLORER_API_KEY:0:20}...${NC}"
else
    echo -e "${YELLOW}⚠️  FALTAN${NC}"
    echo -e "   ${YELLOW}🟡 IMPORTANTE: Sin esto datos limitados de blockchain${NC}"
    echo -e "   Obtén en: https://cronoscan.com/apis${NC}"
    ((IMPORTANT++))
fi
echo ""

# 4. PRIVATE_KEY
echo -n "4. PRIVATE_KEY: "
if [ -n "$PRIVATE_KEY" ] && [ "$PRIVATE_KEY" != "0x..." ]; then
    if [[ "$PRIVATE_KEY" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
        echo -e "${GREEN}✅ Configurada${NC}"
        echo -e "   Valor: ${PRIVATE_KEY:0:10}...${PRIVATE_KEY: -6}${NC}"
    else
        echo -e "${YELLOW}⚠️  Configurada pero formato sospechoso${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  FALTAN (Opcional)${NC}"
    echo -e "   Requerida solo si el IA firma transacciones${NC}"
    ((OPTIONAL++))
fi
echo ""

# =====================================================
# CONFIG VALIDATION
# =====================================================

echo -e "${BLUE}📋 Configuración del Sistema${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# CRONOS_RPC_URL
echo -n "CRONOS_RPC_URL: "
if [ -n "$CRONOS_RPC_URL" ]; then
    echo -e "${GREEN}✅ ${CRONOS_RPC_URL}${NC}"
else
    echo -e "${RED}❌ No configurada${NC}"
fi

# CHAIN_ID
echo -n "CHAIN_ID: "
if [ -n "$CHAIN_ID" ]; then
    if [ "$CHAIN_ID" = "25" ]; then
        echo -e "${GREEN}✅ ${CHAIN_ID} (Cronos Mainnet)${NC}"
    elif [ "$CHAIN_ID" = "338" ]; then
        echo -e "${YELLOW}⚠️  ${CHAIN_ID} (Cronos Testnet)${NC}"
    else
        echo -e "${YELLOW}⚠️  ${CHAIN_ID} (Desconocido)${NC}"
    fi
else
    echo -e "${RED}❌ No configurada${NC}"
fi

# X402_FACILITATOR_URL
echo -n "X402_FACILITATOR_URL: "
if [ -n "$X402_FACILITATOR_URL" ]; then
    echo -e "${GREEN}✅ Configurada${NC}"
else
    echo -e "${RED}❌ No configurada${NC}"
fi

# NODE_ENV
echo -n "NODE_ENV: "
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}⚠️  Production (Requiere todas las credenciales)${NC}"
else
    echo -e "${GREEN}✅ ${NODE_ENV:-development}${NC}"
fi

# SKIP_X402
echo -n "SKIP_X402: "
if [ "$SKIP_X402" = "true" ]; then
    echo -e "${YELLOW}⚠️  MOCK MODE - Pagos desactivados${NC}"
else
    echo -e "${GREEN}✅ Pagos activados${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# =====================================================
# SUMMARY
# =====================================================

echo -e "${BLUE}📊 Resumen${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $CRITICAL -eq 0 ]; then
    echo -e "${GREEN}🟢 Credenciales Críticas: TODAS CONFIGURADAS${NC}"
else
    echo -e "${RED}🔴 Credenciales Críticas Faltantes: $CRITICAL${NC}"
fi

if [ $IMPORTANT -eq 0 ]; then
    echo -e "${GREEN}🟢 Credenciales Importantes: TODAS CONFIGURADAS${NC}"
else
    echo -e "${YELLOW}🟡 Credenciales Importantes Faltantes: $IMPORTANT${NC}"
fi

if [ $OPTIONAL -eq 0 ]; then
    echo -e "${GREEN}🟢 Credenciales Opcionales: TODAS CONFIGURADAS${NC}"
else
    echo -e "${BLUE}🔵 Credenciales Opcionales Faltantes: $OPTIONAL${NC}"
fi

echo ""

# =====================================================
# RECOMMENDATION
# =====================================================

if [ $CRITICAL -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ NO ESTÁ LISTO PARA PRODUCCIÓN${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Aciones requeridas:"
    echo -e "  1. Configurar ANTHROPIC_API_KEY"
    echo -e "  2. Configurar RECIPIENT_ADDRESS"
    echo -e "  3. Ejecutar este script nuevamente"
    echo ""
    exit 1
elif [ $IMPORTANT -gt 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  PARCIALMENTE LISTO${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Recomendaciones:"
    echo -e "  1. Configurar CRONOS_EXPLORER_API_KEY para mejor funcionalidad"
    echo -e "  2. El IA funcionará pero con datos limitados"
    echo ""
else
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ LISTO PARA PRODUCCIÓN${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Todas las credenciales están configuradas."
    echo -e "Puedes desplegar a producción con confianza."
    echo ""
fi

echo -e "${BLUE}📚 Documentación:${NC}"
echo "  • Guía detallada: CREDENTIALS-GUIDE.md"
echo "  • Seguridad: docs/SECURITY.md"
echo "  • Setup: docs/SECURITY-SETUP.md"
echo ""
