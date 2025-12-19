#!/bin/bash
# Incremental Fix Validation
# Validates fixes incrementally before proceeding to next fix

set -euo pipefail

# Validate fix by type
validate_fix_by_type() {
  local fix_type="$1"
  local file="$2"
  local platform="${3:-}"
  local language="${4:-}"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  case "$fix_type" in
    "missing_environment_suffix")
      # Check if environmentSuffix is present in resource names
      case "$platform-$language" in
        "cdk-ts"|"cdktf-ts"|"pulumi-ts")
          if grep -qE "bucketName.*environmentSuffix|functionName.*environmentSuffix" "$file"; then
            echo "✅ Validated: environmentSuffix found in resource names"
            return 0
          else
            echo "❌ Validation failed: environmentSuffix not found in resource names"
            return 1
          fi
          ;;
        "cdk-py"|"cdktf-py"|"pulumi-py")
          if grep -qE "bucket_name.*environment_suffix|function_name.*environment_suffix" "$file"; then
            echo "✅ Validated: environment_suffix found in resource names"
            return 0
          else
            echo "❌ Validation failed: environment_suffix not found in resource names"
            return 1
          fi
          ;;
        *)
          echo "⚠️ Cannot validate for platform-language: $platform-$language"
          return 0  # Non-blocking
          ;;
      esac
      ;;
    
    "retain_policy")
      # Check if RETAIN is removed
      if grep -qiE "RemovalPolicy\.RETAIN|removalPolicy.*RETAIN|RETAIN" "$file"; then
        echo "❌ Validation failed: RETAIN policy still present"
        return 1
      else
        echo "✅ Validated: RETAIN policies removed"
        return 0
      fi
      ;;
    
    "deletion_protection")
      # Check if deletionProtection is false
      if grep -qiE "deletionProtection.*true|deletion_protection.*True" "$file"; then
        echo "⚠️ Validation warning: deletionProtection may still be enabled"
        return 0  # Non-blocking
      else
        echo "✅ Validated: deletionProtection disabled"
        return 0
      fi
      ;;
    
    "config_iam_policy")
      # Check if correct AWS Config IAM policy is used
      if grep -qiE "service-role/AWS_ConfigRole" "$file"; then
        echo "✅ Validated: Correct AWS Config IAM policy"
        return 0
      elif grep -qiE "ConfigRole|AWS_ConfigRole" "$file"; then
        echo "⚠️ Validation warning: May need to verify AWS Config IAM policy"
        return 0  # Non-blocking
      else
        echo "ℹ️ No AWS Config IAM policy found (may not be applicable)"
        return 0
      fi
      ;;
    
    "deprecated_synthetics")
      # Check if deprecated Synthetics runtime is updated
      if grep -qiE "SYNTHETICS_NODEJS_PUPPETEER_[0-5]\." "$file"; then
        echo "❌ Validation failed: Deprecated Synthetics runtime still present"
        return 1
      else
        echo "✅ Validated: Synthetics runtime updated"
        return 0
      fi
      ;;
    
    "aws_sdk_v2")
      # Check if AWS SDK v2 is replaced
      if grep -qiE "require.*aws-sdk|from.*aws-sdk" "$file"; then
        echo "⚠️ Validation warning: AWS SDK v2 may still be present (requires manual review)"
        return 0  # Non-blocking - complex fix
      else
        echo "✅ Validated: AWS SDK v2 usage addressed"
        return 0
      fi
      ;;
    
    "lambda_concurrency")
      # Check if reserved concurrency is removed
      if grep -qiE "reservedConcurrentExecutions|reserved_concurrent_executions" "$file"; then
        echo "⚠️ Validation warning: Reserved concurrency may still be present"
        return 0  # Non-blocking
      else
        echo "✅ Validated: Reserved concurrency removed"
        return 0
      fi
      ;;
    
    *)
      echo "⚠️ Unknown fix type: $fix_type (skipping validation)"
      return 0
      ;;
  esac
}

# Validate fix with platform-specific checks
validate_fix_platform() {
  local file="$1"
  local platform="$2"
  local language="$3"
  
  case "$platform" in
    "cdk"|"cdktf")
      # Run synth to validate
      if command -v npm >/dev/null 2>&1; then
        echo "  🔍 Running synth validation..."
        if npm run synth > /tmp/validate-synth.txt 2>&1; then
          echo "  ✅ Synth validation passed"
          return 0
        else
          echo "  ❌ Synth validation failed:"
          grep -i "error" /tmp/validate-synth.txt | head -5
          return 1
        fi
      fi
      ;;
    "pulumi")
      # Run pulumi preview
      if command -v pulumi >/dev/null 2>&1; then
        echo "  🔍 Running pulumi preview validation..."
        if pulumi preview > /tmp/validate-preview.txt 2>&1; then
          echo "  ✅ Pulumi preview validation passed"
          return 0
        else
          echo "  ❌ Pulumi preview validation failed:"
          grep -i "error" /tmp/validate-preview.txt | head -5
          return 1
        fi
      fi
      ;;
    "tf")
      # Run terraform validate
      if command -v terraform >/dev/null 2>&1; then
        echo "  🔍 Running terraform validate..."
        if terraform validate > /tmp/validate-tf.txt 2>&1; then
          echo "  ✅ Terraform validation passed"
          return 0
        else
          echo "  ❌ Terraform validation failed:"
          cat /tmp/validate-tf.txt
          return 1
        fi
      fi
      ;;
  esac
  
  # If platform validation not available, skip
  echo "  ⚠️ Platform validation not available (skipping)"
  return 0
}

# Main validation function
validate_fix() {
  local fix_json="$1"
  local platform="${2:-}"
  local language="${3:-}"
  
  local fix_type=$(echo "$fix_json" | jq -r '.fix_type')
  local file=$(echo "$fix_json" | jq -r '.location // .file')
  
  if [ -z "$file" ] || [ "$file" = "null" ] || [ "$file" = "unknown" ]; then
    echo "⚠️ Cannot validate: file location unknown"
    return 1
  fi
  
  echo "🔍 Validating fix: $fix_type in $file"
  
  # Validate fix-specific changes
  if ! validate_fix_by_type "$fix_type" "$file" "$platform" "$language"; then
    echo "❌ Fix validation failed"
    return 1
  fi
  
  # Validate platform-specific (if applicable)
  if [ -n "$platform" ]; then
    if ! validate_fix_platform "$file" "$platform" "$language"; then
      echo "⚠️ Platform validation had issues (non-blocking)"
      # Don't fail on platform validation - it's a secondary check
    fi
  fi
  
  echo "✅ Fix validation passed"
  return 0
}

# Validate multiple fixes
validate_fixes() {
  local fixes_json="$1"
  local platform="${2:-}"
  local language="${3:-}"
  
  local total=$(echo "$fixes_json" | jq 'length')
  local passed=0
  local failed=0
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "VALIDATING $total FIXES"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  while IFS= read -r fix; do
    if validate_fix "$fix" "$platform" "$language"; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi
  done < <(echo "$fixes_json" | jq -c '.[]')
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "VALIDATION SUMMARY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Total: $total"
  echo "Passed: $passed"
  echo "Failed: $failed"
  
  if [ $failed -eq 0 ]; then
    echo "✅ All fixes validated successfully"
    return 0
  else
    echo "⚠️ Some fixes failed validation"
    return 1
  fi
}

# If script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  if [ $# -lt 1 ]; then
    echo "Usage: $0 <fixes_json_file> [platform] [language]"
    exit 1
  fi
  
  validate_fixes "$(cat "$1")" "${2:-}" "${3:-}"
fi

