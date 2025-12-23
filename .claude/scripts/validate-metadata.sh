#!/bin/bash
# Validate metadata.json for synthetic task generation
# Ensures all fields meet strict requirements to prevent Claude hallucinations

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}" >&2; }

# Usage
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <metadata.json>"
    exit 1
fi

METADATA_FILE="$1"

if [ ! -f "$METADATA_FILE" ]; then
    log_error "Metadata file not found: $METADATA_FILE"
    exit 1
fi

ERRORS=0

# Check if jq is available
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    exit 1
fi

log_info "Validating metadata.json..."

# 1. Check required fields
REQUIRED_FIELDS=("platform" "language" "complexity" "turn_type" "po_id" "team" "startedAt" "subtask")
for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e ".$field" "$METADATA_FILE" > /dev/null 2>&1; then
        log_error "Missing required field: $field"
        ((ERRORS++))
    fi
done

# 2. Validate platform
PLATFORM=$(jq -r '.platform // empty' "$METADATA_FILE")
if [ -n "$PLATFORM" ]; then
    if [[ ! "$PLATFORM" =~ ^(cdk|cdktf|cfn|tf|pulumi|cicd|analysis)$ ]]; then
        log_error "Invalid platform: '$PLATFORM' (must be: cdk, cdktf, cfn, tf, pulumi, cicd, or analysis)"
        ((ERRORS++))
    else
        log_info "Platform: $PLATFORM"
    fi
fi

# 3. Validate language
LANGUAGE=$(jq -r '.language // empty' "$METADATA_FILE")
if [ -n "$LANGUAGE" ]; then
    if [[ ! "$LANGUAGE" =~ ^(ts|py|js|go|java|hcl|yaml|json|yml)$ ]]; then
        log_error "Invalid language: '$LANGUAGE' (must be: ts, py, js, go, java, hcl, yaml, json, or yml)"
        ((ERRORS++))
    else
        log_info "Language: $LANGUAGE"
    fi
fi

# 4. Validate platform-language compatibility
if [ -n "$PLATFORM" ] && [ -n "$LANGUAGE" ]; then
    case "$PLATFORM" in
        cdk)
            if [[ ! "$LANGUAGE" =~ ^(ts|js|py|java|go)$ ]]; then
                log_error "Invalid platform-language combination: cdk-$LANGUAGE (cdk supports: ts, js, py, java, go)"
                ((ERRORS++))
            fi
            ;;
        cdktf)
            if [[ ! "$LANGUAGE" =~ ^(ts|py|go|java)$ ]]; then
                log_error "Invalid platform-language combination: cdktf-$LANGUAGE (cdktf supports: ts, py, go, java)"
                ((ERRORS++))
            fi
            ;;
        pulumi)
            if [[ ! "$LANGUAGE" =~ ^(ts|js|py|go|java)$ ]]; then
                log_error "Invalid platform-language combination: pulumi-$LANGUAGE (pulumi supports: ts, js, py, go, java)"
                ((ERRORS++))
            fi
            ;;
        tf)
            if [ "$LANGUAGE" != "hcl" ]; then
                log_error "Invalid platform-language combination: tf-$LANGUAGE (tf requires: hcl)"
                ((ERRORS++))
            fi
            ;;
        cfn)
            if [[ ! "$LANGUAGE" =~ ^(yaml|json|yml)$ ]]; then
                log_error "Invalid platform-language combination: cfn-$LANGUAGE (cfn supports: yaml, json, yml)"
                ((ERRORS++))
            fi
            ;;
        cicd)
            if [[ ! "$LANGUAGE" =~ ^(yaml|yml)$ ]]; then
                log_error "Invalid platform-language combination: cicd-$LANGUAGE (cicd supports: yaml, yml)"
                ((ERRORS++))
            fi
            ;;
        analysis)
            if [ "$LANGUAGE" != "py" ]; then
                log_error "Invalid platform-language combination: analysis-$LANGUAGE (analysis supports: py)"
                ((ERRORS++))
            fi
            ;;
    esac

    if [ $ERRORS -eq 0 ]; then
        log_info "Platform-language compatibility: Valid ($PLATFORM-$LANGUAGE)"
    fi
fi

# 5. Validate complexity
COMPLEXITY=$(jq -r '.complexity // empty' "$METADATA_FILE")
if [ -n "$COMPLEXITY" ]; then
    if [[ ! "$COMPLEXITY" =~ ^(medium|hard|expert)$ ]]; then
        log_error "Invalid complexity: '$COMPLEXITY' (must be: medium, hard, or expert)"
        ((ERRORS++))
    else
        log_info "Complexity: $COMPLEXITY"
    fi
fi

# 6. Validate subtask
SUBTASK=$(jq -r '.subtask // empty' "$METADATA_FILE")
if [ -n "$SUBTASK" ]; then
    VALID_SUBTASKS=(
        "Provisioning of Infrastructure Environments"
        "Application Deployment"
        "CI/CD Pipeline Integration"
        "Failure Recovery and High Availability"
        "Security, Compliance, and Governance"
        "IaC Program Optimization"
        "Infrastructure QA and Management"
    )

    subtask_valid=false
    for valid in "${VALID_SUBTASKS[@]}"; do
        if [ "$SUBTASK" == "$valid" ]; then
            subtask_valid=true
            break
        fi
    done

    if [ "$subtask_valid" = false ]; then
        log_error "Invalid subtask: '$SUBTASK'"
        log_warn "Valid subtasks are:"
        for valid in "${VALID_SUBTASKS[@]}"; do
            echo "    - $valid" >&2
        done
        ((ERRORS++))
    else
        log_info "Subtask: $SUBTASK"
    fi
fi

# 7. Validate aws_services is array (not string)
if jq -e '.aws_services' "$METADATA_FILE" > /dev/null 2>&1; then
    AWS_SERVICES_TYPE=$(jq -r '.aws_services | type' "$METADATA_FILE")
    if [ "$AWS_SERVICES_TYPE" != "array" ]; then
        log_error "aws_services must be an array, got: $AWS_SERVICES_TYPE"
        log_warn "Example: \"aws_services\": [\"S3\", \"Lambda\", \"DynamoDB\"]"
        ((ERRORS++))
    else
        AWS_SERVICES_COUNT=$(jq '.aws_services | length' "$METADATA_FILE")
        log_info "aws_services: array with $AWS_SERVICES_COUNT items"
    fi
fi

# 8. Validate subject_labels is array (not string)
if jq -e '.subject_labels' "$METADATA_FILE" > /dev/null 2>&1; then
    SUBJECT_LABELS_TYPE=$(jq -r '.subject_labels | type' "$METADATA_FILE")
    if [ "$SUBJECT_LABELS_TYPE" != "array" ]; then
        log_error "subject_labels must be an array, got: $SUBJECT_LABELS_TYPE"
        log_warn "Example: \"subject_labels\": [\"Cloud Environment Setup\"]"
        ((ERRORS++))
    else
        SUBJECT_LABELS_COUNT=$(jq '.subject_labels | length' "$METADATA_FILE")
        log_info "subject_labels: array with $SUBJECT_LABELS_COUNT items"
    fi
else
    log_error "Missing required field: subject_labels"
    ((ERRORS++))
fi

# 8a. Validate subject_labels values against reference file
REFERENCE_FILE=".claude/docs/references/iac-subtasks-subject-labels.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFERENCE_FILE_ALT="$SCRIPT_DIR/../docs/references/iac-subtasks-subject-labels.json"

# Try to find reference file
if [ -f "$REFERENCE_FILE" ]; then
    REFERENCE_PATH="$REFERENCE_FILE"
elif [ -f "$REFERENCE_FILE_ALT" ]; then
    REFERENCE_PATH="$REFERENCE_FILE_ALT"
else
    REFERENCE_PATH=""
fi

if [ -n "$REFERENCE_PATH" ] && jq -e '.subject_labels' "$METADATA_FILE" > /dev/null 2>&1; then
    METADATA_SUBTASK=$(jq -r '.subtask // empty' "$METADATA_FILE")
    
    if [ -n "$METADATA_SUBTASK" ]; then
        # Get valid labels for this subtask from reference file
        VALID_LABELS=$(jq -r --arg subtask "$METADATA_SUBTASK" '
            .iac_subtasks_and_subject_labels[] | 
            select(.subtask == $subtask) | 
            .subject_labels[]
        ' "$REFERENCE_PATH" 2>/dev/null)
        
        if [ -n "$VALID_LABELS" ]; then
            # Check each subject_label in metadata.json
            METADATA_SUBJECT_LABELS=$(jq -r '.subject_labels[]?' "$METADATA_FILE" 2>/dev/null)
            
            if [ -n "$METADATA_SUBJECT_LABELS" ]; then
                ALL_LABELS_VALID=true
                INVALID_LABELS=()
                
                while IFS= read -r label; do
                    if [ -n "$label" ]; then
                        LABEL_VALID=false
                        while IFS= read -r valid_label; do
                            if [ "$label" = "$valid_label" ]; then
                                LABEL_VALID=true
                                break
                            fi
                        done <<< "$VALID_LABELS"
                        
                        if [ "$LABEL_VALID" = false ]; then
                            ALL_LABELS_VALID=false
                            INVALID_LABELS+=("$label")
                        fi
                    fi
                done <<< "$METADATA_SUBJECT_LABELS"
                
                if [ "$ALL_LABELS_VALID" = false ]; then
                    for invalid_label in "${INVALID_LABELS[@]}"; do
                        log_error "Invalid subject_label: '$invalid_label' for subtask '$METADATA_SUBTASK'"
                    done
                    log_warn "Valid subject_labels for subtask '$METADATA_SUBTASK' are:"
                    while IFS= read -r valid_label; do
                        if [ -n "$valid_label" ]; then
                            echo "    - $valid_label" >&2
                        fi
                    done <<< "$VALID_LABELS"
                    ((ERRORS++))
                else
                    log_info "subject_labels validation: All labels are valid for subtask '$METADATA_SUBTASK'"
                fi
            fi
        else
            log_warn "Could not find valid subject_labels for subtask: '$METADATA_SUBTASK' in reference file"
        fi
    fi
elif [ -z "$REFERENCE_PATH" ]; then
    log_error "Reference file not found: $REFERENCE_FILE - subject_labels cannot be validated"
    log_warn "Ensure the reference file exists at: .claude/docs/references/iac-subtasks-subject-labels.json"
    ((ERRORS++))
fi

# 8c. Validate subject_label to platform/language requirements
# Some subject labels have STRICT platform/language requirements
# Reference: .claude/docs/references/iac-subtasks-subject-labels.json (single source of truth)
if jq -e '.subject_labels' "$METADATA_FILE" > /dev/null 2>&1; then
    METADATA_SUBJECT_LABELS=$(jq -r '.subject_labels[]?' "$METADATA_FILE" 2>/dev/null)
    
    if [ -n "$METADATA_SUBJECT_LABELS" ]; then
        while IFS= read -r label; do
            if [ -n "$label" ]; then
                case "$label" in
                    "Infrastructure Analysis/Monitoring")
                        # This MUST use analysis platform with py language
                        if [ "$PLATFORM" != "analysis" ]; then
                            log_error "Subject label '$label' requires platform='analysis', but got '$PLATFORM'"
                            log_warn "Analysis tasks use Python scripts with boto3, not IaC platforms"
                            ((ERRORS++))
                        fi
                        if [ "$LANGUAGE" != "py" ]; then
                            log_error "Subject label '$label' requires language='py', but got '$LANGUAGE'"
                            log_warn "Analysis tasks only support Python (py) currently"
                            ((ERRORS++))
                        fi
                        ;;
                    "General Infrastructure Tooling QA")
                        # This MUST use analysis platform with py or sh language
                        if [ "$PLATFORM" != "analysis" ]; then
                            log_error "Subject label '$label' requires platform='analysis', but got '$PLATFORM'"
                            log_warn "QA tasks use Python/shell scripts, not IaC platforms"
                            ((ERRORS++))
                        fi
                        if [[ ! "$LANGUAGE" =~ ^(py|sh)$ ]]; then
                            log_error "Subject label '$label' requires language='py' or 'sh', but got '$LANGUAGE'"
                            ((ERRORS++))
                        fi
                        ;;
                    "CI/CD Pipeline")
                        # This MUST use cicd platform with yaml/yml language
                        if [ "$PLATFORM" != "cicd" ]; then
                            log_error "Subject label '$label' requires platform='cicd', but got '$PLATFORM'"
                            log_warn "CI/CD tasks use GitHub Actions workflows, not IaC platforms"
                            ((ERRORS++))
                        fi
                        if [[ ! "$LANGUAGE" =~ ^(yaml|yml)$ ]]; then
                            log_error "Subject label '$label' requires language='yaml' or 'yml', but got '$LANGUAGE'"
                            ((ERRORS++))
                        fi
                        ;;
                esac
            fi
        done <<< "$METADATA_SUBJECT_LABELS"
        
        # Log success if special labels validated correctly
        if echo "$METADATA_SUBJECT_LABELS" | grep -qE "(Infrastructure Analysis/Monitoring|General Infrastructure Tooling QA|CI/CD Pipeline)"; then
            if [ $ERRORS -eq 0 ] || ! echo "$METADATA_SUBJECT_LABELS" | grep -qE "(Infrastructure Analysis/Monitoring|General Infrastructure Tooling QA|CI/CD Pipeline)"; then
                log_info "Subject label platform/language requirements: Valid"
            fi
        fi
    fi
fi

# 8d. Validate that special platforms (analysis, cicd) are ONLY used with their required subject_labels
# This is the REVERSE check - ensures analysis/cicd platforms aren't used with standard IaC subject_labels
if [ "$PLATFORM" = "analysis" ]; then
    HAS_VALID_ANALYSIS_LABEL=false
    if [ -n "$METADATA_SUBJECT_LABELS" ]; then
        while IFS= read -r label; do
            if [[ "$label" == "Infrastructure Analysis/Monitoring" || "$label" == "General Infrastructure Tooling QA" ]]; then
                HAS_VALID_ANALYSIS_LABEL=true
                break
            fi
        done <<< "$METADATA_SUBJECT_LABELS"
    fi
    
    if [ "$HAS_VALID_ANALYSIS_LABEL" = false ]; then
        log_error "Platform 'analysis' can only be used with subject_labels: 'Infrastructure Analysis/Monitoring' or 'General Infrastructure Tooling QA'"
        log_warn "Current subject_labels: $(jq -c '.subject_labels' "$METADATA_FILE")"
        ((ERRORS++))
    fi
fi

if [ "$PLATFORM" = "cicd" ]; then
    HAS_VALID_CICD_LABEL=false
    if [ -n "$METADATA_SUBJECT_LABELS" ]; then
        while IFS= read -r label; do
            if [[ "$label" == "CI/CD Pipeline" ]]; then
                HAS_VALID_CICD_LABEL=true
                break
            fi
        done <<< "$METADATA_SUBJECT_LABELS"
    fi
    
    if [ "$HAS_VALID_CICD_LABEL" = false ]; then
        log_error "Platform 'cicd' can only be used with subject_label: 'CI/CD Pipeline'"
        log_warn "Current subject_labels: $(jq -c '.subject_labels' "$METADATA_FILE")"
        ((ERRORS++))
    fi
fi

# 9. Validate region format (if present)
if jq -e '.region' "$METADATA_FILE" > /dev/null 2>&1; then
    REGION=$(jq -r '.region // empty' "$METADATA_FILE")
    if [ -n "$REGION" ]; then
        if [[ ! "$REGION" =~ ^(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]+$ ]]; then
            log_error "Invalid region format: '$REGION' (must match: xx-xxxx-N)"
            ((ERRORS++))
        else
            log_info "Region: $REGION"
        fi
    fi
fi

# 10. Validate turn_type
TURN_TYPE=$(jq -r '.turn_type // empty' "$METADATA_FILE")
if [ -n "$TURN_TYPE" ]; then
    if [[ ! "$TURN_TYPE" =~ ^(single|multi)$ ]]; then
        log_error "Invalid turn_type: '$TURN_TYPE' (must be: single or multi)"
        ((ERRORS++))
    else
        log_info "Turn type: $TURN_TYPE"
    fi
fi

# 11. Validate team
TEAM=$(jq -r '.team // empty' "$METADATA_FILE")
if [ -n "$TEAM" ]; then
    if [[ ! "$TEAM" =~ ^(1|2|3|4|5|6|synth|synth-[0-9]+|stf)$ ]]; then
        log_error "Invalid team: '$TEAM' (must be: 1-6, synth, synth-N (where N is a number), or stf)"
        ((ERRORS++))
    else
        log_info "Team: $TEAM"
    fi
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    log_info "Metadata validation PASSED - all checks successful"
    exit 0
else
    log_error "Metadata validation FAILED with $ERRORS error(s)"
    log_warn "Please review .claude/docs/references/metadata-requirements.md for detailed requirements"
    exit 1
fi
