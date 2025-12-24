#!/bin/bash
# Determine the review type based on subject labels
# This script outputs the review type for Claude to use
# Required: GITHUB_OUTPUT environment variable must be set
set -e

echo "🔍 Determining review type..."

SUBJECT_LABELS=$(jq -r '.subject_labels[]?' metadata.json 2>/dev/null || echo "")

if echo "$SUBJECT_LABELS" | grep -q "CI/CD Pipeline"; then
  echo "review_type=cicd-pipeline" >> "$GITHUB_OUTPUT"
  echo "📋 Detected CI/CD Pipeline subject label - will use specialized review criteria"
else
  echo "review_type=iac-standard" >> "$GITHUB_OUTPUT"
  echo "📋 Using standard IaC review criteria"
fi

