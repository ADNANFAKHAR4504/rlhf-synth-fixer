# Error Recovery Guide

## Purpose

While error-handling.md focuses on **prevention and reporting**, this guide provides **recovery decision trees** for when things go wrong.

---

## Recovery Philosophy

1. **Attempt automated recovery first** (up to retry limits)
2. **Document the error** for future prevention
3. **Escalate to user only when blocked** (cannot auto-recover)
4. **Fail fast** when recovery is impossible

---

## Error Categories and Recovery

### Category 1: Deployment Failures

**Symptoms**: AWS resource creation fails, CloudFormation stack errors, Terraform apply fails

#### Decision Tree

```
Deployment Failed
  ↓
Check error type:
  ↓
Infrastructure Quota Error? (e.g., "LimitExceeded")
  YES → ESCALATE TO USER → Await quota increase → RETRY
  NO → Continue
  ↓
Resource Dependency Error? (e.g., "SecurityGroup not found")
  YES → FIX DEPENDENCY → RETRY (if attempts < 5)
  NO → Continue
  ↓
Permission/Auth Error? (e.g., "AccessDenied", "InvalidCredentials")
  YES → ESCALATE TO USER → Await fix → RETRY
  NO → Continue
  ↓
Resource Conflict? (e.g., "AlreadyExists", "NameInUse")
  YES → ADD UNIQUE SUFFIX → RETRY (if attempts < 5)
  NO → Continue
  ↓
Configuration Error? (e.g., "InvalidParameterValue", "ValidationError")
  YES → ANALYZE & FIX CODE → RETRY (if attempts < 5)
  NO → Continue
  ↓
Timeout/Transient Error? (e.g., "Throttling", "ServiceUnavailable")
  YES → WAIT 30s → RETRY (if attempts < 5)
  NO → Continue
  ↓
Unknown/Other Error?
  YES → LOG ERROR → RETRY ONCE → If fails: FAIL TASK
```

#### Recovery Actions

##### 1. Quota/Limit Errors

**Error Examples**:
- `LimitExceeded: You have exceeded your quota for VPCs`
- `Too many EIPs allocated`
- `Instance limit exceeded`

**Recovery**:
```bash
# Report to user
echo "❌ AWS Quota Limit: ${ERROR_MESSAGE}"
echo "Action required: Request quota increase for ${RESOURCE_TYPE}"
echo "Region: ${AWS_REGION}"
echo ""
echo "Options:"
echo "1. Request quota increase via AWS Support Console"
echo "2. Switch to different region (if acceptable)"
echo "3. Clean up unused resources"
echo ""
echo "Pausing deployment. Type 'continue' when quota increased:"

# Wait for user input
read USER_INPUT

if [ "$USER_INPUT" = "continue" ]; then
    echo "Retrying deployment..."
    # Retry deployment
else
    echo "Deployment cancelled by user"
    exit 1
fi
```

##### 2. Resource Dependency Errors

**Error Examples**:
- `SecurityGroupId sg-xxx does not exist`
- `SubnetId subnet-yyy not found`
- `Invalid VPC ID`

**Recovery**:
```bash
# Analyze error
MISSING_RESOURCE=$(extract_missing_resource_from_error "$ERROR_MSG")

echo "⚠️ Missing dependency: ${MISSING_RESOURCE}"

# Check if it's supposed to be created by this stack
if resource_should_exist_in_stack "$MISSING_RESOURCE"; then
    echo "✅ Resource should be created by stack, fixing order..."

    # Fix resource creation order in code
    # E.g., move SecurityGroup creation before EC2 instance

    echo "Retrying deployment with fixed order..."
    RETRY_DEPLOYMENT=true
else
    echo "❌ External dependency missing"
    echo "This resource should exist outside the stack."
    echo "Please create ${MISSING_RESOURCE} manually or update code to create it."
    exit 1
fi
```

##### 3. Permission/Auth Errors

**Error Examples**:
- `User: arn:aws:iam::xxx is not authorized to perform: iam:CreateRole`
- `AccessDenied: cannot access S3 bucket`

**Recovery**:
```bash
echo "❌ AWS Permission Error: ${ERROR_MESSAGE}"
echo ""
echo "Missing permission: ${PERMISSION_NEEDED}"
echo "Current IAM role/user: ${CURRENT_IDENTITY}"
echo ""
echo "Actions required:"
echo "1. Add permission to IAM role/user"
echo "2. OR switch to role/user with required permissions"
echo ""
echo "Deployment paused. Type 'continue' when permissions granted:"

read USER_INPUT

if [ "$USER_INPUT" = "continue" ]; then
    echo "Retrying deployment..."
    # Retry
else
    exit 1
fi
```

##### 4. Resource Conflict Errors

**Error Examples**:
- `Stack 'TapStack-test' already exists`
- `S3 bucket name already taken`
- `Lambda function name already exists`

**Recovery**:
```bash
echo "⚠️ Resource conflict: ${RESOURCE_NAME} already exists"

# Check if it's from previous failed deployment
if is_from_previous_deployment "$RESOURCE_NAME"; then
    echo "Found orphaned resource from previous deployment"
    echo "Cleaning up..."

    # Delete orphaned resource
    delete_resource "$RESOURCE_NAME"

    echo "Retrying deployment..."
    RETRY_DEPLOYMENT=true
else
    echo "Resource conflict with existing infrastructure"

    # Add unique suffix if not present
    if ! has_environment_suffix "$RESOURCE_NAME"; then
        echo "Adding environmentSuffix to resource name..."
        update_resource_name_with_suffix "$RESOURCE_NAME"

        echo "Retrying deployment with unique name..."
        RETRY_DEPLOYMENT=true
    else
        echo "❌ Cannot resolve conflict (suffix already present)"
        exit 1
    fi
fi
```

##### 5. Configuration Errors

**Error Examples**:
- `InvalidParameterValue: Invalid instance type`
- `ValidationError: VPC CIDR overlap`
- `MinCapacity must be <=  MaxCapacity`

**Recovery**:
```bash
echo "⚠️ Configuration error: ${ERROR_MESSAGE}"

# Attempt automated fix based on error type
if fix_configuration_error "$ERROR_TYPE"; then
    echo "✅ Configuration fixed automatically"
    echo "Retrying deployment..."
    RETRY_DEPLOYMENT=true
else
    echo "❌ Cannot auto-fix configuration error"
    echo "Manual code changes required:"
    echo "${SUGGESTED_FIX}"
    exit 1
fi
```

**Common Auto-Fixes**:
```bash
fix_configuration_error() {
    case "$1" in
        "InvalidInstanceType")
            # Replace with valid instance type
            sed -i 's/t2\.invalid/t3.micro/g' lib/*.ts
            return 0
            ;;
        "MinMaxCapacityError")
            # Swap if inverted
            # Logic to fix min/max capacity
            return 0
            ;;
        "CIDROverlap")
            # Generate new non-overlapping CIDR
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}
```

##### 6. Timeout/Transient Errors

**Error Examples**:
- `Rate exceeded: Throttling`
- `ServiceUnavailable: Temporary service outage`
- `RequestTimeout`

**Recovery**:
```bash
ATTEMPT=1
MAX_ATTEMPTS=5

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS..."

    if deploy_infrastructure; then
        echo "✅ Deployment successful"
        exit 0
    else
        if is_transient_error "$ERROR_MSG"; then
            WAIT_TIME=$((30 * ATTEMPT))  # Exponential backoff
            echo "⚠️ Transient error, waiting ${WAIT_TIME}s..."
            sleep $WAIT_TIME
            ATTEMPT=$((ATTEMPT + 1))
        else
            echo "❌ Non-transient error, stopping retries"
            exit 1
        fi
    fi
done

echo "❌ Max attempts reached, deployment failed"
exit 1
```

---

### Category 2: Test Failures

**Symptoms**: Unit tests fail, integration tests fail, coverage below threshold

#### Decision Tree

```
Tests Failed
  ↓
Which test type?
  ↓
Unit Tests Failed?
  ↓
  Check failure type:
    ↓
    Syntax/Import Error?
      YES → FIX CODE → RERUN (no retry limit)
    ↓
    Assertion Failure?
      YES → ANALYZE → FIX CODE OR TEST → RERUN
    ↓
    Coverage < 90%?
      YES → ADD TESTS → RERUN (iterate until ≥90%)

Integration Tests Failed?
  ↓
  Check failure type:
    ↓
    Resource Not Found?
      YES → CHECK OUTPUTS → FIX TEST OR DEPLOYMENT → RERUN
    ↓
    Permission Error?
      YES → ESCALATE OR ADD IAM → RETRY
    ↓
    Timeout?
      YES → INCREASE TIMEOUT → RETRY (if < 3 attempts)
    ↓
    Functional Failure?
      YES → FIX CODE → REDEPLOY → RERUN TESTS
```

#### Recovery Actions

##### 1. Unit Test Syntax Errors

**Error Examples**:
- `SyntaxError: Unexpected token`
- `ImportError: Module not found`
- `ReferenceError: x is not defined`

**Recovery**:
```bash
echo "⚠️ Unit test syntax error: ${ERROR_MSG}"

# Common fixes
if [[ "$ERROR_MSG" =~ "Module not found" ]]; then
    MODULE=$(extract_module_name "$ERROR_MSG")
    echo "Installing missing module: $MODULE"
    npm install --save-dev "$MODULE"

elif [[ "$ERROR_MSG" =~ "Unexpected token" ]]; then
    echo "TypeScript compilation error, checking tsconfig.json..."
    # Fix tsconfig issues

elif [[ "$ERROR_MSG" =~ "is not defined" ]]; then
    echo "Missing import, adding..."
    # Auto-add import
fi

echo "Retrying tests..."
npm run test
```

##### 2. Unit Test Assertion Failures

**Error Examples**:
- `Expected 2 to equal 3`
- `AssertionError: False is not true`

**Recovery**:
```bash
echo "⚠️ Unit test assertion failed"

# Analyze failure
echo "Test: ${FAILING_TEST}"
echo "Expected: ${EXPECTED}"
echo "Actual: ${ACTUAL}"

# Decision: Is test wrong or code wrong?
echo ""
echo "Is the test assertion correct? (yes/no)"
read IS_TEST_CORRECT

if [ "$IS_TEST_CORRECT" = "yes" ]; then
    echo "Fixing code to match assertion..."
    # Fix code
else
    echo "Updating test assertion..."
    # Fix test
fi

npm run test
```

##### 3. Coverage Below Threshold

**Error Examples**:
- `Coverage: 85% (threshold: 90%)`

**Recovery**:
```bash
COVERAGE=$(get_coverage_percentage)
THRESHOLD=90

echo "Coverage: ${COVERAGE}% (threshold: ${THRESHOLD}%)"

if [ "$COVERAGE" -lt "$THRESHOLD" ]; then
    GAP=$((THRESHOLD - COVERAGE))
    echo "Gap: ${GAP}%"

    # Identify uncovered files
    UNCOVERED=$(get_uncovered_files)

    echo "Uncovered areas:"
    echo "$UNCOVERED"

    echo ""
    echo "Adding tests for uncovered code..."

    # Generate test stubs for uncovered files
    for file in $UNCOVERED; do
        generate_test_stub "$file"
    done

    echo "Test stubs created. Implement tests and rerun."
    exit 1  # Require manual test implementation
fi
```

##### 4. Integration Test Resource Not Found

**Error Examples**:
- `Error: S3 bucket not found in outputs`
- `DynamoDB table does not exist`

**Recovery**:
```bash
echo "⚠️ Integration test error: Resource not found"

# Check if resource exists in deployment
RESOURCE_NAME=$(extract_resource_from_error "$ERROR_MSG")

if aws_resource_exists "$RESOURCE_NAME"; then
    echo "✅ Resource exists in AWS"
    echo "❌ But not in cfn-outputs/flat-outputs.json"
    echo "Fixing: Add output to stack..."

    # Add output to stack code
    add_stack_output "$RESOURCE_NAME"

    echo "Redeploying to update outputs..."
    deploy_infrastructure

    echo "Retrying tests..."
    npm run test:integration
else
    echo "❌ Resource doesn't exist in AWS"
    echo "Deployment issue or resource not created"
    exit 1
fi
```

##### 5. Integration Test Timeout

**Error Examples**:
- `Timeout waiting for Lambda response`
- `Test exceeded 30s timeout`

**Recovery**:
```bash
ATTEMPT=1
MAX_ATTEMPTS=3

TIMEOUT=30  # Initial timeout

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS (timeout: ${TIMEOUT}s)..."

    if run_integration_tests_with_timeout "$TIMEOUT"; then
        echo "✅ Tests passed"
        exit 0
    else
        if is_timeout_error "$ERROR_MSG"; then
            TIMEOUT=$((TIMEOUT * 2))  # Double timeout
            echo "⚠️ Timeout, increasing to ${TIMEOUT}s..."
            ATTEMPT=$((ATTEMPT + 1))
        else
            echo "❌ Non-timeout error"
            exit 1
        fi
    fi
done

echo "❌ Still timing out after ${MAX_ATTEMPTS} attempts"
echo "Possible issues:"
echo "- Resource is genuinely slow (cold start, large data)"
echo "- Networking issues"
echo "- Infinite loop in code"
exit 1
```

---

### Category 3: Build/Compilation Failures

**Symptoms**: npm run build fails, tsc errors, linting errors

#### Decision Tree

```
Build Failed
  ↓
Check error type:
  ↓
Linting Error?
  YES → AUTO-FIX IF POSSIBLE → RERUN → If still fails: MANUAL FIX
  NO → Continue
  ↓
TypeScript Compilation Error?
  YES → ANALYZE → FIX CODE → RERUN (no retry limit)
  NO → Continue
  ↓
Dependency Error?
  YES → INSTALL DEPENDENCIES → RERUN
  NO → FAIL (unknown error)
```

#### Recovery Actions

##### 1. Linting Errors

**Error Examples**:
- `Error: Expected semicolon`
- `Warning: Unused variable 'x'`

**Recovery**:
```bash
echo "⚠️ Linting errors found"

# Attempt auto-fix
echo "Running auto-fix..."
npm run lint -- --fix

if [ $? -eq 0 ]; then
    echo "✅ All linting errors auto-fixed"
else
    echo "⚠️ Some errors require manual fix"

    # List remaining errors
    npm run lint

    echo ""
    echo "Manual fixes required. Common issues:"
    echo "- Remove unused imports"
    echo "- Add missing semicolons"
    echo "- Fix indentation"
    exit 1
fi
```

##### 2. TypeScript Compilation Errors

**Error Examples**:
- `Type 'string' is not assignable to type 'number'`
- `Property 'x' does not exist on type 'Y'`

**Recovery**:
```bash
echo "⚠️ TypeScript compilation error"

# Extract error details
ERROR_FILE=$(extract_file_from_tsc_error "$ERROR_MSG")
ERROR_LINE=$(extract_line_from_tsc_error "$ERROR_MSG")

echo "File: $ERROR_FILE"
echo "Line: $ERROR_LINE"
echo "Error: $ERROR_MSG"

# Common patterns for auto-fix
if [[ "$ERROR_MSG" =~ "is not assignable to type" ]]; then
    echo "Type mismatch - adding type conversion..."
    # Auto-add type conversion if simple

elif [[ "$ERROR_MSG" =~ "does not exist on type" ]]; then
    echo "Property missing - checking if typo..."
    # Suggest correct property name

else
    echo "Manual fix required"
    exit 1
fi

# Recompile
npm run build
```

##### 3. Dependency Errors

**Error Examples**:
- `Cannot find module '@aws-sdk/client-s3'`
- `Module not found: Error: Can't resolve 'lodash'`

**Recovery**:
```bash
MODULE=$(extract_module_from_error "$ERROR_MSG")

echo "⚠️ Missing dependency: $MODULE"

# Check if in package.json
if is_in_package_json "$MODULE"; then
    echo "Module in package.json but not installed"
    echo "Running npm ci..."
    npm ci
else
    echo "Module not in package.json"
    echo "Installing $MODULE..."
    npm install --save "$MODULE"
fi

# Retry build
npm run build
```

---

### Category 4: Platform/Language Mismatch

**Symptoms**: Generated code uses wrong IaC tool or language

#### Decision Tree

```
Platform Mismatch Detected
  ↓
Is this first generation?
  YES → REGENERATE WITH STRONGER CONSTRAINTS
  NO → FAIL (already tried, model cannot generate correct platform)
  ↓
Regeneration:
  ↓
  Update PROMPT.md with explicit constraints:
    "YOU MUST USE [PLATFORM] with [LANGUAGE]"
    "DO NOT use [other platforms]"
    "ANY code not in [PLATFORM]/[LANGUAGE] will be rejected"
  ↓
  Regenerate MODEL_RESPONSE
  ↓
  Verify platform again:
    ↓
    Still wrong?
      YES → FAIL TASK (model cannot comply)
      NO → Continue with QA pipeline
```

#### Recovery Action

```bash
echo "❌ CRITICAL: Platform/language mismatch"

EXPECTED_PLATFORM=$(jq -r '.platform' metadata.json)
EXPECTED_LANGUAGE=$(jq -r '.language' metadata.json)
ACTUAL_PLATFORM=$(detect_platform_from_code)

echo "Expected: $EXPECTED_PLATFORM-$EXPECTED_LANGUAGE"
echo "Actual: $ACTUAL_PLATFORM"

# Check if already regenerated
if [ -f lib/PROMPT2.md ]; then
    echo "❌ Already attempted regeneration"
    echo "Model cannot generate correct platform"
    echo "Marking task as ERROR"

    ./.claude/scripts/task-manager.sh mark-error "${TASK_ID}" \
        "Platform mismatch: cannot generate $EXPECTED_PLATFORM-$EXPECTED_LANGUAGE" \
        "code-generation"

    exit 1
else
    echo "⚠️ First attempt, regenerating with stronger constraints..."

    # Create enhanced PROMPT
    cat lib/PROMPT.md > lib/PROMPT2.md
    cat >> lib/PROMPT2.md << EOF

## CRITICAL CONSTRAINTS

**YOU MUST USE ${EXPECTED_PLATFORM^^} WITH ${EXPECTED_LANGUAGE^^}**

- DO NOT use Terraform
- DO NOT use CloudFormation
- DO NOT use CDK
- DO NOT use Pulumi
- DO NOT use CDKTF
(Remove the one that matches $EXPECTED_PLATFORM from above list)

ANY code generated in a different platform or language will be REJECTED.
EOF

    echo "Regenerating with PROMPT2.md..."
    # Hand off to iac-infra-generator

    exit 0  # Continue pipeline
fi
```

---

## Retry Limits by Category

| Error Category | Max Retries | Backoff Strategy |
|----------------|-------------|------------------|
| Deployment | 5 | None (immediate retry after fix) |
| Transient (throttling) | 5 | Exponential (30s, 60s, 120s...) |
| Test failures | Unlimited | None (fix then rerun) |
| Build failures | Unlimited | None (fix then rerun) |
| Platform mismatch | 1 | N/A (regenerate once) |

---

## When to Fail Fast

Do NOT retry in these cases:

1. **AWS Quota Limits**: Requires user action
2. **Permission Errors**: Requires IAM changes
3. **Platform Mismatch (2nd attempt)**: Model cannot comply
4. **Max Retries Reached**: Stop wasting resources
5. **Unknown/Unhandled Errors**: Cannot auto-recover

---

## Escalation to User

### Pattern

```bash
escalate_to_user() {
    local ERROR_TYPE="$1"
    local ERROR_MSG="$2"
    local REQUIRED_ACTION="$3"

    echo "╔════════════════════════════════════════╗"
    echo "║   USER INTERVENTION REQUIRED          ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Error Type: $ERROR_TYPE"
    echo "Error: $ERROR_MSG"
    echo ""
    echo "Required Action:"
    echo "$REQUIRED_ACTION"
    echo ""
    echo "Deployment paused. Type 'continue' when resolved, or 'cancel' to abort:"

    read USER_INPUT

    if [ "$USER_INPUT" = "continue" ]; then
        return 0  # Continue
    else
        echo "Deployment cancelled by user"
        return 1  # Abort
    fi
}
```

### Usage

```bash
if escalate_to_user "AWS Quota" "VPC limit exceeded" \
    "Request VPC quota increase via AWS Support Console"; then
    # User resolved, retry
    retry_deployment
else
    # User cancelled
    mark_task_error
fi
```

---

## Summary

**Recovery Order**:
1. Attempt automated fix (if pattern known)
2. Retry with exponential backoff (if transient)
3. Escalate to user (if requires external action)
4. Fail fast (if unrecoverable or max retries reached)

**Key Principle**: "Fix what you can, escalate what you can't, fail what's impossible."

**See Also**:
- error-handling.md for error reporting and patterns
- lessons_learnt.md for common issues and fixes
- validation_and_testing_guide.md for test-specific guidance
