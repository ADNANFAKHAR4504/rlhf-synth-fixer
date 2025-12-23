#!/bin/bash
# detect-task-type.sh
# Centralized task type detection to prevent inconsistency across Claude reviews
# Outputs one of: cicd-pipeline, analysis, optimization, iac-standard

set -eo pipefail

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
    echo "iac-standard"
    exit 0
fi

# Extract platform and subject_labels
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
SUBTASK=$(jq -r '.subtask // ""' metadata.json 2>/dev/null || echo "")
SUBJECT_LABELS=$(jq -r '.subject_labels[]?' metadata.json 2>/dev/null || echo "")

# CI/CD Pipeline detection
# Matches: platform=cicd OR subject_labels contains "CI/CD Pipeline"
if [ "$PLATFORM" = "cicd" ]; then
    echo "cicd-pipeline"
    exit 0
fi

if echo "$SUBJECT_LABELS" | grep -q "CI/CD Pipeline"; then
    echo "cicd-pipeline"
    exit 0
fi

# Analysis task detection
# Matches: platform=analysis OR subtask="Infrastructure QA and Management" OR subject_labels contains "Infrastructure Analysis"
if [ "$PLATFORM" = "analysis" ]; then
    echo "analysis"
    exit 0
fi

if [ "$SUBTASK" = "Infrastructure QA and Management" ]; then
    echo "analysis"
    exit 0
fi

if echo "$SUBJECT_LABELS" | grep -q "Infrastructure Analysis"; then
    echo "analysis"
    exit 0
fi

if echo "$SUBJECT_LABELS" | grep -q "Infrastructure Monitoring"; then
    echo "analysis"
    exit 0
fi

# Optimization task detection
# Matches: subject_labels contains "IaC Optimization" or "IaC Diagnosis"
if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
    echo "optimization"
    exit 0
fi

if echo "$SUBJECT_LABELS" | grep -q "IaC Diagnosis"; then
    echo "optimization"
    exit 0
fi

# Default to standard IaC review
echo "iac-standard"
