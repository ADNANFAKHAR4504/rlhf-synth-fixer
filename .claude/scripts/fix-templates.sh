#!/bin/bash
# Fix Templates - Executable fix patterns from lessons_learnt.md
# Provides reusable fix functions for common issues

set -euo pipefail

# Template: Missing environmentSuffix
fix_missing_environment_suffix() {
  local file="$1"
  local platform="$2"
  local language="$3"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing missing environmentSuffix in $file ($platform-$language)..."
  
  case "$platform-$language" in
    "cdk-ts"|"cdktf-ts"|"pulumi-ts")
      # TypeScript: Find resource names without environmentSuffix
      # Pattern: bucketName: `name` -> bucketName: `name-${environmentSuffix}`
      sed -i.bak \
        -e 's/bucketName: `\([^`]*\)`/bucketName: `\1-${environmentSuffix}`/g' \
        -e 's/functionName: `\([^`]*\)`/functionName: `\1-${environmentSuffix}`/g' \
        -e 's/tableName: `\([^`]*\)`/tableName: `\1-${environmentSuffix}`/g' \
        -e 's/roleName: `\([^`]*\)`/roleName: `\1-${environmentSuffix}`/g' \
        -e 's/queueName: `\([^`]*\)`/queueName: `\1-${environmentSuffix}`/g' \
        -e 's/topicName: `\([^`]*\)`/topicName: `\1-${environmentSuffix}`/g' \
        -e 's/clusterName: `\([^`]*\)`/clusterName: `\1-${environmentSuffix}`/g' \
        -e 's/dbInstanceIdentifier: `\([^`]*\)`/dbInstanceIdentifier: `\1-${environmentSuffix}`/g' \
        "$file"
      ;;
    "cdk-py"|"cdktf-py"|"pulumi-py")
      # Python: Find resource names without environment_suffix
      sed -i.bak \
        -e "s/bucket_name='\([^']*\)'/bucket_name=f'\1-{environment_suffix}'/g" \
        -e "s/bucket_name=\"\([^\"]*\)\"/bucket_name=f\"\1-{environment_suffix}\"/g" \
        -e "s/function_name='\([^']*\)'/function_name=f'\1-{environment_suffix}'/g" \
        -e "s/table_name='\([^']*\)'/table_name=f'\1-{environment_suffix}'/g" \
        -e "s/role_name='\([^']*\)'/role_name=f'\1-{environment_suffix}'/g" \
        -e "s/queue_name='\([^']*\)'/queue_name=f'\1-{environment_suffix}'/g" \
        -e "s/topic_name='\([^']*\)'/topic_name=f'\1-{environment_suffix}'/g" \
        -e "s/cluster_name='\([^']*\)'/cluster_name=f'\1-{environment_suffix}'/g" \
        -e "s/db_instance_identifier='\([^']*\)'/db_instance_identifier=f'\1-{environment_suffix}'/g" \
        "$file"
      ;;
    "tf-hcl")
      # Terraform: Add environment_suffix variable
      sed -i.bak \
        -e 's/bucket = "\([^"]*\)"/bucket = "\1-${var.environment_suffix}"/g' \
        -e 's/name = "\([^"]*\)"/name = "\1-${var.environment_suffix}"/g' \
        "$file"
      ;;
    *)
      echo "⚠️ Unknown platform-language combination: $platform-$language"
      return 1
      ;;
  esac
  
  # Clean up backup files
  rm -f "${file}.bak"
  
  echo "✅ Applied environmentSuffix fix to $file"
}

# Template: Retain policies
fix_retain_policies() {
  local file="$1"
  local platform="$2"
  local language="$3"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing Retain policies in $file ($platform-$language)..."
  
  case "$platform-$language" in
    "cdk-ts"|"cdktf-ts"|"pulumi-ts")
      sed -i.bak \
        -e 's/RemovalPolicy\.RETAIN/RemovalPolicy.DESTROY/g' \
        -e 's/removalPolicy:\s*RemovalPolicy\.RETAIN/removalPolicy: RemovalPolicy.DESTROY/g' \
        -e 's/removalPolicy.*=.*RETAIN/removalPolicy: RemovalPolicy.DESTROY/g' \
        "$file"
      ;;
    "cdk-py"|"cdktf-py"|"pulumi-py")
      sed -i.bak \
        -e 's/RemovalPolicy.RETAIN/RemovalPolicy.DESTROY/g' \
        -e 's/removal_policy.*=.*RETAIN/removal_policy=RemovalPolicy.DESTROY/g' \
        "$file"
      ;;
    *)
      # Generic fix for any platform
      sed -i.bak \
        -e 's/RETAIN/DESTROY/g' \
        -e 's/Retain/Destroy/g' \
        "$file"
      ;;
  esac
  
  rm -f "${file}.bak"
  echo "✅ Applied Retain policy fix to $file"
}

# Template: DeletionProtection
fix_deletion_protection() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing DeletionProtection in $file..."
  
  sed -i.bak \
    -e 's/deletionProtection:\s*true/deletionProtection: false/g' \
    -e 's/deletionProtection.*=.*true/deletionProtection: false/g' \
    -e 's/deletion_protection.*=.*True/deletion_protection=False/g' \
    -e 's/deletion_protection:\s*True/deletion_protection: False/g' \
    "$file"
  
  rm -f "${file}.bak"
  echo "✅ Applied DeletionProtection fix to $file"
}

# Template: AWS Config IAM policy
fix_config_iam() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing AWS Config IAM policy in $file..."
  
  sed -i.bak \
    -e 's/service-role\/ConfigRole/service-role\/AWS_ConfigRole/g' \
    -e 's/arn:aws:iam::aws:policy\/ConfigRole/arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole/g' \
    -e 's/arn:aws:iam::aws:policy\/AWS_ConfigRole[^"]/arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole/g' \
    "$file"
  
  rm -f "${file}.bak"
  echo "✅ Applied AWS Config IAM fix to $file"
}

# Template: Deprecated Synthetics runtime
fix_deprecated_synthetics() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing deprecated Synthetics runtime in $file..."
  
  sed -i.bak \
    -e 's/SYNTHETICS_NODEJS_PUPPETEER_[0-5]\./SYNTHETICS_NODEJS_PUPPETEER_7_0/g' \
    "$file"
  
  rm -f "${file}.bak"
  echo "✅ Applied Synthetics runtime fix to $file"
}

# Template: AWS SDK v2 (Node.js 18+)
fix_aws_sdk_v2() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing AWS SDK v2 usage in $file..."
  
  # Replace require('aws-sdk') with @aws-sdk/client-* imports
  # This is a complex fix that may require manual intervention
  sed -i.bak \
    -e 's/const AWS = require.*aws-sdk.*/\/\/ TODO: Replace with AWS SDK v3 imports/g' \
    -e 's/require.*aws-sdk.*/\/\/ TODO: Use @aws-sdk\/client-* instead/g' \
    "$file"
  
  rm -f "${file}.bak"
  echo "⚠️ Applied AWS SDK v2 fix (may require manual review)"
}

# Template: Lambda reserved concurrency
fix_lambda_concurrency() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing Lambda reserved concurrency in $file..."
  
  # Remove or reduce reservedConcurrentExecutions
  sed -i.bak \
    -e '/reservedConcurrentExecutions/d' \
    -e '/reserved_concurrent_executions/d' \
    "$file"
  
  rm -f "${file}.bak"
  echo "✅ Removed Lambda reserved concurrency"
}

# Apply fix template by name
apply_fix_template() {
  local template="$1"
  local file="$2"
  local platform="${3:-}"
  local language="${4:-}"
  
  case "$template" in
    "missing_environment_suffix")
      fix_missing_environment_suffix "$file" "$platform" "$language"
      ;;
    "retain_policy")
      fix_retain_policies "$file" "$platform" "$language"
      ;;
    "deletion_protection")
      fix_deletion_protection "$file"
      ;;
    "config_iam_policy")
      fix_config_iam "$file"
      ;;
    "deprecated_synthetics")
      fix_deprecated_synthetics "$file"
      ;;
    "aws_sdk_v2")
      fix_aws_sdk_v2 "$file"
      ;;
    "lambda_concurrency")
      fix_lambda_concurrency "$file"
      ;;
    *)
      echo "❌ Unknown fix template: $template"
      return 1
      ;;
  esac
}

# Main function for batch fixing
batch_fix() {
  local fixes_json="$1"
  local platform="${2:-}"
  local language="${3:-}"
  
  echo "🔧 Applying batch fixes..."
  
  local fix_count=$(echo "$fixes_json" | jq 'length')
  local success_count=0
  local fail_count=0
  
  while IFS= read -r fix; do
    local template=$(echo "$fix" | jq -r '.fix_type')
    local file=$(echo "$fix" | jq -r '.file')
    
    if apply_fix_template "$template" "$file" "$platform" "$language"; then
      success_count=$((success_count + 1))
    else
      fail_count=$((fail_count + 1))
    fi
  done < <(echo "$fixes_json" | jq -c '.[]')
  
  echo "✅ Batch fix complete: $success_count succeeded, $fail_count failed"
  
  return $fail_count
}

# Export functions for use in other scripts
export -f fix_missing_environment_suffix
export -f fix_retain_policies
export -f fix_deletion_protection
export -f fix_config_iam
export -f fix_deprecated_synthetics
export -f fix_aws_sdk_v2
export -f fix_lambda_concurrency
export -f apply_fix_template
export -f batch_fix

# If script is executed directly, show usage
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  if [ $# -lt 2 ]; then
    echo "Usage: $0 <template> <file> [platform] [language]"
    echo ""
    echo "Available templates:"
    echo "  - missing_environment_suffix"
    echo "  - retain_policy"
    echo "  - deletion_protection"
    echo "  - config_iam_policy"
    echo "  - deprecated_synthetics"
    echo "  - aws_sdk_v2"
    echo "  - lambda_concurrency"
    exit 1
  fi
  
  apply_fix_template "$1" "$2" "${3:-}" "${4:-}"
fi

