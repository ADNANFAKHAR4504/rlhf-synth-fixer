#!/bin/bash
# Enhanced Error Pattern Matching and Analysis
# Analyzes GitHub pipeline logs and classifies errors with context

set -euo pipefail

PR_NUMBER="${1:-}"
LOG_FILE="${2:-/tmp/pr-${PR_NUMBER}-logs.txt}"

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <PR_NUMBER> [LOG_FILE]"
  exit 1
fi

# Error pattern database with fix references
declare -A ERROR_PATTERNS=(
  ["BucketAlreadyExists|ResourceConflict|AlreadyExistsException"]="missing_environment_suffix"
  ["Policy.*does not exist|InvalidPolicy|PolicyNotFound"]="config_iam_policy"
  ["Cannot find module|ImportError|ModuleNotFound"]="missing_dependency"
  ["quota|limit exceeded|ServiceLimitExceeded"]="aws_quota"
  ["RemovalPolicy.*RETAIN|DeletionPolicy.*Retain"]="retain_policy"
  ["environmentSuffix|environment_suffix.*missing"]="missing_environment_suffix"
  ["GuardDuty.*detector.*exists"]="guardduty_detector"
  ["SYNTHETICS_NODEJS_PUPPETEER_[0-5]"]="deprecated_synthetics"
  ["aws-sdk.*not found|require.*aws-sdk"]="aws_sdk_v2"
  ["deletionProtection.*true|deletion_protection.*True"]="deletion_protection"
  ["ReservedConcurrentExecutions.*decreases"]="lambda_concurrency"
  ["TS[0-9]+.*Cannot find name"]="missing_import"
  ["TS[0-9]+.*not assignable"]="type_mismatch"
  ["TS[0-9]+.*Property does not exist"]="typo_or_wrong_type"
)

# Extract errors with context
extract_errors_with_context() {
  local log_file="$1"
  local output_file="/tmp/pr-${PR_NUMBER}-errors.json"
  
  # Extract error lines with 5 lines of context before and after
  grep -n -B5 -A5 -iE "error|failed|failure" "$log_file" | \
    grep -v "grep\|^--$" | \
    awk '
      BEGIN { 
        RS=""; 
        FS="\n";
        print "["
      }
      {
        if (NR > 1) print ","
        print "{"
        print "  \"context\": ["
        for (i=1; i<=NF; i++) {
          if (i > 1) print ","
          gsub(/"/, "\\\"", $i)
          print "    \"" $i "\""
        }
        print "  ]"
        print "}"
      }
      END { print "]" }
    ' > "$output_file"
  
  echo "$output_file"
}

# Classify error and match to pattern
classify_error() {
  local error_context="$1"
  local error_text=$(echo "$error_context" | jq -r '.[] | select(test("(?i)error|failed|failure")) | .' | head -1)
  
  if [ -z "$error_text" ]; then
    return 1
  fi
  
  local matched_pattern=""
  local fix_type=""
  
  for pattern in "${!ERROR_PATTERNS[@]}"; do
    if echo "$error_text" | grep -qiE "$pattern"; then
      matched_pattern="$pattern"
      fix_type="${ERROR_PATTERNS[$pattern]}"
      break
    fi
  done
  
  if [ -n "$matched_pattern" ]; then
    echo "{\"pattern\": \"$matched_pattern\", \"fix_type\": \"$fix_type\", \"error\": \"$error_text\"}"
  else
    echo "{\"pattern\": \"unknown\", \"fix_type\": \"manual_review\", \"error\": \"$error_text\"}"
  fi
}

# Analyze errors semantically
analyze_semantic_error() {
  local error_text="$1"
  local log_file="$2"
  
  # Extract resource type
  local resource_type=$(echo "$error_text" | grep -oE "(Bucket|Function|Table|Role|Queue|Topic|Stack|Instance|Cluster|Database)" | head -1 || echo "Unknown")
  
  # Extract error type
  local error_type=$(echo "$error_text" | grep -oE "(already exists|not found|invalid|permission denied|quota|timeout|dependency)" | head -1 || echo "unknown")
  
  # Extract location from context
  local location=$(grep -B10 "$error_text" "$log_file" 2>/dev/null | grep -oE "lib/[^:]+:[0-9]+" | head -1 || echo "unknown")
  
  # Infer likely cause
  local likely_cause=""
  case "$error_type" in
    "already exists")
      likely_cause="Missing environmentSuffix in resource name"
      ;;
    "not found")
      likely_cause="Missing dependency or incorrect reference"
      ;;
    "quota")
      likely_cause="AWS account limit exceeded - requires manual intervention"
      ;;
    "permission denied")
      likely_cause="IAM permissions insufficient"
      ;;
    "dependency")
      likely_cause="Circular dependency or missing resource"
      ;;
    *)
      likely_cause="Requires detailed analysis"
      ;;
  esac
  
  # Calculate priority (Critical=1, High=2, Medium=3, Low=4)
  local priority=3
  case "$error_type" in
    "quota") priority=1 ;;
    "already exists"|"not found") priority=2 ;;
    "invalid") priority=3 ;;
    *) priority=4 ;;
  esac
  
  cat <<EOF
{
  "resource_type": "$resource_type",
  "error_type": "$error_type",
  "location": "$location",
  "raw_error": "$error_text",
  "likely_cause": "$likely_cause",
  "fix_priority": $priority,
  "timestamp": "$(date -Iseconds)"
}
EOF
}

# Main analysis function
main() {
  echo "🔍 Analyzing errors for PR #${PR_NUMBER}..."
  
  if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
  fi
  
  # Extract errors with context
  local errors_file=$(extract_errors_with_context "$LOG_FILE")
  
  # Classify each error
  local classified_errors="/tmp/pr-${PR_NUMBER}-classified-errors.json"
  echo "[" > "$classified_errors"
  
  local first=true
  while IFS= read -r error_context; do
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$classified_errors"
    fi
    
    local classification=$(classify_error "$error_context")
    local error_text=$(echo "$classification" | jq -r '.error')
    
    # Get semantic analysis
    local semantic=$(analyze_semantic_error "$error_text" "$LOG_FILE")
    
    # Combine classification and semantic analysis
    echo "$classification" | jq --argjson semantic "$semantic" '. + $semantic' >> "$classified_errors"
  done < <(jq -c '.[]' "$errors_file")
  
  echo "]" >> "$classified_errors"
  
  # Generate summary
  local summary_file="/tmp/pr-${PR_NUMBER}-error-summary.json"
  jq '{
    total_errors: length,
    by_fix_type: group_by(.fix_type) | map({fix_type: .[0].fix_type, count: length, errors: .}),
    by_priority: group_by(.fix_priority) | map({priority: .[0].fix_priority, count: length}),
    critical_errors: [.[] | select(.fix_priority == 1)],
    high_priority_errors: [.[] | select(.fix_priority == 2)],
    recommended_fixes: [.[] | select(.fix_type != "manual_review") | {fix_type, location, likely_cause}]
  }' "$classified_errors" > "$summary_file"
  
  echo "✅ Error analysis complete"
  echo "📊 Summary: $summary_file"
  echo "📋 Classified errors: $classified_errors"
  
  # Display summary
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "ERROR ANALYSIS SUMMARY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  jq -r '
    "Total Errors: \(.total_errors)\n",
    "By Fix Type:",
    (.by_fix_type[] | "  - \(.fix_type): \(.count)"),
    "\nBy Priority:",
    (.by_priority[] | "  - Priority \(.priority): \(.count)"),
    "\nCritical Errors: \(.critical_errors | length)",
    "\nRecommended Fixes: \(.recommended_fixes | length)"
  ' "$summary_file"
}

main "$@"

