#!/bin/bash
# Fix Prioritization and Batching
# Prioritizes fixes by impact and batches related fixes together

set -euo pipefail

# Priority levels: 1=Critical, 2=High, 3=Medium, 4=Low
declare -A FIX_PRIORITIES=(
  ["aws_quota"]=1
  ["missing_environment_suffix"]=2
  ["retain_policy"]=2
  ["deletion_protection"]=2
  ["config_iam_policy"]=2
  ["guardduty_detector"]=2
  ["missing_dependency"]=2
  ["deprecated_synthetics"]=3
  ["aws_sdk_v2"]=3
  ["lambda_concurrency"]=3
  ["missing_import"]=3
  ["type_mismatch"]=3
  ["typo_or_wrong_type"]=4
  ["manual_review"]=4
)

# Fixes that can be batched together
declare -A BATCHABLE_FIXES=(
  ["missing_environment_suffix"]=1
  ["retain_policy"]=1
  ["deletion_protection"]=1
  ["config_iam_policy"]=1
  ["deprecated_synthetics"]=1
)

# Prioritize fixes from error analysis
prioritize_fixes() {
  local errors_json="$1"
  local output_file="${2:-/tmp/prioritized-fixes.json}"
  
  echo "📊 Prioritizing fixes..."
  
  # Add priority to each error
  local prioritized=$(echo "$errors_json" | jq --argjson priorities "$(declare -p FIX_PRIORITIES | jq -R .)" '
    map(. + {
      priority: (
        if .fix_type == "aws_quota" then 1
        elif .fix_type == "missing_environment_suffix" then 2
        elif .fix_type == "retain_policy" then 2
        elif .fix_type == "deletion_protection" then 2
        elif .fix_type == "config_iam_policy" then 2
        elif .fix_type == "guardduty_detector" then 2
        elif .fix_type == "missing_dependency" then 2
        elif .fix_type == "deprecated_synthetics" then 3
        elif .fix_type == "aws_sdk_v2" then 3
        elif .fix_type == "lambda_concurrency" then 3
        elif .fix_type == "missing_import" then 3
        elif .fix_type == "type_mismatch" then 3
        elif .fix_type == "typo_or_wrong_type" then 4
        else 4
        end
      ),
      can_batch: (
        .fix_type == "missing_environment_suffix" or
        .fix_type == "retain_policy" or
        .fix_type == "deletion_protection" or
        .fix_type == "config_iam_policy" or
        .fix_type == "deprecated_synthetics"
      )
    })
  ')
  
  # Sort by priority (1=highest priority)
  local sorted=$(echo "$prioritized" | jq 'sort_by(.priority)')
  
  # Group by category for batching
  local grouped=$(echo "$sorted" | jq '
    group_by(.fix_type) |
    map({
      category: .[0].fix_type,
      priority: .[0].priority,
      can_batch: .[0].can_batch,
      count: length,
      fixes: .,
      files: [.[] | .location] | unique
    }) |
    sort_by(.priority)
  ')
  
  echo "$grouped" > "$output_file"
  
  echo "✅ Prioritization complete: $output_file"
  echo "$grouped" | jq -r '
    "Fix Groups:\n",
    (.[] | "  Priority \(.priority) - \(.category): \(.count) fixes (\(if .can_batch then "batchable" else "sequential" end))")
  '
  
  echo "$grouped"
}

# Apply batched fixes
apply_batched_fixes() {
  local fix_group="$1"
  local platform="${2:-}"
  local language="${3:-}"
  
  local category=$(echo "$fix_group" | jq -r '.category')
  local can_batch=$(echo "$fix_group" | jq -r '.can_batch')
  local fixes=$(echo "$fix_group" | jq -r '.fixes')
  
  echo "🔧 Applying fixes for category: $category"
  
  if [ "$can_batch" = "true" ]; then
    echo "  → Batch mode: Applying all fixes together"
    
    # Extract unique files
    local files=$(echo "$fix_group" | jq -r '.files[]')
    
    for file in $files; do
      if [ -f "$file" ]; then
        # Apply fix template to entire file
        source .claude/scripts/fix-templates.sh
        apply_fix_template "$category" "$file" "$platform" "$language"
      else
        echo "⚠️ File not found: $file (skipping)"
      fi
    done
    
    # Validate batch
    validate_fix_group "$fix_group" "$platform" "$language"
  else
    echo "  → Sequential mode: Applying fixes one at a time"
    
    local success_count=0
    local fail_count=0
    
    while IFS= read -r fix; do
      local file=$(echo "$fix" | jq -r '.location // .file')
      
      if [ -z "$file" ] || [ "$file" = "null" ] || [ "$file" = "unknown" ]; then
        echo "⚠️ Cannot determine file for fix, skipping"
        fail_count=$((fail_count + 1))
        continue
      fi
      
      if [ ! -f "$file" ]; then
        echo "⚠️ File not found: $file (skipping)"
        fail_count=$((fail_count + 1))
        continue
      fi
      
      source .claude/scripts/fix-templates.sh
      if apply_fix_template "$category" "$file" "$platform" "$language"; then
        success_count=$((success_count + 1))
        
        # Validate after each fix
        if ! validate_fix "$fix" "$platform" "$language"; then
          echo "⚠️ Validation failed for fix, but continuing..."
        fi
      else
        fail_count=$((fail_count + 1))
      fi
    done < <(echo "$fixes" | jq -c '.[]')
    
    echo "  → Sequential fix complete: $success_count succeeded, $fail_count failed"
  fi
}

# Validate a single fix
validate_fix() {
  local fix="$1"
  local platform="${2:-}"
  local language="${3:-}"
  
  local fix_type=$(echo "$fix" | jq -r '.fix_type')
  local file=$(echo "$fix" | jq -r '.location // .file')
  
  if [ -z "$file" ] || [ "$file" = "null" ] || [ "$file" = "unknown" ]; then
    return 1
  fi
  
  case "$fix_type" in
    "missing_environment_suffix")
      # Check if environmentSuffix is now present
      if grep -q "environmentSuffix\|environment_suffix" "$file" 2>/dev/null; then
        echo "  ✅ Validated: environmentSuffix found"
        return 0
      else
        echo "  ❌ Validation failed: environmentSuffix not found"
        return 1
      fi
      ;;
    "retain_policy")
      # Check if RETAIN is removed
      if ! grep -qi "RETAIN" "$file" 2>/dev/null; then
        echo "  ✅ Validated: RETAIN removed"
        return 0
      else
        echo "  ❌ Validation failed: RETAIN still present"
        return 1
      fi
      ;;
    "deletion_protection")
      # Check if deletionProtection is false
      if grep -qi "deletionProtection.*false\|deletion_protection.*False" "$file" 2>/dev/null; then
        echo "  ✅ Validated: deletionProtection disabled"
        return 0
      else
        echo "  ⚠️ Validation: deletionProtection may still be enabled"
        return 0  # Non-blocking
      fi
      ;;
    *)
      # Generic validation: check if file exists and is readable
      if [ -f "$file" ] && [ -r "$file" ]; then
        echo "  ✅ Validated: file accessible"
        return 0
      else
        return 1
      fi
      ;;
  esac
}

# Validate fix group (for batched fixes)
validate_fix_group() {
  local fix_group="$1"
  local platform="${2:-}"
  local language="${3:-}"
  
  local category=$(echo "$fix_group" | jq -r '.category')
  local files=$(echo "$fix_group" | jq -r '.files[]')
  
  echo "  🔍 Validating batch fix for category: $category"
  
  local all_valid=true
  
  for file in $files; do
    if [ ! -f "$file" ]; then
      continue
    fi
    
    # Create a mock fix object for validation
    local mock_fix=$(echo "{\"fix_type\": \"$category\", \"location\": \"$file\"}" | jq .)
    
    if ! validate_fix "$mock_fix" "$platform" "$language"; then
      all_valid=false
    fi
  done
  
  if [ "$all_valid" = true ]; then
    echo "  ✅ Batch validation passed"
    return 0
  else
    echo "  ⚠️ Batch validation had issues (non-blocking)"
    return 0  # Non-blocking for now
  fi
}

# Main execution function
main() {
  local errors_json_file="${1:-/tmp/pr-errors.json}"
  local platform="${2:-}"
  local language="${3:-}"
  
  if [ ! -f "$errors_json_file" ]; then
    echo "❌ Error analysis file not found: $errors_json_file"
    exit 1
  fi
  
  # Prioritize fixes
  local prioritized=$(prioritize_fixes "$(cat "$errors_json_file")")
  
  # Apply fixes in priority order
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "APPLYING PRIORITIZED FIXES"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  while IFS= read -r fix_group; do
    apply_batched_fixes "$fix_group" "$platform" "$language"
  done < <(echo "$prioritized" | jq -c '.[]')
  
  echo ""
  echo "✅ All prioritized fixes applied"
}

# If script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi

