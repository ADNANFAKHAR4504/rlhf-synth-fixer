#!/bin/bash
set -e

echo "🧹 CI/CD Pipeline Cleanup Script"
echo "======================================"

# Delete auto-generated workflow file
echo ""
echo "📋 Cleaning up auto-generated workflow file..."

if [ -f ".github/workflows/multi-stage-pipeline.yml" ]; then
  git config user.name "GitHub Actions Bot"
  git config user.email "actions@github.com"

  git rm .github/workflows/multi-stage-pipeline.yml
  git commit -m "chore: cleanup auto-generated multi-stage-pipeline.yml [skip-jobs]"
  git push origin HEAD

  echo "✅ Auto-generated workflow file deleted"
else
  echo "ℹ️ No auto-generated workflow file to clean up"
fi

echo ""
echo "======================================"
echo "✅ Cleanup completed"
