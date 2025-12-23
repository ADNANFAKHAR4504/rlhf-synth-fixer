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
    # Handle multiline JSON and spaces around colons
    echo "$json" | tr -d '\n' | grep -oE "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*: *"\([^"]*\)".*/\1/'
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

# Convert CSV line to JSON
csv_to_json() {
    local csv_line="$1"
    
    # Remove carriage returns
    csv_line=$(echo "$csv_line" | tr -d '\r')
    
    # Parse CSV using awk (handles quoted fields)
    echo "$csv_line" | awk -F',' '
    function parse_csv_line(line, fields,    n, i, current, in_quote, c) {
        n = 0
        current = ""
        in_quote = 0
        
        for (i = 1; i <= length(line); i++) {
            c = substr(line, i, 1)
            
            if (c == "\"") {
                in_quote = !in_quote
            } else if (c == "," && !in_quote) {
                fields[++n] = current
                current = ""
            } else {
                current = current c
            }
        }
        fields[++n] = current
        return n
    }
    
    {
        n = parse_csv_line($0, fields)

        # CSV header: task_id,status,platform,language,difficulty,subtask,subject_labels,problem,background,environment,constraints
        task_id = fields[1]
        status = fields[2]
        platform = fields[3]
        language = fields[4]
        difficulty = fields[5]
        subtask = fields[6]
        subject_labels = fields[7]
        problem = fields[8]
        background = fields[9]
        environment = fields[10]
        constraints = fields[11]
        
        # Clean quotes from fields (but preserve JSON array format for subject_labels)
        gsub(/^"|"$/, "", task_id)
        gsub(/^"|"$/, "", status)
        gsub(/^"|"$/, "", platform)
        gsub(/^"|"$/, "", difficulty)
        gsub(/^"|"$/, "", subtask)
        gsub(/^"|"$/, "", background)
        gsub(/^"|"$/, "", problem)
        gsub(/^"|"$/, "", language)
        gsub(/^"|"$/, "", environment)
        gsub(/^"|"$/, "", constraints)
        
        # For subject_labels, preserve JSON array format if present
        # Remove outer quotes but keep inner structure
        if (subject_labels ~ /^\[.*\]$/) {
            # Already a JSON array, just remove outer quotes if present
            gsub(/^"|"$/, "", subject_labels)
        } else if (subject_labels == "") {
            # Empty, set to empty array
            subject_labels = "[]"
        } else {
            # Not empty but not a JSON array - might be a string that needs conversion
            # Remove outer quotes and check if it needs to be wrapped in array
            gsub(/^"|"$/, "", subject_labels)
            if (subject_labels !~ /^\[.*\]$/) {
                # Not a JSON array, wrap it as a single-element array
                gsub(/"/, "\\\"", subject_labels)
                subject_labels = "[\"" subject_labels "\"]"
            }
        }
        
        # Escape quotes in string values for JSON
        gsub(/"/, "\\\"", background)
        gsub(/"/, "\\\"", problem)
        gsub(/"/, "\\\"", constraints)
        gsub(/"/, "\\\"", environment)
        
        printf "{\"task_id\":\"%s\",\"status\":\"%s\",\"platform\":\"%s\",\"difficulty\":\"%s\",\"subtask\":\"%s\",\"background\":\"%s\",\"problem\":\"%s\",\"language\":\"%s\",\"environment\":\"%s\",\"constraints\":\"%s\",\"subject_labels\":%s}\n",
               task_id, status, platform, difficulty, subtask, background, problem, language, environment, constraints, subject_labels
    }'
}

# Check if input is a task ID or JSON
if [[ "$INPUT" =~ ^\{.*\}$ ]]; then
    # Input is JSON
    TASK_JSON="$INPUT"
elif [ -f "$INPUT" ]; then
    # Input is a file
    TASK_JSON=$(cat "$INPUT")
else
    # Input is a task ID - fetch from CSV and convert to JSON
    CSV_LINE=$(./.claude/scripts/task-manager.sh get "$INPUT")
    if [ -z "$CSV_LINE" ]; then
        log_error "Task $INPUT not found"
        exit 1
    fi
    TASK_JSON=$(csv_to_json "$CSV_LINE")
fi

# Extract fields using grep (no jq dependency)
TASK_ID=$(json_val "$TASK_JSON" "task_id")
# Convert to lowercase first (CRITICAL: platform and language must be lowercase)
PLATFORM=$(json_val "$TASK_JSON" "platform" | tr '[:upper:]' '[:lower:]')
LANGUAGE=$(json_val "$TASK_JSON" "language" | tr '[:upper:]' '[:lower:]')
DIFFICULTY=$(json_val "$TASK_JSON" "difficulty" | tr '[:upper:]' '[:lower:]')
SUBTASK_RAW=$(json_val "$TASK_JSON" "subtask")

# Load reference file for validation and normalization
REFERENCE_FILE=".claude/docs/references/iac-subtasks-subject-labels.json"

# Function to get subtask from subject label (reverse lookup)
get_subtask_from_label() {
    local label="$1"
    local ref_file="$2"
    
    if [ ! -f "$ref_file" ]; then
        echo ""
        return
    fi
    
    # Use awk to parse JSON and find matching subject label
    awk -v search_label="$label" '
    BEGIN {
        in_subtask = 0
        current_subtask = ""
        found = 0
    }
    /"subtask"/ {
        # Extract subtask value
        match($0, /"subtask"[[:space:]]*:[[:space:]]*"([^"]+)"/, arr)
        if (arr[1]) {
            current_subtask = arr[1]
        }
    }
    /"subject_labels"/ {
        in_subtask = 1
    }
    /\[/ && in_subtask {
        # Start of array
    }
    /\]/ && in_subtask {
        in_subtask = 0
    }
    in_subtask && /"[^"]+"/ {
        # Extract subject label
        match($0, /"([^"]+)"/, arr)
        if (arr[1] == search_label) {
            print current_subtask
            found = 1
            exit
        }
    }
    END {
        if (!found) exit 1
    }
    ' "$ref_file" 2>/dev/null || echo ""
}

# Function to get subject labels for a subtask
get_subject_labels_for_subtask() {
    local subtask="$1"
    local ref_file="$2"
    
    if [ ! -f "$ref_file" ]; then
        echo "[]"
        return
    fi
    
    # Find the line number of the matching subtask
    SUBTASK_LINE=$(grep -n "\"subtask\"[[:space:]]*:[[:space:]]*\"$subtask\"" "$ref_file" | head -1 | cut -d: -f1)
    
    if [ -z "$SUBTASK_LINE" ]; then
        echo "[]"
        return
    fi
    
    # Extract lines from subtask to the closing brace of that entry
    # Then find subject_labels array within that block
    BLOCK_START=$SUBTASK_LINE
    BLOCK_END=$(sed -n "${SUBTASK_LINE},\$p" "$ref_file" | grep -n "^    }," | head -1 | cut -d: -f1)
    if [ -n "$BLOCK_END" ]; then
        BLOCK_END=$((SUBTASK_LINE + BLOCK_END - 1))
    else
        # No closing brace found, use a reasonable window
        BLOCK_END=$((SUBTASK_LINE + 10))
    fi
    
    # Extract the subject_labels array from this block
    # Use a Python-like approach: find the array and extract it properly
    ARRAY_RAW=$(sed -n "${BLOCK_START},${BLOCK_END}p" "$ref_file" | awk '
    BEGIN {
        collecting = 0
        bracket_depth = 0
        result = ""
    }
    {
        # Look for subject_labels line
        if (!collecting && match($0, /"subject_labels"[[:space:]]*:[[:space:]]*/)) {
            collecting = 1
            # Get part after colon
            after_colon = substr($0, RSTART + RLENGTH)
            
            # Find opening bracket
            if (match(after_colon, /\[/)) {
                bracket_start = RSTART
                bracket_depth = 1
                # Start from the bracket
                result = substr(after_colon, bracket_start)
                
                # Check if closes on same line
                rest = substr(after_colon, bracket_start + 1)
                for (i = 1; i <= length(rest); i++) {
                    c = substr(rest, i, 1)
                    if (c == "[") bracket_depth++
                    if (c == "]") {
                        bracket_depth--
                        if (bracket_depth == 0) {
                            result = substr(after_colon, bracket_start, i + 1)
                            print result
                            exit
                        }
                    }
                }
            }
        }
        
        # Continue collecting if we're in the array
        if (collecting && bracket_depth > 0) {
            # Check each character in this line
            line_added = 0
            for (i = 1; i <= length($0); i++) {
                c = substr($0, i, 1)
                if (c == "[") bracket_depth++
                if (c == "]") {
                    bracket_depth--
                    if (bracket_depth == 0) {
                        # Include up to closing bracket
                        result = result substr($0, 1, i)
                        print result
                        exit
                    }
                }
            }
            # If bracket didn't close, add entire line
            if (bracket_depth > 0) {
                result = result $0
            }
        }
    }
    END {
        if (result != "" && bracket_depth == 0) {
            print result
        }
    }
    ' 2>/dev/null | head -1)
    
    if [ -z "$ARRAY_RAW" ] || [ "$ARRAY_RAW" = "" ]; then
        echo "[]"
        return
    fi
    
    # Clean up: remove leading whitespace from array, compress internal whitespace
    # But preserve the JSON structure (quotes, commas, brackets)
    CLEANED=$(echo "$ARRAY_RAW" | sed 's/^[[:space:]]*//' | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')
    # Normalize brackets and commas
    CLEANED=$(echo "$CLEANED" | sed 's/[[:space:]]*\[[[:space:]]*/[/')
    CLEANED=$(echo "$CLEANED" | sed 's/[[:space:]]*\][[:space:]]*/]/')
    CLEANED=$(echo "$CLEANED" | sed 's/[[:space:]]*,[[:space:]]*/, /g')
    CLEANED=$(echo "$CLEANED" | sed 's/[[:space:]]*$//')
    echo "${CLEANED:-[]}"
}

# Function to check if a value is a valid subtask
is_valid_subtask() {
    local subtask="$1"
    local ref_file="$2"
    
    if [ ! -f "$ref_file" ]; then
        return 1
    fi
    
    # Check if subtask exists in reference file
    grep -q "\"subtask\"[[:space:]]*:[[:space:]]*\"$subtask\"" "$ref_file" 2>/dev/null
}

# Normalize subtask: check if it's valid, if not try to map from subject label
SUBTASK="$SUBTASK_RAW"
if [ -n "$SUBTASK" ]; then
    if ! is_valid_subtask "$SUBTASK" "$REFERENCE_FILE"; then
        # Try to find if it's actually a subject label
        MAPPED_SUBTASK=$(get_subtask_from_label "$SUBTASK" "$REFERENCE_FILE")
        if [ -n "$MAPPED_SUBTASK" ]; then
            log_info "Normalized subtask: '$SUBTASK' -> '$MAPPED_SUBTASK'"
            SUBTASK="$MAPPED_SUBTASK"
        else
            log_error "Invalid subtask: '$SUBTASK'. Valid subtasks are defined in $REFERENCE_FILE"
            # Don't exit - allow it but warn
        fi
    fi
fi

# If subtask is still empty or invalid, try common mappings
if [ -z "$SUBTASK" ] || [ "$SUBTASK" = "" ]; then
    # Try to infer from common patterns (fallback)
    case "$SUBTASK_RAW" in
        *"Environment"*|*"Migration"*|*"Setup"*)
            SUBTASK="Provisioning of Infrastructure Environments"
            ;;
        *"Application"*|*"Deployment"*|*"Serverless"*)
            SUBTASK="Application Deployment"
            ;;
        *"CI"*|*"CD"*|*"Pipeline"*)
            SUBTASK="CI/CD Pipeline Integration"
            ;;
        *"Failure"*|*"Recovery"*|*"Availability"*)
            SUBTASK="Failure Recovery and High Availability"
            ;;
        *"Security"*|*"Compliance"*|*"Governance"*)
            SUBTASK="Security, Compliance, and Governance"
            ;;
        *"Optimization"*|*"Diagnosis"*|*"Edits"*)
            SUBTASK="IaC Program Optimization"
            ;;
        *"QA"*|*"Analysis"*|*"Monitoring"*|*"Management"*)
            SUBTASK="Infrastructure QA and Management"
            ;;
        *)
            # Default fallback
            SUBTASK="Provisioning of Infrastructure Environments"
            log_info "Using default subtask: $SUBTASK"
            ;;
    esac
fi

# Normalize platform to match CLI tool format (must be lowercase abbreviated form)
case "$PLATFORM" in
    cloudformation) PLATFORM="cfn" ;;
    # cdk, cdktf, pulumi, tf, cfn remain as-is (already lowercase)
    *) : ;; # No change for other platforms (: is a no-op)
esac

# Normalize language to match CLI tool format (must be lowercase abbreviated form)
case "$LANGUAGE" in
    typescript) LANGUAGE="ts" ;;
    python) LANGUAGE="py" ;;
    javascript) LANGUAGE="js" ;;
    terraform) LANGUAGE="hcl" ;;
    # go, java, yaml, json, hcl remain as-is (already lowercase)
    *) : ;; # No change for other languages (: is a no-op)
esac

# CRITICAL: Use exact difficulty value as complexity (no mapping)
# This ensures PR body shows the same complexity as .claude/tasks.csv
COMPLEXITY="$DIFFICULTY"

# Get timestamp
STARTED_AT=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)

# Extract subject_labels (handle array format robustly)
# FIXED: Previously used fragile regex that failed on arrays with spaces like ["Label 1", "Label 2"]
# Now uses awk to properly track bracket depth and extract complete JSON arrays
# This ensures subject_labels from CSV are correctly preserved in metadata.json
SUBJECT_LABELS=""

# Use awk to extract subject_labels value by finding the pattern and extracting until matching bracket
# This handles arrays with spaces, commas, and quoted strings properly
SUBJECT_LABELS=$(echo "$TASK_JSON" | awk '
{
    # Find "subject_labels" field
    match($0, /"subject_labels"[[:space:]]*:[[:space:]]*/)
    if (RSTART > 0) {
        # Extract from after the colon
        start_pos = RSTART + RLENGTH
        rest = substr($0, start_pos)
        
        # Find the opening bracket
        match(rest, /\[/)
        if (RSTART > 0) {
            bracket_pos = RSTART
            depth = 1
            i = bracket_pos + 1
            
            # Track bracket depth to find matching closing bracket
            while (i <= length(rest) && depth > 0) {
                char = substr(rest, i, 1)
                if (char == "[") depth++
                if (char == "]") depth--
                i++
            }
            
            if (depth == 0) {
                # Found matching bracket
                print substr(rest, bracket_pos, i - bracket_pos)
            }
        }
    }
}' 2>/dev/null || echo "")

# If awk method failed, try sed as fallback
if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" = "" ]; then
    # Try sed with a pattern that matches arrays (including those with spaces)
    SUBJECT_LABELS=$(echo "$TASK_JSON" | sed -n 's/.*"subject_labels"[[:space:]]*:[[:space:]]*\(\[[^]]*\]\).*/\1/p' 2>/dev/null || echo "")
fi

# Validate and normalize the extracted value
if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" = "null" ] || [ "$SUBJECT_LABELS" = '""' ]; then
    SUBJECT_LABELS='[]'
elif ! echo "$SUBJECT_LABELS" | grep -qE '^\s*\[.*\]\s*$'; then
    # Not a valid JSON array format - check if it's a string that needs conversion
    CLEANED=$(echo "$SUBJECT_LABELS" | sed 's/^"\(.*\)"$/\1/')
    if [ "$CLEANED" != "$SUBJECT_LABELS" ]; then
        # It was a quoted string, convert to single-element array
        ESCAPED=$(echo "$CLEANED" | sed 's/"/\\"/g')
        SUBJECT_LABELS="[\"$ESCAPED\"]"
    else
        # Unknown format, default to empty array
        SUBJECT_LABELS='[]'
    fi
fi

# Trim whitespace
SUBJECT_LABELS=$(echo "$SUBJECT_LABELS" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

# Normalize and validate subject_labels against reference file
# If subject_labels is empty or invalid, derive from subtask
if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" = "[]" ] || [ "$SUBJECT_LABELS" = "null" ]; then
    # Empty - derive from subtask using reference file
    if [ -n "$SUBTASK" ] && is_valid_subtask "$SUBTASK" "$REFERENCE_FILE"; then
        DERIVED_LABELS=$(get_subject_labels_for_subtask "$SUBTASK" "$REFERENCE_FILE")
        if [ -n "$DERIVED_LABELS" ] && [ "$DERIVED_LABELS" != "[]" ]; then
            SUBJECT_LABELS="$DERIVED_LABELS"
            log_info "Derived subject_labels from subtask '$SUBTASK': $SUBJECT_LABELS"
        fi
    fi
else
    # Validate that subject_labels match the subtask
    # Extract labels from the array string for validation
    LABELS_LIST=$(echo "$SUBJECT_LABELS" | sed 's/\[//;s/\]//;s/"//g' | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$')
    
    # Check if any label matches the subtask's expected labels
    if [ -n "$SUBTASK" ] && is_valid_subtask "$SUBTASK" "$REFERENCE_FILE"; then
        EXPECTED_LABELS=$(get_subject_labels_for_subtask "$SUBTASK" "$REFERENCE_FILE")
        EXPECTED_LIST=$(echo "$EXPECTED_LABELS" | sed 's/\[//;s/\]//;s/"//g' | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$')
        
        # Check if all provided labels are valid for this subtask
        INVALID_FOUND=false
        while IFS= read -r label; do
            if [ -n "$label" ]; then
                # Check if this label belongs to the subtask
                LABEL_SUBTASK=$(get_subtask_from_label "$label" "$REFERENCE_FILE")
                if [ "$LABEL_SUBTASK" != "$SUBTASK" ]; then
                    INVALID_FOUND=true
                    log_error "Subject label '$label' does not belong to subtask '$SUBTASK'"
                    if [ -n "$LABEL_SUBTASK" ]; then
                        log_error "  Label '$label' belongs to subtask: '$LABEL_SUBTASK'"
                    fi
                fi
            fi
        done <<< "$LABELS_LIST"
        
        # If invalid labels found, replace with correct ones from reference
        if [ "$INVALID_FOUND" = true ]; then
            log_info "Replacing invalid subject_labels with correct ones from reference file"
            SUBJECT_LABELS=$(get_subject_labels_for_subtask "$SUBTASK" "$REFERENCE_FILE")
            if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" = "[]" ]; then
                SUBJECT_LABELS='[]'
            fi
        fi
    fi
fi

# Final validation: ensure subject_labels is a valid JSON array
if [ -z "$SUBJECT_LABELS" ] || [ "$SUBJECT_LABELS" = "null" ]; then
    SUBJECT_LABELS='[]'
elif ! echo "$SUBJECT_LABELS" | grep -qE '^\s*\[.*\]\s*$'; then
    # Not a valid array format - try to fix it
    log_info "Fixing subject_labels format: $SUBJECT_LABELS"
    SUBJECT_LABELS='[]'
fi

# Extract fields for PROMPT.md (needed early for region extraction)
BACKGROUND=$(json_val "$TASK_JSON" "background")
PROBLEM=$(json_val "$TASK_JSON" "problem")
CONSTRAINTS=$(json_val "$TASK_JSON" "constraints")
ENVIRONMENT=$(json_val "$TASK_JSON" "environment")

# Unescape JSON escaped newlines and other common escapes
unescape_json_string() {
    echo "$1" | sed 's/\\n/\n/g' | sed 's/\\t/\t/g' | sed "s/\\\\'/'/g"
}

BACKGROUND=$(unescape_json_string "$BACKGROUND")
PROBLEM=$(unescape_json_string "$PROBLEM")
CONSTRAINTS=$(unescape_json_string "$CONSTRAINTS")
ENVIRONMENT=$(unescape_json_string "$ENVIRONMENT")

# Extract region from environment or constraints if present
extract_region() {
    local environment="$1"
    local constraints="$2"
    
    # First, try to find region in environment field (where regions are actually mentioned)
    local region=$(echo "$environment" | grep -oE '(us-east-[12]|us-west-[12]|eu-[a-z]+-[0-9]+|ap-[a-z]+-[0-9]+|ca-central-[0-9]+|sa-east-[0-9]+|af-south-[0-9]+|me-south-[0-9]+)' | head -1)
    
    # If not found, check constraints
    if [ -z "$region" ]; then
        region=$(echo "$constraints" | grep -oE '(us-east-[12]|us-west-[12]|eu-[a-z]+-[0-9]+|ap-[a-z]+-[0-9]+|ca-central-[0-9]+|sa-east-[0-9]+|af-south-[0-9]+|me-south-[0-9]+)' | head -1)
    fi
    
    # Default to us-east-1 if no region found
    if [ -z "$region" ]; then
        echo "us-east-1"
    else
        echo "$region"
    fi
}

REGION=$(extract_region "$ENVIRONMENT" "$CONSTRAINTS")

# Read team value from settings.local.json
# If team is mentioned in settings, use that value (e.g., synth-2, synth-1)
# Otherwise, default to "synth"
SETTINGS_FILE=".claude/settings.local.json"
if [ -f "$SETTINGS_FILE" ]; then
    TEAM=$(json_val "$(cat "$SETTINGS_FILE")" "team")
    [ -z "$TEAM" ] && TEAM="synth"
else
    TEAM="synth"
fi

# Create metadata.json
METADATA_FILE="$OUTPUT_DIR/metadata.json"
cat > "$METADATA_FILE" <<EOF
{
  "platform": "$PLATFORM",
  "language": "$LANGUAGE",
  "complexity": "$COMPLEXITY",
  "turn_type": "single",
  "team": "$TEAM",
  "startedAt": "$STARTED_AT",
  "subtask": "$SUBTASK",
  "subject_labels": $SUBJECT_LABELS,
  "po_id": "$TASK_ID",
  "aws_services": [],
  "region": "$REGION"
}
EOF

log_info "Created metadata.json"

# Helper function to parse and format constraints
format_constraints() {
    local constraints="$1"
    if [ -z "$constraints" ]; then
        echo "- Follow AWS security best practices"
        return
    fi
    # Split by semicolon and format as list
    echo "$constraints" | sed 's/; */\n- /g' | sed '1s/^/- /' | sed 's/^-  /- /'
}

# Helper function to detect and format JSON strings
format_json_if_present() {
    local content="$1"
    # Check if content looks like JSON (starts with { and ends with })
    if [[ "$content" =~ ^\{.*\}$ ]]; then
        echo '```json'
        echo "$content"
        echo '```'
    else
        echo "$content"
    fi
}

# Helper function to parse environment field (often contains JSON-like data)
format_environment() {
    local env="$1"
    if [ -z "$env" ]; then
        echo "- AWS credentials with appropriate permissions"
        echo "- $PLATFORM CLI tools installed"
        echo "- $LANGUAGE runtime/SDK configured"
        return
    fi
    
    # Try to detect structured data and format it
    if [[ "$env" =~ setup_requirements|core_services|core_components|required_services ]]; then
        # Format as code block for better readability
        echo '```'
        echo "$env" | sed "s/[{}']//g" | sed 's/, /\n/g' | sed 's/: /:\n  /g'
        echo '```'
    else
        format_json_if_present "$env"
    fi
}

FORMATTED_CONSTRAINTS=$(format_constraints "$CONSTRAINTS")
FORMATTED_ENVIRONMENT=$(format_environment "$ENVIRONMENT")

# Detect if PROBLEM field contains a complete prompt (likely if it's long or has markdown structure)
PROBLEM_IS_COMPLETE=false
if [[ "$PROBLEM" =~ "##" ]] || [[ ${#PROBLEM} -gt 800 ]] || [[ "$PROBLEM" =~ "Please " ]] || [[ "$PROBLEM" =~ "You're " ]]; then
    PROBLEM_IS_COMPLETE=true
fi

PROMPT_FILE="$OUTPUT_DIR/PROMPT.md"

# Generate PROMPT.md based on problem type
if [ "$PROBLEM_IS_COMPLETE" = true ]; then
    # Problem contains complete prompt - use it as main content with minimal wrapper
    cat > "$PROMPT_FILE" <<EOF
# $SUBTASK

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using $PLATFORM with $LANGUAGE**
> 
> Platform: **$PLATFORM**  
> Language: **$LANGUAGE**  
> Region: **$REGION**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

$(format_json_if_present "$PROBLEM")

---

## Additional Context

### Background
${BACKGROUND:-Infrastructure as Code implementation task}

### Constraints and Requirements
$FORMATTED_CONSTRAINTS

### Environment Setup
$FORMATTED_ENVIRONMENT

## Project-Specific Conventions

### Resource Naming
- All resources must use the \`environmentSuffix\` variable in their names to support multiple PR environments
- Example: \`myresource-\${environmentSuffix}\` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from \`cfn-outputs/flat-outputs.json\`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include \`environmentSuffix\` in their names
- Pattern: \`{resource-name}-\${environmentSuffix}\` or \`{resource-name}-\${props.environmentSuffix}\`
- Examples:
  - S3 Bucket: \`my-bucket-\${environmentSuffix}\`
  - Lambda Function: \`my-function-\${environmentSuffix}\`
  - DynamoDB Table: \`my-table-\${environmentSuffix}\`
- **Validation**: Every resource with a \`name\`, \`bucketName\`, \`functionName\`, \`tableName\`, \`roleName\`, \`queueName\`, \`topicName\`, \`streamName\`, \`clusterName\`, or \`dbInstanceIdentifier\` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**: 
  - \`RemovalPolicy.RETAIN\` (CDK/CDKTF) → Use \`RemovalPolicy.DESTROY\` instead
  - \`DeletionPolicy: Retain\` (CloudFormation) → Remove or use \`Delete\`
  - \`deletionProtection: true\` (RDS, DynamoDB) → Use \`deletionProtection: false\`
  - \`skip_final_snapshot: false\` (RDS) → Use \`skip_final_snapshot: true\`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - ✅ CORRECT: \`arn:aws:iam::aws:policy/service-role/AWS_ConfigRole\`
  - ❌ WRONG: \`arn:aws:iam::aws:policy/service-role/ConfigRole\`
  - ❌ WRONG: \`arn:aws:iam::aws:policy/AWS_ConfigRole\`
- **Alternative**: Use service-linked role \`AWSServiceRoleForConfig\` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use \`require('aws-sdk')\` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: \`import { S3Client } from '@aws-sdk/client-s3'\`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting \`reservedConcurrentExecutions\` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: \`synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0\`
  - ❌ WRONG: \`SYNTHETICS_NODEJS_PUPPETEER_5_1\` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set \`backup_retention_period = 1\` (minimum) and \`skip_final_snapshot = true\`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~\$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: \`prod-\`, \`dev-\`, \`stage-\`, \`production\`, \`development\`, \`staging\`
  - Account IDs: \`123456789012\`, \`arn:aws:.*:.*:account\`
  - Regions: Hardcoded \`us-east-1\` or \`us-west-2\` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use \`DependsOn\` in CloudFormation, \`dependsOn\` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDK TypeScript)
\`\`\`typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: \`data-bucket-\${environmentSuffix}\`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucketName: 'data-bucket-prod'  // Hardcoded, will fail
\`\`\`

### Correct Removal Policy (CDK TypeScript)
\`\`\`typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: RemovalPolicy.DESTROY,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
\`\`\`

### Correct AWS Config IAM Role (CDK TypeScript)
\`\`\`typescript
const configRole = new iam.Role(this, 'ConfigRole', {
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWS_ConfigRole'  // ✅ CORRECT
    )
  ]
});

// ❌ WRONG:
// 'service-role/ConfigRole'  // Policy doesn't exist
// 'AWS_ConfigRole'  // Missing service-role/ prefix
\`\`\`

## Target Region
All resources should be deployed to: **$REGION**
EOF
else
    # Problem is brief - use structured template
    cat > "$PROMPT_FILE" <<EOF
# $SUBTASK

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using $PLATFORM with $LANGUAGE**
> 
> Platform: **$PLATFORM**  
> Language: **$LANGUAGE**  
> Region: **$REGION**

---

## Background
${BACKGROUND:-Infrastructure as Code implementation task}

## Problem Statement
${PROBLEM:-Implement the infrastructure requirements using $PLATFORM and $LANGUAGE.}

## Constraints and Requirements
$FORMATTED_CONSTRAINTS

## Environment Setup
$FORMATTED_ENVIRONMENT

---

## Implementation Guidelines

### Platform Requirements
- Use $PLATFORM as the IaC framework
- All code must be written in $LANGUAGE
- Follow $PLATFORM best practices for resource organization
- Ensure all resources use the \`environmentSuffix\` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from \`cfn-outputs/flat-outputs.json\`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include \`environmentSuffix\` in their names
- Pattern: \`{resource-name}-\${environmentSuffix}\` or \`{resource-name}-\${props.environmentSuffix}\`
- Examples:
  - S3 Bucket: \`my-bucket-\${environmentSuffix}\`
  - Lambda Function: \`my-function-\${environmentSuffix}\`
  - DynamoDB Table: \`my-table-\${environmentSuffix}\`
- **Validation**: Every resource with a \`name\`, \`bucketName\`, \`functionName\`, \`tableName\`, \`roleName\`, \`queueName\`, \`topicName\`, \`streamName\`, \`clusterName\`, or \`dbInstanceIdentifier\` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**: 
  - \`RemovalPolicy.RETAIN\` (CDK/CDKTF) → Use \`RemovalPolicy.DESTROY\` instead
  - \`DeletionPolicy: Retain\` (CloudFormation) → Remove or use \`Delete\`
  - \`deletionProtection: true\` (RDS, DynamoDB) → Use \`deletionProtection: false\`
  - \`skip_final_snapshot: false\` (RDS) → Use \`skip_final_snapshot: true\`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - ✅ CORRECT: \`arn:aws:iam::aws:policy/service-role/AWS_ConfigRole\`
  - ❌ WRONG: \`arn:aws:iam::aws:policy/service-role/ConfigRole\`
  - ❌ WRONG: \`arn:aws:iam::aws:policy/AWS_ConfigRole\`
- **Alternative**: Use service-linked role \`AWSServiceRoleForConfig\` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use \`require('aws-sdk')\` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: \`import { S3Client } from '@aws-sdk/client-s3'\`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting \`reservedConcurrentExecutions\` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: \`synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0\`
  - ❌ WRONG: \`SYNTHETICS_NODEJS_PUPPETEER_5_1\` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set \`backup_retention_period = 1\` (minimum) and \`skip_final_snapshot = true\`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~\$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: \`prod-\`, \`dev-\`, \`stage-\`, \`production\`, \`development\`, \`staging\`
  - Account IDs: \`123456789012\`, \`arn:aws:.*:.*:account\`
  - Regions: Hardcoded \`us-east-1\` or \`us-west-2\` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use \`DependsOn\` in CloudFormation, \`dependsOn\` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDK TypeScript)
\`\`\`typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: \`data-bucket-\${environmentSuffix}\`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucketName: 'data-bucket-prod'  // Hardcoded, will fail
\`\`\`

### Correct Removal Policy (CDK TypeScript)
\`\`\`typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: RemovalPolicy.DESTROY,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
\`\`\`

### Correct AWS Config IAM Role (CDK TypeScript)
\`\`\`typescript
const configRole = new iam.Role(this, 'ConfigRole', {
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWS_ConfigRole'  // ✅ CORRECT
    )
  ]
});

// ❌ WRONG:
// 'service-role/ConfigRole'  // Policy doesn't exist
// 'AWS_ConfigRole'  // Missing service-role/ prefix
\`\`\`

## Target Region
Deploy all resources to: **$REGION**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
EOF
fi

log_info "Created PROMPT.md"

# Copy ci-cd.yml reference file for CI/CD Pipeline Integration tasks
if [ "$SUBTASK" = "CI/CD Pipeline Integration" ]; then
    CICD_YML_TEMPLATE="$(dirname "$0")/../../templates/cicd-yml/lib/ci-cd.yml"
    CICD_YML_DEST="$OUTPUT_DIR/lib/ci-cd.yml"
    
    if [ -f "$CICD_YML_TEMPLATE" ]; then
        # Ensure lib directory exists
        mkdir -p "$OUTPUT_DIR/lib"
        
        # Copy the ci-cd.yml file
        cp "$CICD_YML_TEMPLATE" "$CICD_YML_DEST"
        log_info "Copied ci-cd.yml reference file to lib/"
    else
        log_error "Warning: ci-cd.yml template not found at $CICD_YML_TEMPLATE"
    fi
fi

# Copy optimize.py script for IaC Optimization tasks
# Check if subject_labels contains "IaC Optimization"
if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
    OPTIMIZE_TEMPLATE="$(dirname "$0")/../../templates/optimize/optimize.py"
    OPTIMIZE_DEST="$OUTPUT_DIR/lib/optimize.py"
    
    if [ -f "$OPTIMIZE_TEMPLATE" ]; then
        # Ensure lib directory exists
        mkdir -p "$OUTPUT_DIR/lib"
        
        # Copy the optimize.py file
        cp "$OPTIMIZE_TEMPLATE" "$OPTIMIZE_DEST"
        log_info "Copied optimize.py optimization script to lib/"
    else
        log_error "Warning: optimize.py template not found at $OPTIMIZE_TEMPLATE"
    fi
fi

# Validate metadata
REQUIRED=("platform" "language" "complexity" "turn_type" "team" "startedAt" "subtask" "po_id")
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
