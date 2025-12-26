---
name: local-ci-runner
description: 🏠 LOCAL-CI - Run all CI stages locally before push
---

# Local CI Runner

Run all CI/CD stages locally on worktree before pushing to remote.

## ⛔ FIRST THING: REMOVE "HEY TEAM"!

```bash
# EXECUTE IMMEDIATELY!
for f in lib/PROMPT.md PROMPT.md; do
  [ -f "$f" ] && sed -i '/^#*[[:space:]]*[Hh]ey [Tt]eam/d' "$f"
done
```

**⛔ DO NOT PUSH IF "HEY TEAM" EXISTS!**

## How to Use

```
/local-ci-runner 8543
/local-ci-runner <pr-number>
```

## What it Does

1. **PHASE 1: Worktree Setup** - Creates isolated worktree for PR
2. **PHASE 2: Protected Files Check** - Restores protected files from main
3. **PHASE 3: Local CI Stages** - Runs ALL CI stages locally:
   - Detect Project Files
   - Prompt Quality (removes "Hey team" etc.)
   - Commit Validation
   - Jest Config
   - Build
   - Synth
   - Lint
   - Unit Tests
   - Deploy (LocalStack)
   - Integration Tests
   - Claude Reviews (with API key)
   - IDEAL_RESPONSE validation
4. **PHASE 4: Push & Monitor** - Push only after ALL passes

## Output Format

All output uses LOCAL-CI branding:

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        🏠 LOCAL-CI RUNNER                                        ║
╚══════════════════════════════════════════════════════════════════════════════════╝

[LOCAL-CI] [PR #XXXX] Stage: <stage_name>
[LOCAL-CI] [PR #XXXX] ✅ PASSED: <stage>
[LOCAL-CI] [PR #XXXX] ❌ FAILED: <stage> - <reason>
```

## Key Rules

| Rule | Description |
|------|-------------|
| **PULL FIRST** | ⚠️ Always `git pull origin <branch>` first - don't ignore remote changes! |
| **ALL LOCAL** | Run ALL CI stages locally before push |
| **FIX LOOP** | Re-run failed stage until it passes |
| **NO "HEY TEAM"** | Remove informal greetings from PROMPT.md |
| **PROTECTED FILES** | Never modify: package.json, tsconfig.json, scripts/ |

## ⚠️ MANDATORY STAGES (DO NOT SKIP!)

| Stage | Script | Required? |
|-------|--------|-----------|
| **Detect** | `./scripts/detect-metadata.sh` | ✅ **MANDATORY** |
| **Prompt Quality** | `.claude/scripts/claude-validate-prompt-quality.sh` | ✅ **MANDATORY** |
| **Build** | `./scripts/build.sh` | ✅ **MANDATORY** |
| **Synth** | `./scripts/synth.sh` | ✅ **MANDATORY (CDK/CDKTF)** |
| **Lint** | `./scripts/lint.sh` | ✅ **MANDATORY** |
| **Unit Tests** | `./scripts/unit-tests.sh` | ✅ **MANDATORY** |
| **IDEAL_RESPONSE** | `.claude/scripts/validate-ideal-response.sh` | ✅ **MANDATORY** |

## Argument

- `$ARGUMENTS` - PR number to fix (e.g., `8543`)

See `.claude/agents/local-ci-runner.md` for full documentation.

