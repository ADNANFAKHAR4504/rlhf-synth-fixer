# Stack Naming Conventions

## Overview

This document defines the **mandatory** stack naming conventions used across all Infrastructure as Code (IaC) platforms in this project. Consistent naming is **critical** for proper deployment, state management, and resource cleanup.

## Standard Stack Name

**All stack names MUST use:**

```
TapStack
```

- **Capital T**, **Capital S**
- **No hyphens**
- **PascalCase** format

## ❌ INCORRECT Naming Patterns

The following patterns are **FORBIDDEN** and will cause deployment failures:

- `tap-stack` ❌ (lowercase with hyphen)
- `Tap-stack` ❌ (mixed case with hyphen)
- `TAP-STACK` ❌ (all caps with hyphen)
- `tapStack` ❌ (camelCase)
- `tap_stack` ❌ (snake_case)
- `Tapstack` ❌ (lowercase 's')
- `TapSTACK` ❌ (uppercase 'STACK')

## ✅ Platform-Specific Naming

### CloudFormation / CDK

**Format:** `TapStack${ENVIRONMENT_SUFFIX}`

**Examples:**
```bash
# PR 123
TapStackpr123

# Development
TapStackdev

# Production
TapStackprod
```

**Usage in code:**
```bash
# In scripts
STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"

# AWS CLI
aws cloudformation deploy --stack-name TapStack${ENVIRONMENT_SUFFIX}
```

### Pulumi

**Format (Full):** `${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}`

**Format (Short):** `TapStack${ENVIRONMENT_SUFFIX}`

**Examples:**
```bash
# Full path
organization/TapStack/TapStackpr123

# Short form (for some commands)
TapStackpr123
```

**Usage in code:**
```bash
# Stack selection
pulumi stack select "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}" --create

# Deployment
pulumi up --stack "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}"
```

**Python (tap.py):**
```python
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack{environment_suffix}"
```

**TypeScript (bin/tap.ts):**
```typescript
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// Stack name: TapStack{environmentSuffix}
```

### Terraform / CDKTF

Terraform/CDKTF don't use "TapStack" in the state management but use environment suffix for resource naming:

```bash
# Resource naming
resource "aws_s3_bucket" "example" {
  bucket = "my-bucket-${var.environment_suffix}"
}
```

## Why This Matters

### 1. State File Location
Different stack names point to different state file locations in S3:

```
✅ Correct:
s3://bucket/TapStack/TapStackpr123/.pulumi/stacks/TapStackpr123.json

❌ Incorrect (creates a different stack):
s3://bucket/TapStack/tap-stackpr123/.pulumi/stacks/tap-stackpr123.json
```

### 2. Resource Isolation
Stack names ensure resources are properly isolated by environment:
- PR-specific resources: `TapStackpr123`
- Dev environment: `TapStackdev`
- Production: `TapStackprod`

### 3. Cleanup
The destroy scripts must use the exact same stack name to find and delete resources:

```bash
# If deployed as TapStackpr123
pulumi destroy --stack TapStackpr123  ✅ Works

# If trying to destroy tap-stackpr123
pulumi destroy --stack tap-stackpr123  ❌ Stack not found
```

### 4. Integration Tests
Tests retrieve outputs using the stack name:

```bash
# Must match deployment stack name exactly
pulumi stack output --stack TapStackpr123 bucketName
```

## Environment Suffix Format

The `ENVIRONMENT_SUFFIX` is automatically set by CI/CD:

```yaml
# From .github/workflows/ci-cd.yml
ENVIRONMENT_SUFFIX: ${{ github.event.inputs.environment_suffix || 
                        (github.event.number && format('pr{0}', github.event.number)) || 
                        'dev' }}
```

**Examples:**
- PR #123 → `pr123`
- Manual trigger with input "test" → `test`
- Main branch → `dev`

**Format requirements:**
- Lowercase alphanumeric
- No special characters except allowed patterns
- Typically starts with `pr` for pull requests

## Validation

### Automated Validation

The project includes automated validation scripts:

1. **`scripts/validate-stack-naming.sh`**
   - Scans code for incorrect naming patterns
   - Validates stack name format
   - Runs during build and deploy phases

2. **`scripts/stack-config.sh`**
   - Provides centralized stack naming functions
   - Includes validation helpers
   - Can be sourced in other scripts

### Running Validation Manually

```bash
# Validate naming in current codebase
./scripts/validate-stack-naming.sh

# Print current stack configuration
export ENVIRONMENT_SUFFIX=pr123
./scripts/stack-config.sh --print

# Output:
# Stack Naming Configuration
# ==========================
# STACK_NAME_PREFIX: TapStack
# ENVIRONMENT_SUFFIX: pr123
# 
# Generated Stack Names:
#   CDK/CloudFormation: TapStackpr123
#   Pulumi (full):      organization/TapStack/TapStackpr123
#   Pulumi (short):     TapStackpr123
```

## Common Mistakes and Fixes

### Mistake 1: Using Hyphens

❌ **Wrong:**
```typescript
const stackName = `tap-stack-${environmentSuffix}`;
```

✅ **Correct:**
```typescript
const stackName = `TapStack${environmentSuffix}`;
```

### Mistake 2: Wrong Casing

❌ **Wrong:**
```python
STACK_NAME = f"tapStack{environment_suffix}"
```

✅ **Correct:**
```python
STACK_NAME = f"TapStack{environment_suffix}"
```

### Mistake 3: Inconsistent Naming Across Files

Ensure ALL files use the same convention:
- `package.json` scripts
- Deployment scripts (`scripts/deploy.sh`)
- Entry point files (`tap.py`, `bin/tap.ts`)
- Test files
- CI/CD workflow

### Mistake 4: Hardcoding Stack Names

❌ **Wrong:**
```bash
pulumi stack select organization/TapStack/TapStackdev
```

✅ **Correct:**
```bash
pulumi stack select "${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}"
```

## Enforcement

### CI/CD Pipeline

The CI/CD pipeline enforces naming conventions:

1. **Build Phase:** Validates naming in code
2. **Deploy Phase:** Validates stack name before deployment
3. **Warning Level:** Currently logs warnings (non-blocking)
4. **Future:** Will become blocking (fail builds on violations)

### Pre-commit Hooks (Recommended)

Add a pre-commit hook to catch issues early:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Validating stack naming conventions..."
if [ -f scripts/validate-stack-naming.sh ]; then
  ./scripts/validate-stack-naming.sh
  if [ $? -ne 0 ]; then
    echo "❌ Pre-commit: Stack naming validation failed"
    echo "Fix the issues before committing"
    exit 1
  fi
fi
```

## References

### Project Scripts
- `scripts/deploy.sh` - Main deployment script
- `scripts/destroy.sh` - Resource cleanup script
- `scripts/bootstrap.sh` - Bootstrap script
- `scripts/stack-config.sh` - Centralized configuration
- `scripts/validate-stack-naming.sh` - Validation script

### CI/CD Workflow
- `.github/workflows/ci-cd.yml` - Main pipeline configuration
- Line 33: `ENVIRONMENT_SUFFIX` definition
- Build job: Validation step
- Deploy job: Stack name validation

### Template Files
- `templates/pulumi-py/tap.py` - Python Pulumi entry point
- `templates/pulumi-ts/bin/tap.ts` - TypeScript Pulumi entry point
- `templates/cdk-py/tap.py` - Python CDK entry point
- `templates/cdk-ts/bin/tap.ts` - TypeScript CDK entry point

## Questions?

If you're unsure about stack naming:

1. Run validation: `./scripts/validate-stack-naming.sh`
2. Check configuration: `./scripts/stack-config.sh --print`
3. Review this document
4. Check existing template files in `templates/`

**Remember:** Use `TapStack` (capital T, capital S) everywhere! 🎯

