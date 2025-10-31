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
        
        # Clean quotes from fields
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
        gsub(/^"|"$/, "", subject_labels)
        
        # Escape quotes in string values for JSON
        gsub(/"/, "\\\"", background)
        gsub(/"/, "\\\"", problem)
        gsub(/"/, "\\\"", constraints)
        gsub(/"/, "\\\"", environment)
        
        printf "{\"task_id\":\"%s\",\"status\":\"%s\",\"platform\":\"%s\",\"difficulty\":\"%s\",\"subtask\":\"%s\",\"background\":\"%s\",\"problem\":\"%s\",\"language\":\"%s\",\"environment\":\"%s\",\"constraints\":\"%s\",\"subject_labels\":%s}\n",
               task_id, status, platform, difficulty, subtask, background, problem, language, environment, constraints, (subject_labels == "" ? "[]" : subject_labels)
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
SUBTASK=$(json_val "$TASK_JSON" "subtask")

# Normalize platform to match CLI tool format (must be lowercase abbreviated form)
case "$PLATFORM" in
    cloudformation) PLATFORM="cfn" ;;
    # cdk, cdktf, pulumi, tf, cfn remain as-is (already lowercase)
esac

# Normalize language to match CLI tool format (must be lowercase abbreviated form)
case "$LANGUAGE" in
    typescript) LANGUAGE="ts" ;;
    python) LANGUAGE="py" ;;
    javascript) LANGUAGE="js" ;;
    terraform) LANGUAGE="hcl" ;;
    # go, java, yaml, json, hcl remain as-is (already lowercase)
esac

# CRITICAL: Use exact difficulty value as complexity (no mapping)
# This ensures PR body shows the same complexity as .claude/tasks.csv
COMPLEXITY="$DIFFICULTY"

# Get timestamp
STARTED_AT=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)

# Extract subject_labels (handle array format)
SUBJECT_LABELS=$(echo "$TASK_JSON" | grep -o '"subject_labels":\[[^\]]*\]' | cut -d':' -f2 || echo "")
[ -z "$SUBJECT_LABELS" ] && SUBJECT_LABELS='[]'

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

# Extract region from constraints if present
extract_region() {
    local constraints="$1"
    local region=$(echo "$constraints" | grep -oE '(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]+' | head -1)
    if [ -n "$region" ]; then
        echo "$region"
    else
        echo "ap-southeast-1"
    fi
}

REGION=$(extract_region "$CONSTRAINTS")

# Create metadata.json
METADATA_FILE="$OUTPUT_DIR/metadata.json"
cat > "$METADATA_FILE" <<EOF
{
  "platform": "$PLATFORM",
  "language": "$LANGUAGE",
  "complexity": "$COMPLEXITY",
  "turn_type": "single",
  "team": "synth",
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
