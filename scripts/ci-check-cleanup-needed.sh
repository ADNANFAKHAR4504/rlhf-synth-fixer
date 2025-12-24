#!/bin/bash

# Check if cleanup is needed
# Determines if infrastructure cleanup is needed based on subject labels

set -e

SUBJECT_LABELS="${SUBJECT_LABELS:-}"
ANALYSIS_LABEL="${ANALYSIS_LABEL:-}"
CICD_LABEL="${CICD_LABEL:-}"

if echo "$SUBJECT_LABELS" | grep -q "$ANALYSIS_LABEL" || echo "$SUBJECT_LABELS" | grep -q "$CICD_LABEL"; then
  echo "needs_cleanup=false" >> $GITHUB_OUTPUT
  echo "ℹ️ Analysis or CI/CD Pipeline task - no infrastructure to cleanup"
else
  echo "needs_cleanup=true" >> $GITHUB_OUTPUT
  echo "✅ Infrastructure task - cleanup needed"
fi
