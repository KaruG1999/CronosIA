# 🔒 Security Guidelines - CronosAI

## ⚠️ CRITICAL: Preventing Secrets from Being Committed

This document outlines security best practices for the CronosAI project to prevent accidental exposure of sensitive information.

## Environment Variables

### DO NOT ❌
- ❌ Commit `.env` files with real API keys or private keys
- ❌ Hardcode secrets in source code
- ❌ Use example values that look realistic (e.g., `0x...` for addresses)
- ❌ Share private keys or API keys through any non-secure channel
- ❌ Reuse private keys across multiple services or projects

### DO ✅
- ✅ Use `.env.example` as a template for required variables
- ✅ Create a local `.env` file (automatically ignored by git)
- ✅ Use `.env.local` for environment-specific configurations
- ✅ Rotate API keys regularly
- ✅ Use separate wallets for different purposes (recipient vs. service)
- ✅ Keep API keys and private keys in secure vaults in production

## Files Protected by .gitignore

The following files/patterns are protected and will NOT be committed to GitHub:

```
.env                          # Main environment file
.env.local                    # Local overrides
.env.*.local                  # Environment-specific local files
.env.production.local         # Production local config
node_modules/                 # Dependencies
dist/                         # Build artifacts
.claude/settings.local.json   # Local Claude settings
*.pem, *.key, *.pfx, *.p12   # Certificate/key files
```

## API Keys & Secrets

### Anthropic API Key
- Format: `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Get from: https://console.anthropic.com/
- Keep separate for development, staging, and production
- Rotate keys periodically

### Cronos Explorer API Key
- Get from: https://cronoscan.com/apis
- Used for querying blockchain data
- Keep separate from other project keys
- Monitor usage for suspicious activity

### Private Keys
- **NEVER** hardcode private keys in source code
- **NEVER** commit private keys to version control
- Use secure key management systems in production
- Consider using Hardware Security Modules (HSM) for production keys
- Rotate service wallets if compromised

## Wallet Management

### Recipient Wallet (Receives Payments)
- Should be a dedicated wallet for this service only
- Should NOT contain the service's private key
- Used for monitoring incoming x402 payments
- Address is non-sensitive (can be in `.env.example`)

### Service Wallet (For Transactions)
- Contains the private key for signing transactions
- NEVER share or expose the private key
- Should have minimal funds needed for gas fees
- Different from the recipient wallet
- Used only when queries require signing

## Production Deployment

1. **Use Environment Variables**: Deploy secrets via secure environment configuration
2. **Use Secrets Management**: Use services like:
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - GitHub Secrets (for CI/CD)
3. **Audit Access**: Log and monitor who accesses secrets
4. **Rotate Regularly**: Establish a schedule for rotating secrets
5. **Limit Scope**: Grant minimal necessary permissions
6. **Use Service Accounts**: Separate accounts for different services

## Before Committing

Run these checks before pushing to GitHub:

```bash
# Check for accidentally staged secrets
git diff --cached | grep -E "sk-|0x[a-fA-F0-9]{40,}|PRIVATE_KEY|private_key"

# Verify .env is ignored
git check-ignore .env

# View what will be committed
git ls-files --others --exclude-standard
```

## If You Accidentally Committed Secrets

1. **IMMEDIATELY** rotate the exposed key/secret
2. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all
   git push --force --all
   git push --force --tags
   ```
3. Notify the team
4. Review git logs for any other exposed secrets

## Secret Detection Tools

Consider using these tools to prevent accidental commits:

- **git-secrets**: https://github.com/awslabs/git-secrets
- **pre-commit hooks**: https://pre-commit.com/
- **TruffleHog**: https://github.com/truffleHog/truffleHog

Example `.git/hooks/pre-commit`:
```bash
#!/bin/bash
git diff --cached | grep -E "sk-|PRIVATE|SECRET|API_KEY" && \
  echo "ERROR: Secrets detected in staged changes!" && exit 1
exit 0
```

## Documentation

- Never document actual secrets in README or other docs
- Use placeholder values with `<>` or `<YOUR_VALUE>` format
- Link to official documentation for obtaining secrets

## Questions or Concerns?

If you discover a security vulnerability or have concerns about exposed secrets:
1. Do not make it public
2. Rotate the affected credentials immediately
3. Contact the security team
4. Document the incident

---

**Last Updated**: January 10, 2026
**Security Level**: 🔴 CRITICAL
