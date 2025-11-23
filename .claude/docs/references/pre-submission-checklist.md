# Pre-Submission Checklist for Synth Tasks

## Overview

This document defines the **MANDATORY** requirements that must be met before task submission or PR creation. These are non-negotiable quality gates that ensure deployment success and maintainability.

## ⚠️ CRITICAL: All Items Must Pass

**PR creation will be BLOCKED if any requirement fails.**

---

## 1. Build Success ✅

### Requirements
- [ ] **Lint**: Zero linting errors
- [ ] **Build**: Successful compilation with zero errors
- [ ] **Synth**: Successful template generation (for CDK, CDKTF, Pulumi, Terraform)

### Validation Commands

```bash
# TypeScript (CDK/CDKTF)
npm run lint && npm run build && npm run synth

# Python (CDK/CDKTF/CFN)
pipenv run lint && pipenv run build && pipenv run synth

# Go (Pulumi/CDK)
go vet ./... && go build -o /dev/null ./... && pulumi preview

# Java (CDK)
./gradlew check && ./gradlew build && ./gradlew synth

# Terraform
terraform fmt -check && terraform validate && terraform plan
```

### Failure Actions
- **STOP** immediately if any command fails
- Fix all errors before proceeding
- Do NOT attempt deployment with build errors
- Reference: `.claude/docs/guides/validation_and_testing_guide.md` Phase 2

### Agent Responsibility
- **iac-infra-qa-trainer**: Section 2 - Code Quality Gate
- **iac-code-reviewer**: Phase 1.5 - Build validation check

---

## 2. No Lint Issues ✅

### Requirements
- [ ] **Zero** linting errors
- [ ] **Zero** linting warnings (target - some warnings acceptable)
- [ ] Code follows platform-specific style guidelines
- [ ] All imports are used
- [ ] No syntax errors

### Platform-Specific Standards

| Platform | Command | Pass Criteria |
|----------|---------|--------------|
| TypeScript | `npm run lint` | Exit code 0 |
| Python | `pipenv run lint` | Score ≥ 7.0/10 |
| Go | `go vet ./...` | Exit code 0 |
| Java | `./gradlew check` | Exit code 0 |
| HCL | `terraform fmt -check` | Exit code 0 |

### Common Fixes
```bash
# Auto-fix formatting issues
npm run format      # TypeScript
pipenv run format   # Python
terraform fmt       # Terraform/HCL
go fmt ./...        # Go
```

### Failure Actions
- Fix all linting errors
- Auto-format code where possible
- Remove unused imports
- Add missing type annotations

### Agent Responsibility
- **iac-infra-qa-trainer**: Section 2 - Lint validation
- **iac-code-reviewer**: Phase 2 - Code quality review

---

## 3. No Synth Issues ✅

### Requirements
- [ ] Template generation completes successfully
- [ ] All resources validate correctly
- [ ] No circular dependencies
- [ ] All cross-resource references resolve
- [ ] Output files generated in expected location

### Platform-Specific Synth

| Platform | Command | Expected Output |
|----------|---------|-----------------|
| CDK | `npm run synth` | `cdk.out/*.template.json` |
| CDKTF | `cdktf synth` | `cdktf.out/*.tf.json` |
| Pulumi | `pulumi preview` | Preview output |
| Terraform | `terraform plan` | Plan output |
| CloudFormation | `cfn-lint lib/*.yaml` | Validation pass |

### Common Issues
- **Circular dependencies**: Refactor resource dependencies
- **Missing required properties**: Add required resource properties
- **Invalid configurations**: Check AWS documentation
- **Cross-stack references**: Ensure proper exports/imports

### Failure Actions
- Analyze synth error messages
- Fix resource configuration issues
- Validate cross-resource dependencies
- Reference AWS CloudFormation/CDK documentation

### Agent Responsibility
- **iac-infra-qa-trainer**: Section 2 - Synth validation
- **iac-code-reviewer**: Phase 2 - Template review

---

## 4. Deployment Success ✅

### Requirements
- [ ] Infrastructure deploys successfully to AWS
- [ ] All resources created without errors
- [ ] Stack outputs generated correctly
- [ ] Deployment completes within timeout (30 minutes)
- [ ] **Maximum 5 deployment attempts**

### Pre-Deployment Validation

```bash
# MANDATORY: Run before ANY deployment
bash .claude/scripts/pre-validate-iac.sh
```

**Pre-validation checks:**
- Resource naming includes environmentSuffix
- No hardcoded environment values (prod-, dev-, stage-)
- No Retain policies or DeletionProtection
- No expensive configurations flagged
- Valid cross-resource references

### Deployment Process

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="synth${TASK_ID}"

# Deploy (max 5 attempts)
bash scripts/deploy.sh

# Extract outputs
bash scripts/extract-outputs.sh

# Verify outputs file
test -f cfn-outputs/flat-outputs.json
```

### Common Deployment Failures

| Error | Root Cause | Fix |
|-------|-----------|------|
| "already exists" | Missing environmentSuffix | Add suffix to all resource names |
| "Bucket not empty" | S3 deletion issue | Add `autoDeleteObjects: true` |
| "ReservedConcurrentExecutions" | Lambda quota | Remove or reduce value |
| "Runtime.ImportModuleError" | AWS SDK issue | Use SDK v3 or extract from event |
| "AccessDenied" | Missing IAM permissions | Add required permissions |

### Failure Actions
- Analyze deployment error messages
- Fix issues and retry (max 5 total attempts)
- After 5 failed attempts: Report BLOCKED status
- Reference: `.claude/lessons_learnt.md` for common failures

### Agent Responsibility
- **iac-infra-qa-trainer**: Section 3 - Deployment execution
- **iac-code-reviewer**: Phase 3 - Deployment validation

---

## 5. Test Coverage 100% ✅

### Requirements
- [ ] **Unit test coverage: 100%** statements
- [ ] **Branch coverage: ≥95%**
- [ ] **Function coverage: 100%**
- [ ] **Line coverage: 100%**
- [ ] All code paths tested
- [ ] Error handling tested
- [ ] Edge cases covered

### Coverage Validation

```bash
# Run tests with coverage
npm run test:coverage          # TypeScript
pipenv run test:unit          # Python
go test -cover ./...          # Go
./gradlew test jacocoTestReport  # Java

# Extract coverage
COVERAGE=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
echo "Statement coverage: ${COVERAGE}%"

# Validate threshold
if [ "$COVERAGE" -lt 100 ]; then
  echo "❌ Coverage below 100%: ${COVERAGE}%"
  exit 1
fi
```

### Coverage Report Locations

| Platform | Coverage File | Format |
|----------|--------------|--------|
| TypeScript/JavaScript | `coverage/coverage-summary.json` | JSON |
| Python | `coverage.xml` | XML |
| Go | Terminal output | Text |
| Java | `build/reports/jacoco/test/jacocoTestReport.xml` | XML |

### What to Test

**✅ Required Tests:**
- All resource creation
- Resource properties and configurations
- Security settings (encryption, IAM, etc.)
- Resource naming (includes environmentSuffix)
- Cross-resource relationships
- Error handling and validation
- All public methods/functions
- All conditional branches
- All error paths

**❌ Don't Test:**
- AWS SDK internals
- Third-party library behavior
- Hardcoded environmentSuffix values (use parameterized tests)

### Achieving 100% Coverage

```typescript
// Example: Testing all branches
describe('Database Configuration', () => {
  test('creates encrypted database when encryption enabled', () => {
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      enableEncryption: true  // Test this branch
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true
    });
  });

  test('creates unencrypted database when encryption disabled', () => {
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      enableEncryption: false  // Test this branch
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: false
    });
  });

  test('handles missing configuration gracefully', () => {
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test'
      // Test undefined case
    });
    // Test default behavior
  });
});
```

### Failure Actions
- Identify untested code paths using coverage report
- Add tests for missing coverage
- Test all conditional branches (if/else, switch/case)
- Test error handling paths (try/catch)
- Test edge cases and boundary conditions
- Use code coverage tools to identify gaps

### Agent Responsibility
- **iac-infra-qa-trainer**: Section 4 - Unit test creation and coverage validation
- **iac-code-reviewer**: Phase 3 - Test coverage review

---

## 6. No Files Outside Allowed Directories ✅

### Requirements
- [ ] All infrastructure code in `lib/`
- [ ] All tests in `test/` or `tests/`
- [ ] Entry points in `bin/` (if needed)
- [ ] Only allowed files at root level
- [ ] No files in forbidden locations

### Allowed Locations

**✅ Allowed Folders:**
```
bin/           # Entry points only
lib/           # All infrastructure code + documentation
test/          # Unit and integration tests
tests/         # Alternative test directory
```

**✅ Allowed Root Files:**
```
metadata.json       # Task metadata (REQUIRED)
package.json        # Node.js dependencies
package-lock.json   # Node.js lock file
cdk.json            # CDK configuration
cdktf.json          # CDKTF configuration
Pulumi.yaml         # Pulumi configuration
tap.py              # Python Pulumi entry
tap.go              # Go Pulumi entry
```

### Documentation File Locations

**CRITICAL - These MUST be in lib/, NOT at root:**

```bash
✅ lib/PROMPT.md              # NOT /PROMPT.md
✅ lib/MODEL_RESPONSE.md      # NOT /MODEL_RESPONSE.md
✅ lib/IDEAL_RESPONSE.md      # NOT /IDEAL_RESPONSE.md
✅ lib/MODEL_FAILURES.md      # NOT /MODEL_FAILURES.md
✅ lib/README.md              # NOT /README.md
✅ lib/lambda/handler.py      # NOT /lambda/handler.py
✅ lib/functions/process.js   # NOT /functions/process.js
```

### Forbidden Locations

**❌ Never create files in:**
```
.github/        # CI/CD workflows (managed by repo)
scripts/        # Build scripts (managed by repo)
.claude/        # Agent instructions (managed by repo)
templates/      # Platform templates (managed by repo)
docs/           # Not allowed in PRs
config/         # Not allowed in PRs
.vscode/        # IDE settings
.idea/          # IDE settings
```

### Validation Command

```bash
# Check what files will be in PR
git diff --name-only origin/main...HEAD

# Check for violations (should return empty)
git diff --name-only origin/main...HEAD | grep -v '^bin/' | grep -v '^lib/' | grep -v '^test/' | grep -v '^tests/' | grep -v '^metadata.json$' | grep -v '^cdk.json$' | grep -v '^cdktf.json$' | grep -v '^Pulumi.yaml$' | grep -v '^package.json$' | grep -v '^package-lock.json$' | grep -v '^tap.py$' | grep -v '^tap.go$'

# If above command outputs any files, they are violations
```

### CI/CD Check

The pipeline runs `scripts/check-project-files.sh` **BEFORE** any other jobs. If this fails, the entire pipeline fails immediately.

### Failure Actions
- Move files to correct locations
- Delete files in forbidden locations
- Ensure all documentation is in `lib/`
- Verify with validation command before PR creation

### Impact of Violations
- ❌ CI/CD pipeline fails immediately
- ❌ No build, synth, or deployment runs
- ❌ PR cannot be merged
- ❌ Training quality penalty: -3 points
- ❌ Task marked as failed

### Agent Responsibility
- **iac-infra-generator**: Phase 2 - Create files in correct locations
- **iac-infra-qa-trainer**: Section 5 - Validate file locations
- **iac-code-reviewer**: Phase 1.5 Step 9 - File location validation (Checkpoint K)

---

## Pre-Submission Validation Script

### Run Before PR Creation

```bash
#!/bin/bash
# File: .claude/scripts/pre-submission-check.sh

set -e

TASK_ID=$(jq -r '.po_id' metadata.json)
echo "🔍 Pre-Submission Validation for Task ${TASK_ID}"
echo "================================================"

# 1. Build Success
echo ""
echo "1️⃣ Checking Build..."
bash scripts/build.sh
bash scripts/synth.sh
echo "✅ Build successful"

# 2. Lint Issues
echo ""
echo "2️⃣ Checking Lint..."
bash scripts/lint.sh
echo "✅ No lint issues"

# 3. Synth Issues
echo ""
echo "3️⃣ Synth already validated ✅"

# 4. Deployment Success
echo ""
echo "4️⃣ Checking Deployment..."
if [ ! -f cfn-outputs/flat-outputs.json ]; then
  echo "❌ Deployment outputs not found"
  exit 1
fi
echo "✅ Deployment successful"

# 5. Test Coverage
echo ""
echo "5️⃣ Checking Test Coverage..."
bash scripts/unit-tests.sh

# Extract coverage based on platform
if [ -f coverage/coverage-summary.json ]; then
  STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
  BRANCH_COV=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
  FUNC_COV=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
  LINE_COV=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
  
  echo "Statement Coverage: ${STMT_COV}%"
  echo "Branch Coverage: ${BRANCH_COV}%"
  echo "Function Coverage: ${FUNC_COV}%"
  echo "Line Coverage: ${LINE_COV}%"
  
  if (( $(echo "$STMT_COV < 100" | bc -l) )); then
    echo "❌ Statement coverage below 100%"
    exit 1
  fi
  
  if (( $(echo "$FUNC_COV < 100" | bc -l) )); then
    echo "❌ Function coverage below 100%"
    exit 1
  fi
  
  if (( $(echo "$LINE_COV < 100" | bc -l) )); then
    echo "❌ Line coverage below 100%"
    exit 1
  fi
  
  echo "✅ Test coverage: 100%"
else
  echo "⚠️  Coverage report not found, checking alternative locations..."
  # Add platform-specific coverage checks here
fi

# 6. File Locations
echo ""
echo "6️⃣ Checking File Locations..."
invalid_files=$(git diff --name-only origin/main...HEAD | grep -v '^bin/' | grep -v '^lib/' | grep -v '^test/' | grep -v '^tests/' | grep -v '^metadata.json$' | grep -v '^cdk.json$' | grep -v '^cdktf.json$' | grep -v '^Pulumi.yaml$' | grep -v '^package.json$' | grep -v '^package-lock.json$' | grep -v '^tap.py$' | grep -v '^tap.go$' || true)

if [ -n "$invalid_files" ]; then
  echo "❌ Files in wrong locations:"
  echo "$invalid_files"
  exit 1
fi
echo "✅ All files in correct locations"

# Final Summary
echo ""
echo "================================================"
echo "✅ All Pre-Submission Checks Passed!"
echo "================================================"
echo ""
echo "Ready for PR creation ✅"
```

---

## Summary Checklist

### Quick Validation (Run in worktree)

```bash
# Quick check - all must pass
bash scripts/build.sh && \
bash scripts/synth.sh && \
bash scripts/lint.sh && \
bash scripts/unit-tests.sh && \
bash scripts/deploy.sh && \
bash scripts/integration-tests.sh

# Verify coverage
cat coverage/coverage-summary.json | jq '.total.statements.pct'

# Verify file locations
git diff --name-only origin/main...HEAD
```

### Before PR Creation

- [ ] Build: ✅ Successful
- [ ] Lint: ✅ Zero errors
- [ ] Synth: ✅ Templates generated
- [ ] Deployment: ✅ Stack deployed
- [ ] Unit Tests: ✅ 100% coverage
- [ ] Integration Tests: ✅ All passing
- [ ] File Locations: ✅ All correct
- [ ] Documentation: ✅ All in `lib/`

### Training Quality Impact

| Requirement | Failure Penalty | Critical? |
|------------|----------------|-----------|
| Build fails | -5 points | YES |
| Lint errors | -2 points | YES |
| Synth fails | -5 points | YES |
| Deployment fails | -3 points | YES |
| Coverage < 100% | -3 points | YES |
| Wrong file locations | -3 points | YES |

**Minimum passing score: 8/10**

If any critical requirement fails, training quality will likely drop below 8, **BLOCKING PR creation**.

---

## Agent Integration

### iac-infra-qa-trainer
- **Section 2**: Enforce build/lint/synth requirements
- **Section 3**: Enforce deployment success
- **Section 4**: Enforce 100% test coverage
- **Section 5**: Validate file locations

### iac-code-reviewer
- **Phase 1.5**: Validate all checkpoints
- **Phase 2**: Review code quality
- **Phase 3**: Review test coverage (must be 100%)
- **Phase 4**: Calculate training quality with new thresholds

### task-coordinator
- **Phase 5**: Run pre-submission validation before PR creation
- **BLOCK PR** if any requirement fails
- Report specific failures and remediation steps

---

## References

- **Detailed Testing Guide**: `.claude/docs/guides/validation_and_testing_guide.md`
- **Common Issues**: `.claude/lessons_learnt.md`
- **File Restrictions**: `.claude/docs/references/cicd-file-restrictions.md`
- **Validation Checkpoints**: `.claude/docs/references/validation-checkpoints.md`
- **Quick Checklist**: `.claude/docs/references/quick_validation_checklist.md`

---

*Last Updated: 2025-11-04*
*This document defines non-negotiable quality gates for all synthetic tasks*

