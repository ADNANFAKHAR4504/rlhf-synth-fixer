#!/bin/bash
# Create metadata.json and PROMPT.md for a task
# Pure shell - no Python or jq dependencies

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log_info() { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }

# Extract JSON value (simple extraction, no jq needed)
json_val() {
    local json="$1" key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

# Usage check
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <task_json_or_task_id> [output_dir]"
    echo "  task_json_or_task_id: Either JSON string or task ID" >&2
    echo "  output_dir: Output directory (default: current dir)" >&2
    exit 1
fi

INPUT="$1"
OUTPUT_DIR="${2:-.}"

# Check if input is a task ID or JSON
if [[ "$INPUT" =~ ^\{.*\}$ ]]; then
    # Input is JSON
    TASK_JSON="$INPUT"
elif [ -f "$INPUT" ]; then
    # Input is a file
    TASK_JSON=$(cat "$INPUT")
else
    # Input is a task ID - fetch from CSV
    TASK_JSON=$(./scripts/task-manager.sh get "$INPUT")
fi

# Extract fields using grep (no jq dependency)
TASK_ID=$(json_val "$TASK_JSON" "task_id")
PLATFORM=$(json_val "$TASK_JSON" "platform" | tr '[:upper:]' '[:lower:]')
LANGUAGE=$(json_val "$TASK_JSON" "language" | tr '[:upper:]' '[:lower:]')
DIFFICULTY=$(json_val "$TASK_JSON" "difficulty" | tr '[:upper:]' '[:lower:]')
SUBTASK=$(json_val "$TASK_JSON" "subtask")

# Map difficulty to complexity
case "$DIFFICULTY" in
    easy) COMPLEXITY="simple" ;;
    medium) COMPLEXITY="moderate" ;;
    hard|expert) COMPLEXITY="complex" ;;
    *) COMPLEXITY="moderate" ;;
esac

# Get timestamp
STARTED_AT=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)

# Extract subject_labels (handle array format)
SUBJECT_LABELS=$(echo "$TASK_JSON" | grep -o '"subject_labels":\[[^\]]*\]' | cut -d':' -f2)
[ -z "$SUBJECT_LABELS" ] && SUBJECT_LABELS='[]'

# Create metadata.json
METADATA_FILE="$OUTPUT_DIR/metadata.json"
cat > "$METADATA_FILE" <<EOF
{
  "platform": "$PLATFORM",
  "language": "$LANGUAGE",
  "complexity": "$COMPLEXITY",
  "team": "synth",
  "startedAt": "$STARTED_AT",
  "subtask": "$SUBTASK",
  "subject_labels": $SUBJECT_LABELS,
  "po_id": "$TASK_ID",
  "aws_services": [],
  "region": "ap-southeast-1"
}
EOF

log_info "Created metadata.json"

# Create PROMPT.md (extract additional fields if available)
BACKGROUND=$(json_val "$TASK_JSON" "background")
PROBLEM=$(json_val "$TASK_JSON" "problem")
CONSTRAINTS=$(json_val "$TASK_JSON" "constraints")

PROMPT_FILE="$OUTPUT_DIR/PROMPT.md"
cat > "$PROMPT_FILE" <<EOF
# Infrastructure Task: $SUBTASK

## Platform and Language
**This task MUST be implemented using $PLATFORM with $LANGUAGE.**

## Background
${BACKGROUND:-Infrastructure as Code task}

## Problem Statement
${PROBLEM:-Implement the infrastructure requirements using $PLATFORM and $LANGUAGE.}

## Technical Requirements

### Environment Setup
- AWS credentials with appropriate permissions
- $PLATFORM CLI tools installed
- $LANGUAGE runtime/SDK configured

### Core Infrastructure Components
- Define infrastructure as code
- Follow $PLATFORM best practices
- Use $LANGUAGE for implementation

### Security and Compliance Constraints
${CONSTRAINTS:-Follow AWS security best practices}

## Implementation Guidelines

### Platform: $PLATFORM
- Use $PLATFORM IaC framework
- All code must be written in $LANGUAGE
- Follow $PLATFORM best practices for resource organization
- Ensure all resources use the environmentSuffix variable for naming

### AWS Best Practices
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately for cost tracking and compliance

### Testing Requirements
- Unit tests must achieve 90%+ code coverage
- Integration tests must validate end-to-end workflows
- Tests should use actual deployed resources, not mocks
- Load test outputs from cfn-outputs/flat-outputs.json

### Documentation
- Document all architectural decisions
- Include deployment instructions
- Document any assumptions made
- Include rollback procedures

## Deliverables

1. Complete $PLATFORM infrastructure code in $LANGUAGE
2. Unit tests with 90%+ coverage
3. Integration tests for deployed infrastructure
4. README with deployment and testing instructions
5. All resources must be destroyable (no DeletionPolicy: Retain)

## Success Criteria

- Infrastructure deploys successfully in ap-southeast-1 region
- All security constraints are met
- All tests pass with required coverage
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed without manual intervention
EOF

log_info "Created PROMPT.md"

# Validate metadata
REQUIRED=("platform" "language" "complexity" "team" "startedAt" "subtask" "po_id")
MISSING=()

for field in "${REQUIRED[@]}"; do
    if ! grep -q "\"$field\":" "$METADATA_FILE"; then
        MISSING+=("$field")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    log_error "Missing required fields: ${MISSING[*]}"
    exit 1
fi

log_info "All required fields present"
echo "Task ID: $TASK_ID" >&2
echo "Platform: $PLATFORM-$LANGUAGE" >&2
echo "Complexity: $COMPLEXITY" >&2
