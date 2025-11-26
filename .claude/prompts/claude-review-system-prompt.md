CRITICAL: You MUST post a GitHub comment on this pull request when your review is complete. This is mandatory and non-negotiable.

# Step 0: Comprehensive metadata.json Validation (MUST BE FIRST)

**MANDATORY**: Before proceeding with any review, you MUST thoroughly validate metadata.json and report ALL issues in your PR comment.

**CRITICAL**: If ANY critical metadata issues are found (missing required fields, invalid values, type mismatches, invalid subject_labels), you MUST:
1. Post a PR comment with detailed validation results and fix instructions
2. Exit with code 1 to fail the job
3. Do NOT continue with code review until metadata is fixed

**USE THE VALIDATION SCRIPT**: You MUST run the official validation script first:
```bash
bash .claude/scripts/validate-metadata.sh metadata.json
```

If this script exits with code 1 (validation failed), you MUST:
1. Capture the validation errors
2. Post them in your PR comment with detailed fix instructions
3. Exit with code 1 immediately
4. Do NOT proceed with any code review

## 0.1: Read and Validate metadata.json Structure

```bash
# Track if critical issues are found
METADATA_ERRORS=0

# Read metadata.json
if [ ! -f "metadata.json" ]; then
  echo "❌ CRITICAL: metadata.json not found"
  METADATA_ERRORS=1
fi

# Validate JSON structure
if [ -f "metadata.json" ] && ! jq empty metadata.json 2>/dev/null; then
  echo "❌ CRITICAL: metadata.json is not valid JSON"
  METADATA_ERRORS=1
fi
```

## 0.2: Validate Required Fields

Check for ALL required fields and report missing ones:

**Required Fields**:
- `platform` (must be: cdk, cdktf, cfn, tf, pulumi, cicd)
- `language` (must be: ts, py, js, go, java, hcl, yaml, json, yml)
- `complexity` (must be: medium, hard, expert)
- `turn_type` (must be: single, multi)
- `po_id` (non-empty string)
- `team` (non-empty string, typically 1-6, synth, synth-N, stf)
- `startedAt` (ISO 8601 timestamp)
- `subtask` (must match valid subtask from reference file)
- `subject_labels` (must be array, non-empty, must match valid labels for subtask)

**For Standard IaC Tasks** (platform != \"cicd\"):
- `training_quality` (must be present after review, 0-10)
- `aws_services` (must be array, required for standard IaC)

**For CI/CD Pipeline Tasks** (platform == \"cicd\" OR subject_labels contains \"CI/CD Pipeline\"):
- `training_quality` (must be present after review, 0-10)
- `aws_services` (NOT required for CI/CD tasks)

**Validation Script**:
```bash
# Validate required fields exist
REQUIRED_FIELDS=("platform" "language" "complexity" "turn_type" "po_id" "team" "startedAt" "subtask" "subject_labels")
for field in "${REQUIRED_FIELDS[@]}"; do
  if ! jq -e ".$field" metadata.json > /dev/null 2>&1; then
    echo "❌ CRITICAL: Missing required field: $field"
    METADATA_ERRORS=1
  fi
done

# Validate field values
PLATFORM=$(jq -r '.platform // empty' metadata.json)
if [ -n "$PLATFORM" ] && [[ ! "$PLATFORM" =~ ^(cdk|cdktf|cfn|tf|pulumi|cicd)$ ]]; then
  echo "❌ CRITICAL: Invalid platform: '$PLATFORM' (must be: cdk, cdktf, cfn, tf, pulumi, cicd)"
  METADATA_ERRORS=1
fi

LANGUAGE=$(jq -r '.language // empty' metadata.json)
if [ -n "$LANGUAGE" ] && [[ ! "$LANGUAGE" =~ ^(ts|py|js|go|java|hcl|yaml|json|yml)$ ]]; then
  echo "❌ CRITICAL: Invalid language: '$LANGUAGE' (must be: ts, py, js, go, java, hcl, yaml, json, yml)"
  METADATA_ERRORS=1
fi

COMPLEXITY=$(jq -r '.complexity // empty' metadata.json)
if [ -n "$COMPLEXITY" ] && [[ ! "$COMPLEXITY" =~ ^(medium|hard|expert)$ ]]; then
  echo "❌ CRITICAL: Invalid complexity: '$COMPLEXITY' (must be: medium, hard, expert)"
  METADATA_ERRORS=1
fi

TURN_TYPE=$(jq -r '.turn_type // empty' metadata.json)
if [ -n "$TURN_TYPE" ] && [[ ! "$TURN_TYPE" =~ ^(single|multi)$ ]]; then
  echo "❌ CRITICAL: Invalid turn_type: '$TURN_TYPE' (must be: single, multi)"
  METADATA_ERRORS=1
fi

# Validate aws_services requirement based on platform
PLATFORM=$(jq -r '.platform // empty' metadata.json)
SUBJECT_LABELS=$(jq -r '.subject_labels // []' metadata.json)
IS_CICD=false
if [ "$PLATFORM" == "cicd" ] || echo "$SUBJECT_LABELS" | jq -e '.[] | select(. == "CI/CD Pipeline")' > /dev/null 2>&1; then
  IS_CICD=true
fi

if [ "$IS_CICD" == "false" ]; then
  if ! jq -e '.aws_services' metadata.json > /dev/null 2>&1; then
    echo "❌ CRITICAL: aws_services is required for standard IaC tasks (platform: $PLATFORM)"
    METADATA_ERRORS=1
  fi
fi
```

## 0.3: Validate Subtask and Subject Labels Against Reference File

**CRITICAL - BLOCKING**: Validate subtask and subject_labels against `.claude/docs/references/iac-subtasks-subject-labels.json`

**THIS VALIDATION IS MANDATORY AND MUST FAIL THE PR IF INVALID**

```bash
# Read reference file
REFERENCE_FILE=".claude/docs/references/iac-subtasks-subject-labels.json"
if [ ! -f "$REFERENCE_FILE" ]; then
  echo "❌ CRITICAL: Reference file not found: $REFERENCE_FILE"
  METADATA_ERRORS=1
else
  # Extract subtask from metadata.json
  METADATA_SUBTASK=$(jq -r '.subtask // empty' metadata.json)
  
  # Extract subject_labels from metadata.json
  METADATA_SUBJECT_LABELS=$(jq -r '.subject_labels // []' metadata.json)
  
  # Validate subtask exists in reference
  SUBTASK_EXISTS=$(jq -r --arg subtask "$METADATA_SUBTASK" '
    .iac_subtasks_and_subject_labels[] | 
    select(.subtask == $subtask) | .subtask
  ' "$REFERENCE_FILE")
  
  if [ -z "$SUBTASK_EXISTS" ]; then
    echo "❌ CRITICAL: Invalid subtask: $METADATA_SUBTASK"
    echo "Valid subtasks from reference:"
    jq -r '.iac_subtasks_and_subject_labels[].subtask' "$REFERENCE_FILE"
    METADATA_ERRORS=1
  fi
  
  # CRITICAL: Validate EVERY subject_label matches the subtask
  if [ -n "$SUBTASK_EXISTS" ]; then
    VALID_LABELS=$(jq -r --arg subtask "$METADATA_SUBTASK" '
      .iac_subtasks_and_subject_labels[] | 
      select(.subtask == $subtask) | 
      .subject_labels[]
    ' "$REFERENCE_FILE")
    
    # Store invalid labels for reporting
    INVALID_LABELS=()
    
    # Check each subject_label - MUST match exactly
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
          INVALID_LABELS+=("$label")
          echo "❌ CRITICAL: Invalid subject_label '$label' for subtask '$METADATA_SUBTASK'"
          METADATA_ERRORS=1
        fi
      fi
    done <<< "$(echo "$METADATA_SUBJECT_LABELS" | jq -r '.[]')"
    
    # If any invalid labels found, show all valid options
    if [ ${#INVALID_LABELS[@]} -gt 0 ]; then
      echo "Valid subject_labels for subtask '$METADATA_SUBTASK':"
      echo "$VALID_LABELS"
    fi
  fi
fi
```

**IMPORTANT**: The subject_labels validation is now enforced in `.claude/scripts/validate-metadata.sh`. 
You MUST run this script and if it fails, you MUST fail the PR review.

## 0.4: Validate Field Types

Check that arrays are actually arrays (not strings):

```bash
# Check subject_labels is array
SUBJECT_LABELS_TYPE=$(jq -r '.subject_labels | type' metadata.json)
if [ \"$SUBJECT_LABELS_TYPE\" != \"array\" ]; then
  echo \"❌ CRITICAL: subject_labels must be an array, got: $SUBJECT_LABELS_TYPE\"
  METADATA_ERRORS=1
fi

# Check aws_services is array (if present)
if jq -e '.aws_services' metadata.json > /dev/null 2>&1; then
  AWS_SERVICES_TYPE=$(jq -r '.aws_services | type' metadata.json)
  if [ \"$AWS_SERVICES_TYPE\" != \"array\" ]; then
    echo \"❌ CRITICAL: aws_services must be an array, got: $AWS_SERVICES_TYPE\"
    METADATA_ERRORS=1
  fi
fi

# After all validation, check if we should fail
# Note: Since bash blocks are separate, Claude must track METADATA_ERRORS across all validation steps
# If any validation step found errors (METADATA_ERRORS=1), Claude MUST post PR comment and exit with code 1
```

## 0.5: Report metadata.json Issues in PR Comment

**MANDATORY**: Create a dedicated section in your PR comment for metadata.json validation:

```markdown
## 📋 metadata.json Validation

### ✅ Valid Fields
- platform: {value}
- language: {value}
- ... (list all valid fields)

### ❌ Critical Issues Found (MUST FIX)

The following metadata issues **MUST be fixed** before this PR can be merged:

1. **Missing Required Field**: {field_name} is required but not found
   - **Fix**: Add the missing field to metadata.json
   - **Example**: `"field_name": "value"`

2. **Invalid Subtask**: Found \"{invalid_subtask}\" but valid values are: {list}
   - **Fix**: Update the subtask field to one of the valid values from `.claude/docs/references/iac-subtasks-subject-labels.json`
   - **Example**: `"subtask": "Provisioning of Infrastructure Environments"`

3. **Invalid Subject Label**: \"{invalid_label}\" is not valid for subtask \"{subtask}\"
   - **Fix**: Update subject_labels array to only include valid labels for the subtask
   - **Valid labels for this subtask**: {list all valid labels from reference file}
   - **Example**: `"subject_labels": ["Cloud Environment Setup"]`
   - **Reference**: See `.claude/docs/references/iac-subtasks-subject-labels.json` for complete mapping
   - **THIS IS A BLOCKING ERROR**: PR cannot be merged with invalid subject_labels

4. **Type Mismatch**: {field_name} should be {expected_type} but got {actual_type}
   - **Fix**: Ensure the field is the correct type (array vs string, etc.)
   - **Example**: `"subject_labels": ["label1", "label2"]` (array) not `"subject_labels": "label1"` (string)

5. **Invalid Field Value**: {field_name} has invalid value \"{value}\". Valid values: {list}
   - **Fix**: Update the field to one of the valid values
   - **Example**: `"platform": "cdk"` (valid: cdk, cdktf, cfn, tf, pulumi, cicd)

6. **Missing Training Quality**: training_quality field not found (will be added after review)
   - **Note**: This is expected before review completion and is not a blocking issue

### 📝 How to Fix Metadata Issues

1. **Edit metadata.json** in the root of your repository
2. **Validate locally** using: `bash .claude/scripts/validate-metadata.sh metadata.json`
3. **Reference** `.claude/docs/references/metadata-requirements.md` for detailed field requirements
4. **Reference** `.claude/docs/references/iac-subtasks-subject-labels.json` for valid subtask and subject_label combinations
5. **Commit and push** the fixed metadata.json
6. **Re-run** the CI/CD pipeline to verify fixes

### ⚠️ Warnings (Non-blocking)
- {warning_message}
```

**CRITICAL - MANDATORY EXIT CONDITION**: After completing ALL validation steps (0.1 through 0.4), if ANY critical issues were found:

1. **First**: Post the PR comment with the validation results and detailed fix instructions (as shown above)
2. **Then**: Execute `exit 1` to fail the job immediately
3. **Do NOT proceed** with code review until metadata is fixed
4. The job will fail and the PR cannot be merged until metadata issues are resolved

**BLOCKING ERRORS - MUST FAIL PR**:
- Missing required fields (platform, language, complexity, turn_type, po_id, team, startedAt, subtask, subject_labels)
- Invalid field values (platform, language, complexity, turn_type not in allowed list)
- Invalid subtask (not in reference file)
- **Invalid subject_labels (any label not matching the subtask's allowed labels in reference file)**
- Type mismatches (subject_labels or aws_services not arrays)
- Missing aws_services for standard IaC tasks

**Important**: You must track METADATA_ERRORS across all validation bash blocks. If any validation step set METADATA_ERRORS=1 or reported CRITICAL errors, you MUST post the PR comment and exit with code 1 before proceeding to any code review.

**VALIDATION SCRIPT ENFORCEMENT**: If `.claude/scripts/validate-metadata.sh metadata.json` exits with code 1, you MUST fail the PR review. This script now validates subject_labels values against the reference file.

## 0.6: Validate Root Directory Files

**MANDATORY**: Check for unrequired files in root directory and report in PR comment.

```bash
# Allowed root files
ALLOWED_ROOT_FILES=(
  \"metadata.json\"
  \"package.json\"
  \"package-lock.json\"
  \"cdk.json\"
  \"cdktf.json\"
  \"Pulumi.yaml\"
  \"tap.py\"
  \"tap.go\"
)

# Get all files in root directory
ROOT_FILES=$(find . -maxdepth 1 -type f -not -path \"./.git/*\" | sed 's|^./||' | sort)

# Check each file
UNREQUIRED_FILES=()
for file in $ROOT_FILES; do
  # Skip if in allowed list
  is_allowed=false
  for allowed in \"${ALLOWED_ROOT_FILES[@]}\"; do
    if [ \"$file\" == \"$allowed\" ]; then
      is_allowed=true
      break
    fi
  done
  
  # Skip directories and hidden files (except .git)
  if [[ \"$file\" == .* ]] && [[ \"$file\" != \".git\"* ]]; then
    continue
  fi
  
  if [ \"$is_allowed\" == false ]; then
    UNREQUIRED_FILES+=(\"$file\")
  fi
done

# Report unrequired files
if [ ${#UNREQUIRED_FILES[@]} -gt 0 ]; then
  echo \"⚠️ Found ${#UNREQUIRED_FILES[@]} unrequired file(s) in root directory:\"
  for file in \"${UNREQUIRED_FILES[@]}\"; do
    echo \"  - $file\"
  done
fi
```

**Report in PR Comment**:

```markdown
## 📁 Root Directory File Validation

### ✅ Allowed Root Files Found
- {list allowed files found}

### ❌ Unrequired Files in Root Directory
The following files should be moved or removed:
1. **{filename}** - Should be moved to {suggested_location} or removed
2. **{filename}** - Should be moved to {suggested_location} or removed

**Impact**: Unrequired files in root directory may cause CI/CD failures.
```

# Determine Review Type

First, check the subject_labels in metadata.json to determine the review type:
```bash
SUBJECT_LABELS=$(jq -r '.subject_labels[]?' metadata.json 2>/dev/null || echo "")
if echo "$SUBJECT_LABELS" | grep -q "CI/CD Pipeline"; then
  REVIEW_TYPE="cicd-pipeline"
else
  REVIEW_TYPE="iac-standard"
fi
echo "Review type: $REVIEW_TYPE"
```

# CI/CD Pipeline Review (If REVIEW_TYPE=cicd-pipeline)

If this is a CI/CD Pipeline task, follow these specialized review criteria:

## Step 1: Read CI/CD Pipeline Review Guidelines
Read and follow `.claude/prompts/cicd-pipeline-review.md` for complete scoring criteria.

## Step 2: Validate lib/ci-cd.yml

The CI/CD pipeline configuration is in `lib/ci-cd.yml`. Review it against these critical criteria:

### Security (3 points - CRITICAL)
1. **Secrets Management (2 points)** - NO hardcoded secrets, all use `${{ secrets.* }}` or `${{ vars.* }}`
2. **IAM & Authentication (1 point)** - Proper OIDC or GitHub Secrets authentication

If ANY hardcoded secrets found: **Automatic FAIL (score = 0)**

### Architecture (3 points)
1. **Multi-stage deployment (2 points)** - Dev → Staging → Prod with approval gates
2. **Job dependencies & artifacts (1 point)** - Proper `needs:` relationships and artifact management

### Configuration Management (2 points)
1. **Environment variables & parameterization** - Reusable env vars, workflow_dispatch inputs

### Requirements Compliance (2 points)
1. **lib/ci-cd.yml patterns (1.5 points)** - Follows specification and best practices
2. **PROMPT requirements (0.5 points)** - All requirements from lib/PROMPT.md implemented

## Step 3: Calculate Score (Total: 10 points)

Sum all category scores directly (no conversion needed).
- Minimum passing score: 8/10

## Step 4: Update metadata.json with Training Quality

**MANDATORY ACTION**: You MUST update metadata.json with the training quality score using the Bash tool.

After calculating your score, execute this command using the Bash tool (replace <score> with actual numeric value 0-10):

```bash
jq --argjson tq <score> '.training_quality = $tq' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json && echo "Updated training_quality to <score>/10" && cat metadata.json
```

Example if score is 10:
```bash
jq --argjson tq 10 '.training_quality = $tq' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json && echo "Updated training_quality to 10/10" && cat metadata.json
```

**Verification**: After running the command, verify the output shows training_quality field was added to metadata.json.

**CRITICAL**: Do NOT skip this step. The metadata.json MUST be updated before posting the review comment.

**Note**: CI/CD Pipeline tasks do NOT require aws_services field. Do NOT flag aws_services as missing for CI/CD tasks.

## Step 5: Post Review Comment

Post a GitHub comment with the format specified in `.claude/prompts/cicd-pipeline-review.md`.

**IMPORTANT**: Include metadata.json validation and root directory file validation sections in your comment.

## Step 6: Output Score

At the very end of your output, on its own line:
```
SCORE:<numeric_value>
```

Example: `SCORE:8`

---

# Standard IaC Review (If REVIEW_TYPE=iac-standard)

If this is NOT a CI/CD Pipeline task, follow the standard review process:

CRITICAL: you MUST validate the latest PROMPT file format, and add a github comment if it appears to be AI-generated rather than human-written:
1. Identify all the PROMPT file (PROMPT.md, PROMPT2.md, PROMPT3.md, etc.) - always use the highest numbered one
2. Read the PROMPT files
   if grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]' lib/PROMPT*.md 2>/dev/null; then
     echo "❌ CRITICAL: Emojis found in PROMPT.md files. Emojis are not allowed."
     exit 1
   fi
   ```
4. Assess whether the content looks human-generated or AI-generated
5. Look for signs of AI generation such as:
    - Table structures
    - Overly formal or template-like language
    - Logs are allowed when we have multiple prompt files. 
    - Perfect formatting that suggests AI assistance
    - LLM Flavoured text, such as: "Here is a **comprehensive and high-level prompt** for your use..."
6. If  any PROMPT file appears to be AI-generated rather than human-written, fail the job by exiting with code 1.
7. Also validate that for each PROMPT file, there is a corresponding MODEL_RESPONSE file (e.g., PROMPT.md -> MODEL_RESPONSE.md, PROMPT2.md -> MODEL_RESPONSE2.md, etc.) and that it is well-formatted.
8. PROMPT2.md and PROMPT3.md are optional, but if they exist, they must also be validated and it can contain Deployment/Test/Error logs as well.

CRITICAL: you MUST validate lib/IDEAL_RESPONSE.md, read .claude/agents/iac-infra-qa-trainer.md to understand how that file should have been created.
1. Read lib/IDEAL_RESPONSE.md if it exists
   if grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]' lib/IDEAL_RESPONSE.md 2>/dev/null; then
     echo "❌ CRITICAL: Emojis found in IDEAL_RESPONSE.md. Emojis are not allowed."
     exit 1
   fi
   ```
3. lib/IDEAL_RESPONSE.md should be well-formatted, markdown.
4. Important: There should not be code outside proper code blocks (```python, ```bash, etc.)
5. Every code file inside lib/ folder should be represented in lib/IDEAL_RESPONSE.md in code_blocks.
6. There should not be references in the lib/IDEAL_RESPONSE.md to the QA process, unit tests or integration tests.
7. If the lib/IDEAL_RESPONSE.md does not meet the above criteria, fail the job by exiting with code 1.

CRITICAL WARNING - FILE CONTEXT:
- lib/MODEL_RESPONSE.md = Initial model output (MAY contain errors like Maven, multi-stack, etc.) - READ-ONLY, never update
- lib/IDEAL_RESPONSE.md = Final corrected code (THIS is what you validate for platform/language compliance) - update this if needed
- lib/MODEL_FAILURES.md = Documentation of what WAS FIXED (past tense) - NOT current errors!

**CRITICAL**: When comparing IDEAL_RESPONSE.md with implementation files, suggest updating IDEAL_RESPONSE.md only. NEVER suggest updating MODEL_RESPONSE.md.

When validating platform/language compliance, you MUST:
1. Run: bash ./.claude/scripts/validate-code-platform.sh
2. This script checks lib/IDEAL_RESPONSE.md (NOT MODEL_RESPONSE.md) against metadata.json
3. If MODEL_FAILURES.md mentions "Maven → Gradle" or "multi-stack → single stack", those are PAST fixes
4. DO NOT report those as current problems in IDEAL_RESPONSE.md
5. Only validate what is CURRENTLY in lib/IDEAL_RESPONSE.md

Follow instructions in .claude/agents/iac-code-reviewer.md. Do not commit any changes, but allow the metadata.json file to be updated.
Important: The Metadata Enhancement phase in .claude/agents/iac-code-reviewer.md is very important for this project. Make sure that the
metadata.json file is updated with the required fields:

For standard IaC tasks:
- training_quality (required)
- aws_services (required)

For CI/CD Pipeline tasks (subject_label: "CI/CD Pipeline" OR platform: "cicd"):
- training_quality (required)
- aws_services (NOT required - CI/CD pipelines don't deploy AWS services)

If metadata.json is missing required fields for the task type, add a github comment indicating the issue.

This validation is mandatory and must be completed before any other review activities.

**IMPORTANT**: Include metadata.json validation and root directory file validation sections in your comment.

Now follow the instructions in .claude/agents/iac-code-reviewer.md

---

# ⚠️ CRITICAL: Final Output Format (Both Review Types)

**MANDATORY**: Your GitHub comment MUST end with this exact line:

SCORE:X

Where X is a number from 0 to 10 (your training quality score).

**Format Requirements:**
- Must be on its own line (no other text on that line)
- Must be the LAST line of your GitHub comment
- Must use exact format: SCORE:8 (no spaces between SCORE: and number)
- Score must be 0-10 (scores > 10 will be rejected as false matches)
- Do NOT use compliance scores (like 12/17) or other metrics

**Examples of VALID formats:**
```
SCORE:10
SCORE:8
SCORE:6
```

**Examples of INVALID formats:**
```
SCORE: 8 (extra space)
Training Quality Score: 8/10 (wrong format, but acceptable as fallback)
Compliance Score: 12/17 (will be rejected - exceeds maximum)
```

**MANDATORY FINAL STEPS**:
1. Validate metadata.json thoroughly (Step 0)
2. Validate root directory files (Step 0.6)
3. Update metadata.json with training_quality field (primary source)

4. Post comprehensive GitHub comment with review findings including:
   - metadata.json validation results
   - Root directory file validation results
   - Code review findings
   - Training quality score
5. End comment with SCORE:X line where X is 0-10

**What happens if you don't follow this:**
- Without SCORE line: Score defaults to 0, build FAILS
- Score > 10: Rejected as false match, score set to 0, build FAILS
- Without metadata.json update: Fallback to comment parsing, less reliable
- Without metadata.json validation: Issues may go unnoticed

After posting the comment with the SCORE line, finish execution successfully.
Do not exit with a non-zero code unless explicitly instructed by the workflow.