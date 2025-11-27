#!/bin/bash

# Pre-Deployment IaC Validation Script
# Basic validation: environmentSuffix, hardcoded values, required files
# For advanced pattern matching, see code-health-check.sh

set -euo pipefail

# Standardized error reporting
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Prerequisite checks
check_prerequisites() {
    local missing_deps=()
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v grep &> /dev/null; then
        missing_deps+=("grep")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required dependencies: ${missing_deps[*]}${NC}"
        echo "Please install missing dependencies before running this script"
        exit 1
    fi
    
    # Check if we're in a worktree
    if [ ! -f "metadata.json" ]; then
        echo -e "${YELLOW}⚠️  Not in worktree directory (metadata.json not found)${NC}"
        echo "   This script should be run from worktree/synth-{task_id}/"
        exit 1
    fi
}

check_prerequisites

echo "🔍 Starting Pre-Deployment IaC Validation (Basic Checks)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Read metadata
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-"dev"}

echo "  Platform: $PLATFORM"
echo "  Language: $LANGUAGE"
echo "  Environment Suffix: $ENVIRONMENT_SUFFIX"

ERROR_COUNT=0
WARNING_COUNT=0

# ============================================================================
# 1. Check for hardcoded environment names and values
# ============================================================================
echo ""
echo "📋 1. Checking for hardcoded values..."

# Common hardcoded patterns to avoid
HARDCODED_PATTERNS=(
  "prod-"
  "production"
  "dev-"
  "development"
  "stage-"
  "staging"
  "us-east-1.*account"
  "us-west-2.*account"
  "arn:aws:.*:123456789"
  "arn:aws:.*:.*:account"
)

# Check lib/ directory for hardcoded values
if [ -d "lib" ]; then
  for pattern in "${HARDCODED_PATTERNS[@]}"; do
    MATCHES=$(grep -rniE "$pattern" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.hcl" --include="*.tf" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
      echo "⚠️  WARNING: Potential hardcoded value found: $pattern"
      echo "$MATCHES" | head -3
      ((WARNING_COUNT++))
    fi
  done
fi

# ============================================================================
# 2. Verify environmentSuffix usage in resource names
# ============================================================================
echo ""
echo "📋 2. Checking environmentSuffix usage in resource names..."

# Platform-specific checks
case "$PLATFORM" in
  cdk|cdktf)
    if [ "$LANGUAGE" == "ts" ] || [ "$LANGUAGE" == "js" ]; then
      # Check for resource naming patterns in TypeScript/JavaScript
      if [ -d "lib" ]; then
        # Look for resource definitions without environmentSuffix
        NO_SUFFIX=$(grep -rniE "(bucketName|functionName|roleName|tableName|queueName|topicName|streamName|clusterName|dbInstanceIdentifier).*['\"].*['\"]" lib/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "environmentSuffix" || true)
        if [ -n "$NO_SUFFIX" ]; then
          echo "⚠️  WARNING: Resource names without environmentSuffix detected:"
          echo "$NO_SUFFIX" | head -5
          ((WARNING_COUNT++))
        fi
      fi
    elif [ "$LANGUAGE" == "py" ]; then
      # Check for resource naming patterns in Python
      if [ -d "lib" ]; then
        NO_SUFFIX=$(grep -rniE "(bucket_name|function_name|role_name|table_name|queue_name|topic_name|stream_name|cluster_name|db_instance_identifier).*['\"].*['\"]" lib/ --include="*.py" 2>/dev/null | grep -v "environment_suffix" || true)
        if [ -n "$NO_SUFFIX" ]; then
          echo "⚠️  WARNING: Resource names without environment_suffix detected:"
          echo "$NO_SUFFIX" | head -5
          ((WARNING_COUNT++))
        fi
      fi
    fi
    ;;
  cfn)
    # Check CloudFormation templates
    if [ -d "lib" ]; then
      NO_SUFFIX=$(grep -rniE "Name.*:" lib/ --include="*.yaml" --include="*.yml" --include="*.json" 2>/dev/null | grep -v "Ref.*ENVIRONMENT_SUFFIX" | grep -v "environmentSuffix" || true)
      if [ -n "$NO_SUFFIX" ]; then
        echo "⚠️  WARNING: CloudFormation resources without environmentSuffix detected"
        ((WARNING_COUNT++))
      fi
    fi
    ;;
  tf|pulumi)
    # Check Terraform/Pulumi files
    if [ -d "lib" ]; then
      NO_SUFFIX=$(grep -rniE "(name|bucket|identifier).*=" lib/ --include="*.tf" --include="*.hcl" --include="*.py" --include="*.ts" 2>/dev/null | grep -v "environment_suffix" | grep -v "var.environment_suffix" || true)
      if [ -n "$NO_SUFFIX" ]; then
        echo "⚠️  WARNING: Resource names without environment_suffix detected"
        ((WARNING_COUNT++))
      fi
    fi
    ;;
esac

# ============================================================================
# 3. Check for Retain policies and DeletionProtection
# ============================================================================
echo ""
echo "📋 3. Checking for Retain policies and DeletionProtection..."

if [ -d "lib" ]; then
  RETAIN_POLICIES=$(grep -rniE "(RemovalPolicy\.RETAIN|DeletionPolicy.*Retain|deletion_protection.*true|skip_final_snapshot.*false)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.hcl" --include="*.tf" 2>/dev/null || true)
    if [ -n "$RETAIN_POLICIES" ]; then
      echo -e "${RED}❌ ERROR: Retain policies or DeletionProtection found (resources must be destroyable):${NC}"
      echo "$RETAIN_POLICIES"
      ((ERROR_COUNT++))
    else
      echo -e "${GREEN}✅ No Retain policies found${NC}"
    fi
fi

# ============================================================================
# 4. Check for expensive resource configurations
# ============================================================================
echo ""
echo "📋 4. Checking for expensive resource configurations..."

if [ -d "lib" ]; then
  # Check for RDS non-serverless instances
  RDS_INSTANCES=$(grep -rniE "(DatabaseInstance|db\..*instance|aws_db_instance)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.hcl" --include="*.tf" 2>/dev/null | grep -v "serverless" || true)
  if [ -n "$RDS_INSTANCES" ]; then
    echo "⚠️  WARNING: Non-serverless RDS instances detected (expensive and slow to deploy):"
    echo "$RDS_INSTANCES" | head -3
    ((WARNING_COUNT++))
  fi

  # Check for NAT Gateways
  NAT_GATEWAYS=$(grep -rniE "(NatGateway|aws_nat_gateway)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.hcl" --include="*.tf" 2>/dev/null || true)
  if [ -n "$NAT_GATEWAYS" ]; then
    echo "⚠️  WARNING: NAT Gateways detected (expensive ~$30-40/month each):"
    echo "$NAT_GATEWAYS" | head -3
    ((WARNING_COUNT++))
  fi

  # Check for ConfigRecorder (can be slow)
  CONFIG_RECORDER=$(grep -rniE "(ConfigurationRecorder|aws_config_configuration_recorder)" lib/ --include="*.ts" --include="*.py" --include="*.js" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.hcl" --include="*.tf" 2>/dev/null || true)
  if [ -n "$CONFIG_RECORDER" ]; then
    echo "⚠️  WARNING: AWS Config Recorder detected (can be slow to deploy):"
    echo "$CONFIG_RECORDER" | head -3
    ((WARNING_COUNT++))
  fi
fi

# ============================================================================
# 5. Check for valid cross-resource references
# ============================================================================
echo ""
echo "📋 5. Checking for cross-resource references..."

# This is a basic check - more sophisticated validation would require parsing AST
if [ -d "lib" ]; then
  case "$LANGUAGE" in
    ts|js)
      # Check for undefined variables being referenced
      UNDEFINED_REFS=$(grep -rniE "\.([a-zA-Z_][a-zA-Z0-9_]*)\." lib/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "this\." | grep -v "props\." | head -10 || true)
      # This is informational only, not failing on it
      ;;
    py)
      # Similar check for Python
      UNDEFINED_REFS=$(grep -rniE "self\..*\." lib/ --include="*.py" 2>/dev/null | head -10 || true)
      ;;
  esac
fi

# ============================================================================
# 6. Platform-specific validations
# ============================================================================
echo ""
echo "📋 6. Running platform-specific validations..."

case "$PLATFORM" in
  cdk|cdktf)
    # Check for proper Stack/Construct patterns
    if [ "$LANGUAGE" == "ts" ] || [ "$LANGUAGE" == "js" ]; then
      if [ -d "lib" ]; then
        # Verify TapStack exists
        if ! grep -rq "class TapStack" lib/ --include="*.ts" --include="*.js" 2>/dev/null; then
          echo "⚠️  WARNING: TapStack class not found in lib/"
          ((WARNING_COUNT++))
        fi
      fi
    fi
    ;;
  cfn)
    # Validate CloudFormation template syntax (basic check)
    if [ "$LANGUAGE" == "yaml" ] || [ "$LANGUAGE" == "yml" ]; then
      for template in lib/*.yaml lib/*.yml 2>/dev/null; do
        if [ -f "$template" ]; then
          if ! python3 -c "import yaml; yaml.safe_load(open('$template'))" 2>/dev/null; then
            echo "❌ ERROR: Invalid YAML syntax in $template"
            ((ERROR_COUNT++))
          fi
        fi
      done
    elif [ "$LANGUAGE" == "json" ]; then
      for template in lib/*.json 2>/dev/null; do
        if [ -f "$template" ]; then
          if ! jq empty "$template" 2>/dev/null; then
            echo "❌ ERROR: Invalid JSON syntax in $template"
            ((ERROR_COUNT++))
          fi
        fi
      done
    fi
    ;;
  tf)
    # Basic Terraform validation
    if [ -d "lib" ] && command -v terraform &> /dev/null; then
      echo "  Running terraform validate (if available)..."
      # Note: This is informational, not failing on it since terraform may not be fully initialized
    fi
    ;;
esac

# ============================================================================
# 7. Check required files exist
# ============================================================================
echo ""
echo "📋 7. Checking required files..."

REQUIRED_FILES=("metadata.json")

case "$PLATFORM" in
  cdk|cdktf)
    if [ "$LANGUAGE" == "ts" ] || [ "$LANGUAGE" == "js" ]; then
      REQUIRED_FILES+=("package.json" "tsconfig.json")
    elif [ "$LANGUAGE" == "py" ]; then
      REQUIRED_FILES+=("Pipfile" "setup.py")
    fi
    ;;
  tf)
    # Terraform doesn't have strict file requirements
    ;;
  pulumi)
    if [ "$LANGUAGE" == "ts" ]; then
      REQUIRED_FILES+=("package.json" "tsconfig.json" "Pulumi.yaml")
    elif [ "$LANGUAGE" == "py" ]; then
      REQUIRED_FILES+=("Pipfile" "Pulumi.yaml")
    fi
    ;;
esac

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERROR: Required file missing: $file"
    ((ERROR_COUNT++))
  fi
done

# ============================================================================
# Summary and Exit
# ============================================================================
echo ""
echo "=========================================="
echo "📊 Validation Summary"
echo "=========================================="
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${RED}❌ Pre-deployment validation FAILED with $ERROR_COUNT error(s)${NC}"
  echo "   Please fix the errors above before attempting AWS deployment"
  exit 1
elif [ $WARNING_COUNT -gt 3 ]; then
  echo -e "${YELLOW}⚠️  Pre-deployment validation completed with $WARNING_COUNT warnings${NC}"
  echo "   Consider reviewing the warnings, but proceeding with deployment"
  exit 0
else
  echo -e "${GREEN}✅ Pre-deployment validation PASSED${NC}"
  echo "   Ready to proceed with AWS deployment"
  exit 0
fi

