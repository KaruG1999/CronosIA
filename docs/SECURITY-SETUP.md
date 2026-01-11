# Security Setup Guide

## Installation

### 1. Setup Git Pre-Commit Hook

This ensures that secrets are never accidentally committed to the repository.

```bash
# Copy the security pre-commit hook
cp scripts/pre-commit-security.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Test the hook (it will block if it finds potential secrets)
git add .env.example
git commit -m "test: security hook" --dry-run
```

### 2. Verify .gitignore is working

```bash
# These should all show that .env is properly ignored
git check-ignore .env
git check-ignore .env.local
git check-ignore web/.env.local

# If .env was accidentally committed before, remove it:
git rm --cached .env
git commit -m "security: remove .env from tracking"
```

### 3. Create your local .env files

```bash
# Copy the example file and fill in your secrets
cp .env.example .env
cp web/.env.example web/.env.local

# Edit with your actual values
nano .env
nano web/.env.local
```

### 4. Configure Environment Variables

Edit `.env` and add:
- `ANTHROPIC_API_KEY`: Your Anthropic API key from https://console.anthropic.com/
- `CRONOS_EXPLORER_API_KEY`: Your CronosScan API key
- `RECIPIENT_ADDRESS`: Your Cronos wallet address
- `PRIVATE_KEY`: Your service wallet private key (if needed)

## Security Checklist

Before committing any changes:

- [ ] No `.env` file in staged changes
- [ ] No API keys visible in code
- [ ] No private keys visible in code
- [ ] No credentials in comments
- [ ] `.gitignore` is properly configured
- [ ] Pre-commit hook is installed and working

## Useful Commands

```bash
# Check what will be committed (verify no .env files)
git ls-files --others --exclude-standard

# See staged changes before committing
git diff --cached

# Check if .env is properly ignored
git check-ignore -v .env

# Remove .env from git tracking if accidentally added
git rm --cached .env
```

## Emergency: Exposed Secrets

If you accidentally commit a secret:

1. **Rotate the secret immediately** (API key, private key, etc.)
2. Clean git history:
```bash
# Remove the file from git history
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (use with caution!)
git push --force --all
git push --force --tags
```

3. Notify the team
4. Review recent git logs for any other exposed data

## Monitoring

### GitHub Settings

For your GitHub repository:

1. Enable branch protection rules
2. Require reviews before merge
3. Enable status checks
4. Set up GitHub Actions to scan for secrets:

```yaml
# .github/workflows/secret-scan.yml
name: Secret Scanning
on: [push, pull_request]
jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: truffleHog/truffleHog-action@main
```

### Tools

- **git-secrets**: `brew install git-secrets` (macOS)
- **pre-commit**: `pip install pre-commit` and configure `.pre-commit-config.yaml`
- **TruffleHog**: Scans git history for secrets

## References

- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Protecting sensitive credentials](https://docs.github.com/en/code-security/secret-scanning)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [CronosAI Security Guidelines](./SECURITY.md)

