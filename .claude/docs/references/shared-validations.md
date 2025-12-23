# Shared Validation Reference

This document contains common validation rules and requirements used across all agents. Reference this instead of duplicating validation logic.

## CI/CD File Location Requirements

**CRITICAL**: The CI/CD pipeline enforces strict file location restrictions. This is the #1 reason synthetic tasks fail.

**See `.claude/docs/references/cicd-file-restrictions.md` for complete rules.**

**Quick Reference**:

- ✅ All infrastructure code → `lib/`
- ✅ All tests → `test/` or `tests/`
- ✅ Entry points → `bin/`
- ✅ Documentation (PROMPT.md, IDEAL_RESPONSE.md, etc.) → `lib/`
- ✅ Lambda functions → `lib/lambda/`
- ❌ NO files at root except: `metadata.json`, `cdk.json`, `cdktf.json`, `Pulumi.yaml`, `tap.py`, `tap.go`, `package.json`, `package-lock.json`
- ❌ NO files in: `.github/`, `scripts/`, `docs/`, `.claude/`, `templates/`, etc.

**Violation = CI/CD pipeline fails immediately at check-project-files.sh**

## Metadata Required Fields

All tasks must have `metadata.json` with these fields:

```
platform: cdk | cdktf | cfn | tf | pulumi | cicd | analysis
language: ts | js | py | java | go | hcl | yaml | json | yml
complexity: medium | hard | expert
turn_type: single | multi
po_id: <task_id>
team: synth
subtask: <task_category>
subject_labels: <array>
startedAt: <ISO_timestamp>
aws_services: <array>
```

## Platform-Language Compatibility Matrix

Valid combinations from `cli/create-task.ts`:

| Platform | Valid Languages      |
| -------- | -------------------- |
| cdk      | ts, js, py, java, go |
| cdktf    | ts, py, go, java     |
| pulumi   | ts, js, py, java, go |
| tf       | hcl                  |
| cfn      | yaml, json           |
| cicd     | yaml, yml            |
| analysis | py                   |

**Note**: Normalize "python" to "py" in metadata.json

## Subject Label → Platform Requirements

**CRITICAL**: Some subject labels have STRICT platform/language requirements.

| Subject Label                      | Required Platform | Required Language |
| ---------------------------------- | ----------------- | ----------------- |
| Infrastructure Analysis/Monitoring | analysis          | py                |
| General Infrastructure Tooling QA  | analysis          | py                |
| CI/CD Pipeline                     | cicd              | yaml, yml         |

**Reference**: `.claude/docs/references/iac-subtasks-subject-labels.json` (single source of truth)

**Validation**: `.claude/scripts/validate-metadata.sh` enforces these requirements.

## Platform Detection Patterns

Use these patterns to verify generated code matches expected platform:

### CDK

- **Must have**: `import * as cdk from 'aws-cdk-lib'`, `new cdk.Stack` or `extends cdk.Stack`
- **Must NOT have**: Terraform/Pulumi/CDKTF imports

### Pulumi

- **Must have**: Language-specific Pulumi imports
  - Go: `package main` + `pulumi.Run()`
  - TypeScript: `import * as pulumi`
- **Must NOT have**: CDK/Terraform/CDKTF code

### Terraform (HCL)

- **Must have**: `provider "aws"`, `resource "aws_*"`
- **Must be**: HCL syntax
- **Must NOT have**: imports from other IaC tools

### CDKTF

- **Must have**:
  - Python: `from cdktf import`
  - TypeScript: `import { TerraformStack }`
- **Must NOT have**: Pure CDK or Terraform code

### CloudFormation

- **Must have**: `AWSTemplateFormatVersion`, `Resources:` with `Type: AWS::`
- **Must NOT have**: IaC tool code

### Analysis (Python Scripts)

- **Must have**: `import boto3`, Python analysis/monitoring functions
- **File**: `lib/analyse.py` or `lib/analyze.py`
- **Purpose**: Analyze existing AWS resources, no infrastructure deployment
- **Must NOT have**: IaC tool imports (cdk, terraform, pulumi)

### CI/CD (GitHub Actions)

- **Must have**: `on:`, `jobs:`, GitHub Actions workflow syntax
- **File**: `lib/ci-cd.yml`
- **Purpose**: Define deployment pipelines
- **Must NOT have**: IaC tool code (infrastructure defined separately)

## Language Detection Patterns

| Language  | Required Syntax                 | Forbidden Syntax              |
| --------- | ------------------------------- | ----------------------------- |
| ts        | TypeScript syntax, imports      | Python syntax (def, :)        |
| py        | Python syntax, def, imports     | TypeScript syntax             |
| go        | package main, Go imports        | Python/TypeScript syntax      |
| java      | Java class syntax, public class | Python/TypeScript/Go syntax   |
| hcl       | HCL resource blocks             | Programming language imports  |
| yaml/json | CloudFormation template format  | Code in programming languages |

## Resource Naming Requirements

### environmentSuffix Usage

All named resources must include environmentSuffix for uniqueness:

**Patterns by language**:

- TypeScript/JavaScript: `${environmentSuffix}` or `${props.environmentSuffix}`
- Python: `f"{environment_suffix}"` or `f"-{environment_suffix}"`
- Go: `fmt.Sprintf("...-{%s}", environmentSuffix)`
- HCL: `"${var.environment_suffix}"`
- CloudFormation: `!Sub "...-${EnvironmentSuffix}"`

**Validation**: ≥80% of named resources must have suffix

### Destroyability Requirement

- No Retain policies
- No DeletionProtection flags
- All resources must be destroyable after testing

## PROMPT.md Style Requirements

### Human-Style (Required)

- Conversational opening: "Hey team" or "Hi" or "We need to build"
- Casual business language
- Clear sections but conversational tone
- NO emojis or special formatting

### AI-Generated Style (Forbidden)

- Starts with "ROLE:" or "CONTEXT:" or "CONSTRAINTS:"
- Contains emojis (✨ 🚀 📊)
- "Here is a comprehensive prompt..." phrasing
- Overly formal template structure

**Reference**: `archive/cdk-ts/Pr4133/lib/PROMPT.md` for correct style

## Training Quality Scoring

**See `../policies/training-quality-guide.md` for complete scoring system.**

### Quick Reference

**Purpose**: Measures learning value (gap between MODEL_RESPONSE and IDEAL_RESPONSE), not code quality.

**Base Score**: 8 (threshold for PR creation)

**Critical Blockers** (automatic fail):

- Platform/language mismatch → Score = 3
- Wrong region deployment → Score = 5
- Wrong AWS account → Score = 3
- Missing ≥50% required services → Score = 4

**Adjustments**:

- Significant improvements (security, architecture): +1 to +2
- Moderate improvements (configuration, patterns): ±0
- Minor fixes only (linting, typos, 4+ fixes): -1 to -2
- Minimal changes (<5 fixes, model too good): -2 to -4
- Complexity bonus (multi-service, security, HA): +1 to +2 (max +2)

**Score Range**: 0-10 (capped)

**Threshold**: ≥8 for PR creation

**Special Case**: Production-ready MODEL_RESPONSE with few fixes = low score (model already competent)

## Working Directory

**See `../guides/working-directory-guide.md` for complete context rules.**

### Quick Reference

**Sub-agents work in**: `worktree/synth-{task_id}/` (never leave)

**Verification**:

```bash
pwd  # Must end with: /worktree/synth-{task_id}
[[ $(pwd) =~ worktree/synth-[^/]+$ ]] && echo "✅ OK" || exit 1
git branch --show-current  # Must match: synth-{task_id}
```

**Path Rules**:

- Use relative paths exclusively: `cat metadata.json`, `ls lib/`
- Never use absolute paths: ~~`cat /full/path/to/file`~~
- Verify location before ALL file operations

**Files in worktree**: metadata.json, lib/, test/, cfn-outputs/
**Files in main repo only**: .claude/tasks.csv (not accessible from worktree)
