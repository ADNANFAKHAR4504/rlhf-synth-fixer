---
name: localstack-task-selector
description: Intelligently selects tasks from archive for LocalStack migration based on various criteria including platform, services, and success probability.
color: cyan
model: sonnet
---

# LocalStack Task Selector Agent

Selects tasks from the archive folder for LocalStack migration using intelligent criteria.

## Input Parameters

- `MIGRATION_LOG` - Path to migration log JSON file
- `MODE` - Selection mode (next, platform, service, smart, random)
- `FILTER_VALUE` - Filter value for platform/service modes

## Selection Modes

### Mode 1: Sequential (`--next`)

Picks the first un-migrated task alphabetically:

```bash
select_next_task() {
  local migration_log="$1"

  # Get already migrated/attempted tasks
  ATTEMPTED=$(jq -r '.migrations[].task_path' "$migration_log" 2>/dev/null | sort -u)

  # Find first un-migrated task
  for dir in $(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ -f "$dir/metadata.json" ]; then
      if ! echo "$ATTEMPTED" | grep -q "^$dir$"; then
        echo "$dir"
        return 0
      fi
    fi
  done

  return 1  # No tasks available
}
```

### Mode 2: By Platform (`--platform <name>`)

```bash
select_by_platform() {
  local migration_log="$1"
  local platform="$2"

  PLATFORM_DIR="archive/$platform"

  if [ ! -d "$PLATFORM_DIR" ]; then
    echo "ERROR: Platform directory not found: $PLATFORM_DIR" >&2
    return 1
  fi

  ATTEMPTED=$(jq -r '.migrations[].task_path' "$migration_log" 2>/dev/null | sort -u)

  for dir in $(find "$PLATFORM_DIR" -maxdepth 2 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ -f "$dir/metadata.json" ]; then
      if ! echo "$ATTEMPTED" | grep -q "^$dir$"; then
        echo "$dir"
        return 0
      fi
    fi
  done

  return 1
}
```

### Mode 3: By AWS Service (`--service <name>`)

Select tasks that use a specific AWS service:

```bash
select_by_service() {
  local migration_log="$1"
  local service="$2"

  ATTEMPTED=$(jq -r '.migrations[].task_path' "$migration_log" 2>/dev/null | sort -u)

  for dir in $(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ -f "$dir/metadata.json" ]; then
      # Check if task uses the service (case-insensitive)
      if jq -e --arg svc "$service" '
        .aws_services // [] |
        map(ascii_downcase) |
        any(. | contains($svc | ascii_downcase))
      ' "$dir/metadata.json" >/dev/null 2>&1; then
        # Check if not already attempted
        if ! echo "$ATTEMPTED" | grep -q "^$dir$"; then
          echo "$dir"
          return 0
        fi
      fi
    fi
  done

  return 1
}
```

### Mode 4: Smart Selection (`--smart`)

Intelligent selection based on likelihood of LocalStack success:

```bash
select_smart() {
  local migration_log="$1"

  # Service compatibility tiers for LocalStack Community Edition
  # High compatibility: Core services that work well
  HIGH_COMPAT="s3 dynamodb sqs sns iam kms cloudwatch logs secretsmanager ssm events"

  # Medium compatibility: Work but may have limitations
  MED_COMPAT="lambda apigateway stepfunctions kinesis firehose"

  # Low compatibility: Limited or Pro-only features
  LOW_COMPAT="ecs rds ec2 eks fargate alb elb appsync cognito"

  ATTEMPTED=$(jq -r '.migrations[].task_path' "$migration_log" 2>/dev/null | sort -u)

  BEST_TASK=""
  BEST_SCORE=0

  for dir in $(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null); do
    if [ ! -f "$dir/metadata.json" ]; then
      continue
    fi

    # Skip already attempted
    if echo "$ATTEMPTED" | grep -q "^$dir$"; then
      continue
    fi

    # Calculate compatibility score
    SCORE=100

    # Get services used by this task
    SERVICES=$(jq -r '.aws_services[]?' "$dir/metadata.json" 2>/dev/null | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

    for svc in $SERVICES; do
      svc_normalized=$(echo "$svc" | tr '[:upper:]' '[:lower:]' | tr -d ' ' | tr '-' ' ')

      # Check service tier
      if echo "$LOW_COMPAT" | grep -qi "$svc_normalized"; then
        SCORE=$((SCORE - 25))
      elif echo "$MED_COMPAT" | grep -qi "$svc_normalized"; then
        SCORE=$((SCORE - 10))
      elif echo "$HIGH_COMPAT" | grep -qi "$svc_normalized"; then
        SCORE=$((SCORE + 5))
      fi
    done

    # Platform bonus (some platforms work better with LocalStack)
    PLATFORM=$(jq -r '.platform' "$dir/metadata.json" 2>/dev/null)
    case "$PLATFORM" in
      cfn)    SCORE=$((SCORE + 15)) ;;  # CloudFormation is most straightforward
      cdk)    SCORE=$((SCORE + 10)) ;;  # CDK with cdklocal works well
      tf)     SCORE=$((SCORE + 5)) ;;   # Terraform with tflocal
      pulumi) SCORE=$((SCORE + 0)) ;;   # Pulumi needs more configuration
    esac

    # Complexity penalty
    COMPLEXITY=$(jq -r '.complexity' "$dir/metadata.json" 2>/dev/null)
    case "$COMPLEXITY" in
      medium) SCORE=$((SCORE + 5)) ;;
      hard)   SCORE=$((SCORE - 5)) ;;
      expert) SCORE=$((SCORE - 15)) ;;
    esac

    # Update best if this is better
    if [ "$SCORE" -gt "$BEST_SCORE" ]; then
      BEST_SCORE=$SCORE
      BEST_TASK="$dir"
    fi
  done

  if [ -n "$BEST_TASK" ]; then
    echo "$BEST_TASK"
    echo "SCORE:$BEST_SCORE" >&2
    return 0
  fi

  return 1
}
```

### Mode 5: Random Selection (`--random`)

```bash
select_random() {
  local migration_log="$1"

  ATTEMPTED=$(jq -r '.migrations[].task_path' "$migration_log" 2>/dev/null | sort -u)

  # Collect all un-attempted tasks
  CANDIDATES=()
  for dir in $(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null); do
    if [ -f "$dir/metadata.json" ]; then
      if ! echo "$ATTEMPTED" | grep -q "^$dir$"; then
        CANDIDATES+=("$dir")
      fi
    fi
  done

  if [ ${#CANDIDATES[@]} -eq 0 ]; then
    return 1
  fi

  # Pick random
  RANDOM_INDEX=$((RANDOM % ${#CANDIDATES[@]}))
  echo "${CANDIDATES[$RANDOM_INDEX]}"
  return 0
}
```

### Mode 6: Batch Selection (`--batch <n>`)

```bash
select_batch() {
  local migration_log="$1"
  local batch_size="${2:-5}"

  ATTEMPTED=$(jq -r '.migrations[].task_path' "$migration_log" 2>/dev/null | sort -u)
  COUNT=0

  for dir in $(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ $COUNT -ge $batch_size ]; then
      break
    fi

    if [ -f "$dir/metadata.json" ]; then
      if ! echo "$ATTEMPTED" | grep -q "^$dir$"; then
        echo "$dir"
        COUNT=$((COUNT + 1))
      fi
    fi
  done

  if [ $COUNT -eq 0 ]; then
    return 1
  fi

  return 0
}
```

### Mode 7: Failed Retry (`--retry-failed`)

Select previously failed tasks for retry:

```bash
select_failed_retry() {
  local migration_log="$1"

  # Get failed migrations that haven't been retried recently
  jq -r '
    .migrations |
    map(select(.status == "failed")) |
    sort_by(.attempted_at) |
    .[0].task_path // empty
  ' "$migration_log" 2>/dev/null
}
```

## Service Compatibility Reference

### High Compatibility (LocalStack Community)

| Service         | Compatibility | Notes               |
| --------------- | ------------- | ------------------- |
| S3              | ✅ Excellent  | Full support        |
| DynamoDB        | ✅ Excellent  | Full support        |
| SQS             | ✅ Excellent  | Full support        |
| SNS             | ✅ Excellent  | Full support        |
| IAM             | ✅ Good       | Simplified policies |
| KMS             | ✅ Good       | Basic encryption    |
| CloudWatch      | ✅ Good       | Logs and metrics    |
| Secrets Manager | ✅ Good       | Full support        |
| SSM             | ✅ Good       | Parameter Store     |
| EventBridge     | ✅ Good       | Events and rules    |

### Medium Compatibility

| Service        | Compatibility | Notes           |
| -------------- | ------------- | --------------- |
| Lambda         | ⚠️ Good       | May need Docker |
| API Gateway    | ⚠️ Good       | REST APIs       |
| Step Functions | ⚠️ Good       | State machines  |
| Kinesis        | ⚠️ Moderate   | Basic streams   |

### Low Compatibility (May Require Pro or Mocking)

| Service | Compatibility | Notes            |
| ------- | ------------- | ---------------- |
| ECS     | ⚠️ Limited    | Basic support    |
| RDS     | ⚠️ Limited    | Simulated        |
| EC2     | ⚠️ Limited    | Mocked           |
| EKS     | ❌ Pro only   | Not in Community |
| AppSync | ❌ Pro only   | Not in Community |
| Cognito | ⚠️ Limited    | Basic auth       |

## Output

Returns the selected task path to stdout, or exits with code 1 if no tasks available.

Additional information (score, reason) may be written to stderr.

## Usage Example

```bash
# In the localstack-migrate command:

case "$MODE" in
  next)
    TASK_PATH=$(select_next_task "$MIGRATION_LOG")
    ;;
  platform)
    TASK_PATH=$(select_by_platform "$MIGRATION_LOG" "$FILTER_VALUE")
    ;;
  service)
    TASK_PATH=$(select_by_service "$MIGRATION_LOG" "$FILTER_VALUE")
    ;;
  smart)
    TASK_PATH=$(select_smart "$MIGRATION_LOG")
    ;;
  random)
    TASK_PATH=$(select_random "$MIGRATION_LOG")
    ;;
esac

if [ -z "$TASK_PATH" ]; then
  echo "No tasks available for migration"
  exit 0
fi

echo "Selected: $TASK_PATH"
```

## Statistics Helper

```bash
show_selection_stats() {
  local migration_log="$1"

  echo "Task Selection Statistics"
  echo "========================="
  echo ""

  # Total available
  TOTAL=$(find archive -maxdepth 3 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')
  ATTEMPTED=$(jq '.migrations | length' "$migration_log" 2>/dev/null || echo "0")
  AVAILABLE=$((TOTAL - ATTEMPTED))

  echo "Total Tasks:     $TOTAL"
  echo "Attempted:       $ATTEMPTED"
  echo "Available:       $AVAILABLE"
  echo ""

  # By platform
  echo "Available by Platform:"
  for platform_dir in archive/*/; do
    if [ -d "$platform_dir" ]; then
      PNAME=$(basename "$platform_dir")
      PTOTAL=$(find "$platform_dir" -maxdepth 2 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')
      PATTEMPTED=$(jq --arg p "archive/$PNAME" '[.migrations[] | select(.task_path | startswith($p))] | length' "$migration_log" 2>/dev/null || echo "0")
      PAVAILABLE=$((PTOTAL - PATTEMPTED))
      if [ "$PAVAILABLE" -gt 0 ]; then
        printf "  %-15s %5d available\n" "$PNAME:" "$PAVAILABLE"
      fi
    fi
  done
}
```
