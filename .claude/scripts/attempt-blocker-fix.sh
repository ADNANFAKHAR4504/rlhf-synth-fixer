#!/bin/bash
# Attempts to fix critical blockers before marking ERROR
# Usage: attempt-blocker-fix.sh <blocker_type> <task_id> <score>

set -euo pipefail

BLOCKER_TYPE="$1"
TASK_ID="$2"
CURRENT_SCORE="$3"

WORKTREE_DIR="worktree/synth-${TASK_ID}"
if [ ! -d "$WORKTREE_DIR" ]; then
  echo "❌ Worktree not found: $WORKTREE_DIR"
  exit 1
fi

cd "$WORKTREE_DIR" || exit 1

if [ ! -f "metadata.json" ]; then
  echo "❌ metadata.json not found"
  exit 1
fi

case "$BLOCKER_TYPE" in
  "wrong_region")
    echo "🔧 Attempting to fix wrong region..."
    # Extract correct region from PROMPT.md
    CORRECT_REGION=$(grep -i "region" lib/PROMPT.md 2>/dev/null | grep -oE "(us-east-1|us-west-2|eu-west-1|eu-central-1|ap-southeast-1)" | head -1)
    
    if [ -z "$CORRECT_REGION" ]; then
      echo "❌ Cannot determine correct region from PROMPT.md"
      exit 1
    fi
    
    # Get current region from code
    PLATFORM=$(jq -r '.platform' metadata.json)
    LANGUAGE=$(jq -r '.language' metadata.json)
    
    echo "📝 Updating region from detected value to $CORRECT_REGION..."
    
    # Update code to use correct region
    case "$PLATFORM" in
      "cdk"|"cdktf")
        if [ "$LANGUAGE" = "ts" ]; then
          find lib/ -name "*.ts" -type f | xargs sed -i.bak "s/us-east-1/$CORRECT_REGION/g" 2>/dev/null || true
          find lib/ -name "*.ts" -type f | xargs sed -i.bak "s/us-west-2/$CORRECT_REGION/g" 2>/dev/null || true
        elif [ "$LANGUAGE" = "py" ]; then
          find lib/ -name "*.py" -type f | xargs sed -i.bak "s/us-east-1/$CORRECT_REGION/g" 2>/dev/null || true
          find lib/ -name "*.py" -type f | xargs sed -i.bak "s/us-west-2/$CORRECT_REGION/g" 2>/dev/null || true
        fi
        ;;
      "pulumi")
        if [ "$LANGUAGE" = "ts" ]; then
          find lib/ -name "*.ts" -type f | xargs sed -i.bak "s/us-east-1/$CORRECT_REGION/g" 2>/dev/null || true
        elif [ "$LANGUAGE" = "py" ]; then
          find lib/ -name "*.py" -type f | xargs sed -i.bak "s/us-east-1/$CORRECT_REGION/g" 2>/dev/null || true
        fi
        ;;
      "cfn")
        find lib/ -name "*.yaml" -o -name "*.yml" -o -name "*.json" | xargs sed -i.bak "s/us-east-1/$CORRECT_REGION/g" 2>/dev/null || true
        ;;
      "tf")
        find lib/ -name "*.tf" -type f | xargs sed -i.bak "s/us-east-1/$CORRECT_REGION/g" 2>/dev/null || true
        ;;
    esac
    
    # Clean up backup files
    find lib/ -name "*.bak" -delete 2>/dev/null || true
    
    echo "✅ Region updated to $CORRECT_REGION"
    echo "⚠️ Requires regeneration and redeployment"
    exit 0
    ;;
    
  "missing_services")
    echo "🔧 Attempting to add missing services..."
    # Extract required services from task description/PROMPT.md
    if [ ! -f "lib/PROMPT.md" ]; then
      echo "❌ PROMPT.md not found"
      exit 1
    fi
    
    # This would require more complex logic to add services
    # For now, mark as requiring manual intervention
    echo "⚠️ Missing services fix requires regeneration with updated PROMPT.md"
    echo "⚠️ Please update PROMPT.md with missing services and regenerate"
    exit 1
    ;;
    
  "platform_mismatch")
    echo "🔧 Attempting to fix platform mismatch..."
    # Verify actual platform vs required
    REQUIRED_PLATFORM=$(jq -r '.platform' metadata.json)
    REQUIRED_LANGUAGE=$(jq -r '.language' metadata.json)
    
    echo "⚠️ Platform mismatch fix requires regeneration with correct platform"
    echo "⚠️ Required: $REQUIRED_PLATFORM-$REQUIRED_LANGUAGE"
    echo "⚠️ Please regenerate code with correct platform/language"
    exit 1
    ;;
    
  *)
    echo "❌ Unknown blocker type: $BLOCKER_TYPE"
    echo "Supported types: wrong_region, missing_services, platform_mismatch"
    exit 1
    ;;
esac

