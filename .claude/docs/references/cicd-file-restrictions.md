# CI/CD File Restrictions

## Overview

The CI/CD pipeline enforces strict file location restrictions through the `check-project-files.sh` script. This validation runs **BEFORE** any other CI/CD jobs and will **FAIL THE ENTIRE PIPELINE** if files are created outside allowed locations.

## ⚠️ CRITICAL: Why This Matters

**Every synthetic task MUST pass this check before PR merge.**

If files are created in wrong locations:
- ❌ CI/CD pipeline fails immediately at the "Check Project Files" step
- ❌ No build, synth, or deployment will run
- ❌ PR cannot be merged
- ❌ Task is marked as failed

**This is the #1 reason synthetic tasks fail in the pipeline.**

---

## Allowed File Locations

### ✅ Allowed Folders (Unlimited Files)

Files can ONLY be created in these directories:

```bash
bin/           # Entry point files (bin/tap.ts, bin/tap.py, bin/tap.go)
lib/           # All infrastructure code, PROMPT.md, MODEL_RESPONSE.md, IDEAL_RESPONSE.md, MODEL_FAILURES.md, AWS_REGION, README.md
test/          # Unit tests and integration tests
tests/         # Alternative test directory name
```

**Important**: 
- `lib/` is where ALL your infrastructure code goes
- `lib/` is where ALL documentation files go (PROMPT.md, IDEAL_RESPONSE.md, etc.)
- Lambda functions go in `lib/lambda/` or `lib/functions/`
- Stack files go in `lib/` (e.g., `lib/tap-stack.ts`, `lib/database-stack.py`)

### ✅ Allowed Root-Level Files

Only these specific files are allowed at the repository root:

```bash
package.json       # Node.js dependencies (TypeScript/JavaScript projects)
package-lock.json  # Node.js lock file
cdk.json           # AWS CDK configuration
tap.py             # Python Pulumi entry point
tap.go             # Go Pulumi entry point  
cdktf.json         # CDKTF configuration
Pulumi.yaml        # Pulumi configuration
metadata.json      # Task metadata (REQUIRED for all synthetic tasks)
```

### ❌ Forbidden Locations

**DO NOT create files in these locations:**

```bash
.github/           # CI/CD workflows (managed by repo maintainers)
scripts/           # Build/deploy scripts (managed by repo maintainers)
.claude/           # Agent instructions (managed by repo maintainers)
templates/         # Platform templates (managed by repo maintainers)
docs/              # Documentation (not allowed in PRs)
config/            # Configuration files (not allowed in PRs)
.vscode/           # Editor settings (not allowed in PRs)
.idea/             # IDE settings (not allowed in PRs)
dist/              # Build output (generated, not committed)
cdk.out/           # CDK synth output (generated, not committed)
cfn-outputs/       # Deployment outputs (generated, not committed)
node_modules/      # Dependencies (generated, not committed)
__pycache__/       # Python cache (generated, not committed)
.terraform/        # Terraform state (generated, not committed)
```

**DO NOT create files at root level except the allowed ones above:**

```bash
❌ README.md       # Must be in lib/README.md instead
❌ .gitignore      # Already exists, don't modify
❌ tsconfig.json   # Already exists in templates, don't modify
❌ jest.config.js  # Already exists in templates, don't modify
❌ requirements.txt # Already exists in templates, don't modify
❌ go.mod          # Already exists in templates, don't modify
❌ pom.xml         # Already exists in templates, don't modify
❌ Any other files # Not allowed unless in allowed list
```

---

## Common Violations and Fixes

### Violation 1: Creating README.md at Root

❌ **Wrong**:
```
/README.md         # Created at root
/lib/tap-stack.ts
```

✅ **Correct**:
```
/lib/README.md     # Create in lib/ instead
/lib/tap-stack.ts
```

### Violation 2: Creating Documentation Files at Root

❌ **Wrong**:
```
/PROMPT.md
/MODEL_RESPONSE.md
/IDEAL_RESPONSE.md
/lib/tap-stack.ts
```

✅ **Correct**:
```
/lib/PROMPT.md
/lib/MODEL_RESPONSE.md
/lib/IDEAL_RESPONSE.md
/lib/tap-stack.ts
```

### Violation 3: Creating Lambda Code Outside lib/

❌ **Wrong**:
```
/lambda/handler.py       # Wrong location
/functions/process.js    # Wrong location
```

✅ **Correct**:
```
/lib/lambda/handler.py       # In lib/lambda/
/lib/functions/process.js    # In lib/functions/
```

### Violation 4: Creating Config Files at Root

❌ **Wrong**:
```
/config.yaml        # Not in allowed list
/settings.json      # Not in allowed list
/.env               # Not in allowed list
```

✅ **Correct**:
```
/lib/config.yaml        # Move to lib/ if needed for IaC
/lib/settings.json      # Move to lib/ if needed for IaC
# Don't create .env files - use AWS Secrets Manager
```

### Violation 5: Modifying CI/CD or Script Files

❌ **Wrong**:
```
Modified: .github/workflows/ci-cd.yml
Modified: scripts/build.sh
Modified: scripts/deploy.sh
```

✅ **Correct**:
```
# Never modify these files
# They are managed by repository maintainers
# Use existing commands from package.json instead
```

---

## Validation Before PR Creation

### Manual Validation (Run in Worktree)

Before creating a PR, verify file locations:

```bash
# Check what files will be in the PR
git diff --name-only origin/main...HEAD

# Common violations to check for:
git diff --name-only origin/main...HEAD | grep -v '^bin/' | grep -v '^lib/' | grep -v '^test/' | grep -v '^tests/' | grep -v '^metadata.json$' | grep -v '^cdk.json$' | grep -v '^cdktf.json$' | grep -v '^Pulumi.yaml$' | grep -v '^package.json$' | grep -v '^package-lock.json$' | grep -v '^tap.py$' | grep -v '^tap.go$'

# If the above command returns ANY files, they will FAIL the check
```

### Automated Validation

The CI/CD pipeline runs this check automatically:

```yaml
- name: Check Project Files
  id: check-files
  run: ./scripts/check-project-files.sh
```

**This runs BEFORE everything else. If it fails, nothing else runs.**

---

## Agent Guidelines

### For iac-infra-generator

**When generating code:**

1. **Create PROMPT.md in lib/**:
   ```bash
   # ✅ Correct
   cat > lib/PROMPT.md <<EOF
   ...
   EOF
   ```

2. **Create MODEL_RESPONSE.md in lib/**:
   ```bash
   # ✅ Correct
   cat > lib/MODEL_RESPONSE.md <<EOF
   ...
   EOF
   ```

3. **Extract code to lib/**:
   ```bash
   # ✅ Correct - Infrastructure code
   cat > lib/tap-stack.ts <<EOF
   ...
   EOF
   
   # ✅ Correct - Lambda functions
   cat > lib/lambda/handler.py <<EOF
   ...
   EOF
   
   # ✅ Correct - Documentation
   cat > lib/README.md <<EOF
   ...
   EOF
   ```

4. **Never create files outside allowed locations**:
   ```bash
   # ❌ Wrong
   cat > README.md <<EOF           # Should be lib/README.md
   
   # ❌ Wrong  
   cat > docs/architecture.md <<EOF  # No docs/ folder allowed
   
   # ❌ Wrong
   cat > lambda/handler.py <<EOF     # Should be lib/lambda/handler.py
   ```

### For iac-infra-qa-trainer

**When fixing code and creating tests:**

1. **Only modify files in bin/, lib/, test/, tests/**:
   ```bash
   # ✅ Correct locations
   lib/tap-stack.ts
   lib/database-stack.py
   test/tap-stack.test.ts
   tests/integration.test.js
   ```

2. **Create IDEAL_RESPONSE.md in lib/**:
   ```bash
   # ✅ Correct
   cat > lib/IDEAL_RESPONSE.md <<EOF
   ...
   EOF
   ```

3. **Create MODEL_FAILURES.md in lib/**:
   ```bash
   # ✅ Correct
   cat > lib/MODEL_FAILURES.md <<EOF
   ...
   EOF
   ```

4. **Never modify package.json** (unless absolutely necessary for dependencies):
   ```bash
   # ⚠️ Only modify if adding required dependencies
   # Document why in MODEL_FAILURES.md
   ```

### For iac-code-reviewer

**When reviewing code:**

1. **Check file locations as part of review**:
   ```bash
   # Verify all files are in allowed locations
   git diff --name-only origin/main...HEAD
   ```

2. **Flag violations in review**:
   ```markdown
   ❌ **File Location Violation**
   
   File: `/README.md`
   Issue: Created at root level
   Fix: Move to `/lib/README.md`
   
   This will FAIL CI/CD check-project-files.sh
   ```

3. **Include file location check in training_quality score**:
   - Files in wrong locations → Critical issue → Reduces score by 2-3 points

---

## Reference: check-project-files.sh

The actual validation script:

```bash
#!/bin/bash
set -e

ALLOWED_FOLDERS=("bin" "lib" "test" "tests")
ALLOWED_FILES=("package.json" "package-lock.json" "cdk.json" "tap.py" "tap.go" "cdktf.json" "Pulumi.yaml" "metadata.json")

echo "Checking PR file changes..."

changed_files=$(git diff --name-only origin/main...HEAD)

if [ -z "$changed_files" ]; then
  echo "No changed files detected"
  exit 0
fi

invalid_files=()

while IFS= read -r file; do
  valid=false
  
  # Check if file is in allowed folder
  for folder in "${ALLOWED_FOLDERS[@]}"; do
    if [[ "$file" == "$folder/"* ]]; then
      valid=true
      break
    fi
  done
  
  # Check if file is an allowed root-level file
  if [ "$valid" = false ]; then
    for allowed_file in "${ALLOWED_FILES[@]}"; do
      if [[ "$file" == "$allowed_file" ]]; then
        valid=true
        break
      fi
    done
  fi
  
  # Mark as invalid if not in allowed list
  if [ "$valid" = false ]; then
    invalid_files+=("$file")
  fi
done <<< "$changed_files"

# Fail if any invalid files found
if [ ${#invalid_files[@]} -gt 0 ]; then
  echo "ERROR: Found files outside allowed directories/files:"
  printf '  - %s\n' "${invalid_files[@]}"
  echo ""
  echo "Allowed folders: ${ALLOWED_FOLDERS[*]}"
  echo "Allowed files: ${ALLOWED_FILES[*]}"
  exit 1
fi

echo "All changed files are in allowed locations"
exit 0
```

---

## Quick Checklist

Before creating a PR, verify:

- [ ] All infrastructure code is in `lib/`
- [ ] All tests are in `test/` or `tests/`
- [ ] Entry points are in `bin/` (if needed)
- [ ] `PROMPT.md` is in `lib/PROMPT.md` (not root)
- [ ] `MODEL_RESPONSE.md` is in `lib/MODEL_RESPONSE.md` (not root)
- [ ] `IDEAL_RESPONSE.md` is in `lib/IDEAL_RESPONSE.md` (not root)
- [ ] `MODEL_FAILURES.md` is in `lib/MODEL_FAILURES.md` (not root)
- [ ] `README.md` is in `lib/README.md` (not root)
- [ ] Lambda/function code is in `lib/lambda/` or `lib/functions/`
- [ ] No files created in `.github/`, `scripts/`, `.claude/`, `templates/`, `docs/`, etc.
- [ ] Only allowed root files: `metadata.json`, `cdk.json`, `cdktf.json`, `Pulumi.yaml`, `tap.py`, `tap.go`, `package.json`, `package-lock.json`
- [ ] Run `git diff --name-only origin/main...HEAD` and verify all files are allowed

---

## Summary

**Golden Rule**: If it's code or documentation you're creating for a synthetic task:
- Infrastructure code → `lib/`
- Tests → `test/` or `tests/`
- Entry points → `bin/`
- Documentation → `lib/`
- Lambda functions → `lib/lambda/`
- Everything else → `lib/`

**Only exception**: `metadata.json` and platform config files (`cdk.json`, `Pulumi.yaml`, etc.) at root.

**Remember**: This check runs FIRST in CI/CD. Get it wrong, and the entire pipeline fails immediately.

