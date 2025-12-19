#!/bin/bash
# LocalStack Task Selector Script
# Selects tasks from archive for LocalStack migration
# Usage: ./localstack-select-task.sh [mode] [filter]
#
# Modes:
#   next       - Select next un-migrated task (default)
#   platform   - Select by platform (requires filter: cdk-ts, cfn-yaml, etc.)
#   service    - Select by AWS service (requires filter: S3, Lambda, etc.)
#   smart      - Smart selection based on success probability
#   random     - Random selection
#   stats      - Show migration statistics

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Migration log
MIGRATION_LOG="$PROJECT_ROOT/.claude/reports/localstack-migrations.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Initialize migration log if not exists
init_migration_log() {
  mkdir -p "$(dirname "$MIGRATION_LOG")"
  if [ ! -f "$MIGRATION_LOG" ]; then
    cat > "$MIGRATION_LOG" << 'EOF'
{
  "created_at": "",
  "migrations": [],
  "summary": {
    "total_attempted": 0,
    "successful": 0,
    "failed": 0
  }
}
EOF
    jq --arg ts "$(date -Iseconds)" '.created_at = $ts' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp"
    mv "${MIGRATION_LOG}.tmp" "$MIGRATION_LOG"
  fi
}

# Get list of attempted tasks
get_attempted() {
  jq -r '.migrations[].task_path' "$MIGRATION_LOG" 2>/dev/null | sort -u
}

# Select next un-migrated task
select_next() {
  local attempted
  attempted=$(get_attempted)
  
  for dir in $(find "$PROJECT_ROOT/archive" -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ -f "$dir/metadata.json" ]; then
      local rel_path="${dir#$PROJECT_ROOT/}"
      if ! echo "$attempted" | grep -q "^$rel_path$"; then
        echo "$rel_path"
        return 0
      fi
    fi
  done
  
  return 1
}

# Select by platform
select_by_platform() {
  local platform="$1"
  local platform_dir="$PROJECT_ROOT/archive/$platform"
  
  if [ ! -d "$platform_dir" ]; then
    echo -e "${RED}Platform directory not found: archive/$platform${NC}" >&2
    return 1
  fi
  
  local attempted
  attempted=$(get_attempted)
  
  for dir in $(find "$platform_dir" -maxdepth 2 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ -f "$dir/metadata.json" ]; then
      local rel_path="${dir#$PROJECT_ROOT/}"
      if ! echo "$attempted" | grep -q "^$rel_path$"; then
        echo "$rel_path"
        return 0
      fi
    fi
  done
  
  echo -e "${YELLOW}All tasks in archive/$platform have been processed${NC}" >&2
  return 1
}

# Select by AWS service
select_by_service() {
  local service="$1"
  local attempted
  attempted=$(get_attempted)
  
  for dir in $(find "$PROJECT_ROOT/archive" -maxdepth 3 -type d -name "Pr*" 2>/dev/null | sort); do
    if [ -f "$dir/metadata.json" ]; then
      # Check if task uses the service (case-insensitive)
      if jq -e --arg svc "$service" '
        .aws_services // [] | 
        map(ascii_downcase) | 
        any(. | contains($svc | ascii_downcase))
      ' "$dir/metadata.json" >/dev/null 2>&1; then
        local rel_path="${dir#$PROJECT_ROOT/}"
        if ! echo "$attempted" | grep -q "^$rel_path$"; then
          echo "$rel_path"
          return 0
        fi
      fi
    fi
  done
  
  echo -e "${YELLOW}No un-migrated tasks found using service: $service${NC}" >&2
  return 1
}

# Smart selection based on success probability
select_smart() {
  # Service compatibility tiers
  local HIGH_COMPAT="s3 dynamodb sqs sns iam kms cloudwatch logs secretsmanager ssm events"
  local MED_COMPAT="lambda apigateway stepfunctions kinesis firehose"
  local LOW_COMPAT="ecs rds ec2 eks fargate alb elb appsync cognito"
  
  local attempted
  attempted=$(get_attempted)
  
  local best_task=""
  local best_score=0
  
  for dir in $(find "$PROJECT_ROOT/archive" -maxdepth 3 -type d -name "Pr*" 2>/dev/null); do
    if [ ! -f "$dir/metadata.json" ]; then
      continue
    fi
    
    local rel_path="${dir#$PROJECT_ROOT/}"
    
    # Skip already attempted
    if echo "$attempted" | grep -q "^$rel_path$"; then
      continue
    fi
    
    # Calculate score
    local score=100
    
    # Get services
    local services
    services=$(jq -r '.aws_services[]?' "$dir/metadata.json" 2>/dev/null | tr '[:upper:]' '[:lower:]')
    
    for svc in $services; do
      if echo "$LOW_COMPAT" | grep -qi "$svc"; then
        score=$((score - 25))
      elif echo "$MED_COMPAT" | grep -qi "$svc"; then
        score=$((score - 10))
      elif echo "$HIGH_COMPAT" | grep -qi "$svc"; then
        score=$((score + 5))
      fi
    done
    
    # Platform bonus
    local platform
    platform=$(jq -r '.platform' "$dir/metadata.json" 2>/dev/null)
    case "$platform" in
      cfn)    score=$((score + 15)) ;;
      cdk)    score=$((score + 10)) ;;
      tf)     score=$((score + 5)) ;;
    esac
    
    # Complexity factor
    local complexity
    complexity=$(jq -r '.complexity' "$dir/metadata.json" 2>/dev/null)
    case "$complexity" in
      medium) score=$((score + 5)) ;;
      hard)   score=$((score - 5)) ;;
      expert) score=$((score - 15)) ;;
    esac
    
    if [ "$score" -gt "$best_score" ]; then
      best_score=$score
      best_task="$rel_path"
    fi
  done
  
  if [ -n "$best_task" ]; then
    echo "$best_task"
    echo -e "${BLUE}Score: $best_score${NC}" >&2
    return 0
  fi
  
  return 1
}

# Random selection
select_random() {
  local attempted
  attempted=$(get_attempted)
  
  local candidates=()
  for dir in $(find "$PROJECT_ROOT/archive" -maxdepth 3 -type d -name "Pr*" 2>/dev/null); do
    if [ -f "$dir/metadata.json" ]; then
      local rel_path="${dir#$PROJECT_ROOT/}"
      if ! echo "$attempted" | grep -q "^$rel_path$"; then
        candidates+=("$rel_path")
      fi
    fi
  done
  
  if [ ${#candidates[@]} -eq 0 ]; then
    return 1
  fi
  
  local random_index=$((RANDOM % ${#candidates[@]}))
  echo "${candidates[$random_index]}"
  return 0
}

# Show statistics
show_stats() {
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}📊 LOCALSTACK MIGRATION STATISTICS${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""
  
  # Count totals
  local total_archive
  total_archive=$(find "$PROJECT_ROOT/archive" -maxdepth 3 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')
  
  local total_attempted
  total_attempted=$(jq '.summary.total_attempted // 0' "$MIGRATION_LOG" 2>/dev/null || echo "0")
  
  local successful
  successful=$(jq '.summary.successful // 0' "$MIGRATION_LOG" 2>/dev/null || echo "0")
  
  local failed
  failed=$(jq '.summary.failed // 0' "$MIGRATION_LOG" 2>/dev/null || echo "0")
  
  local remaining=$((total_archive - total_attempted))
  
  echo "┌─────────────────────────────────────────────────┐"
  echo "│ OVERALL PROGRESS                                │"
  echo "├─────────────────────────────────────────────────┤"
  printf "│ %-25s %21s │\n" "Total Archive Tasks:" "$total_archive"
  printf "│ %-25s %21s │\n" "Attempted:" "$total_attempted"
  printf "│ %-25s %21s │\n" "Successful:" "$successful"
  printf "│ %-25s %21s │\n" "Failed:" "$failed"
  printf "│ %-25s %21s │\n" "Remaining:" "$remaining"
  echo "└─────────────────────────────────────────────────┘"
  echo ""
  
  # By platform
  echo -e "${BLUE}📁 By Platform:${NC}"
  for platform_dir in "$PROJECT_ROOT"/archive/*/; do
    if [ -d "$platform_dir" ]; then
      local platform_name
      platform_name=$(basename "$platform_dir")
      local platform_total
      platform_total=$(find "$platform_dir" -maxdepth 2 -type d -name "Pr*" 2>/dev/null | wc -l | tr -d ' ')
      local platform_migrated
      platform_migrated=$(jq --arg p "archive/$platform_name" '[.migrations[] | select(.task_path | startswith($p))] | length' "$MIGRATION_LOG" 2>/dev/null || echo "0")
      
      if [ "$platform_total" -gt 0 ]; then
        local pct=$((platform_migrated * 100 / platform_total))
        printf "   %-15s %5s / %5s (%3s%%)\n" "$platform_name:" "$platform_migrated" "$platform_total" "$pct"
      fi
    fi
  done
  echo ""
  
  # Recent migrations
  echo -e "${BLUE}📜 Recent Migrations (last 5):${NC}"
  jq -r '.migrations | sort_by(.attempted_at) | reverse | .[0:5] | .[] | 
    "   \(if .status == "success" then "✅" else "❌" end) \(.task_path) (\(.attempted_at | split("T")[0]))"' \
    "$MIGRATION_LOG" 2>/dev/null || echo "   No migrations yet"
  echo ""
}

# Main
main() {
  local mode="${1:-next}"
  local filter="${2:-}"
  
  cd "$PROJECT_ROOT"
  init_migration_log
  
  case "$mode" in
    next)
      select_next
      ;;
    platform)
      if [ -z "$filter" ]; then
        echo -e "${RED}Platform filter required${NC}" >&2
        echo "Usage: $0 platform <platform-name>" >&2
        echo "Available: cdk-ts, cdk-py, cfn-yaml, cfn-json, tf-hcl, pulumi-ts, pulumi-py" >&2
        exit 1
      fi
      select_by_platform "$filter"
      ;;
    service)
      if [ -z "$filter" ]; then
        echo -e "${RED}Service filter required${NC}" >&2
        echo "Usage: $0 service <aws-service>" >&2
        echo "Examples: S3, Lambda, DynamoDB, SQS, SNS" >&2
        exit 1
      fi
      select_by_service "$filter"
      ;;
    smart)
      select_smart
      ;;
    random)
      select_random
      ;;
    stats)
      show_stats
      ;;
    *)
      echo "Usage: $0 [mode] [filter]" >&2
      echo "" >&2
      echo "Modes:" >&2
      echo "  next       - Select next un-migrated task (default)" >&2
      echo "  platform   - Select by platform (requires filter)" >&2
      echo "  service    - Select by AWS service (requires filter)" >&2
      echo "  smart      - Smart selection based on success probability" >&2
      echo "  random     - Random selection" >&2
      echo "  stats      - Show migration statistics" >&2
      exit 1
      ;;
  esac
}

main "$@"

