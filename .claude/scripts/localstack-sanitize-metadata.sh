#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Metadata Sanitization Script
# ═══════════════════════════════════════════════════════════════════════════
# Sanitizes metadata.json to comply with the project schema.
# The schema has additionalProperties: false, so invalid fields must be removed.
#
# Usage: ./localstack-sanitize-metadata.sh <path_to_metadata.json>
#
# This script:
#   - Removes fields not allowed by schema
#   - Maps invalid subtask values to valid ones
#   - Maps invalid subject_labels to valid ones
#   - Sets provider to "localstack"
#   - Validates all enum fields
#
# Exit codes:
#   0 - Success
#   1 - Invalid input or failed to sanitize
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/localstack-common.sh"

# Setup error handling
setup_error_handling

# ═══════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path_to_metadata.json>"
  echo ""
  echo "Sanitizes metadata.json for schema compliance."
  exit 1
fi

METADATA_FILE="$1"

if [ ! -f "$METADATA_FILE" ]; then
  log_error "File not found: $METADATA_FILE"
  exit 1
fi

log_info "Sanitizing metadata.json for schema compliance..."

# ═══════════════════════════════════════════════════════════════════════════
# VALID ENUM VALUES (from config/schemas/metadata.schema.json)
# ═══════════════════════════════════════════════════════════════════════════

# Valid subtask values
VALID_SUBTASKS='["Provisioning of Infrastructure Environments","Application Deployment","CI/CD Pipeline Integration","Failure Recovery and High Availability","Security, Compliance, and Governance","IaC Program Optimization","Infrastructure QA and Management"]'

# Valid subject_labels values
VALID_LABELS='["Environment Migration","Cloud Environment Setup","Multi-Environment Consistency","Web Application Deployment","Serverless Infrastructure (Functions as Code)","CI/CD Pipeline","Failure Recovery Automation","Security Configuration as Code","IaC Diagnosis/Edits","IaC Optimization","Infrastructure Analysis/Monitoring","General Infrastructure Tooling QA"]'

# Valid platform values
VALID_PLATFORMS='["cdk","cdktf","cfn","tf","pulumi","analysis","cicd"]'

# Valid language values
VALID_LANGUAGES='["ts","js","py","java","go","hcl","yaml","json","sh","yml"]'

# Valid complexity values
VALID_COMPLEXITIES='["medium","hard","expert"]'

# Valid turn_type values
VALID_TURN_TYPES='["single","multi"]'

# Valid team values
VALID_TEAMS='["2","3","4","5","6","synth","synth-1","synth-2","stf"]'

# ═══════════════════════════════════════════════════════════════════════════
# SANITIZE METADATA
# ═══════════════════════════════════════════════════════════════════════════

# Create backup
cp "$METADATA_FILE" "${METADATA_FILE}.backup"

# Apply comprehensive sanitization with jq
jq --argjson valid_subtasks "$VALID_SUBTASKS" \
   --argjson valid_labels "$VALID_LABELS" \
   --argjson valid_platforms "$VALID_PLATFORMS" \
   --argjson valid_languages "$VALID_LANGUAGES" \
   --argjson valid_complexities "$VALID_COMPLEXITIES" \
   --argjson valid_turn_types "$VALID_TURN_TYPES" \
   --argjson valid_teams "$VALID_TEAMS" '

  # ═══════════════════════════════════════════════════════════════════════
  # MAPPING FUNCTIONS
  # ═══════════════════════════════════════════════════════════════════════
  
  # Map invalid subtask values to valid ones
  def map_subtask:
    if . == null then "Infrastructure QA and Management"
    elif . == "Security and Compliance Implementation" then "Security, Compliance, and Governance"
    elif . == "Security Configuration" then "Security, Compliance, and Governance"
    elif . == "Database Management" then "Provisioning of Infrastructure Environments"
    elif . == "Network Configuration" then "Provisioning of Infrastructure Environments"
    elif . == "Monitoring Setup" then "Infrastructure QA and Management"
    elif . == "Performance Optimization" then "IaC Program Optimization"
    elif . == "Access Control" then "Security, Compliance, and Governance"
    elif . == "Infrastructure Monitoring" then "Infrastructure QA and Management"
    elif . == "Cost Optimization" then "IaC Program Optimization"
    elif . == "Resource Provisioning" then "Provisioning of Infrastructure Environments"
    elif . == "Deployment Automation" then "Application Deployment"
    elif . == "Disaster Recovery" then "Failure Recovery and High Availability"
    elif . == "Container Management" then "Application Deployment"
    elif . == "Serverless Setup" then "Application Deployment"
    elif . == "API Gateway Setup" then "Application Deployment"
    elif . == "Data Pipeline" then "Provisioning of Infrastructure Environments"
    elif . == "Logging and Monitoring" then "Infrastructure QA and Management"
    elif ($valid_subtasks | index(.)) then .
    else "Infrastructure QA and Management"
    end;
  
  # Map invalid subject_label values to valid ones
  def map_label:
    if . == "Security Configuration" then "Security Configuration as Code"
    elif . == "Database Management" then "General Infrastructure Tooling QA"
    elif . == "Network Configuration" then "Cloud Environment Setup"
    elif . == "Access Control" then "Security Configuration as Code"
    elif . == "Monitoring Setup" then "Infrastructure Analysis/Monitoring"
    elif . == "Performance Optimization" then "IaC Optimization"
    elif . == "Cost Management" then "IaC Optimization"
    elif . == "Resource Management" then "General Infrastructure Tooling QA"
    elif . == "Backup Configuration" then "Failure Recovery Automation"
    elif . == "Logging Setup" then "Infrastructure Analysis/Monitoring"
    elif . == "Container Orchestration" then "Web Application Deployment"
    elif . == "API Management" then "Web Application Deployment"
    elif . == "Data Pipeline" then "General Infrastructure Tooling QA"
    elif . == "Storage Configuration" then "Cloud Environment Setup"
    elif . == "Compute Provisioning" then "Cloud Environment Setup"
    elif . == "Serverless" then "Serverless Infrastructure (Functions as Code)"
    elif . == "Lambda" then "Serverless Infrastructure (Functions as Code)"
    elif . == "Container" then "Web Application Deployment"
    elif . == "Kubernetes" then "Web Application Deployment"
    elif . == "ECS" then "Web Application Deployment"
    elif . == "EKS" then "Web Application Deployment"
    else .
    end;
  
  # Validate and fix enum values
  def validate_platform: if ($valid_platforms | index(.)) then . else "cfn" end;
  def validate_language: if ($valid_languages | index(.)) then . else "yaml" end;
  def validate_complexity: if ($valid_complexities | index(.)) then . else "medium" end;
  def validate_turn_type: if ($valid_turn_types | index(.)) then . else "single" end;
  def validate_team: if ($valid_teams | index(.)) then . else "synth" end;
  def validate_started_at: if . == null or . == "" then (now | todate) else . end;
  
  # ═══════════════════════════════════════════════════════════════════════
  # SUBTASK TYPE ENFORCEMENT
  # CRITICAL: subtask MUST be a single string, not an array!
  # ═══════════════════════════════════════════════════════════════════════
  
  def enforce_subtask_string:
    # If subtask is an array, take the first element
    if type == "array" then
      if length > 0 then .[0] | map_subtask
      else "Infrastructure QA and Management"
      end
    # If subtask is a string, validate it
    elif type == "string" then
      . | map_subtask
    # If subtask is null or invalid type, use default
    else
      "Infrastructure QA and Management"
    end;
  
  # ═══════════════════════════════════════════════════════════════════════
  # BUILD SANITIZED OBJECT
  # Only include fields allowed by schema (additionalProperties: false)
  # ═══════════════════════════════════════════════════════════════════════
  
  {
    platform: (.platform | validate_platform),
    language: (.language | validate_language),
    complexity: (.complexity | validate_complexity),
    turn_type: (.turn_type | validate_turn_type),
    po_id: (.po_id // .task_id // "unknown"),
    team: (.team | validate_team),
    startedAt: (.startedAt | validate_started_at),
    subtask: (.subtask | enforce_subtask_string),
    provider: "localstack",
    subject_labels: (
      [.subject_labels[]? | map_label]
      | unique
      | map(select(. as $l | $valid_labels | index($l)))
      | if length == 0 then ["General Infrastructure Tooling QA"] else . end
    ),
    aws_services: (.aws_services // [])
  }
' "$METADATA_FILE" > "${METADATA_FILE}.tmp"

# Validate the result is valid JSON
if ! jq empty "${METADATA_FILE}.tmp" 2>/dev/null; then
  log_error "Sanitization produced invalid JSON"
  mv "${METADATA_FILE}.backup" "$METADATA_FILE"
  rm -f "${METADATA_FILE}.tmp"
  exit 1
fi

# Replace original with sanitized version
mv "${METADATA_FILE}.tmp" "$METADATA_FILE"
rm -f "${METADATA_FILE}.backup"

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

log_success "metadata.json sanitized successfully"

# Show key fields
echo "  Platform:       $(jq -r '.platform' "$METADATA_FILE")"
echo "  Language:       $(jq -r '.language' "$METADATA_FILE")"
echo "  Subtask:        $(jq -r '.subtask' "$METADATA_FILE")"
echo "  Provider:       $(jq -r '.provider' "$METADATA_FILE")"
echo "  Subject Labels: $(jq -r '.subject_labels | length' "$METADATA_FILE") items"
echo ""

