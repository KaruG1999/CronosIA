# ✅ Checklist de Seguridad para GitHub

## Antes de hacer `git push`

### 🔐 Verificaciones de Secretos

- [ ] Ejecuté `git diff --cached` y NO veo API keys
- [ ] Ejecuté `git diff --cached` y NO veo private keys
- [ ] Ejecuté `git diff --cached` y NO veo passwords
- [ ] Ejecuté `git ls-files` y NO aparece `.env`
- [ ] Ejecuté `git check-ignore .env` y confirmo que está ignorado

### 📁 Archivos a Verificar

- [ ] `.env` NO está en staging
- [ ] `.env.local` NO está en staging  
- [ ] `.env.*.local` NO está en staging
- [ ] `node_modules/` NO está en staging
- [ ] `dist/` NO está en staging
- [ ] Cualquier archivo `.pem`, `.key`, `.pfx`, `.p12` NO está en staging

### 🛡️ Configuración de Seguridad

- [ ] Tengo `.gitignore` con 90+ líneas (verify: `wc -l .gitignore`)
- [ ] Tengo `docs/SECURITY.md` documentado
- [ ] Tengo `docs/SECURITY-SETUP.md` documentado
- [ ] Tengo `scripts/pre-commit-security.sh` ejecutable

### 📋 Archivos a Subir

- [ ] `.env.example` SÍ está en staging (sin secretos reales)
- [ ] `web/.env.example` SÍ está en staging
- [ ] `.gitignore` actualizado SÍ está en staging
- [ ] `web/.gitignore` actualizado SÍ está en staging
- [ ] Documentación de seguridad SÍ está en staging

### ⚙️ Configuración Post-Commit

- [ ] Instalé el pre-commit hook: `cp scripts/pre-commit-security.sh .git/hooks/pre-commit`
- [ ] Hice ejecutable el hook: `chmod +x .git/hooks/pre-commit`
- [ ] Probé el hook en próximos commits

## Comandos de Verificación Rápida

```bash
# 1. Ver qué se va a subir
git ls-files | head -30

# 2. Verificar que .env está ignorado
git check-ignore .env .env.local

# 3. Buscar patrones peligrosos en staging
git diff --cached | grep -E "sk-|PRIVATE|SECRET|PASSWORD|0x[a-f0-9]{64}"

# 4. Contar líneas de .gitignore
wc -l .gitignore web/.gitignore

# 5. Verificar que .env no está en git (si ya existe repo)
git ls-files | grep ".env"  # Debería estar VACÍO
```

## 🚨 Si Encuentras un Problema

1. **DETENERSE**: No hacer push
2. **CORREGIR**: 
   - Editar `.gitignore` si es necesario
   - Remover archivo sensible de staging: `git reset HEAD archivo`
   - Actualizar `.env.example` si necesario
3. **VERIFICAR**: Repetir todos los checks
4. **PROCEDER**: Cuando todo esté verde ✅

## 🔄 Después de Push

- [ ] Entré a https://github.com/tu-repo/files
- [ ] Verificar que NO aparece `.env` en la lista de archivos
- [ ] Verificar que aparece `.env.example` (sin valores reales)
- [ ] Verificar que `.gitignore` tiene contenido completo

## 📱 GitHub Settings (Configuración Recomendada)

- [ ] Activé "Branch protection rules" en Settings
- [ ] Requiero al menos 1 review antes de merge
- [ ] Activé "Require status checks to pass"
- [ ] Activé "GitHub Secret Scanning" si está disponible

## 🛠️ Herramientas Adicionales (Opcional)

- [ ] Instalé `git-secrets` para protección adicional
- [ ] Configuré `.pre-commit-config.yaml` para hooks adicionales
- [ ] Activé GitHub Actions para secret scanning

## 📞 En Caso de Emergencia

Si accidentalmente subiste un secreto:

```bash
# 1. ROTATE EL SECRETO INMEDIATAMENTE
# 2. Remover del historio git:
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push
git push --force --all

# 4. Notificar al equipo
# 5. Revisar: git log --all -- .env
```

## ✨ Resumen Final

| Tarea | Estado |
|-------|--------|
| Secretos revisados | ☐ |
| .gitignore completo | ☐ |
| Documentación creada | ☐ |
| Pre-commit hook instalado | ☐ |
| Verificación final completada | ☐ |
| Listo para GitHub | ☐ |

---

**Imprimir o guardar este checklist para cada commit a GitHub.**

Última actualización: 10 de Enero, 2026
