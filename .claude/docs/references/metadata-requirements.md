# Metadata.json Requirements and Validation

## Overview

The `metadata.json` file is **CRITICAL** for all synthetic task generation workflows. This document provides strict requirements and validation rules that **MUST** be followed.

## ⚠️ CRITICAL: No Hallucinations Allowed

**Claude agents MUST NOT hallucinate or make assumptions about metadata fields.** All values must come from:

1. The CSV task data (`.claude/tasks.csv`)
2. The `create-task-files.sh` script output
3. User-provided input during task creation

**DO NOT**:

- Invent field values
- Guess at AWS services
- Modify fields without explicit instruction
- Add fields not defined in the schema

## Required Schema

```typescript
interface TaskMetadata {
  platform: string; // REQUIRED: IaC platform (cdk, cdktf, cfn, tf, pulumi)
  language: string; // REQUIRED: Programming language (ts, py, js, go, java, hcl, yaml, json)
  complexity: string; // REQUIRED: Task complexity (medium, hard, expert)
  turn_type: string; // REQUIRED: Turn type (single, multi)
  po_id: string; // REQUIRED: Task ID (e.g., "1maext", "synth-abc123")
  team: string; // REQUIRED: Team identifier (1-6, synth, synth-N, stf) - read from settings.local.json if present
  startedAt: string; // REQUIRED: ISO 8601 timestamp
  subtask: string; // REQUIRED: Main subtask category
  subject_labels?: string[]; // OPTIONAL: Array of subject labels
  aws_services?: string[]; // OPTIONAL: Array of AWS service names
  region?: string; // OPTIONAL: AWS region (defaults to us-east-1)
  task_config?: {
    // OPTIONAL: Platform-specific configuration
    deploy_env: string; // For Terraform: tfvars file name
  };
}
```

## Field Requirements

### platform (REQUIRED)

**Type**: `string`
**Allowed values**: `cdk`, `cdktf`, `cfn`, `tf`, `pulumi`, `cicd`, `analysis`

**Validation**:

```bash
VALID_PLATFORMS=("cdk" "cdktf" "cfn" "tf" "pulumi" "cicd" "analysis")
if [[ ! " ${VALID_PLATFORMS[@]} " =~ " ${PLATFORM} " ]]; then
  echo "❌ ERROR: Invalid platform '$PLATFORM'"
  exit 1
fi
```

**Special Platforms**:

- `analysis`: For "Infrastructure Analysis/Monitoring" and "General Infrastructure Tooling QA" tasks. Uses Python scripts with boto3.
- `cicd`: For "CI/CD Pipeline" tasks. Uses GitHub Actions workflows.

**Common Errors**:

- ❌ Using full names: "CloudFormation", "Terraform", "Pulumi"
- ❌ Using uppercase: "CDK", "CDKTF"
- ❌ Using wrong platform for special tasks (e.g., "cdk" for analysis tasks)
- ✅ Correct: "cdk", "cdktf", "cfn", "tf", "pulumi", "cicd", "analysis"

### language (REQUIRED)

**Type**: `string`
**Allowed values**: `ts`, `py`, `js`, `go`, `java`, `hcl`, `yaml`, `json`, `yml`

**Platform-Language Compatibility Matrix**:

```
cdk:      ts, js, py, java, go
cdktf:    ts, py, go, java
pulumi:   ts, js, py, go, java
tf:       hcl
cfn:      yaml, json
cicd:     yaml, yml
analysis: py
```

**Validation**:

```bash
case "$PLATFORM" in
  cdk)
    [[ "$LANGUAGE" =~ ^(ts|js|py|java|go)$ ]] || exit 1
    ;;
  cdktf)
    [[ "$LANGUAGE" =~ ^(ts|py|go|java)$ ]] || exit 1
    ;;
  pulumi)
    [[ "$LANGUAGE" =~ ^(ts|js|py|go|java)$ ]] || exit 1
    ;;
  tf)
    [[ "$LANGUAGE" == "hcl" ]] || exit 1
    ;;
  cfn)
    [[ "$LANGUAGE" =~ ^(yaml|json)$ ]] || exit 1
    ;;
  cicd)
    [[ "$LANGUAGE" =~ ^(yaml|yml)$ ]] || exit 1
    ;;
  analysis)
    [[ "$LANGUAGE" == "py" ]] || exit 1
    ;;
esac
```

**Common Errors**:

- ❌ Using full names: "TypeScript", "Python", "JavaScript"
- ❌ Using uppercase: "TS", "PY"
- ❌ Invalid combinations: "cfn" with "ts", "tf" with "py", "analysis" with "ts"
- ✅ Correct: "ts", "py", "js", "hcl", "yaml", "json", "yml"

### complexity (REQUIRED)

**Type**: `string`
**Allowed values**: `medium`, `hard`, `expert`

**Validation**:

```bash
[[ "$COMPLEXITY" =~ ^(medium|hard|expert)$ ]] || {
  echo "❌ ERROR: Invalid complexity '$COMPLEXITY'"
  exit 1
}
```

**Common Errors**:

- ❌ Using "easy", "simple", "difficult"
- ❌ Using uppercase: "Medium", "Hard", "Expert"
- ✅ Correct: "medium", "hard", "expert"

### subtask (REQUIRED)

**Type**: `string`
**Allowed values**: Must match one of the valid subtasks from reference file

**Valid Subtasks** (from `.claude/docs/references/iac-subtasks-subject-labels.json`):

1. `Provisioning of Infrastructure Environments`
2. `Application Deployment`
3. `CI/CD Pipeline Integration`
4. `Failure Recovery and High Availability`
5. `Security, Compliance, and Governance`
6. `IaC Program Optimization`
7. `Infrastructure QA and Management`

**Validation**:

```bash
VALID_SUBTASKS=(
  "Provisioning of Infrastructure Environments"
  "Application Deployment"
  "CI/CD Pipeline Integration"
  "Failure Recovery and High Availability"
  "Security, Compliance, and Governance"
  "IaC Program Optimization"
  "Infrastructure QA and Management"
)

subtask_valid=false
for valid in "${VALID_SUBTASKS[@]}"; do
  if [ "$SUBTASK" == "$valid" ]; then
    subtask_valid=true
    break
  fi
done

if [ "$subtask_valid" == false ]; then
  echo "❌ ERROR: Invalid subtask '$SUBTASK'"
  exit 1
fi
```

**Common Errors**:

- ❌ Using abbreviated names: "Cloud Setup", "Environment Migration"
- ❌ Using old/incorrect values: "Cloud Environment Setup"
- ✅ Correct: Full exact names from the list above

### subject_labels (OPTIONAL)

**Type**: `string[]` (Array of strings)
**Format**: JSON array

**CRITICAL**: Must be a JSON array, NOT a comma-separated string

**Example**:

```json
{
  "subject_labels": ["Cloud Environment Setup", "Environment Migration"]
}
```

**Valid Subject Labels by Subtask**:

See `.claude/docs/references/iac-subtasks-subject-labels.json` for the complete mapping.

**Common Errors**:

- ❌ String instead of array: `"subject_labels": "Cloud Environment Setup"`
- ❌ Comma-separated string: `"subject_labels": "setup, migration"`
- ❌ Invalid label for subtask: Using "Web Application Deployment" under "CI/CD Pipeline Integration"
- ✅ Correct: `"subject_labels": ["Cloud Environment Setup"]`

### aws_services (OPTIONAL)

**Type**: `string[]` (Array of strings)
**Format**: JSON array

**CRITICAL**: Must be a JSON array, NOT a comma-separated string

**Example**:

```json
{
  "aws_services": ["S3", "Lambda", "DynamoDB", "API Gateway", "CloudWatch"]
}
```

**Service Name Format**:

- Use proper AWS service names (e.g., "Lambda", not "lambda")
- Use common abbreviations (e.g., "S3", "EC2", "RDS")
- Be specific when needed (e.g., "RDS PostgreSQL" vs just "RDS")

**Common Errors**:

- ❌ String instead of array: `"aws_services": "S3, Lambda, DynamoDB"`
- ❌ Empty string: `"aws_services": ""`
- ❌ Null value: `"aws_services": null`
- ✅ Correct: `"aws_services": ["S3", "Lambda", "DynamoDB"]`
- ✅ Also correct: Omit field entirely if no services specified

### region (OPTIONAL)

**Type**: `string`
**Default**: `us-east-1`

**Format**: AWS region format (e.g., `us-east-1`, `eu-west-2`)

**Validation**:

```bash
[[ "$REGION" =~ ^(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]+$ ]] || {
  echo "❌ ERROR: Invalid region format '$REGION'"
  exit 1
}
```

## Subject Label → Platform Requirements

**CRITICAL**: Some subject labels have STRICT platform/language requirements that must be enforced.

| Subject Label                      | Required Platform | Allowed Languages |
| ---------------------------------- | ----------------- | ----------------- |
| Infrastructure Analysis/Monitoring | `analysis`        | `py` only         |
| General Infrastructure Tooling QA  | `analysis`        | `py`, `sh`        |
| CI/CD Pipeline                     | `cicd`            | `yaml`, `yml`     |

**Reference**: See `.claude/docs/references/iac-subtasks-subject-labels.json` (single source of truth for subtasks, labels, and platform requirements).

**Validation is enforced in**: `.claude/scripts/validate-metadata.sh`

**Example Error**:

```
❌ Subject label 'Infrastructure Analysis/Monitoring' requires platform='analysis', but got 'cdk'
⚠️  Analysis tasks use Python scripts with boto3, not IaC platforms
```

## Validation Checklist

Before proceeding with any synthetic task generation, validate:

- [ ] **All required fields present**: platform, language, complexity, turn_type, po_id, team, startedAt, subtask
- [ ] **Platform is valid**: One of cdk, cdktf, cfn, tf, pulumi, cicd, analysis (lowercase)
- [ ] **Language is valid**: Matches platform compatibility matrix (lowercase)
- [ ] **Complexity is valid**: One of medium, hard, expert (lowercase)
- [ ] **Subtask is valid**: Exact match from reference file
- [ ] **subject_labels is array**: If present, must be JSON array, not string
- [ ] **aws_services is array**: If present, must be JSON array, not string
- [ ] **Region format is valid**: Matches AWS region pattern
- [ ] **Platform-language combination is valid**: Check compatibility matrix
- [ ] **Subject label platform requirements**: Analysis/CI/CD labels use correct platform

## Validation Script

Use the built-in validation in `.claude/scripts/create-task-files.sh`:

```bash
# Validate metadata after creation
METADATA_FILE="metadata.json"

# Check required fields
REQUIRED=("platform" "language" "complexity" "turn_type" "team" "startedAt" "subtask" "po_id")
for field in "${REQUIRED[@]}"; do
  if ! grep -q "\"$field\":" "$METADATA_FILE"; then
    echo "❌ ERROR: Missing required field '$field'"
    exit 1
  fi
done

# Validate platform
PLATFORM=$(jq -r '.platform' "$METADATA_FILE")
[[ "$PLATFORM" =~ ^(cdk|cdktf|cfn|tf|pulumi)$ ]] || {
  echo "❌ ERROR: Invalid platform '$PLATFORM'"
  exit 1
}

# Validate language
LANGUAGE=$(jq -r '.language' "$METADATA_FILE")
[[ "$LANGUAGE" =~ ^(ts|py|js|go|java|hcl|yaml|json)$ ]] || {
  echo "❌ ERROR: Invalid language '$LANGUAGE'"
  exit 1
}

# Validate aws_services is array if present
if grep -q '"aws_services"' "$METADATA_FILE"; then
  AWS_SERVICES_TYPE=$(jq -r '.aws_services | type' "$METADATA_FILE")
  if [ "$AWS_SERVICES_TYPE" != "array" ]; then
    echo "❌ ERROR: aws_services must be an array, got: $AWS_SERVICES_TYPE"
    exit 1
  fi
fi

# Validate subject_labels is array if present
if grep -q '"subject_labels"' "$METADATA_FILE"; then
  SUBJECT_LABELS_TYPE=$(jq -r '.subject_labels | type' "$METADATA_FILE")
  if [ "$SUBJECT_LABELS_TYPE" != "array" ]; then
    echo "❌ ERROR: subject_labels must be an array, got: $SUBJECT_LABELS_TYPE"
    exit 1
  fi
fi

echo "✅ Metadata validation passed"
```

## Common Hallucination Patterns to Avoid

### 1. Inventing AWS Services

**❌ WRONG**:

```json
{
  "aws_services": ["S3", "Lambda", "DynamoDB", "API Gateway"]
}
```

_When the task only mentions S3 and Lambda_

**✅ CORRECT**:

```json
{
  "aws_services": ["S3", "Lambda"]
}
```

_Or omit the field if services aren't clearly specified_

### 2. Modifying Subtask Names

**❌ WRONG**:

```json
{
  "subtask": "Infrastructure Provisioning"
}
```

**✅ CORRECT**:

```json
{
  "subtask": "Provisioning of Infrastructure Environments"
}
```

### 3. Using Wrong Data Types

**❌ WRONG**:

```json
{
  "subject_labels": "Cloud Environment Setup",
  "aws_services": "S3, Lambda"
}
```

**✅ CORRECT**:

```json
{
  "subject_labels": ["Cloud Environment Setup"],
  "aws_services": ["S3", "Lambda"]
}
```

### 4. Case Sensitivity Errors

**❌ WRONG**:

```json
{
  "platform": "CDK",
  "language": "TypeScript",
  "complexity": "Medium"
}
```

**✅ CORRECT**:

```json
{
  "platform": "cdk",
  "language": "ts",
  "complexity": "medium"
}
```

## Error Recovery

If metadata validation fails:

1. **Check the source**: Re-read from `.claude/tasks.csv` or user input
2. **Don't guess**: If a field is unclear, ask the user or omit optional fields
3. **Use defaults**: Only for `region` (defaults to `us-east-1`)
4. **Report the error**: Be specific about what's wrong and how to fix it
5. **Stop execution**: Do not proceed with invalid metadata

## References

- Platform-language compatibility: `.claude/docs/references/shared-validations.md`
- Subtask and subject labels: `.claude/docs/references/iac-subtasks-subject-labels.json`
- Task creation script: `.claude/scripts/create-task-files.sh`
- Interface definition: `cli/create-task.ts`
