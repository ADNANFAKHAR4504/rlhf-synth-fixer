# Production-Ready Workflow for LocalStack PRs

## Overview

This guide describes how to ensure your LocalStack PRs pass CI/CD on the **first attempt** by running comprehensive local validation before pushing.

## The Problem

CI/CD iterations are expensive:
- Each run takes 20-40 minutes
- Failed runs waste time and resources
- Multiple iterations delay PR merges

## The Solution

Run the same checks locally that CI/CD runs, **before** pushing.

## Quick Start

### Option 1: Quick Check (30 seconds)

For fast iteration during development:

```bash
# Navigate to your task directory
cd worktree/ls-Pr<NUMBER>

# Run quick validation
bash .claude/scripts/quick-check.sh
```

This checks:
- ✅ metadata.json validity
- ✅ provider=localstack
- ✅ wave field (P0/P1)
- ✅ No disallowed fields
- ✅ No emojis in lib/*.md
- ✅ Commit message format
- ✅ TypeScript compilation
- ✅ Jest config folder
- ✅ Required docs (synth tasks)
- ✅ IDEAL_RESPONSE.md

### Option 2: Full Production Check (2-5 minutes)

Before pushing to GitHub:

```bash
# Standard check
bash .claude/scripts/production-ready-check.sh

# With auto-fix
bash .claude/scripts/production-ready-check.sh --fix

# Full check including deploy/tests
bash .claude/scripts/production-ready-check.sh --full
```

This simulates ALL 14 CI/CD jobs:
1. detect-metadata
2. claude-review-prompt-quality
3. validate-commit-message
4. validate-jest-config
5. build
6. synth
7. deploy (with --full)
8. lint
9. unit-tests
10. integration-tests-live (with --full)
11. cleanup
12. claude-review-ideal-response
13. archive-folders

### Option 3: Automatic Pre-Push Hook

Install the git hook for automatic validation:

```bash
bash .claude/scripts/install-hooks.sh
```

Now every `git push` will automatically run quick checks!

## Workflow Recommendations

### Daily Development Workflow

```bash
# 1. Start LocalStack (once per session)
bash scripts/localstack-start.sh

# 2. Make your changes...

# 3. Quick check before committing
bash .claude/scripts/quick-check.sh

# 4. Commit with conventional format
git commit -m "feat(localstack): your description"

# 5. Full check before pushing
bash .claude/scripts/production-ready-check.sh --fix

# 6. Push (if all checks pass)
git push origin HEAD
```

### When Working with Claude

Tell Claude to follow this workflow:

```
Before making changes, run:
bash .claude/scripts/quick-check.sh

After making changes:
1. Run: bash .claude/scripts/production-ready-check.sh --fix
2. Fix any remaining issues
3. Only commit when all checks pass
```

## Common Issues and Fixes

### 1. Prompt Quality Failures

**Error:** `Prompt quality validation FAILED`

**Fix:**
```bash
bash .claude/scripts/fix-prompt-quality.sh lib/PROMPT.md
```

Common issues:
- Too many parentheses (max 1 allowed)
- Using "e.g.", "i.e." instead of natural language
- Template brackets [like this]
- Missing service connectivity keywords

### 2. Metadata Issues

**Error:** `Missing required fields` or `Found disallowed fields`

**Fix:**
```bash
bash .claude/scripts/localstack-sanitize-metadata.sh metadata.json
```

Or use auto-fix:
```bash
bash .claude/scripts/production-ready-check.sh --fix
```

### 3. Emojis in lib/*.md

**Error:** `Emojis found in lib/*.md`

**Fix:**
```bash
# Auto-remove emojis
perl -pi -e 's/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]//g' lib/*.md
```

### 4. Commit Message Format

**Error:** `Commit message doesn't follow conventional commits`

**Fix:**
```bash
git commit --amend -m "feat(localstack): your description"
```

Valid formats:
- `feat(scope): description`
- `fix(scope): description`
- `docs(scope): description`
- `chore(scope): description`

### 5. Jest Config Wrong Folder

**Error:** `jest.config.js uses 'tests/' but should use 'test/'`

**Fix:**
Edit `jest.config.js`:
```javascript
// Change this:
roots: ['<rootDir>/tests']

// To this:
roots: ['<rootDir>/test']
```

### 6. Missing IDEAL_RESPONSE.md

**Error:** `lib/IDEAL_RESPONSE.md not found`

**Fix:**
```bash
bash .claude/scripts/localstack-generate-ideal-response.sh
```

## Script Reference

| Script | Purpose | Duration |
|--------|---------|----------|
| `quick-check.sh` | Fast pre-commit validation | ~30 sec |
| `production-ready-check.sh` | Full CI/CD simulation | 2-5 min |
| `production-ready-check.sh --fix` | Auto-fix + validate | 2-5 min |
| `production-ready-check.sh --full` | Including deploy/tests | 5-15 min |
| `localstack-ci-simulate.sh` | Complete CI simulation | 5-15 min |
| `localstack-prevalidate.sh` | Pre-validation with fixes | 2-5 min |
| `install-hooks.sh` | Install git hooks | instant |

## CI/CD Job Mapping

| Local Check | CI/CD Job |
|-------------|-----------|
| metadata validation | detect-metadata |
| prompt quality | claude-review-prompt-quality |
| commit format | validate-commit-message |
| jest config | validate-jest-config |
| npm install/build | build |
| cdk/tf synth | synth |
| localstack deploy | deploy |
| npm run lint | lint |
| npm test | unit-tests |
| integration tests | integration-tests-live |
| IDEAL_RESPONSE check | claude-review-ideal-response |

## Success Metrics

With this workflow, you should achieve:
- **First-time CI pass rate:** >90% (vs ~50% without)
- **Average iterations to merge:** 1-2 (vs 5-10 without)
- **Time saved per PR:** 1-3 hours

## Troubleshooting

### LocalStack not running

```bash
# Start LocalStack
bash scripts/localstack-start.sh

# Check status
curl http://localhost:4566/_localstack/health
```

### Quick check passes but full check fails

Run full check for detailed output:
```bash
bash .claude/scripts/production-ready-check.sh --verbose
```

### Pre-push hook blocking commits

To bypass (not recommended):
```bash
git push --no-verify
```

To remove hook:
```bash
bash .claude/scripts/install-hooks.sh --remove
```

