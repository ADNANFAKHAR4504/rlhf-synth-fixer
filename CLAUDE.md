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
- bin/
- tap.ts
- tap.py
- metadata.json
- execution-output.md
- cdk.json
- cdktf.json
- Pulumi.yaml

**NO PERMISSION:**
- package.json
- package-lock.json
- tsconfig.json
- requirements.txt
- pyproject.toml
- jest.config.js

## Commands

| Command | What it does |
|---------|--------------|
| `/synth-fixer 8543` | Fix PR |
| `/synth-fixer --status 8543` | Check status |

Details in `.claude/agents/synth-fixer.md`

## REQUIRED FIELD: wave

**CRITICAL**: The `wave` field is REQUIRED and must ALWAYS be "P0"

### Rule:
- `wave` must ALWAYS be `"P0"` - no exceptions
- Synth team only uses P0

### Fix Pattern:
```bash
# Always set wave to P0
jq '.wave = "P0"' metadata.json > tmp.json && mv tmp.json metadata.json
```

### Schema Requirement:
```json
"wave": {
  "type": "string",
  "const": "P0"
}
```

## ⚠️ Tests Failing Due to Missing Resources

**STRATEGY**: If a test fails because actual AWS resource doesn't exist:
1.  **Analyze**: Check the test file directly to understand the failure.
2.  **Resolve**: Try to fix the logic or mock the resource first.
3.  **Remove**: ONLY remove the failing test if it cannot be fixed or mocked.
4.  **Add**: If a test is removed, add other relevant tests to maintain coverage.

**Common "ResourceNotFound" Errors:**
- `ResourceNotFoundException`, `NoSuchBucket`, `NoSuchKey`, `Table not found`, `Function not found`, `DBInstance not found`, `Queue does not exist`, `Cannot read properties of undefined`.

## LocalStack Pro & Unsupported Services

**We have LocalStack Pro.** This means:
- RDS, EKS, ElastiCache, OpenSearch, MSK, etc. are **SUPPORTED**.
- **DO NOT REMOVE** these services if they are used.

**TRULY UNSUPPORTED (Must REMOVE even in Pro):**
- AppSync, Amplify, SageMaker, Bedrock, Kendra, Lex, etc.
- If these appear in code or logs: **COMMENT OUT or REMOVE** the code.
- Always check `.claude/agents/synth-fixer.md` for the full list.

## Output Format

**ALWAYS** use "SYNTH-AGENT" label for code blocks.
Example:
```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🤖 SYNTH-AGENT [PR #8539] is applying fixes...                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
