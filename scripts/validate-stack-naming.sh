#!/bin/bash

# Exit on any error
set -e

echo "🔍 Validating stack naming conventions..."

# Read platform from metadata.json
if [ ! -f "metadata.json" ]; then
  echo "⚠️ metadata.json not found, skipping validation"
  exit 0
fi

PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)

echo "Platform: $PLATFORM, Language: $LANGUAGE"

# Define the standard stack name prefix
STANDARD_STACK_NAME="TapStack"
VALIDATION_ERRORS=0

# Function to check file for incorrect naming patterns
check_file_naming() {
  local file=$1
  local description=$2
  
  if [ ! -f "$file" ]; then
    return 0
  fi
  
  echo "  Checking $description..."
  
  # Check for common incorrect patterns (case-insensitive search for variants)
  if grep -iE "tap-stack|Tap-stack|TAP-STACK|tapStack" "$file" >/dev/null 2>&1; then
    # Verify it's not in comments or documentation
    if grep -vE "^\s*(#|//|\*)" "$file" | grep -iE "tap-stack|Tap-stack|TAP-STACK|tapStack" >/dev/null 2>&1; then
      echo "    ❌ Found incorrect stack naming pattern in $file"
      echo "    Expected: TapStack (capital T, capital S)"
      grep -inE "tap-stack|Tap-stack|TAP-STACK|tapStack" "$file" | head -5
      VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    fi
  fi
}

# Function to validate Pulumi stack name format
validate_pulumi_stack_format() {
  if [ "$PLATFORM" != "pulumi" ]; then
    return 0
  fi
  
  echo "  Validating Pulumi stack name format..."
  
  # Check scripts/deploy.sh for correct Pulumi stack selection
  if [ -f "scripts/deploy.sh" ]; then
    if grep -E "pulumi stack select.*TapStack\\\${ENVIRONMENT_SUFFIX}" "scripts/deploy.sh" >/dev/null 2>&1; then
      echo "    ✅ deploy.sh uses correct format: TapStack\${ENVIRONMENT_SUFFIX}"
    else
      if grep -iE "pulumi stack select.*(tap-stack|tapstack)" "scripts/deploy.sh" >/dev/null 2>&1; then
        echo "    ❌ deploy.sh uses incorrect stack naming format"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
      fi
    fi
  fi
  
  # Check scripts/destroy.sh for correct Pulumi stack selection
  if [ -f "scripts/destroy.sh" ]; then
    if grep -E "pulumi stack select.*TapStack\\\${ENVIRONMENT_SUFFIX}" "scripts/destroy.sh" >/dev/null 2>&1; then
      echo "    ✅ destroy.sh uses correct format: TapStack\${ENVIRONMENT_SUFFIX}"
    else
      if grep -iE "pulumi stack select.*(tap-stack|tapstack)" "scripts/destroy.sh" >/dev/null 2>&1; then
        echo "    ❌ destroy.sh uses incorrect stack naming format"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
      fi
    fi
  fi
}

# Function to validate CDK/CloudFormation stack names
validate_cdk_cfn_stack_format() {
  if [ "$PLATFORM" != "cdk" ] && [ "$PLATFORM" != "cfn" ]; then
    return 0
  fi
  
  echo "  Validating CDK/CloudFormation stack name format..."
  
  # Check for TapStack pattern in deployment scripts
  if [ -f "scripts/deploy.sh" ]; then
    if grep -E "STACK_NAME=\"TapStack\\\${ENVIRONMENT_SUFFIX" "scripts/deploy.sh" >/dev/null 2>&1; then
      echo "    ✅ deploy.sh uses correct format: TapStack\${ENVIRONMENT_SUFFIX}"
    else
      if grep -iE "STACK_NAME=\"(tap-stack|tapstack)" "scripts/deploy.sh" >/dev/null 2>&1; then
        echo "    ❌ deploy.sh uses incorrect stack naming format"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
      fi
    fi
  fi
}

# Run validations
echo "📋 Running naming convention checks..."

# Check common files
check_file_naming "package.json" "package.json scripts"
check_file_naming "scripts/deploy.sh" "deployment script"
check_file_naming "scripts/destroy.sh" "destroy script"
check_file_naming "scripts/bootstrap.sh" "bootstrap script"

# Check language-specific entry points
if [ "$PLATFORM" = "pulumi" ] || [ "$PLATFORM" = "cdk" ]; then
  case $LANGUAGE in
    py)
      check_file_naming "tap.py" "Python entry point"
      check_file_naming "lib/tap_stack.py" "Python stack definition"
      ;;
    ts)
      check_file_naming "bin/tap.ts" "TypeScript entry point"
      check_file_naming "lib/tap-stack.ts" "TypeScript stack definition"
      ;;
    js)
      check_file_naming "bin/tap.mjs" "JavaScript entry point"
      check_file_naming "lib/tap-stack.mjs" "JavaScript stack definition"
      ;;
    go)
      check_file_naming "tap.go" "Go entry point"
      check_file_naming "lib/tap_stack.go" "Go stack definition"
      ;;
  esac
fi

# Platform-specific validations
validate_pulumi_stack_format
validate_cdk_cfn_stack_format

# Check test files
if [ -d "test" ]; then
  for test_file in test/*.test.ts test/*.test.js test/*.test.py; do
    if [ -f "$test_file" ]; then
      check_file_naming "$test_file" "$(basename "$test_file")"
    fi
  done
fi

# Summary
echo ""
echo "================================"
echo "Stack Naming Validation Summary"
echo "================================"

if [ $VALIDATION_ERRORS -eq 0 ]; then
  echo "✅ All naming conventions are correct!"
  echo ""
  echo "Standard: Use 'TapStack' (capital T, capital S) everywhere"
  echo "Examples:"
  echo "  - CloudFormation/CDK: TapStack\${ENVIRONMENT_SUFFIX}"
  echo "  - Pulumi: \${PULUMI_ORG}/TapStack/TapStack\${ENVIRONMENT_SUFFIX}"
  exit 0
else
  echo "❌ Found $VALIDATION_ERRORS naming convention violation(s)"
  echo ""
  echo "REQUIRED STANDARD:"
  echo "  Use 'TapStack' (capital T, capital S) everywhere"
  echo ""
  echo "❌ INCORRECT patterns to fix:"
  echo "  - tap-stack (lowercase with hyphen)"
  echo "  - Tap-stack (mixed case with hyphen)"
  echo "  - TAP-STACK (all caps with hyphen)"
  echo "  - tapStack (camelCase)"
  echo ""
  echo "✅ CORRECT pattern:"
  echo "  - TapStack (PascalCase, no hyphen)"
  echo ""
  echo "Please fix the naming inconsistencies before deploying."
  exit 1
fi

