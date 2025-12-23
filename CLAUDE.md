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

**Don't touch:**
- scripts/
- .github/
- .claude/
- config/
- node_modules/
- dist/
- .git/

**Can modify (in worktree):**
- lib/
- test/
- metadata.json
- execution-output.md
- package.json (deps only)
- tsconfig.json
- cdk.json
- Pulumi.yaml
- jest.config.js (if coverage >= 80%)

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
