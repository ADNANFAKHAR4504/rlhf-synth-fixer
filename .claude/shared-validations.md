# Shared Validation Reference

This document contains common validation rules and requirements used across all agents. Reference this instead of duplicating validation logic.

## Metadata Required Fields

All tasks must have `metadata.json` with these fields:

```
platform: cdk | cdktf | cfn | tf | pulumi
language: ts | js | py | java | go | hcl | yaml | json
complexity: medium | hard | expert
turn_type: single | multi
po_id: <task_id>
team: synth
subtask: <task_category>
background: <business_context>
subject_labels: <array>
startedAt: <ISO_timestamp>
aws_services: <string>
```

## Platform-Language Compatibility Matrix

Valid combinations from `cli/create-task.ts`:

| Platform | Valid Languages |
|----------|----------------|
| cdk | ts, js, py, java, go |
| cdktf | ts, py, go, java |
| pulumi | ts, js, py, java, go |
| tf | hcl |
| cfn | yaml, json |

**Note**: Normalize "python" to "py" in metadata.json

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

## Language Detection Patterns

| Language | Required Syntax | Forbidden Syntax |
|----------|----------------|------------------|
| ts | TypeScript syntax, imports | Python syntax (def, :) |
| py | Python syntax, def, imports | TypeScript syntax |
| go | package main, Go imports | Python/TypeScript syntax |
| java | Java class syntax, public class | Python/TypeScript/Go syntax |
| hcl | HCL resource blocks | Programming language imports |
| yaml/json | CloudFormation template format | Code in programming languages |

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

### Base Score: 10

### Automatic Penalties
- Platform/language mismatch: -5 (CRITICAL)
- Missing AWS service from requirements: -2 per service
- Wrong region deployment: -3
- PROMPT.md AI-generated style: -2
- Inconsistent environmentSuffix (<80%): -1
- Retain policies present: -1
- Missing error handling: -1
- Missing logging/monitoring: -1

### Score Interpretation
- **9-10**: Excellent - complex, secure, best practices
- **8**: Good - meets requirements, solid implementation
- **6-7**: Fair - some gaps, basic implementation
- **4-5**: Poor - minimal complexity, missing requirements
- **0-3**: Insufficient - major issues, exclude from training

**CRITICAL THRESHOLD**: Must be ≥8 for PR creation

## Working Directory Pattern

All agents work inside: `worktree/synth-{task_id}/`

**Verification**:
```bash
pwd  # Must end with: /worktree/synth-{task_id}
```

All file operations are relative to this directory.
