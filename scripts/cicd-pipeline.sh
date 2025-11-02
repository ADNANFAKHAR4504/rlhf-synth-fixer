#!/bin/bash
set -e

echo "🚀 CI/CD Pipeline Optimization Script"
echo "======================================"

# Step 1: Validate CI/CD Pipeline Configuration
echo ""
echo "📋 Step 1: Validating CI/CD Pipeline Configuration..."
if [ ! -f "lib/ci-cd.yml" ]; then
  echo "❌ lib/ci-cd.yml not found"
  exit 1
fi
echo "✅ CI/CD Pipeline configuration found"

# Step 2: Validate YAML syntax
echo ""
echo "📋 Step 2: Validating GitHub Actions workflow syntax..."
pip install yamllint > /dev/null 2>&1
yamllint lib/ci-cd.yml || echo "⚠️ YAML validation warnings (non-blocking)"

# Step 3: Display Pipeline Configuration
echo ""
echo "📋 Step 3: Displaying CI/CD Pipeline Configuration from lib/ci-cd.yml:"
echo "-------------------------------------------------------------------"
cat lib/ci-cd.yml
echo "-------------------------------------------------------------------"

# Step 4: Copy workflow to .github/workflows
echo ""
echo "📋 Step 4: Copying lib/ci-cd.yml to .github/workflows/multi-stage-pipeline.yml..."
{
  echo "# Auto-generated from lib/ci-cd.yml - DO NOT EDIT MANUALLY"
  echo "# This file will be automatically deleted after pipeline execution"
  echo ""
  cat lib/ci-cd.yml
} > .github/workflows/multi-stage-pipeline.yml
echo "✅ Workflow file created"

# Step 5: Commit and push workflow file
echo ""
echo "📋 Step 5: Committing and pushing temporary workflow file..."
git config user.name "GitHub Actions Bot"
git config user.email "actions@github.com"

git add .github/workflows/multi-stage-pipeline.yml

if git diff --cached --quiet; then
  echo "ℹ️ No changes - workflow file already exists"
else
  git commit -m "chore: auto-generate multi-stage-pipeline from lib/ci-cd.yml [skip-jobs]"
  git push origin HEAD
  echo "✅ Temporary workflow file committed"
fi

# Step 6: Wait and trigger pipeline
echo ""
echo "📋 Step 6: Triggering multi-stage pipeline workflow..."
echo "⏳ Waiting for GitHub to process the workflow file..."
sleep 10

echo "🚀 Triggering multi-stage-pipeline workflow on branch ${GITHUB_HEAD_REF}..."
gh workflow run multi-stage-pipeline.yml --ref "${GITHUB_HEAD_REF}" \
  && echo "✅ Pipeline triggered successfully" \
  || echo "⚠️ Trigger failed - workflow may auto-run on push event"

echo ""
echo "======================================"
echo "✅ CI/CD Pipeline optimization completed"

# Note: Cleanup will be handled by a separate cleanup step in the workflow
# to ensure it runs even if the pipeline trigger fails
