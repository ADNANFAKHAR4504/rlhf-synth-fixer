#!/bin/bash
# Shared Task Type Detection Script
# Used by iac-infra-generator and iac-infra-qa-trainer to detect special task types
# Returns: JSON object with task type flags

set -euo pipefail

# Check if metadata.json exists
if [ ! -f "metadata.json" ]; then
    echo "ERROR: metadata.json not found" >&2
    exit 1
fi

# Read metadata fields
SUBTASK=$(jq -r '.subtask // "Unknown"' metadata.json)
PLATFORM=$(jq -r '.platform // "Unknown"' metadata.json)
SUBJECT_LABELS=$(jq -r '.subject_labels[]? // empty' metadata.json)

# Initialize task type flags
IS_CICD_TASK=false
IS_OPTIMIZATION_TASK=false
IS_ANALYSIS_TASK=false
TASK_TYPE="standard"

# Detect CI/CD Pipeline Integration task
if [ "$SUBTASK" = "CI/CD Pipeline Integration" ] || echo "$SUBJECT_LABELS" | grep -q "CI/CD Pipeline"; then
    IS_CICD_TASK=true
    TASK_TYPE="cicd"
fi

# Detect IaC Optimization task
if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
    IS_OPTIMIZATION_TASK=true
    TASK_TYPE="optimization"
fi

# Detect Infrastructure Analysis/QA task
if [ "$SUBTASK" = "Infrastructure QA and Management" ] || [ "$PLATFORM" = "analysis" ]; then
    IS_ANALYSIS_TASK=true
    TASK_TYPE="analysis"
fi

# Output JSON result
cat <<EOF
{
  "task_type": "$TASK_TYPE",
  "is_cicd_task": $IS_CICD_TASK,
  "is_optimization_task": $IS_OPTIMIZATION_TASK,
  "is_analysis_task": $IS_ANALYSIS_TASK,
  "subtask": "$SUBTASK",
  "platform": "$PLATFORM"
}
EOF

