---
name: localstack-deploy-tester
description: Tests if an IaC task is deployable to LocalStack, capturing detailed deployment and test results.
color: blue
model: sonnet
---

# LocalStack Deploy Tester Agent

Tests IaC tasks for LocalStack deployability without making modifications. Captures detailed results and errors for analysis.

## Input Parameters

- `WORK_DIR` - Working directory containing task files
- `TASK_PATH` - Original task path (for reference)
- `PLATFORM` - IaC platform (cdk, cfn, tf, pulumi)
- `LANGUAGE` - Programming language (ts, py, go, java, yaml, hcl)
- `PR_ID` - PR identifier

## Execution Steps

### Step 1: Setup Environment

```bash
cd "$WORK_DIR"
echo "📁 Working directory: $(pwd)"

# Set LocalStack environment variables
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_S3_FORCE_PATH_STYLE=true

# CDK-specific
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1

# Pulumi-specific
export PULUMI_CONFIG_PASSPHRASE=""
export AWS_SKIP_CREDENTIALS_VALIDATION=true
export AWS_SKIP_METADATA_API_CHECK=true

# Initialize output file
OUTPUT_FILE="execution-output.md"
cat > "$OUTPUT_FILE" << EOF
# LocalStack Deployment Test

**Date:** $(date)
**Task:** $TASK_PATH
**Platform:** $PLATFORM
**Language:** $LANGUAGE
**PR ID:** $PR_ID

---

EOF

echo "✅ Environment configured"
```

### Step 2: Install Dependencies

Based on platform and language, install necessary dependencies:

````bash
echo "" >> "$OUTPUT_FILE"
echo "## Dependencies Installation" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

INSTALL_SUCCESS=true
INSTALL_ERRORS=""

case "$PLATFORM-$LANGUAGE" in
  cdk-ts|cdk-typescript)
    echo "Installing CDK TypeScript dependencies..."

    # Install npm packages
    if [ -f "package.json" ]; then
      npm install 2>&1 | tee -a "$OUTPUT_FILE" || INSTALL_SUCCESS=false
    fi

    # Build TypeScript
    if [ -f "tsconfig.json" ]; then
      echo "Building TypeScript..."
      npm run build 2>&1 | tee -a "$OUTPUT_FILE" || npx tsc --skipLibCheck 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi

    # Ensure cdklocal is available
    if ! command -v cdklocal &> /dev/null; then
      echo "Installing aws-cdk-local..."
      npm install -g aws-cdk-local aws-cdk 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi
    ;;

  cdk-py|cdk-python)
    echo "Installing CDK Python dependencies..."

    # Create virtual environment
    python3 -m venv .venv 2>&1 || true
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true

    # Install requirements
    if [ -f "requirements.txt" ]; then
      pip install -r requirements.txt 2>&1 | tee -a "$OUTPUT_FILE" || INSTALL_SUCCESS=false
    fi

    # Install CDK local
    pip install aws-cdk-local 2>&1 | tee -a "$OUTPUT_FILE" || true
    ;;

  cfn-yaml|cfn-json|cfn-yml)
    echo "CloudFormation - No dependencies to install"

    # Validate template
    TEMPLATE_FILE=""
    if [ -f "lib/TapStack.yml" ]; then
      TEMPLATE_FILE="lib/TapStack.yml"
    elif [ -f "lib/TapStack.yaml" ]; then
      TEMPLATE_FILE="lib/TapStack.yaml"
    elif [ -f "lib/TapStack.json" ]; then
      TEMPLATE_FILE="lib/TapStack.json"
    fi

    if [ -n "$TEMPLATE_FILE" ]; then
      echo "Validating template: $TEMPLATE_FILE"
      awslocal cloudformation validate-template --template-body "file://$TEMPLATE_FILE" 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi
    ;;

  tf-hcl|terraform-hcl)
    echo "Installing Terraform dependencies..."

    # Check tflocal
    if ! command -v tflocal &> /dev/null; then
      echo "Installing terraform-local..."
      pip install terraform-local 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi

    # Initialize Terraform
    cd lib 2>/dev/null || true
    tflocal init 2>&1 | tee -a "$OUTPUT_FILE" || INSTALL_SUCCESS=false
    cd - >/dev/null 2>&1 || true
    ;;

  pulumi-ts|pulumi-typescript)
    echo "Installing Pulumi TypeScript dependencies..."

    if [ -f "package.json" ]; then
      npm install 2>&1 | tee -a "$OUTPUT_FILE" || INSTALL_SUCCESS=false
    fi

    # Build if TypeScript
    if [ -f "tsconfig.json" ]; then
      npm run build 2>&1 | tee -a "$OUTPUT_FILE" || npx tsc 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi
    ;;

  pulumi-py|pulumi-python)
    echo "Installing Pulumi Python dependencies..."

    python3 -m venv .venv 2>&1 || true
    source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null || true

    if [ -f "requirements.txt" ]; then
      pip install -r requirements.txt 2>&1 | tee -a "$OUTPUT_FILE" || INSTALL_SUCCESS=false
    fi

    pip install pulumi pulumi-aws 2>&1 | tee -a "$OUTPUT_FILE" || true
    ;;

  *)
    echo "Unknown platform-language: $PLATFORM-$LANGUAGE"
    echo "Attempting generic setup..."

    if [ -f "package.json" ]; then
      npm install 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi
    if [ -f "requirements.txt" ]; then
      pip install -r requirements.txt 2>&1 | tee -a "$OUTPUT_FILE" || true
    fi
    ;;
esac

echo '```' >> "$OUTPUT_FILE"

if [ "$INSTALL_SUCCESS" = true ]; then
  echo "✅ Dependencies installed" | tee -a "$OUTPUT_FILE"
else
  echo "⚠️ Some dependencies failed to install" | tee -a "$OUTPUT_FILE"
fi
````

### Step 3: Attempt Deployment

````bash
echo "" >> "$OUTPUT_FILE"
echo "## Deployment" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

DEPLOY_SUCCESS=false
DEPLOY_ERRORS=""
DEPLOY_START=$(date +%s)

case "$PLATFORM" in
  cdk)
    echo "Deploying with CDK to LocalStack..."

    # Bootstrap first
    echo "Bootstrapping CDK..."
    cdklocal bootstrap aws://000000000000/us-east-1 --force 2>&1 | tee -a "$OUTPUT_FILE" || true

    # Deploy
    echo "Deploying stack..."
    if cdklocal deploy --all --require-approval never --progress events 2>&1 | tee -a "$OUTPUT_FILE"; then
      DEPLOY_SUCCESS=true
    else
      DEPLOY_ERRORS="CDK deployment failed"
    fi
    ;;

  cfn)
    echo "Deploying CloudFormation to LocalStack..."

    # Find template
    TEMPLATE_FILE=""
    for t in lib/TapStack.yml lib/TapStack.yaml lib/TapStack.json; do
      if [ -f "$t" ]; then
        TEMPLATE_FILE="$t"
        break
      fi
    done

    if [ -z "$TEMPLATE_FILE" ]; then
      DEPLOY_ERRORS="No CloudFormation template found"
    else
      STACK_NAME="tap-stack-localstack"

      # Delete existing stack if present
      awslocal cloudformation delete-stack --stack-name "$STACK_NAME" 2>/dev/null || true
      sleep 2

      # Create stack
      echo "Creating stack from $TEMPLATE_FILE..."
      if awslocal cloudformation create-stack \
          --stack-name "$STACK_NAME" \
          --template-body "file://$TEMPLATE_FILE" \
          --parameters ParameterKey=Environment,ParameterValue=dev \
          --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
          2>&1 | tee -a "$OUTPUT_FILE"; then

        # Wait for completion
        echo "Waiting for stack creation..."
        WAIT_COUNT=0
        MAX_WAIT=60

        while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
          STATUS=$(awslocal cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "UNKNOWN")

          echo "Stack status: $STATUS" | tee -a "$OUTPUT_FILE"

          case "$STATUS" in
            CREATE_COMPLETE|UPDATE_COMPLETE)
              DEPLOY_SUCCESS=true
              break
              ;;
            CREATE_FAILED|ROLLBACK_COMPLETE|ROLLBACK_FAILED|DELETE_FAILED)
              DEPLOY_ERRORS="Stack creation failed with status: $STATUS"
              # Get failure reason
              awslocal cloudformation describe-stack-events --stack-name "$STACK_NAME" \
                --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
                --output table 2>&1 | tee -a "$OUTPUT_FILE" || true
              break
              ;;
            UNKNOWN)
              DEPLOY_ERRORS="Stack not found after creation"
              break
              ;;
          esac

          sleep 3
          WAIT_COUNT=$((WAIT_COUNT + 1))
        done

        if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
          DEPLOY_ERRORS="Stack creation timed out"
        fi
      else
        DEPLOY_ERRORS="Failed to create CloudFormation stack"
      fi
    fi
    ;;

  tf)
    echo "Deploying Terraform to LocalStack..."

    cd lib 2>/dev/null || true

    # Plan
    echo "Running terraform plan..."
    if tflocal plan -out=tfplan 2>&1 | tee -a "$OUTPUT_FILE"; then
      # Apply
      echo "Running terraform apply..."
      if tflocal apply -auto-approve tfplan 2>&1 | tee -a "$OUTPUT_FILE"; then
        DEPLOY_SUCCESS=true
      else
        DEPLOY_ERRORS="Terraform apply failed"
      fi
    else
      DEPLOY_ERRORS="Terraform plan failed"
    fi

    cd - >/dev/null 2>&1 || true
    ;;

  pulumi)
    echo "Deploying Pulumi to LocalStack..."

    # Setup local backend
    mkdir -p .pulumi-state
    pulumi login --local 2>&1 | tee -a "$OUTPUT_FILE" || true

    # Initialize stack
    STACK_NAME="localstack-dev"
    pulumi stack select "$STACK_NAME" 2>/dev/null || pulumi stack init "$STACK_NAME" 2>&1 | tee -a "$OUTPUT_FILE"

    # Configure AWS for LocalStack
    pulumi config set aws:region us-east-1 2>/dev/null || true
    pulumi config set aws:accessKey test 2>/dev/null || true
    pulumi config set aws:secretKey test --secret 2>/dev/null || true
    pulumi config set aws:skipCredentialsValidation true 2>/dev/null || true
    pulumi config set aws:skipMetadataApiCheck true 2>/dev/null || true
    pulumi config set aws:s3UsePathStyle true 2>/dev/null || true

    # Set endpoints
    pulumi config set aws:endpoints '[{"s3":"http://localhost:4566","lambda":"http://localhost:4566","dynamodb":"http://localhost:4566","sqs":"http://localhost:4566","sns":"http://localhost:4566","iam":"http://localhost:4566","cloudformation":"http://localhost:4566","cloudwatch":"http://localhost:4566","sts":"http://localhost:4566"}]' 2>/dev/null || true

    # Deploy
    if pulumi up --yes --refresh 2>&1 | tee -a "$OUTPUT_FILE"; then
      DEPLOY_SUCCESS=true
    else
      DEPLOY_ERRORS="Pulumi deployment failed"
    fi
    ;;

  *)
    DEPLOY_ERRORS="Unsupported platform: $PLATFORM"
    ;;
esac

DEPLOY_END=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))

echo '```' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**Deployment Duration:** ${DEPLOY_DURATION}s" >> "$OUTPUT_FILE"

if [ "$DEPLOY_SUCCESS" = true ]; then
  echo "**Deployment Status:** ✅ SUCCESS" >> "$OUTPUT_FILE"
else
  echo "**Deployment Status:** ❌ FAILED" >> "$OUTPUT_FILE"
  echo "**Error:** $DEPLOY_ERRORS" >> "$OUTPUT_FILE"
fi
````

### Step 4: Extract Stack Outputs

````bash
if [ "$DEPLOY_SUCCESS" = true ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "## Stack Outputs" >> "$OUTPUT_FILE"

  mkdir -p cfn-outputs

  case "$PLATFORM" in
    cdk|cfn)
      # Get CloudFormation outputs
      STACK_NAME=$(awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[0].StackName' --output text 2>/dev/null || echo "")

      if [ -n "$STACK_NAME" ] && [ "$STACK_NAME" != "None" ]; then
        awslocal cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output json 2>/dev/null | \
          jq 'if . then map({(.OutputKey): .OutputValue}) | add // {} else {} end' > cfn-outputs/flat-outputs.json
      else
        echo "{}" > cfn-outputs/flat-outputs.json
      fi
      ;;

    tf)
      cd lib 2>/dev/null || true
      tflocal output -json > ../cfn-outputs/flat-outputs.json 2>/dev/null || echo "{}" > ../cfn-outputs/flat-outputs.json
      cd - >/dev/null 2>&1 || true
      ;;

    pulumi)
      pulumi stack output --json > cfn-outputs/flat-outputs.json 2>/dev/null || echo "{}" > cfn-outputs/flat-outputs.json
      ;;
  esac

  echo '```json' >> "$OUTPUT_FILE"
  cat cfn-outputs/flat-outputs.json >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"

  echo "✅ Outputs saved to cfn-outputs/flat-outputs.json"
fi
````

### Step 5: Run Integration Tests (if deployment succeeded)

````bash
TEST_SUCCESS=false
TEST_ERRORS=""

if [ "$DEPLOY_SUCCESS" = true ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "## Integration Tests" >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"

  # Find test files
  TEST_DIR=""
  if [ -d "test" ]; then
    TEST_DIR="test"
  elif [ -d "tests" ]; then
    TEST_DIR="tests"
  fi

  if [ -n "$TEST_DIR" ]; then
    echo "Running integration tests from $TEST_DIR..."

    case "$LANGUAGE" in
      ts|typescript|js|javascript)
        # Run with Jest
        if npx jest --testPathPattern='int|integration' --passWithNoTests --forceExit 2>&1 | tee -a "$OUTPUT_FILE"; then
          TEST_SUCCESS=true
        else
          TEST_ERRORS="Jest integration tests failed"
        fi
        ;;

      py|python)
        # Run with pytest
        source .venv/bin/activate 2>/dev/null || true
        if pytest "$TEST_DIR" -k "int or integration" -v 2>&1 | tee -a "$OUTPUT_FILE"; then
          TEST_SUCCESS=true
        else
          TEST_ERRORS="Pytest integration tests failed"
        fi
        ;;

      go)
        # Run Go tests
        if go test -v ./... -run "Integration|Int" 2>&1 | tee -a "$OUTPUT_FILE"; then
          TEST_SUCCESS=true
        else
          TEST_ERRORS="Go integration tests failed"
        fi
        ;;

      *)
        echo "No test runner configured for language: $LANGUAGE"
        TEST_SUCCESS=true  # Pass if no tests
        ;;
    esac
  else
    echo "No test directory found"
    TEST_SUCCESS=true  # Pass if no tests
  fi

  echo '```' >> "$OUTPUT_FILE"

  if [ "$TEST_SUCCESS" = true ]; then
    echo "**Test Status:** ✅ PASSED" >> "$OUTPUT_FILE"
  else
    echo "**Test Status:** ❌ FAILED" >> "$OUTPUT_FILE"
    echo "**Error:** $TEST_ERRORS" >> "$OUTPUT_FILE"
  fi
fi
````

### Step 6: Generate Summary

```bash
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## Summary" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ "$DEPLOY_SUCCESS" = true ] && [ "$TEST_SUCCESS" = true ]; then
  echo "### ✅ READY FOR MIGRATION" >> "$OUTPUT_FILE"
  OVERALL_STATUS="success"
else
  echo "### ❌ NEEDS FIXES" >> "$OUTPUT_FILE"
  OVERALL_STATUS="failed"

  echo "" >> "$OUTPUT_FILE"
  echo "**Issues Found:**" >> "$OUTPUT_FILE"

  if [ "$DEPLOY_SUCCESS" != true ]; then
    echo "- Deployment: $DEPLOY_ERRORS" >> "$OUTPUT_FILE"
  fi

  if [ "$TEST_SUCCESS" != true ] && [ "$DEPLOY_SUCCESS" = true ]; then
    echo "- Tests: $TEST_ERRORS" >> "$OUTPUT_FILE"
  fi
fi

# Save test output
cp "$OUTPUT_FILE" "int-test-output.md" 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════════"
echo "DEPLOY TESTER RESULT"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Deployment: $([ "$DEPLOY_SUCCESS" = true ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo "Tests:      $([ "$TEST_SUCCESS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo ""

# Output variables for parent command
echo "DEPLOY_SUCCESS=$DEPLOY_SUCCESS"
echo "DEPLOY_ERRORS=\"$DEPLOY_ERRORS\""
echo "TEST_SUCCESS=$TEST_SUCCESS"
echo "TEST_ERRORS=\"$TEST_ERRORS\""
```

## Output

### Files Created

- `execution-output.md` - Detailed deployment log
- `int-test-output.md` - Copy of execution output
- `cfn-outputs/flat-outputs.json` - Stack outputs (if deployment succeeded)

### Environment Variables Set

- `DEPLOY_SUCCESS` - true/false
- `DEPLOY_ERRORS` - Error message if deployment failed
- `TEST_SUCCESS` - true/false
- `TEST_ERRORS` - Error message if tests failed

### Exit Codes

- `0` - Deployment and tests successful
- `1` - Deployment or tests failed

## Common Error Patterns

| Error                         | Likely Cause            | Suggested Fix           |
| ----------------------------- | ----------------------- | ----------------------- |
| `UnrecognizedClientException` | Missing endpoint config | Add AWS_ENDPOINT_URL    |
| `InvalidSignatureException`   | S3 signature issue      | Use path-style access   |
| `ResourceNotFoundException`   | Service not running     | Check LocalStack health |
| `Template validation error`   | Invalid CloudFormation  | Fix template syntax     |
| `Module not found`            | Missing dependencies    | Run npm/pip install     |
| `Unsupported operation`       | Pro-only feature        | Mock or remove feature  |
