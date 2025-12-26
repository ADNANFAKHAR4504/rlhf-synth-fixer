---
name: local-ci-runner
description: 🏠 LOCAL-CI - Run all CI stages locally before push
---

# Local CI Runner

Run all CI/CD stages locally on worktree before pushing to remote.

## ⛔⛔⛔ STEP 0: CHANGE TO CORRECT REPO FIRST! ⛔⛔⛔

**EXECUTE THIS BEFORE ANYTHING ELSE!**

```bash
# 0.1 Load config
source /home/adnan/Desktop/rlhf-synth-fixer/config.env

# 0.2 CHANGE TO IAC-TEST-AUTOMATIONS (NOT rlhf-synth-fixer!)
cd /home/adnan/turing/iac-test-automations
echo "Current repo: $(pwd)"
# MUST show: /home/adnan/turing/iac-test-automations

# 0.3 Fetch latest
git fetch origin

# 0.4 Export LocalStack/AWS credentials (REQUIRED for deploy!)
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-east-1"
export AWS_ENDPOINT_URL="http://localhost:4566"
export LOCALSTACK_AUTH_TOKEN="ls-GeQerAMa-NEJe-5207-bego-REhoNUvAc589"
echo "✓ AWS/LocalStack credentials exported"
```

**⛔ DO NOT PROCEED UNTIL YOU ARE IN `/home/adnan/turing/iac-test-automations`!**

---

## ⛔ NEXT: REMOVE "HEY TEAM"!

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

## ⚠️ COMPLETE FLOW (MUST FOLLOW!)

### STEP 0: Go to correct repo
```bash
cd /home/adnan/turing/iac-test-automations
git fetch origin
```

### STEP 1: Get PR branch and create worktree
```bash
PR_NUMBER=$ARGUMENTS
BRANCH=$(gh pr view $PR_NUMBER --json headRefName -q '.headRefName')
echo "Branch: $BRANCH"

# Create worktree
git worktree remove worktree/synth-fixer-$PR_NUMBER --force 2>/dev/null || true
git worktree add worktree/synth-fixer-$PR_NUMBER origin/$BRANCH
cd worktree/synth-fixer-$PR_NUMBER
git checkout -B $BRANCH origin/$BRANCH
git pull origin $BRANCH --rebase
```

### STEP 2: Run CI stages in worktree...

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

