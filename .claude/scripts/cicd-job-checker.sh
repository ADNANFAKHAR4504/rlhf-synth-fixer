#!/bin/bash
# CI/CD Job Status Checker and Analyzer
# Fetches CI/CD pipeline status for a PR and creates actionable checklist

# ⚠️ IMPORTANT: Job names must match .github/workflows/ci-cd.yml
# If workflow job names change, update JOB_MAP below
# This script depends on GitHub Actions job naming convention

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
  echo "Usage: $0 <PR_NUMBER>"
  echo ""
  echo "Fetches CI/CD pipeline status for a PR and creates actionable checklist"
  echo ""
  echo "Arguments:"
  echo "  PR_NUMBER    The pull request number to check"
  echo ""
  echo "Example:"
  echo "  $0 1234"
  exit 1
}

# Check arguments
if [ -z "$1" ]; then
  echo -e "${RED}Error: PR number required${NC}"
  usage
fi

PR_NUMBER="$1"

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
  echo -e "${RED}Error: GitHub CLI not authenticated${NC}"
  echo "Run: gh auth login"
  exit 1
fi

echo -e "${BLUE}📋 Fetching CI/CD pipeline status for PR #${PR_NUMBER}...${NC}"
echo ""

# Get all workflow runs for this PR
gh pr checks "${PR_NUMBER}" --json name,state,conclusion,detailsUrl > ci_checks.json

if [ ! -s ci_checks.json ]; then
  echo -e "${YELLOW}Warning: No CI/CD checks found for PR #${PR_NUMBER}${NC}"
  exit 0
fi

# Define all expected jobs based on ci-cd.yml
declare -A JOB_MAP=(
  ["Detect Project Files"]="detect-metadata"
  ["Validate Commit Message"]="validate-commit-message"
  ["Build"]="build"
  ["Synth"]="synth"
  ["Lint"]="lint"
  ["Unit Testing"]="unit-tests"
  ["Deploy"]="deploy"
  ["Integration Tests (Live)"]="integration-tests-live"
  ["Analysis"]="analysis"
  ["CICD Pipeline Optimization"]="cicd-pipeline-optimization"
  ["IaC Optimization"]="iac-optimization"
  ["Claude Review"]="claude-code-action"
  ["Cleanup (Destroy Resources)"]="cleanup"
  ["Archive Folders and Reset Repository"]="archive-folders"
)

# CI/CD Job → Local Validation mapping
declare -A CICD_TO_LOCAL=(
  ["detect-metadata"]="Checkpoint A: Metadata Completeness"
  ["validate-commit-message"]="Commit Message Format Validation"
  ["build"]="Checkpoint G: Build Quality (lint + build)"
  ["synth"]="Checkpoint G: Build Quality (synth)"
  ["lint"]="Checkpoint G: Build Quality (lint)"
  ["unit-tests"]="Checkpoint H: Test Coverage (100%)"
  ["deploy"]="Deployment Success"
  ["integration-tests-live"]="Checkpoint I: Integration Test Quality"
  ["claude-code-action"]="Checkpoint J: Training Quality (>= 8)"
)

# Create checklist output
echo "## CI/CD Pipeline Checklist for PR #${PR_NUMBER}"
echo ""

# Initialize counters
TOTAL_JOBS=0
PASSED_JOBS=0
FAILED_JOBS=0
SKIPPED_JOBS=0
PENDING_JOBS=0
IN_PROGRESS_JOBS=0

# Clear previous failed jobs file
> failed_jobs.txt
> priority_validations.txt

# Iterate through all jobs
for job_name in "${!JOB_MAP[@]}"; do
  job_id="${JOB_MAP[$job_name]}"
  TOTAL_JOBS=$((TOTAL_JOBS + 1))

  # Extract status from ci_checks.json
  STATUS=$(jq -r ".[] | select(.name == \"$job_name\") | .conclusion // \"null\"" ci_checks.json 2>/dev/null)
  STATE=$(jq -r ".[] | select(.name == \"$job_name\") | .state // \"null\"" ci_checks.json 2>/dev/null)
  DETAILS_URL=$(jq -r ".[] | select(.name == \"$job_name\") | .detailsUrl // \"\"" ci_checks.json 2>/dev/null)

  # Determine icon and status text based on status
  if [ "$STATUS" == "success" ]; then
    ICON="${GREEN}✅${NC}"
    STATUS_TEXT="${GREEN}PASSED${NC}"
    PASSED_JOBS=$((PASSED_JOBS + 1))
  elif [ "$STATUS" == "failure" ]; then
    ICON="${RED}❌${NC}"
    STATUS_TEXT="${RED}FAILED${NC}"
    FAILED_JOBS=$((FAILED_JOBS + 1))
    # Store failed job for detailed analysis
    echo "${job_id}|${job_name}|${DETAILS_URL}" >> failed_jobs.txt
    # Map to local validation
    LOCAL_CHECK="${CICD_TO_LOCAL[$job_id]}"
    if [ -n "$LOCAL_CHECK" ]; then
      echo "${LOCAL_CHECK}|${job_id}" >> priority_validations.txt
    fi
  elif [ "$STATUS" == "skipped" ] || [ "$STATUS" == "cancelled" ]; then
    ICON="${YELLOW}⏭️${NC}"
    STATUS_TEXT="${YELLOW}SKIPPED${NC}"
    SKIPPED_JOBS=$((SKIPPED_JOBS + 1))
  elif [ "$STATE" == "in_progress" ]; then
    ICON="${BLUE}🔄${NC}"
    STATUS_TEXT="${BLUE}IN_PROGRESS${NC}"
    IN_PROGRESS_JOBS=$((IN_PROGRESS_JOBS + 1))
  elif [ "$STATE" == "queued" ]; then
    ICON="${YELLOW}⏳${NC}"
    STATUS_TEXT="${YELLOW}QUEUED${NC}"
    PENDING_JOBS=$((PENDING_JOBS + 1))
  else
    ICON="⏸️"
    STATUS_TEXT="PENDING"
    PENDING_JOBS=$((PENDING_JOBS + 1))
  fi

  echo -e "${ICON} **${job_name}**: ${STATUS_TEXT}"
done

echo ""
echo -e "${BLUE}📊 Pipeline Status Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total Jobs:        ${TOTAL_JOBS}"
echo -e "${GREEN}Passed:            ${PASSED_JOBS}${NC}"
echo -e "${RED}Failed:            ${FAILED_JOBS}${NC}"
echo -e "${YELLOW}Skipped:           ${SKIPPED_JOBS}${NC}"
echo -e "${BLUE}In Progress:       ${IN_PROGRESS_JOBS}${NC}"
echo -e "Pending:           ${PENDING_JOBS}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Analyze failed jobs if any
if [ -s failed_jobs.txt ]; then
  echo ""
  echo -e "${RED}🔍 Failed Jobs Analysis${NC}"
  echo ""

  while IFS='|' read -r job_id job_name details_url; do
    echo -e "${RED}### ❌ ${job_name}${NC}"
    echo "Job ID: ${job_id}"
    echo "Details: ${details_url}"

    # Map to local validation
    LOCAL_CHECK="${CICD_TO_LOCAL[$job_id]}"
    if [ -n "$LOCAL_CHECK" ]; then
      echo -e "${YELLOW}→ Local Validation: ${LOCAL_CHECK}${NC}"
    fi

    # Try to fetch failure logs
    if [ -n "$details_url" ]; then
      RUN_ID=$(echo "${details_url}" | grep -oP 'runs/\K[0-9]+' || echo "")

      if [ -n "$RUN_ID" ]; then
        echo "Fetching failure details..."
        LOG_FILE="${job_id}_failure.log"

        if gh run view "${RUN_ID}" --log-failed > "${LOG_FILE}" 2>&1; then
          # Parse common failure patterns
          if grep -q "Error: " "${LOG_FILE}"; then
            echo -e "${YELLOW}Failure Reason:${NC}"
            grep "Error: " "${LOG_FILE}" | head -5
          fi

          if grep -q "FAILED" "${LOG_FILE}"; then
            echo -e "${YELLOW}Test Failures:${NC}"
            grep "FAILED" "${LOG_FILE}" | head -5
          fi

          if grep -q "AssertionError" "${LOG_FILE}"; then
            echo -e "${YELLOW}Assertion Errors:${NC}"
            grep -A 2 "AssertionError" "${LOG_FILE}" | head -10
          fi
        else
          echo "Could not fetch failure logs"
        fi
      fi
    fi

    echo ""
  done < failed_jobs.txt

  echo ""
  echo -e "${YELLOW}📋 Priority Validations to Run Locally${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ -s priority_validations.txt ]; then
    cat priority_validations.txt | while IFS='|' read -r local_check job_id; do
      echo -e "• ${local_check}"
    done
  else
    echo "No priority validations identified"
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Generate fix recommendations
echo ""
echo -e "${BLUE}💡 Recommended Actions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${FAILED_JOBS} -eq 0 ] && [ ${IN_PROGRESS_JOBS} -eq 0 ] && [ ${PENDING_JOBS} -eq 0 ]; then
  echo -e "${GREEN}✅ All CI/CD jobs passed! PR is ready for merge.${NC}"
elif [ ${IN_PROGRESS_JOBS} -gt 0 ]; then
  echo -e "${BLUE}⏳ ${IN_PROGRESS_JOBS} job(s) still in progress. Wait for completion.${NC}"
elif [ ${FAILED_JOBS} -gt 0 ]; then
  echo -e "${RED}❌ ${FAILED_JOBS} job(s) failed. Run /task-fix ${PR_NUMBER} to automatically fix issues.${NC}"
  echo ""
  echo "Or manually:"
  echo "1. Review failed job logs above"
  echo "2. Run priority validations locally (see list above)"
  echo "3. Fix identified issues in lib/, bin/, or test/ directories"
  echo "4. Commit and push changes"
  echo "5. CI/CD will automatically re-run"
else
  echo "⏸️ Some jobs are pending. They may start once dependencies complete."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Output summary for programmatic use
echo ""
echo -e "${BLUE}📄 Summary (JSON)${NC}"
jq -n \
  --arg total "${TOTAL_JOBS}" \
  --arg passed "${PASSED_JOBS}" \
  --arg failed "${FAILED_JOBS}" \
  --arg skipped "${SKIPPED_JOBS}" \
  --arg in_progress "${IN_PROGRESS_JOBS}" \
  --arg pending "${PENDING_JOBS}" \
  '{
    total: ($total | tonumber),
    passed: ($passed | tonumber),
    failed: ($failed | tonumber),
    skipped: ($skipped | tonumber),
    in_progress: ($in_progress | tonumber),
    pending: ($pending | tonumber),
    ready_for_merge: (($failed | tonumber) == 0 and ($in_progress | tonumber) == 0 and ($pending | tonumber) == 0)
  }' > cicd_summary.json

cat cicd_summary.json

echo ""
echo -e "${GREEN}✅ CI/CD status check complete${NC}"
echo ""
echo "Output files created:"
echo "  - ci_checks.json          (raw CI/CD check data)"
echo "  - cicd_summary.json       (summary statistics)"
echo "  - failed_jobs.txt         (list of failed jobs)"
echo "  - priority_validations.txt (local validations to run)"
echo "  - *_failure.log           (failure logs per job)"
