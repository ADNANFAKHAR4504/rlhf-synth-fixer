# Synth Agent

PR fixing automation for IaC tasks. Fixes CI/CD failures from GitHub Actions.

## Commit Rules

**Don't include:**
- "Claude", "AI", "agent", "auto-fix"
- "Generated with" or "Co-Authored-By"
- Any reference to automation

**Good commit messages:**
- "fix: update metadata"
- "fix: lint errors"  
- "fix: update tests"
- "fix: typescript errors"

Message should describe what changed, not who did it.

## Paths

**CRITICAL: PROTECTED FILES ARE NEVER TOUCHED - ONLY ALLOWED FILES ARE FIXED**

**Don't touch (PROTECTED - NEVER MODIFY):**
- scripts/
- .github/
- .claude/
- config/
- node_modules/
- dist/
- .git/
- package.json, package-lock.json
- tsconfig.json
- requirements.txt, pyproject.toml
- docker-compose.yml, Dockerfile
- jest.config.js ❌ (NEVER modify - add tests in test/ instead)
- All root config files

**Can modify (ALLOWED FILES ONLY):**
- lib/ ✅
- test/ ✅ (add tests here to meet coverage requirements)
- tests/ ✅ (add tests here to meet coverage requirements)
- bin/ ✅
- metadata.json ✅
- cdk.json ✅
- cdktf.json ✅
- Pulumi.yaml ✅
- tap.py ✅
- tap.ts ✅

**Coverage Rule:** If coverage is low, ADD tests in `test/` or `tests/` directory according to `lib/` code. NEVER modify `jest.config.js`.

**BEFORE modifying ANY file, validate it's in the allowed list above.**

## Commands

| Command | What it does |
|---------|--------------|
| `/synth-fixer 8543` | Fix PR |
| `/synth-fixer --status 8543` | Check status |

Details in `.claude/agents/synth-fixer.md`

## NEW REQUIRED FIELD: wave

**CRITICAL**: The `wave` field is now REQUIRED in metadata.json

### Valid Values:
- `P0` - Priority 0 (High priority tasks)
- `P1` - Priority 1 (Normal priority tasks)

### Fix Pattern:
```bash
# Add wave field if missing (default to P1)
jq '. + {wave: "P1"}' metadata.json > tmp.json && mv tmp.json metadata.json
```

### Schema Requirement:
```json
"wave": {
  "type": "string",
  "enum": ["P0", "P1"]
}
```
