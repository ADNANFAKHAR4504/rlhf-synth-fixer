# Validation Checkpoints

Standardized validation checkpoints used across all phases. Reference by name to avoid duplication.

## Checkpoint A: Metadata Completeness

**When**: Before any code generation or processing
**Who**: task-coordinator (Phase 1.5), iac-infra-generator (Phase 0)

**Validation**:
```bash
# Verify all required fields exist in metadata.json
jq -e '.platform, .language, .complexity, .turn_type, .po_id, .team, .subtask, .subject_labels, .startedAt, .aws_services' metadata.json
```

**Pass criteria**: All fields present and non-null
**Fail action**: See error-handling.md Standard Error Response
**Reference**: See shared-validations.md for field definitions

---

## Checkpoint B: Platform-Language Compatibility

**When**: After metadata validation, before code generation
**Who**: task-coordinator (Phase 1.5), iac-infra-generator (Phase 0)

**Validation**:
```bash
# Extract and verify platform-language combination
PLATFORM=$(jq -r '.platform' metadata.json)
LANGUAGE=$(jq -r '.language' metadata.json)

# Check against compatibility matrix in shared-validations.md
bash ./.claude/scripts/validate-platform-lang.sh "$PLATFORM" "$LANGUAGE"
```

**Pass criteria**: Combination exists in compatibility matrix
**Fail action**: Report invalid combination, list valid options, stop
**Reference**: shared-validations.md Platform-Language Compatibility Matrix

---

## Checkpoint C: Template Structure

**When**: After worktree setup, before code generation
**Who**: task-coordinator (Phase 1.5)

**Validation**:
```bash
# Verify required directories and platform-specific files
test -d lib/ && test -d test/
# Platform-specific checks based on language
```

**Pass criteria**: Required directories exist, platform files present
**Fail action**: Report missing template files, stop
**Reference**: templates/ directory structure

---

## Checkpoint D: PROMPT.md Style Validation

**When**: After PROMPT.md generation, before MODEL_RESPONSE
**Who**: iac-infra-generator (Phase 2.5)

**Validation**:
```bash
# Check for AI-generated patterns (forbidden)
grep -E '(^ROLE:|^CONTEXT:|^CONSTRAINTS:|[✨🚀📊]|Here is a comprehensive)' lib/PROMPT.md

# Verify conversational opening
head -5 lib/PROMPT.md | grep -E '(Hey|Hi|We need)'

# Verify bold platform statement
grep -E '\*\*.*\swith\s.*\*\*' lib/PROMPT.md
```

**Pass criteria**: No AI patterns, has conversational opening, includes bold platform statement
**Fail action**: Regenerate PROMPT.md with correct style
**Reference**: shared-validations.md PROMPT.md Style Requirements

---

## Checkpoint E: Platform Code Compliance

**When**: After IDEAL_RESPONSE generation, before reporting ready
**Who**: iac-code-reviewer (Phase 1.5), iac-infra-qa-trainer (Section 1)

**Validation**:
```bash
# IMPORTANT: This validates lib/IDEAL_RESPONSE.md (the corrected final code)
# NOT lib/MODEL_RESPONSE.md (the initial model output that may have errors)
#
# The script automatically:
# - Reads platform/language from metadata.json
# - Detects actual platform/language in lib/IDEAL_RESPONSE.md
# - Compares and reports match/mismatch

bash ./.claude/scripts/validate-code-platform.sh
```

**Pass criteria**:
- IDEAL_RESPONSE.md code matches metadata.json platform and language
- Script exits with code 0

**Fail action**:
- CRITICAL - platform/language mismatch detected
- Review IDEAL_RESPONSE.md and ensure it matches project structure
- Check build files (pom.xml vs build.gradle), stack architecture, package names

**Reference**: shared-validations.md Platform Detection Patterns

**NOTE**: MODEL_RESPONSE.md may contain errors - that's expected! MODEL_FAILURES.md documents what was fixed. Only IDEAL_RESPONSE.md matters for this validation.

---

## Checkpoint F: environmentSuffix Usage

**When**: Before deployment
**Who**: iac-infra-qa-trainer (Pre-deployment validation)

**Validation**:
```bash
# Run pre-validation script
bash scripts/pre-validate-iac.sh

# Check resource naming includes environmentSuffix
# Must have ≥80% of resources with suffix
```

**Pass criteria**: ≥80% resource names include suffix, no hardcoded env values
**Fail action**: Fix resource naming, re-run validation
**Reference**: shared-validations.md Resource Naming Requirements

---

## Checkpoint G: Build Quality Gate

**When**: Before any deployment attempt
**Who**: iac-infra-qa-trainer (Section 2)

**Validation**:
```bash
# MANDATORY: All must pass
npm run lint      # or platform equivalent
npm run build     # or platform equivalent
npm run synth     # if applicable (CDK, Pulumi, CDKTF)
```

**Pass criteria**: All three commands exit with code 0
**Fail action**: Fix all errors before proceeding, do NOT attempt deployment
**Reference**: validation_and_testing_guide.md Phase 2

---

## Checkpoint H: Test Coverage

**When**: After deployment, before reporting ready
**Who**: iac-infra-qa-trainer (Section 4)

**Validation**:
```bash
# Unit tests with coverage
npm run test:coverage  # or platform equivalent

# Extract coverage percentage
COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)

# Check threshold
test "$COVERAGE" -ge 90
```

**Pass criteria**: ≥90% line coverage, all tests pass
**Fail action**: Add tests until coverage ≥90%
**Reference**: validation_and_testing_guide.md Phase 3

---

## Checkpoint I: Integration Test Quality

**When**: After deployment and unit tests
**Who**: iac-infra-qa-trainer (Section 4)

**Validation**:
```bash
# Verify integration tests use real outputs
test -f cfn-outputs/flat-outputs.json

# Check tests read from outputs (no hardcoded values)
# Check no mocking libraries used
grep -R 'jest.mock\|sinon\|Mockito' test/

# Run integration tests
npm run test:integration
```

**Pass criteria**: Tests use cfn-outputs, no mocking, all tests pass
**Fail action**: Rewrite tests to use live outputs
**Reference**: validation_and_testing_guide.md Phase 5

---

## Checkpoint J: Training Quality Threshold

**When**: Before PR creation
**Who**: iac-code-reviewer (Phase 4), task-coordinator (Phase 5)

**Validation**:
```bash
# Extract training_quality score
TRAINING_QUALITY=$(jq -r '.training_quality // 0' metadata.json)

# Check minimum threshold
test "$TRAINING_QUALITY" -ge 8
```

**Pass criteria**: training_quality ≥ 8
**Fail action**: Improve implementation, add features, re-assess quality
**Reference**: shared-validations.md Training Quality Scoring

---

## Checkpoint K: File Location Compliance

**When**: Before PR creation (after code-reviewer, before task-coordinator Phase 5)
**Who**: iac-code-reviewer (Phase 1.5 Step 9), task-coordinator (Phase 5)

**Validation**:
```bash
# Check what files will be in the PR
git diff --name-only origin/main...HEAD

# Verify all files are in allowed locations
# This mimics what scripts/check-project-files.sh will check in CI/CD

# Allowed folders: bin/, lib/, test/, tests/
# Allowed root files: metadata.json, cdk.json, cdktf.json, Pulumi.yaml, 
#                     tap.py, tap.go, package.json, package-lock.json

# Manual check - each file must match one of:
# - bin/*
# - lib/*
# - test/*
# - tests/*
# - metadata.json
# - cdk.json
# - cdktf.json
# - Pulumi.yaml
# - tap.py
# - tap.go
# - package.json
# - package-lock.json
```

**Pass criteria**: All files in allowed locations
**Fail action**: 
- Report: "❌ BLOCKED: Files in wrong locations will FAIL CI/CD"
- List violating files and correct locations
- Training quality penalty: -3 points
- Do NOT proceed to PR creation until fixed
**Reference**: cicd-file-restrictions.md

**Common Violations and Fixes**:
| Wrong Location | Correct Location |
|----------------|------------------|
| `/README.md` | `/lib/README.md` |
| `/PROMPT.md` | `/lib/PROMPT.md` |
| `/MODEL_RESPONSE.md` | `/lib/MODEL_RESPONSE.md` |
| `/IDEAL_RESPONSE.md` | `/lib/IDEAL_RESPONSE.md` |
| `/MODEL_FAILURES.md` | `/lib/MODEL_FAILURES.md` |
| `/lambda/handler.py` | `/lib/lambda/handler.py` |
| `/docs/*` | Not allowed |
| `/.github/*` | Not allowed (managed by repo) |
| `/scripts/*` | Not allowed (managed by repo) |

---

## Checkpoint L: PR Prerequisites

**When**: Before PR creation
**Who**: task-coordinator (Phase 5)

**Validation**:
```bash
# Verify gh CLI installed and authenticated
command -v gh && gh auth status

# Verify in worktree directory
pwd | grep -E 'worktree/synth-[^/]+$'

# Verify code-reviewer reported "Ready"
# Verify training_quality ≥ 8 (Checkpoint J)
# Verify file locations valid (Checkpoint K)
```

**Pass criteria**: All prerequisites met
**Fail action**: Install/configure gh, verify location, wait for ready status
**Reference**: error-handling.md PR Creation Failures

---

## Quick Reference Table

| Checkpoint | Phase | Agent | What | Pass Criteria |
|------------|-------|-------|------|---------------|
| A | 1.5, 2 | coordinator, generator | Metadata fields | All present |
| B | 1.5, 2 | coordinator, generator | Platform-lang | Valid combo |
| C | 1.5 | coordinator | Template files | Dirs exist |
| D | 2.5 | generator | PROMPT style | Human-style |
| E | 4, 3 | generator, qa-trainer | Code platform | Matches metadata |
| F | 3 | qa-trainer | environmentSuffix | ≥80% usage |
| G | 3 | qa-trainer | Build quality | Lint+build+synth pass |
| H | 3 | qa-trainer | Unit test coverage | ≥90% |
| I | 3 | qa-trainer | Integration tests | No mocking, uses outputs |
| J | 4, 5 | reviewer, coordinator | Training quality | ≥8/10 |
| K | 4, 5 | reviewer, coordinator | File locations | All in allowed locations |
| L | 5 | coordinator | PR prerequisites | gh + worktree + ready |

## Usage Pattern

In agent prompts, replace detailed validation blocks with:

```markdown
**Validation**: Run Checkpoint X: [Name]
- See validation-checkpoints.md for details
- On failure, see error-handling.md
```

This reduces ~200 lines of repeated validation logic across 4 files.
