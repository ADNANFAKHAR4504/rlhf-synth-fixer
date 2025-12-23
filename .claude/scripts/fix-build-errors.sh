#!/bin/bash
# Attempts to fix build/lint/synth errors
# Usage: fix-build-errors.sh <error_type> <error_output>

set -euo pipefail

ERROR_TYPE="$1"
ERROR_OUTPUT="${2:-/dev/null}"

echo "🔧 Attempting to fix $ERROR_TYPE errors..."

if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")
else
  PLATFORM="unknown"
  LANGUAGE="unknown"
fi

case "$ERROR_TYPE" in
  "lint")
    echo "🔍 Analyzing lint errors..."
    
    case "$PLATFORM-$LANGUAGE" in
      "cdk-ts"|"cdktf-ts")
        echo "Running ESLint auto-fix..."
        if command -v npm >/dev/null 2>&1; then
          npm run lint -- --fix 2>&1 || echo "⚠️ Some lint errors may require manual fixes"
        else
          echo "❌ npm not found, cannot auto-fix"
          exit 1
        fi
        ;;
      "cdk-py"|"cdktf-py"|"pulumi-py")
        echo "Running black/isort auto-fix..."
        if command -v black >/dev/null 2>&1; then
          black lib/ 2>&1 || echo "⚠️ black failed, trying isort..."
        fi
        if command -v isort >/dev/null 2>&1; then
          isort lib/ 2>&1 || echo "⚠️ isort failed"
        fi
        ;;
      "pulumi-ts")
        echo "Running ESLint auto-fix..."
        if command -v npm >/dev/null 2>&1; then
          npm run lint -- --fix 2>&1 || echo "⚠️ Some lint errors may require manual fixes"
        else
          echo "❌ npm not found, cannot auto-fix"
          exit 1
        fi
        ;;
      *)
        echo "⚠️ Auto-fix not implemented for $PLATFORM-$LANGUAGE"
        echo "⚠️ Please fix lint errors manually"
        exit 1
        ;;
    esac
    ;;
    
  "build")
    echo "🔍 Analyzing build errors..."
    
    if [ -f "$ERROR_OUTPUT" ]; then
      # Extract common build errors
      if grep -qi "error TS" "$ERROR_OUTPUT" 2>/dev/null; then
        echo "TypeScript compilation errors detected:"
        grep -i "error TS" "$ERROR_OUTPUT" | head -5
        
        echo ""
        echo "⚠️ TypeScript errors require manual fixes"
        echo "Common fixes:"
        echo "  - Check type definitions"
        echo "  - Verify imports"
        echo "  - Fix type mismatches"
      fi
      
      if grep -qi "syntax error\|SyntaxError" "$ERROR_OUTPUT" 2>/dev/null; then
        echo "Syntax errors detected:"
        grep -i "syntax error\|SyntaxError" "$ERROR_OUTPUT" | head -5
        
        echo ""
        echo "⚠️ Syntax errors require manual fixes"
      fi
    else
      echo "⚠️ Error output file not found: $ERROR_OUTPUT"
    fi
    
    echo ""
    echo "⚠️ Build errors typically require manual intervention"
    echo "Review errors above and fix in source code"
    exit 1
    ;;
    
  "synth")
    echo "🔍 Analyzing synth errors..."
    
    if [ -f "$ERROR_OUTPUT" ]; then
      echo "Synth errors detected:"
      grep -i "error\|failed" "$ERROR_OUTPUT" | head -10
    fi
    
    echo ""
    echo "⚠️ Synth errors require manual fixes"
    echo "Common fixes:"
    echo "  - Check resource configurations"
    echo "  - Verify property names"
    echo "  - Fix circular dependencies"
    echo "  - Check AWS service limits"
    
    exit 1
    ;;
    
  *)
    echo "❌ Unknown error type: $ERROR_TYPE"
    echo "Supported types: lint, build, synth"
    exit 1
    ;;
esac

echo "✅ Fix attempt completed"
exit 0

