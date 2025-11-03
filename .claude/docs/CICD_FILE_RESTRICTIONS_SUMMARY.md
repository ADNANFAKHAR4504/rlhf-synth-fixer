# CI/CD File Restrictions - Implementation Summary

## Problem Identified

Synthetic tasks were frequently failing in the CI/CD pipeline at the "Check Project Files" step (line 74-76 in `.github/workflows/ci-cd.yml`). This step runs `./scripts/check-project-files.sh` which enforces strict file location restrictions.

## Root Cause

The `check-project-files.sh` script only allows files in specific locations:
- **Allowed folders**: `bin/`, `lib/`, `test/`, `tests/`
- **Allowed root files**: `package.json`, `package-lock.json`, `cdk.json`, `tap.py`, `tap.go`, `cdktf.json`, `Pulumi.yaml`, `metadata.json`

Any files created outside these locations will cause the entire CI/CD pipeline to fail immediately, preventing build, synth, deploy, and all other steps from running.

## Common Violations

Before this fix, Claude agents were likely creating:
- ❌ `README.md` at root (should be `lib/README.md`)
- ❌ `PROMPT.md` at root (should be `lib/PROMPT.md`)
- ❌ `IDEAL_RESPONSE.md` at root (should be `lib/IDEAL_RESPONSE.md`)
- ❌ `MODEL_FAILURES.md` at root (should be `lib/MODEL_FAILURES.md`)
- ❌ Files in `docs/`, `.github/`, `scripts/`, etc. (not allowed)

## Solution Implemented

### 1. Created Comprehensive Documentation

**File**: `.claude/docs/references/cicd-file-restrictions.md`

This new documentation provides:
- Clear explanation of why this matters (CI/CD failure)
- Complete list of allowed file locations
- Common violations with fixes
- Agent-specific guidelines
- Validation commands
- Quick checklist
- Reference to the actual `check-project-files.sh` script

### 2. Updated All Agent Instructions

Updated the following agent files to reference the new documentation:

#### `iac-infra-generator.md`
- Added reference in "Before Starting" section
- Added critical file location warnings in PHASE 2 (PROMPT.md generation)
- Added critical file location warnings in PHASE 4 (MODEL_RESPONSE.md generation)
- Added constraint about documentation files in lib/ folder

#### `iac-infra-qa-trainer.md`
- Added reference in "Before Starting" section
- Added critical warnings when creating IDEAL_RESPONSE.md
- Added critical warnings when creating MODEL_FAILURES.md
- Added constraint about documentation files in lib/ folder

#### `iac-code-reviewer.md`
- Added reference in "Before Starting" section
- **Added NEW Step 9: File Location Validation**
  - Runs before final quality gate
  - Checks all files are in allowed locations
  - -3 point training quality penalty for violations
  - Blocks PR creation if violations exist
- Updated Step 10 (formerly Step 9) to include file location check in final checklist

### 3. Added New Validation Checkpoint

**File**: `.claude/docs/references/validation-checkpoints.md`

- **New Checkpoint K: File Location Compliance**
  - Runs before PR creation
  - Used by `iac-code-reviewer` and `task-coordinator`
  - Mimics what `check-project-files.sh` will validate
  - Includes common violations table
  - Pass criteria: All files in allowed locations
  - Fail action: Block PR creation with -3 training quality penalty

- **Renamed old Checkpoint K to Checkpoint L** (PR Prerequisites)

- Updated Quick Reference Table to include new checkpoint

### 4. Updated Task Coordinator

**File**: `.claude/commands/task-coordinator.md`

- Updated Phase 5 pre-flight checks to include Checkpoint K (file location compliance)
- Added manual verification commands to check file locations
- Updated reference to Checkpoint L for PR prerequisites

### 5. Updated Shared Validations

**File**: `.claude/docs/references/shared-validations.md`

- Added new section at the top: "CI/CD File Location Requirements"
- Quick reference of allowed and forbidden locations
- Clear warning that violations = immediate CI/CD failure

### 6. Updated Documentation Index

**File**: `.claude/docs/README.md`

- Added `cicd-file-restrictions.md` to directory structure
- Added entry in References section with **CRITICAL** marker
- Linked to check-project-files.sh in description

## How This Fixes the Problem

### Before This Fix
1. Agent creates `README.md` at root level
2. Agent creates PR
3. PR triggers CI/CD pipeline
4. Pipeline runs `check-project-files.sh`
5. Script finds `README.md` at root (not in allowed list)
6. **Pipeline FAILS immediately** ❌
7. No build, no synth, no deploy - complete failure
8. Task marked as failed

### After This Fix
1. Agent reads `.claude/docs/references/cicd-file-restrictions.md` in "Before Starting"
2. Agent knows to create `lib/README.md` instead of root `README.md`
3. Agent creates all files in correct locations
4. `iac-code-reviewer` validates file locations (Step 9)
5. If violations found: Blocks PR creation, reports error, applies penalty
6. If no violations: Proceeds with PR creation
7. PR triggers CI/CD pipeline
8. Pipeline runs `check-project-files.sh`
9. Script validates all files are in allowed locations
10. **Pipeline PASSES** ✅
11. Build, synth, deploy, and all other steps proceed successfully

## Key Benefits

1. **Proactive Prevention**: Agents know the rules before creating files
2. **Early Detection**: `iac-code-reviewer` catches violations before PR creation
3. **Clear Guidance**: Comprehensive documentation with examples
4. **Training Quality Impact**: -3 point penalty ensures violations are taken seriously
5. **Reduced Failures**: Synthetic tasks will stop failing at check-project-files.sh

## Validation

The fix ensures that:
- ✅ All agents understand file location restrictions
- ✅ Critical warnings are shown when creating documentation files
- ✅ File locations are validated before PR creation
- ✅ Training quality score reflects file location compliance
- ✅ Clear documentation exists for troubleshooting

## Next Steps

When Claude agents generate synthetic tasks, they will now:
1. Read the file restrictions documentation
2. Create all files in correct locations (lib/, test/, bin/)
3. Have their file locations validated by `iac-code-reviewer`
4. Only create PRs if all files are in allowed locations
5. Pass the CI/CD `check-project-files.sh` validation

This should significantly reduce synthetic task failures in the pipeline.

## Reference

- CI/CD workflow: `.github/workflows/ci-cd.yml` (lines 74-76)
- Validation script: `scripts/check-project-files.sh`
- New documentation: `.claude/docs/references/cicd-file-restrictions.md`
- Validation checkpoint: `.claude/docs/references/validation-checkpoints.md` (Checkpoint K)

