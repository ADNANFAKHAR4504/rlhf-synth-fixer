---
name: localstack-migrate
description: Migrates tasks from archive folder to LocalStack, testing deployment and fixing issues until successful.
color: green
model: sonnet
---

# LocalStack Migration Command

Picks a task from the archive folder and ensures it's deployable to LocalStack, fixing issues iteratively until successful.

## Usage

```bash
# Migrate a specific task by path
/localstack-migrate ./archive/cdk-ts/Pr7179

# Migrate by PR number (auto-detects platform)
/localstack-migrate Pr7179

# Migrate next unprocessed task from a specific platform
/localstack-migrate --platform cdk-ts

# Migrate next unprocessed task (sequential)
/localstack-migrate --next

# Smart selection (highest success probability)
/localstack-migrate --smart

# Filter by AWS service
/localstack-migrate --service S3

# Show migration statistics
/localstack-migrate --stats
```

## Workflow

### Step 1: Initialize and Validate Environment

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "🚀 LOCALSTACK MIGRATION"
echo "═══════════════════════════════════════════════════"
echo ""

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Parse arguments
TASK_PATH="${1:-}"
PLATFORM_FILTER=""
SERVICE_FILTER=""
PICK_NEXT=false
SMART_SELECT=false
SHOW_STATS=false

# Parse flags
case "$TASK_PATH" in
  --platform)
    PLATFORM_FILTER="${2:-}"
    TASK_PATH=""
    ;;
  --service)
    SERVICE_FILTER="${2:-}"
    TASK_PATH=""
    ;;
  --next)
    PICK_NEXT=true
    TASK_PATH=""
    ;;
  --smart)
    SMART_SELECT=true
    TASK_PATH=""
    ;;
  --stats)
    SHOW_STATS=true
    TASK_PATH=""
    ;;
esac

# Check LocalStack is running
echo "🔍 Checking LocalStack status..."
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo "❌ LocalStack is not running!"
  echo ""
  echo "💡 Start LocalStack first:"
  echo "   ./scripts/localstack-start.sh"
  echo ""
  exit 1
fi

LOCALSTACK_VERSION=$(curl -s http://localhost:4566/_localstack/health | jq -r '.version // "unknown"')
echo "✅ LocalStack is running (version: $LOCALSTACK_VERSION)"
echo ""

# Check required tools
MISSING_TOOLS=()
for tool in awslocal jq curl; do
  if ! command -v $tool &> /dev/null; then
    MISSING_TOOLS+=("$tool")
  fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
  echo "💡 Install with: pip install awscli-local (for awslocal)"
  exit 1
fi
echo "✅ Required tools available"
echo ""
```

### Step 2: Initialize Migration Log

```bash
MIGRATION_LOG=".claude/reports/localstack-migrations.json"
mkdir -p .claude/reports

# Initialize migration log if not exists
if [ ! -f "$MIGRATION_LOG" ]; then
  cat > "$MIGRATION_LOG" << 'EOF'
{
  "created_at": "$(date -Iseconds)",
  "migrations": [],
  "summary": {
    "total_attempted": 0,
    "successful": 0,
    "failed": 0
  }
}
EOF
  # Fix the date
  jq --arg ts "$(date -Iseconds)" '.created_at = $ts' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp"
  mv "${MIGRATION_LOG}.tmp" "$MIGRATION_LOG"
  echo "📋 Created migration log: $MIGRATION_LOG"
fi
```

### Step 3: Show Statistics (if requested)

```bash
if [ "$SHOW_STATS" = true ]; then
  echo "═══════════════════════════════════════════════════"
  echo "📊 LOCALSTACK MIGRATION STATISTICS"
  echo "═══════════════════════════════════════════════════"
  echo ""

  # Count total archive tasks
  TOTAL_ARCHIVE=$(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')

  # Get migration stats
  TOTAL_MIGRATED=$(jq '.summary.total_attempted // 0' "$MIGRATION_LOG")
  SUCCESSFUL=$(jq '.summary.successful // 0' "$MIGRATION_LOG")
  FAILED=$(jq '.summary.failed // 0' "$MIGRATION_LOG")
  REMAINING=$((TOTAL_ARCHIVE - TOTAL_MIGRATED))

  echo "┌─────────────────────────────────────────────────┐"
  echo "│ OVERALL PROGRESS                                │"
  echo "├─────────────────────────────────────────────────┤"
  printf "│ %-25s %21s │\n" "Total Archive Tasks:" "$TOTAL_ARCHIVE"
  printf "│ %-25s %21s │\n" "Attempted:" "$TOTAL_MIGRATED"
  printf "│ %-25s %21s │\n" "Successful:" "$SUCCESSFUL"
  printf "│ %-25s %21s │\n" "Failed:" "$FAILED"
  printf "│ %-25s %21s │\n" "Remaining:" "$REMAINING"
  echo "└─────────────────────────────────────────────────┘"
  echo ""

  # By platform breakdown
  echo "📁 By Platform:"
  for platform_dir in archive/*/; do
    if [ -d "$platform_dir" ]; then
      PLATFORM_NAME=$(basename "$platform_dir")
      PLATFORM_TOTAL=$(find "$platform_dir" -maxdepth 2 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')
      PLATFORM_MIGRATED=$(jq --arg p "archive/$PLATFORM_NAME" '[.migrations[] | select(.task_path | startswith($p))] | length' "$MIGRATION_LOG" 2>/dev/null || echo "0")
      if [ "$PLATFORM_TOTAL" -gt 0 ]; then
        PCT=$((PLATFORM_MIGRATED * 100 / PLATFORM_TOTAL))
        printf "   %-15s %5s / %5s (%3s%%)\n" "$PLATFORM_NAME:" "$PLATFORM_MIGRATED" "$PLATFORM_TOTAL" "$PCT"
      fi
    fi
  done
  echo ""

  # Recent migrations
  echo "📜 Recent Migrations (last 5):"
  jq -r '.migrations | sort_by(.attempted_at) | reverse | .[0:5] | .[] | "   \(.status | if . == "success" then "✅" else "❌" end) \(.task_path) (\(.attempted_at | split("T")[0]))"' "$MIGRATION_LOG" 2>/dev/null || echo "   No migrations yet"
  echo ""

  exit 0
fi
```

### Step 4: Select Task to Migrate

```bash
if [ -n "$TASK_PATH" ]; then
  # Manual path provided
  if [[ "$TASK_PATH" =~ ^Pr[0-9]+$ ]]; then
    # Find task by PR number
    FOUND_PATH=$(find archive -maxdepth 3 -type d -name "$TASK_PATH" 2>/dev/null | head -1)
    if [ -z "$FOUND_PATH" ]; then
      echo "❌ Task not found: $TASK_PATH"
      echo "💡 Try: find archive -name '$TASK_PATH'"
      exit 1
    fi
    TASK_PATH="$FOUND_PATH"
  fi

  if [ ! -d "$TASK_PATH" ]; then
    echo "❌ Directory not found: $TASK_PATH"
    exit 1
  fi

  echo "📁 Using specified task: $TASK_PATH"

else
  # Auto-select task
  echo "🔍 Selecting task to migrate..."

  # Get already migrated/attempted tasks
  ATTEMPTED=$(jq -r '.migrations[].task_path' "$MIGRATION_LOG" 2>/dev/null | sort -u)

  # Build search path
  SEARCH_DIR="archive"
  if [ -n "$PLATFORM_FILTER" ]; then
    SEARCH_DIR="archive/$PLATFORM_FILTER"
    echo "   Platform filter: $PLATFORM_FILTER"
  fi

  # Define service compatibility for smart selection
  HIGH_COMPAT_SERVICES="s3 dynamodb sqs sns iam kms cloudwatch logs secretsmanager ssm"
  MED_COMPAT_SERVICES="lambda apigateway stepfunctions events"
  LOW_COMPAT_SERVICES="ecs rds ec2 eks fargate alb appsync"

  # Find candidate tasks
  TASK_PATH=""
  BEST_SCORE=0

  for dir in $(find "$SEARCH_DIR" -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ ! -f "$dir/metadata.json" ]; then
      continue
    fi

    # Skip already attempted
    if echo "$ATTEMPTED" | grep -q "^$dir$"; then
      continue
    fi

    # Service filter
    if [ -n "$SERVICE_FILTER" ]; then
      if ! jq -e --arg svc "$SERVICE_FILTER" '.aws_services | map(ascii_downcase) | any(. | contains($svc | ascii_downcase))' "$dir/metadata.json" >/dev/null 2>&1; then
        continue
      fi
    fi

    # Smart selection scoring
    if [ "$SMART_SELECT" = true ]; then
      SCORE=100
      SERVICES=$(jq -r '.aws_services[]?' "$dir/metadata.json" 2>/dev/null | tr '[:upper:]' '[:lower:]')

      for svc in $SERVICES; do
        svc_lower=$(echo "$svc" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
        if echo "$LOW_COMPAT_SERVICES" | grep -qi "$svc_lower"; then
          SCORE=$((SCORE - 25))
        elif echo "$MED_COMPAT_SERVICES" | grep -qi "$svc_lower"; then
          SCORE=$((SCORE - 10))
        fi
      done

      # Prefer simpler platforms
      PLATFORM=$(jq -r '.platform' "$dir/metadata.json")
      case "$PLATFORM" in
        cfn) SCORE=$((SCORE + 10)) ;;
        cdk) SCORE=$((SCORE + 5)) ;;
      esac

      if [ "$SCORE" -gt "$BEST_SCORE" ]; then
        BEST_SCORE=$SCORE
        TASK_PATH="$dir"
      fi
    else
      # Simple sequential selection
      TASK_PATH="$dir"
      break
    fi
  done

  if [ -z "$TASK_PATH" ]; then
    echo "✅ All tasks in $SEARCH_DIR have been processed!"
    echo ""
    echo "💡 Options:"
    echo "   - Try a different platform: /localstack-migrate --platform <platform>"
    echo "   - View stats: /localstack-migrate --stats"
    exit 0
  fi

  if [ "$SMART_SELECT" = true ]; then
    echo "   Smart selection score: $BEST_SCORE"
  fi
fi

echo ""
```

### Step 5: Read Task Metadata

```bash
if [ ! -f "$TASK_PATH/metadata.json" ]; then
  echo "❌ No metadata.json found in $TASK_PATH"
  exit 1
fi

METADATA=$(cat "$TASK_PATH/metadata.json")
PLATFORM=$(echo "$METADATA" | jq -r '.platform // "unknown"')
LANGUAGE=$(echo "$METADATA" | jq -r '.language // "unknown"')
COMPLEXITY=$(echo "$METADATA" | jq -r '.complexity // "unknown"')
PR_ID=$(basename "$TASK_PATH")
AWS_SERVICES=$(echo "$METADATA" | jq -r '.aws_services // [] | join(", ")')

echo "═══════════════════════════════════════════════════"
echo "📋 TASK DETAILS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "   Path:       $TASK_PATH"
echo "   Platform:   $PLATFORM"
echo "   Language:   $LANGUAGE"
echo "   Complexity: $COMPLEXITY"
echo "   PR ID:      $PR_ID"
echo "   Services:   $AWS_SERVICES"
echo ""

# Check if platform is supported
SUPPORTED_PLATFORMS="cdk cfn tf pulumi"
if ! echo "$SUPPORTED_PLATFORMS" | grep -qw "$PLATFORM"; then
  echo "⚠️  Platform '$PLATFORM' may not be fully supported for LocalStack"
  echo "   Supported: $SUPPORTED_PLATFORMS"
  echo ""
fi
```

### Step 6: Setup Working Directory

```bash
echo "═══════════════════════════════════════════════════"
echo "📁 SETTING UP WORKING DIRECTORY"
echo "═══════════════════════════════════════════════════"
echo ""

WORK_DIR="worktree/localstack-${PR_ID}"

# Clean existing work directory
if [ -d "$WORK_DIR" ]; then
  echo "🧹 Cleaning existing work directory..."
  rm -rf "$WORK_DIR"
fi

mkdir -p "$WORK_DIR"
echo "📁 Created: $WORK_DIR"

# Copy task files
cp -r "${TASK_PATH}"/* "$WORK_DIR/"
echo "📋 Copied task files"

# Copy project-level files needed for deployment
for file in package.json tsconfig.json jest.config.js babel.config.js; do
  if [ -f "$file" ] && [ ! -f "$WORK_DIR/$file" ]; then
    cp "$file" "$WORK_DIR/" 2>/dev/null || true
  fi
done

# Copy scripts directory (needed for deployment)
mkdir -p "$WORK_DIR/scripts"
cp scripts/localstack-*.sh "$WORK_DIR/scripts/" 2>/dev/null || true

echo "✅ Working directory ready"
echo ""
```

### Step 7: Reset LocalStack State

```bash
echo "🧹 Resetting LocalStack state..."
curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null && echo "✅ LocalStack state reset" || echo "⚠️  State reset not available (continuing anyway)"
echo ""
```

### Step 8: Invoke LocalStack Deploy Tester Agent

Now invoke the `localstack-deploy-tester` agent to test if the task deploys:

**Agent Context**:

````markdown
You are testing if task at `${WORK_DIR}` is deployable to LocalStack.

**Task Details**:

- Original Path: ${TASK_PATH}
- Work Directory: ${WORK_DIR}
- Platform: ${PLATFORM}
- Language: ${LANGUAGE}
- PR ID: ${PR_ID}
- AWS Services: ${AWS_SERVICES}

**Your Mission**:

1. Change to the working directory: `cd ${WORK_DIR}`
2. Set up LocalStack environment variables
3. Install dependencies based on platform/language
4. Attempt LocalStack deployment using the appropriate method
5. Capture deployment output in `execution-output.md`
6. If deployment succeeds, attempt to run integration tests
7. Report detailed results

**Environment Setup**:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1
```
````

**Deployment Commands by Platform**:

- CDK: Bootstrap with `cdklocal bootstrap`, then `cdklocal deploy --all --require-approval never`
- CloudFormation: `awslocal cloudformation create-stack --stack-name tap-stack --template-body file://lib/TapStack.yml --capabilities CAPABILITY_IAM`
- Terraform: `tflocal init && tflocal apply -auto-approve`
- Pulumi: Configure local backend, then `pulumi up --yes`

**Output Required**:
Create `execution-output.md` with:

- Deployment commands run
- Full output/errors
- Success/failure status

Set shell variables for next step:

- DEPLOY_SUCCESS=true/false
- DEPLOY_ERRORS="error message if failed"
- TEST_SUCCESS=true/false (if deployment succeeded)
- TEST_ERRORS="test error if failed"

Exit with code 0 if deployment successful, 1 if failed.

````

### Step 9: Handle Deployment Result and Invoke Fixer if Needed

Based on the deploy tester results:

```bash
if [ "$DEPLOY_SUCCESS" = "true" ] && [ "$TEST_SUCCESS" = "true" ]; then
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "✅ DEPLOYMENT AND TESTS SUCCESSFUL!"
  echo "═══════════════════════════════════════════════════"

  FIX_SUCCESS="true"

elif [ "$DEPLOY_SUCCESS" = "true" ] && [ "$TEST_SUCCESS" != "true" ]; then
  echo ""
  echo "⚠️  Deployment succeeded but tests failed"
  echo "Invoking localstack-fixer agent to fix tests..."
  echo ""

  # Invoke fixer agent for test fixes
  # (Agent will be invoked here)

else
  echo ""
  echo "❌ Deployment failed"
  echo "Errors: $DEPLOY_ERRORS"
  echo ""
  echo "Invoking localstack-fixer agent..."
  echo ""

  # Invoke fixer agent
  # (Agent will be invoked here)
fi
````

If deployment or tests failed, invoke `localstack-fixer` agent:

**Agent Context**:

```markdown
You are fixing task at `${WORK_DIR}` to make it LocalStack-compatible.

**Task Details**:

- Work Directory: ${WORK_DIR}
- Platform: ${PLATFORM}
- Language: ${LANGUAGE}
- PR ID: ${PR_ID}

**Current Errors**:
Deployment Errors: ${DEPLOY_ERRORS:-"None"}
Test Errors: ${TEST_ERRORS:-"None"}

**Your Mission**:

1. Analyze the errors in `${WORK_DIR}/execution-output.md`
2. Apply targeted fixes to make the stack LocalStack-compatible
3. Re-attempt deployment after each fix
4. Maximum 5 iterations
5. Document all changes in `execution-output.md`

**Common Fixes**:

1. Add LocalStack endpoint configuration
2. Fix S3 path-style access issues
3. Remove/mock unsupported AWS features
4. Simplify IAM policies for LocalStack
5. Fix resource naming issues
6. Update integration tests for LocalStack

**Constraints**:

- Maximum 5 fix iterations
- Do NOT change core business logic
- Keep changes minimal and focused
- Document every change made

**Output**:
Set variables:

- FIX_SUCCESS=true/false
- FIX_FAILURE_REASON="reason if failed"
- ITERATIONS_USED=N

Exit code 0 if fixed, 1 if unable to fix, 2 if unsupported services.
```

### Step 10: Finalize Migration

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "📦 FINALIZING MIGRATION"
echo "═══════════════════════════════════════════════════"
echo ""

MIGRATION_STATUS="failed"
MIGRATION_REASON=""

if [ "$FIX_SUCCESS" = "true" ]; then
  MIGRATION_STATUS="success"

  # Create destination directory
  DEST_DIR="archive-localstack/${PR_ID}-${PLATFORM}-${LANGUAGE}"

  echo "📁 Moving to: $DEST_DIR"
  mkdir -p "$DEST_DIR"

  # Copy all files from work directory
  cp -r "$WORK_DIR"/* "$DEST_DIR/"

  # Ensure output files exist
  if [ ! -f "$DEST_DIR/execution-output.md" ]; then
    echo "# LocalStack Migration Output" > "$DEST_DIR/execution-output.md"
    echo "" >> "$DEST_DIR/execution-output.md"
    echo "**Migrated:** $(date)" >> "$DEST_DIR/execution-output.md"
    echo "**Source:** $TASK_PATH" >> "$DEST_DIR/execution-output.md"
  fi

  # Generate cfn-outputs if not exists
  if [ ! -d "$DEST_DIR/cfn-outputs" ]; then
    mkdir -p "$DEST_DIR/cfn-outputs"
    echo "{}" > "$DEST_DIR/cfn-outputs/flat-outputs.json"
  fi

  echo "✅ Files copied to $DEST_DIR"

else
  MIGRATION_REASON="${FIX_FAILURE_REASON:-Unknown error}"
  echo "❌ Migration failed: $MIGRATION_REASON"
fi

# Update migration log
echo ""
echo "📋 Updating migration log..."

MIGRATION_ENTRY=$(cat <<EOF
{
  "task_path": "$TASK_PATH",
  "destination": "${DEST_DIR:-null}",
  "platform": "$PLATFORM",
  "language": "$LANGUAGE",
  "pr_id": "$PR_ID",
  "aws_services": $(echo "$METADATA" | jq '.aws_services // []'),
  "status": "$MIGRATION_STATUS",
  "reason": $([ -n "$MIGRATION_REASON" ] && echo "\"$MIGRATION_REASON\"" || echo "null"),
  "iterations_used": ${ITERATIONS_USED:-0},
  "attempted_at": "$(date -Iseconds)"
}
EOF
)

# Add to migrations array and update summary
jq --argjson entry "$MIGRATION_ENTRY" --arg status "$MIGRATION_STATUS" '
  .migrations += [$entry] |
  .summary.total_attempted += 1 |
  if $status == "success" then .summary.successful += 1 else .summary.failed += 1 end
' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp"
mv "${MIGRATION_LOG}.tmp" "$MIGRATION_LOG"

echo "✅ Migration log updated"
```

### Step 11: Cleanup and Summary

```bash
echo ""
echo "🧹 Cleaning up work directory..."
rm -rf "$WORK_DIR"
echo "✅ Cleanup complete"

echo ""
echo "═══════════════════════════════════════════════════"
if [ "$MIGRATION_STATUS" = "success" ]; then
  echo "✅ MIGRATION SUCCESSFUL!"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "   Source:      $TASK_PATH"
  echo "   Destination: $DEST_DIR"
  echo "   Platform:    $PLATFORM"
  echo "   Language:    $LANGUAGE"
  echo ""
  echo "📁 View migrated task:"
  echo "   ls -la $DEST_DIR"
  echo ""
  echo "🧪 Test deployment:"
  echo "   ./scripts/localstack-deploy.sh $DEST_DIR"
  echo ""
else
  echo "❌ MIGRATION FAILED"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "   Task:   $TASK_PATH"
  echo "   Reason: $MIGRATION_REASON"
  echo ""
  echo "💡 Next steps:"
  echo "   - Review errors in migration log"
  echo "   - Try manual migration"
  echo "   - Check if services are supported in LocalStack Community"
  echo ""
fi

echo "📋 Migration log: $MIGRATION_LOG"
echo ""

# Exit with appropriate code
if [ "$MIGRATION_STATUS" = "success" ]; then
  exit 0
else
  exit 1
fi
```

## Supported Platforms

| Platform | Language         | Deploy Method                    |
| -------- | ---------------- | -------------------------------- |
| cdk      | ts, py, go, java | cdklocal                         |
| cfn      | yaml, json       | awslocal cloudformation          |
| tf       | hcl              | tflocal                          |
| pulumi   | ts, py, go       | pulumi with LocalStack endpoints |

## Migration Log Schema

```json
{
  "created_at": "2025-12-17T...",
  "migrations": [
    {
      "task_path": "archive/cdk-ts/Pr7179",
      "destination": "archive-localstack/Pr7179-cdk-ts",
      "platform": "cdk",
      "language": "ts",
      "pr_id": "Pr7179",
      "aws_services": ["S3", "Lambda"],
      "status": "success",
      "reason": null,
      "iterations_used": 2,
      "attempted_at": "2025-12-17T..."
    }
  ],
  "summary": {
    "total_attempted": 10,
    "successful": 8,
    "failed": 2
  }
}
```

## Related Agents

- `localstack-task-selector` - Intelligent task selection
- `localstack-deploy-tester` - Tests deployment to LocalStack
- `localstack-fixer` - Fixes compatibility issues
