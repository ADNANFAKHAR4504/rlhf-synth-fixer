# Working Directory Guide

## Context Problem

Agents operate in git worktrees, which can cause confusion about:
- Where files are located (relative vs absolute paths)
- Which commands work in which directory
- When to change directories
- How to verify location

This guide clarifies working directory context for all agents.

## ⚠️ CRITICAL: Mandatory Verification Requirement

**ALL agents MUST verify their location before ANY file operations.**

Context switching between main repo and worktree is inherently dangerous and has caused:
- Files created in wrong directory
- Changes committed to wrong branch
- Template files copied to main repo instead of worktree

**ENFORCEMENT**: Use the automated verification script:

```bash
# At the start of EVERY agent phase:
bash .claude/scripts/verify-worktree.sh || exit 1

# This will:
# ✅ Verify you're in worktree (not main repo)
# ✅ Verify branch matches directory name
# ✅ Verify metadata.json exists
# ✅ Prevent operations on main branch
# ✅ Export WORKTREE_DIR environment variable
```

**This is NOT optional - it is MANDATORY for all sub-agents.**

---

## Two Directory Contexts

### Context 1: Main Repository (Coordinator Only)
**Location**: `/Users/.../iac-test-automations/`
**When**: Task selection, worktree setup, PR finalization, CSV updates
**Who**: task-coordinator only

**Verification**:
```bash
pwd
# Output should be: .../iac-test-automations (NOT inside worktree/)

# Verify main files exist
ls .claude/tasks.csv .claude/ templates/
```

**Key Files**:
- `.claude/tasks.csv` - Task list
- `.claude/` - Agent instructions
- `templates/` - Platform templates
- `.claude/scripts/` - Utility scripts

### Context 2: Worktree (All Sub-Agents)
**Location**: `/Users/.../iac-test-automations/worktree/synth-{task_id}/`
**When**: Code generation, QA, testing, review
**Who**: iac-infra-generator, iac-infra-qa-trainer, iac-code-reviewer

**Verification (MANDATORY)**:
```bash
# REQUIRED: Run automated verification before ANY operations
bash .claude/scripts/verify-worktree.sh || exit 1

# Alternative manual verification (only if automated script unavailable):
pwd
# Output MUST end with: /worktree/synth-{task_id}

# Verify worktree structure
ls .claude/ lib/ test/ metadata.json

# Verify branch
git branch --show-current
# Output MUST be: synth-{task_id}
```

**After Verification**:
```bash
# The script exports these variables for your use:
echo $WORKTREE_DIR  # Full path to worktree
echo $TASK_BRANCH   # synth-{task_id}
echo $TASK_ID       # {task_id}
```

**Key Files**:
- `metadata.json` - Task metadata
- `lib/` - Infrastructure code
- `test/` or `tests/` - Test code
- `.claude/` - Agent instructions (symlinked from main)
- `lib/PROMPT.md` - Requirements
- `lib/MODEL_RESPONSE.md` - Generated code
- `lib/IDEAL_RESPONSE.md` - Final code
- `lib/MODEL_FAILURES.md` - Fix documentation

---

## Verification Commands

### At Start of Agent Execution

**Every agent should run this verification block**:

```bash
# Verify working directory
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Check if in worktree (for sub-agents)
if [[ "$CURRENT_DIR" =~ worktree/synth-[^/]+$ ]]; then
    echo "✅ In worktree directory"

    # Verify branch matches directory
    EXPECTED_BRANCH=$(basename "$CURRENT_DIR")
    ACTUAL_BRANCH=$(git branch --show-current)

    if [ "$EXPECTED_BRANCH" = "$ACTUAL_BRANCH" ]; then
        echo "✅ Branch matches: $ACTUAL_BRANCH"
    else
        echo "❌ ERROR: Branch mismatch"
        echo "   Expected: $EXPECTED_BRANCH"
        echo "   Actual: $ACTUAL_BRANCH"
        exit 1
    fi

    # Verify required files
    if [ ! -f metadata.json ]; then
        echo "❌ ERROR: metadata.json not found"
        exit 1
    fi

    echo "✅ All verifications passed"
else
    echo "❌ ERROR: Not in worktree directory"
    echo "   Current: $CURRENT_DIR"
    echo "   Expected pattern: */worktree/synth-{task_id}"
    exit 1
fi
```

### Quick Verification (One-Liner)

```bash
# Quick check for worktree location
[[ $(pwd) =~ worktree/synth-[^/]+$ ]] && echo "✅ In worktree" || echo "❌ Wrong location"
```

---

## Path Rules

### Rule 1: Always Use Relative Paths in Worktree

**When in worktree**, all paths are relative to current directory:

```bash
# ✅ CORRECT (relative paths)
cat metadata.json
ls lib/
npm run test
bash .claude/scripts/pre-validate-iac.sh
jq -r '.platform' metadata.json

# ❌ WRONG (absolute paths from main repo)
cat /Users/.../iac-test-automations/metadata.json
ls /Users/.../iac-test-automations/lib/
```

**Why**: Worktree has its own copy of files. Absolute paths reference main repo, not worktree.

### Rule 2: Reference Main Repo Only for Shared Resources

**Shared resources** live in main repo and are accessed by agents:

```bash
# ✅ CORRECT (shared resources)
bash .claude/scripts/task-manager.sh          # Utility script
cat .claude/validation-checkpoints.md          # Reference doc
ls templates/cdk-ts/                           # Template directory

# These work because .claude/ is symlinked in worktree
```

### Rule 3: Change Directory Explicitly When Needed

**When task-coordinator needs to update CSV** (Phase 5):

```bash
# Currently in worktree
pwd  # .../worktree/synth-{task_id}

# Need to return to main repo for CSV update
cd ../..

# Verify location
pwd  # .../iac-test-automations (main repo)

# Now can update CSV
./.claude/scripts/task-manager.sh mark-done "${TASK_ID}" "${PR_NUMBER}"

# Do NOT return to worktree (it will be removed)
```

---

## Common Mistakes

### Mistake 1: Using Absolute Paths

```bash
# ❌ WRONG
cat /Users/mayanksethi/Projects/turing/iac-test-automations/worktree/synth-123/metadata.json

# ✅ CORRECT
cat metadata.json
```

### Mistake 2: Forgetting to Verify Location

```bash
# ❌ WRONG (assume location)
npm run build

# ✅ CORRECT (verify first)
pwd  # Check location
[[ $(pwd) =~ worktree/synth-[^/]+$ ]] && echo "OK" || exit 1
npm run build
```

### Mistake 3: Changing Directory Without Need

```bash
# ❌ WRONG (unnecessary cd)
cd lib/
cat PROMPT.md
cd ..

# ✅ CORRECT (use relative path)
cat lib/PROMPT.md
```

### Mistake 4: Mixing Main Repo and Worktree References

```bash
# ❌ WRONG (inconsistent context)
cd worktree/synth-123
cat ../../.claude/tasks.csv  # This references main repo .claude/tasks.csv, not worktree

# ✅ CORRECT (stay in one context)
# If need .claude/tasks.csv, don't be in worktree
# If need metadata.json, be in worktree
```

---

## Agent-Specific Guidelines

### task-coordinator

**Operates in BOTH contexts**:

1. **Phase 1 (Task Selection)**: Main repo
   ```bash
   pwd  # .../iac-test-automations
   cat .claude/tasks.csv
   ```

2. **Setup Worktree**: Create and enter
   ```bash
   git worktree add worktree/synth-{task_id} -b synth-{task_id}
   cd worktree/synth-{task_id}
   pwd  # .../iac-test-automations/worktree/synth-{task_id}
   ```

3. **Phases 2-4**: Remain in worktree, delegate to sub-agents

4. **Phase 5 (PR Creation)**: Start in worktree, return to main for CSV
   ```bash
   pwd  # .../worktree/synth-{task_id}
   # ... create PR ...
   cd ../..
   pwd  # .../iac-test-automations
   # ... update CSV ...
   ```

### iac-infra-generator

**Operates ONLY in worktree**:

```bash
# Verify at start
pwd  # MUST be: .../worktree/synth-{task_id}

# All operations relative
cat metadata.json
ls lib/
echo "us-east-1" > lib/AWS_REGION
```

**Never changes directory**

### iac-infra-qa-trainer

**Operates ONLY in worktree**:

```bash
# Verify at start
pwd  # MUST be: .../worktree/synth-{task_id}

# All operations relative
npm ci
npm run build
npm run test
aws cloudformation describe-stacks --stack-name TapStack${ENVIRONMENT_SUFFIX}
```

**Never changes directory**

### iac-code-reviewer

**Operates ONLY in worktree**:

```bash
# Verify at start
pwd  # MUST be: .../worktree/synth-{task_id}

# All operations relative
cat lib/PROMPT.md
cat lib/MODEL_RESPONSE.md
cat lib/IDEAL_RESPONSE.md
jq '.training_quality' metadata.json
```

**Never changes directory**

---

## File Location Reference

### Always in Main Repo (Never Copied to Worktree)

| File | Location | Access From Worktree |
|------|----------|----------------------|
| .claude/tasks.csv | Main repo .claude/ | Not accessible (don't try) |
| .claude/scripts/task-manager.sh | Main repo .claude/scripts/ | Via .claude/ symlink |

### Always in Worktree (Never in Main Repo)

| File | Location | Purpose |
|------|----------|---------|
| metadata.json | Worktree root | Task metadata |
| lib/PROMPT.md | Worktree lib/ | Requirements |
| lib/MODEL_RESPONSE.md | Worktree lib/ | Generated code |
| lib/IDEAL_RESPONSE.md | Worktree lib/ | Final code |
| lib/MODEL_FAILURES.md | Worktree lib/ | Fix documentation |
| cfn-outputs/ | Worktree root | Deployment outputs |

### Shared (Accessible from Both)

| File | Location | Access |
|------|----------|--------|
| .claude/*.md | Main repo | Symlinked to worktree |
| .claude/scripts/*.sh | Main repo | Symlinked to worktree |
| templates/ | Main repo | Copied to worktree during setup |

---

## Troubleshooting

### Error: "metadata.json not found"

**Cause**: Not in worktree directory

**Fix**:
```bash
pwd  # Check location
# If not in worktree:
cd worktree/synth-{task_id}
# Verify:
ls metadata.json
```

### Error: ".claude/tasks.csv not found"

**Cause**: In worktree, trying to access main repo file

**Fix**:
```bash
# Return to main repo
cd ../..
pwd  # Should be: .../iac-test-automations
ls .claude/tasks.csv
```

### Error: "Branch mismatch"

**Cause**: Git branch doesn't match worktree directory name

**Fix**:
```bash
# Check current branch
git branch --show-current

# Check directory name
basename $(pwd)

# If mismatch, worktree setup failed
# Return to main repo and recreate worktree:
cd ../..
git worktree remove worktree/synth-{task_id} --force
git worktree add worktree/synth-{task_id} -b synth-{task_id}
```

### Error: "Command not found" (for scripts)

**Cause**: Running script with wrong path

**Fix**:
```bash
# ❌ WRONG
.claude/scripts/pre-validate-iac.sh

# ✅ CORRECT (include ./ or full path)
./.claude/scripts/pre-validate-iac.sh
bash .claude/scripts/pre-validate-iac.sh
```

---

## Best Practices

### 1. Verify Location at Agent Start

Every agent should verify location before doing ANY file operations:

```bash
# In agent prompt: "Before Starting" section
pwd
[[ $(pwd) =~ worktree/synth-[^/]+$ ]] && echo "✅ Location verified" || exit 1
```

### 2. Use Relative Paths Exclusively

Within worktree, always use relative paths:

```bash
# ✅ CORRECT
cat lib/PROMPT.md
npm run test
jq -r '.platform' metadata.json

# ❌ WRONG
cat /absolute/path/to/worktree/lib/PROMPT.md
```

### 3. Never Assume Location

Always verify before critical operations:

```bash
# Before deployment
pwd
git branch --show-current
ls metadata.json

# Before CSV update
pwd
ls .claude/tasks.csv
```

### 4. Document Directory Changes

If changing directory, comment why:

```bash
# Return to main repo for CSV update (worktree will be removed)
cd ../..
pwd  # Verify: .../iac-test-automations
```

### 5. Use Verification Script

Create a reusable verification:

```bash
# .claude/scripts/verify-worktree.sh
#!/bin/bash
if [[ ! $(pwd) =~ worktree/synth-[^/]+$ ]]; then
    echo "❌ ERROR: Not in worktree"
    echo "Current: $(pwd)"
    exit 1
fi

BRANCH=$(git branch --show-current)
DIR=$(basename $(pwd))
if [ "$BRANCH" != "$DIR" ]; then
    echo "❌ ERROR: Branch mismatch"
    echo "Branch: $BRANCH"
    echo "Directory: $DIR"
    exit 1
fi

echo "✅ Worktree verified: $(pwd)"
exit 0
```

Usage:
```bash
bash .claude/scripts/verify-worktree.sh && npm run build
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│ WORKING DIRECTORY QUICK REFERENCE                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Main Repo:     .../iac-test-automations/               │
│ Worktree:      .../iac-test-automations/worktree/      │
│                      synth-{task_id}/                   │
│                                                         │
│ Verify Location:                                        │
│   pwd                                                   │
│   [[ $(pwd) =~ worktree/synth-[^/]+$ ]]               │
│                                                         │
│ Verify Branch:                                          │
│   git branch --show-current                            │
│                                                         │
│ Change to Worktree:                                     │
│   cd worktree/synth-{task_id}                          │
│                                                         │
│ Return to Main:                                         │
│   cd ../..                                              │
│                                                         │
│ RULE: Sub-agents NEVER leave worktree                  │
│ RULE: Use relative paths in worktree                   │
│ RULE: Verify location before operations                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

- **Two contexts**: Main repo (coordinator) vs Worktree (sub-agents)
- **Verify location**: Always check pwd and branch before operations
- **Use relative paths**: Never use absolute paths in worktree
- **Stay in context**: Sub-agents never leave worktree
- **One directory change**: task-coordinator returns to main for CSV update only

**Key Principle**: "Know where you are, verify it, stay there."
