# Phase Naming Convention

Standardized naming convention for all phases across all agents in the IaC development lifecycle.

## Format Standard

**Format**: `PHASE X.Y: [Descriptive Name]`

### Rules

1. **Capitalization**: Always use uppercase `PHASE` in status reports and phase headers
2. **Numbering**:
   - Whole numbers (1, 2, 3, 4, 5) for major phases
   - Single decimal (1.1, 1.2, 2.1, 2.2) for sub-phases
   - Double decimal (2.1.1, 2.1.2) only for micro-steps (avoid if possible)
3. **Naming**: Use descriptive names in Title Case
4. **Consistency**: All agents must follow this format

## Status Reporting Format

All agents MUST use this standardized format:

```markdown
**AGENT STATUS**: PHASE X.Y - [STATUS] - [CURRENT_STEP]
**TASK**: [Specific task being worked on]
**PROGRESS**: [X.Y/Z] phases completed
**NEXT ACTION**: [Next planned action]
**ISSUES**: [Blocking issues or NONE]
**BLOCKED**: [YES/NO - If YES, explain and resolution needed]
```

## Phase Mapping by Agent

### task-coordinator

| Phase | Name | Agent |
|-------|------|-------|
| PHASE 1 | Task Selection & Setup | task-coordinator |
| PHASE 1.1 | Task Selection | iac-task-selector |
| PHASE 1.2 | Task Validation & Setup | task-coordinator |
| PHASE 2 | Code Generation | iac-infra-generator |
| PHASE 3 | QA Training & Validation | iac-infra-qa-trainer |
| PHASE 4 | Code Review & Compliance | iac-code-reviewer |
| PHASE 5 | PR Creation & Task Completion | task-coordinator |

### iac-task-selector

| Phase | Name | Description |
|-------|------|-------------|
| PHASE 1.1 | Task Selection | Select task from CSV or prompt user |

### iac-infra-generator

| Phase | Name | Description |
|-------|------|-------------|
| PHASE 0 | Pre-Generation Validation | Verify worktree, validate metadata.json |
| PHASE 1 | Analyze Configuration | Extract platform/language, validate requirements |
| PHASE 2 | Code Generation | Generate IaC code based on requirements |

### iac-infra-qa-trainer

| Phase | Name | Description |
|-------|------|-------------|
| PHASE 0 | Pre-QA Validation | Verify worktree, validate prerequisites |
| PHASE 3 | QA Training & Validation | Execute QA pipeline (lint, build, deploy, test) |

### iac-code-reviewer

| Phase | Name | Description |
|-------|------|-------------|
| PHASE 0 | Pre-Review Validation | Verify worktree, validate prerequisites |
| PHASE 1 | Prerequisites Check | Verify required files exist |
| PHASE 1.1 | Metadata Enhancement & Compliance | Update metadata.json, validate compliance |
| PHASE 2 | Code Quality Review | Review code quality and patterns |
| PHASE 3 | Test Coverage Review | Validate 100% test coverage |
| PHASE 4 | Training Quality Assessment & Code Review | Calculate training_quality score and final compliance check |

### iac-synth-trainer

| Phase | Name | Description |
|-------|------|-------------|
| PHASE 0 | Pre-Execution Validation | Review documentation, verify scripts |
| PHASE 1 | PR Selection | Load PR status, check availability |
| PHASE 1.1 | Atomic PR Selection | Atomically select next PR (thread-safe) |
| PHASE 2 | PR Processing Loop | Main processing loop for fixing PRs |
| PHASE 2.1 | Pre-Fix Analysis | Document root cause, create fix plan |
| PHASE 2.2 | Worktree Setup | Create isolated worktree, validate location |
| PHASE 2.3 | Failure Analysis | Analyze GitHub pipeline failures in detail |
| PHASE 2.4 | Pre-Deployment Validation | Run pre-validate-iac.sh (cost optimization) |
| PHASE 2.5 | Apply Fixes | Fix issues stage by stage |
| PHASE 2.6 | Local Validation | Validate all fixes locally |
| PHASE 2.7 | Quality Gates | Verify all quality gates pass |
| PHASE 2.8 | Commit & Push | Commit fixes and push to PR branch |
| PHASE 2.9 | Monitor Pipeline | Wait for ALL GitHub pipeline stages to pass |
| PHASE 2.10 | Update Status | Mark as fixed/failed with progress tracking |
| PHASE 2.11 | Cleanup | Remove worktrees after completion |
| PHASE 3 | Final Summary | Generate final summary report |

## Migration Guide

### Old → New Phase Names

**task-coordinator**:
- `Phase 1` → `PHASE 1: Task Selection & Setup`
- `Phase 1.5` → `PHASE 1.2: Task Validation & Setup`
- `Phase 2` → `PHASE 2: Code Generation`
- `Phase 3` → `PHASE 3: QA Training & Validation`
- `Phase 4` → `PHASE 4: Code Review & Compliance`
- `Phase 5` → `PHASE 5: PR Creation & Task Completion`

**iac-synth-trainer**:
- `Phase 0` → `PHASE 0: Pre-Execution Validation`
- `Phase 1` → `PHASE 1: PR Selection`
- `Phase 1.5` → `PHASE 1.1: Atomic PR Selection`
- `Phase 2.0` → `PHASE 2.1: Pre-Fix Analysis`
- `Phase 2.2` → `PHASE 2.2: Worktree Setup`
- `Phase 2.4` → `PHASE 2.3: Failure Analysis`
- `Phase 2.5` → `PHASE 2.4: Pre-Deployment Validation`
- `Phase 2.6` → `PHASE 2.6: Local Validation`
- `Phase 2.6.5` → `PHASE 2.7: Quality Gates`
- `Phase 2.7` → `PHASE 2.8: Commit & Push`
- `Phase 2.8` → `PHASE 2.9: Monitor Pipeline`
- `Phase 2.10` → `PHASE 2.10: Update Status`
- `Phase 2.11` → `PHASE 2.11: Cleanup`
- `Phase 2.12` → `PHASE 2.11: PR Completion` (Note: consolidated)
- `Phase 3` → `PHASE 3: Final Summary`

## Examples

### Status Report Examples

**Before**:
```markdown
**AGENT STATUS**: Phase 1.5 - [STATUS] - [CURRENT_STEP]
**SYNTH TRAINER STATUS**: PHASE 2.0 - ANALYSIS COMPLETE
```

**After**:
```markdown
**AGENT STATUS**: PHASE 1.2 - VALIDATION - Task setup validated
**SYNTH TRAINER STATUS**: PHASE 2.1 - ANALYSIS COMPLETE - Root cause documented
```

### Phase Header Examples

**Before**:
```markdown
### Phase 1.5: Validate Task Selection and Setup
### PHASE 0: Pre-Generation Validation (CRITICAL)
```

**After**:
```markdown
### PHASE 1.2: Task Validation & Setup
### PHASE 0: Pre-Generation Validation
```

## Enforcement

- All new phases MUST follow this convention
- Existing phases should be migrated when files are updated
- Status reports MUST use uppercase `PHASE` format
- Phase numbers should be sequential and logical

## References

- Status Reporting: `.claude/docs/references/error-handling.md`
- Validation Checkpoints: `.claude/docs/references/validation-checkpoints.md`
- Task Coordinator: `.claude/commands/task-coordinator.md`

