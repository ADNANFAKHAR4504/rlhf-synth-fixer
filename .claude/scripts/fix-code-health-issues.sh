#!/bin/bash
# Attempts to fix code health issues before marking ERROR
# Usage: fix-code-health-issues.sh <issue_type> <file_path>

set -euo pipefail

ISSUE_TYPE="$1"
FILE_PATH="${2:-}"

if [ -z "$FILE_PATH" ] && [ "$ISSUE_TYPE" != "scan" ]; then
  echo "❌ File path required for issue type: $ISSUE_TYPE"
  exit 1
fi

echo "🔧 Attempting to fix $ISSUE_TYPE..."

if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")
else
  PLATFORM="unknown"
  LANGUAGE="unknown"
fi

case "$ISSUE_TYPE" in
  "empty_array")
    if [ ! -f "$FILE_PATH" ]; then
      echo "❌ File not found: $FILE_PATH"
      exit 1
    fi
    
    echo "Fixing empty array in $FILE_PATH..."
    
    # Detect empty array pattern
    case "$PLATFORM-$LANGUAGE" in
      "pulumi-ts"|"cdk-ts"|"cdktf-ts")
        # Check for empty subnet arrays in DB subnet groups
        if grep -q "subnetIds: \[\]" "$FILE_PATH" 2>/dev/null; then
          echo "Found empty subnetIds array, attempting to populate..."
          echo "⚠️ Requires VPC context to populate subnets"
          echo "⚠️ Please ensure VPC subnets are created before DB subnet group"
          # This would require more context to auto-fix
          exit 1
        fi
        ;;
      "pulumi-py"|"cdk-py"|"cdktf-py")
        if grep -q "subnet_ids=\[\]" "$FILE_PATH" 2>/dev/null; then
          echo "Found empty subnet_ids array, attempting to populate..."
          echo "⚠️ Requires VPC context to populate subnets"
          exit 1
        fi
        ;;
    esac
    
    echo "⚠️ Empty array fix requires manual intervention with context"
    exit 1
    ;;
    
  "wrong_architecture")
    echo "Fixing wrong architecture..."
    
    # Detect architecture mismatch
    # Example: Regular Aurora instead of Global Database
    if [ -f "lib/PROMPT.md" ] && grep -qi "global\|multi-region" lib/PROMPT.md; then
      if grep -q "rds.Cluster" "$FILE_PATH" 2>/dev/null && ! grep -q "GlobalCluster" "$FILE_PATH" 2>/dev/null; then
        echo "Found regular Aurora in multi-region task"
        echo "⚠️ Architecture fix requires regeneration with correct architecture"
        echo "⚠️ Please regenerate code with Global Database configuration"
        exit 1
      fi
    fi
    
    echo "⚠️ Architecture fix requires regeneration"
    exit 1
    ;;
    
  "syntax_error")
    echo "Fixing syntax error..."
    
    if [ ! -f "$FILE_PATH" ]; then
      echo "❌ File not found: $FILE_PATH"
      exit 1
    fi
    
    # Platform-specific syntax fixes
    case "$PLATFORM-$LANGUAGE" in
      "cdk-ts"|"cdktf-ts"|"pulumi-ts")
        # Try to fix common TypeScript syntax errors
        echo "⚠️ TypeScript syntax errors require manual fixes"
        echo "Common fixes:"
        echo "  - Check for missing commas, semicolons"
        echo "  - Verify import statements"
        echo "  - Check bracket matching"
        ;;
      "cdk-py"|"cdktf-py"|"pulumi-py")
        # Try to fix common Python syntax errors
        echo "⚠️ Python syntax errors require manual fixes"
        echo "Common fixes:"
        echo "  - Check indentation"
        echo "  - Verify colons after if/for/def"
        echo "  - Check parentheses matching"
        ;;
    esac
    
    exit 1
    ;;
    
  "scan")
    echo "🔍 Scanning for code health issues..."
    
    # Scan for common issues
    ISSUES_FOUND=0
    
    # Check for empty arrays
    if find lib/ -type f \( -name "*.ts" -o -name "*.py" \) -exec grep -l "subnetIds: \[\|\]subnet_ids=\[\]" {} \; 2>/dev/null | head -5; then
      echo "⚠️ Found empty array patterns"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for wrong architecture patterns
    if [ -f "lib/PROMPT.md" ] && grep -qi "global\|multi-region" lib/PROMPT.md; then
      if find lib/ -type f -name "*.ts" -o -name "*.py" | xargs grep -l "rds.Cluster\|rds_cluster" 2>/dev/null | \
         xargs grep -L "GlobalCluster\|global_cluster" 2>/dev/null | head -5; then
        echo "⚠️ Found regular Aurora in multi-region task"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
      fi
    fi
    
    if [ $ISSUES_FOUND -eq 0 ]; then
      echo "✅ No common code health issues detected"
      exit 0
    else
      echo "⚠️ Found $ISSUES_FOUND potential issues"
      echo "⚠️ Review and fix manually or regenerate code"
      exit 1
    fi
    ;;
    
  *)
    echo "❌ Unknown issue type: $ISSUE_TYPE"
    echo "Supported types: empty_array, wrong_architecture, syntax_error, scan"
    exit 1
    ;;
esac

echo "✅ Fix attempt completed"
exit 0

