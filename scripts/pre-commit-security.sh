#!/bin/bash

# ===========================================
# Security Pre-Commit Hook
# ===========================================
# This script checks for accidentally staged secrets before committing
# Install with: cp scripts/pre-commit-security.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[Security Check] Scanning staged changes for secrets...${NC}"

# Patterns to detect
PATTERNS=(
    "sk-ant-"                           # Anthropic API keys
    "ANTHROPIC_API_KEY="                # API key variable
    "PRIVATE_KEY"                       # Private key references
    "private_key"                       # Alternative format
    "SECRET"                            # Generic secret
    "PASSWORD"                          # Passwords
    "0x[a-fA-F0-9]\{64\}"              # 64-char hex (private keys)
)

FOUND_SECRETS=0

# Check each pattern
for pattern in "${PATTERNS[@]}"; do
    if git diff --cached | grep -i -E "$pattern" > /dev/null; then
        echo -e "${RED}[ERROR] Potential secret detected in staged changes: $pattern${NC}"
        echo "Matching lines:"
        git diff --cached | grep -i -E "$pattern" | head -5
        FOUND_SECRETS=1
    fi
done

# Check if .env file is about to be committed
if git diff --cached --name-only | grep -E "\.env($|\.)" > /dev/null && \
   ! git diff --cached --name-only | grep "\.env\.example"; then
    echo -e "${RED}[ERROR] Attempting to commit .env file! This file must not be committed.${NC}"
    FOUND_SECRETS=1
fi

# Check for large files that might contain secrets
LARGE_FILES=$(git diff --cached --name-only --diff-filter=A | while read file; do
    if [ -f "$file" ]; then
        SIZE=$(wc -c < "$file")
        # Flag files larger than 1MB
        if [ "$SIZE" -gt 1048576 ]; then
            echo "$file ($((SIZE / 1048576))MB)"
        fi
    fi
done)

if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}[WARNING] Large files detected (>1MB):${NC}"
    echo "$LARGE_FILES"
fi

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo -e "${RED}[SECURITY] COMMIT BLOCKED: Potential secrets detected!${NC}"
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    echo "If this is a false positive, update scripts/pre-commit-security.sh"
    exit 1
fi

echo -e "${GREEN}[Security Check] ✓ No secrets detected${NC}"
exit 0
