# Task Coordinator

Orchestrates the complete Infrastructure as Code development lifecycle by coordinating three specialized sub-agents.

## ⚠️ CRITICAL: CSV Data Integrity

**BEFORE modifying .claude/tasks.csv:**
1. READ "CSV File Corruption Prevention" in `.claude/lessons_learnt.md`
2. READ complete guide in `.claude/docs/policies/csv_safety_guide.md`
3. RUN safety check: `./.claude/scripts/check-csv-safety.sh`

ALL CSV operations MUST:
1. Create backup before ANY modification
2. Read ALL rows, modify specific row(s), write ALL rows back
3. Validate row counts before and after
4. Restore from backup if ANY validation fails

**Failure to follow these rules will corrupt .claude/tasks.csv and lose all task data!**

## ⚠️ CRITICAL: Commit Message Requirements

**ALL commits MUST follow conventional commits format with lowercase subject:**

- Format: `<type>(<scope>): <subject in lowercase>`
- ✅ CORRECT: `feat(synth-{task_id}): add infrastructure for healthcare`
- ❌ WRONG: `feat(synth-{task_id}): Add infrastructure for healthcare`

The CI/CD pipeline validates commits using `commitlint` and will **FAIL** if subject starts with uppercase. See PHASE 5 for detailed instructions.

## Workflow

Execute these phases in sequence to deliver production-ready IaC:

### PHASE 1: Task Selection & Setup

**Agent**: `task-coordinator`

### PHASE 1.1: Task Selection

**Agent**: `iac-task-selector`

### PHASE 1.2: Task Validation & Setup

**Goal**: Ensure selected task and metadata.json match CLI tool expectations.

After task selection and metadata.json generation, validate:

**Validation**: Run Checkpoint A: Metadata Completeness
- See `.claude/docs/references/validation-checkpoints.md` for field requirements
- See `.claude/docs/references/shared-validations.md` for field definitions

**Validation**: Run Checkpoint B: Platform-Language Compatibility
- See `.claude/docs/references/validation-checkpoints.md` for compatibility matrix
- See `.claude/docs/references/shared-validations.md` for valid combinations

**Validation**: Run Checkpoint C: Template Structure
- See `.claude/docs/references/validation-checkpoints.md` for required files

**Task Context Completeness**:
```
Verify task context for iac-infra-generator:
✓ Task description complete (not summarized)
✓ All AWS services mentioned
✓ All constraints documented
✓ Region requirements identified
✓ Security/compliance requirements captured

Remember: Pass COMPLETE task info to iac-infra-generator
Do NOT summarize or paraphrase requirements
```

**CHECKPOINT**:
```
If all pass:
- Report: "✅ PHASE 1.2: Task setup validated - ready for code generation"
- Proceed to PHASE 2 (iac-infra-generator)

If any fail:
- Report: "❌ PHASE 1.2: Validation FAILED"
- List specific issues
- Fix metadata.json or task setup
- Re-validate before proceeding
```

**Handoff to iac-infra-generator**:
```
Provide:
- Complete task description (ALL requirements)
- Background context
- Specific constraints from task
- ALL AWS services mentioned
- Platform: {PLATFORM} (from metadata.json)
- Language: {LANGUAGE} (from metadata.json)
- Region: {REGION or default}
- Complexity: {COMPLEXITY}

Emphasize: "Platform and language are MANDATORY constraints from metadata.json"
```

### PHASE 2: Code Generation

**Agent**: `iac-infra-generator`

### PHASE 3: QA Training & Validation

**Agent**: `iac-infra-qa-trainer`

### PHASE 4: Code Review & Compliance

**Agent**: `iac-code-reviewer`

**Iteration Policy**: See `.claude/docs/policies/iteration-policy.md` for complete decision logic.

**Quick Reference**:
- Score ≥8: Approve PR
- Score 6-7: Conditional iteration (if first attempt AND can add significant features)
- Score <6: Mark as ERROR (insufficient training value)
- Max iterations: 1 per task

**Decision Authority**: iac-code-reviewer recommends, task-coordinator enforces

### PHASE 5: PR Creation & Task Completion

**Agent**: `task-coordinator` (orchestrates final steps)

**Prerequisites**:
- PHASE 4 (code-reviewer) reports "Ready"
- **ALL pre-submission requirements met** (see below)
- GitHub CLI (`gh`) installed and authenticated
- Git remote origin accessible
- User has write permissions

**MANDATORY Pre-Submission Requirements**:

Run the pre-submission validation script:
```bash
bash .claude/scripts/pre-submission-check.sh
```

This validates **ALL** critical requirements:
1. ✅ Build successful (lint + build + synth)
2. ✅ No lint issues
3. ✅ No synth issues  
4. ✅ Deployment successful
5. ✅ **Test coverage: 100%** (statements, functions, lines)
6. ✅ Integration tests passing
7. ✅ All files in allowed directories
8. ✅ All documentation present
9. ✅ Training quality ≥ 8

**If ANY requirement fails**:
- **BLOCK PR creation immediately**
- Report specific failures
- Do NOT proceed until all pass
- Reference: `.claude/docs/references/pre-submission-checklist.md`

**Pre-flight Checks**:

**Validation**: Run Checkpoint K: File Location Compliance
- See `.claude/docs/references/validation-checkpoints.md` for file location rules
- See `.claude/docs/references/cicd-file-restrictions.md` for complete restrictions

```bash
# Check what files will be in the PR
git diff --name-only origin/main...HEAD

# Manually verify all files are in allowed locations:
# - bin/, lib/, test/, tests/ folders
# - metadata.json, cdk.json, cdktf.json, Pulumi.yaml, tap.py, tap.go, package.json, package-lock.json at root
# NO files in .github/, scripts/, docs/, or other locations
```

**If violations found**: STOP, fix file locations, do NOT proceed

**Validation**: Run Checkpoint L: PR Prerequisites
- See `.claude/docs/references/validation-checkpoints.md` for prerequisite checks

Script reference:
```bash
# See .claude/scripts/preflight-checks.sh for implementation
bash .claude/scripts/preflight-checks.sh
```

**Steps**:

1. **Verify worktree location**:
   ```bash
   pwd  # Should end with: /worktree/synth-{task_id}
   ```

2. **Validate training quality**:

**Validation**: Run Checkpoint J: Training Quality Threshold
- See `.claude/docs/references/validation-checkpoints.md` for threshold check
- Minimum: 8, Target: 9

```bash
TRAINING_QUALITY=$(jq -r '.training_quality // 0' metadata.json)

if [ "$TRAINING_QUALITY" -lt 8 ]; then
  echo "❌ Training quality ($TRAINING_QUALITY) below minimum 8"
  echo "Actions: Review MODEL_FAILURES.md, add features, re-assess"
  exit 1
fi

echo "✅ Training quality validated: $TRAINING_QUALITY/10"
```

If fails: Return to PHASE 4, improve implementation, re-validate

3. **Stage changes**:
   ```bash
   git add .
   git status  # Review what will be committed
   ```

4. **Commit with standardized message**:

**CRITICAL FORMAT**: Subject MUST start with lowercase (commitlint validation)

```bash
# Extract metadata
TASK_ID=$(jq -r '.po_id' metadata.json)
SUBTASK=$(jq -r '.subtask' metadata.json)
PLATFORM=$(jq -r '.platform' metadata.json)
LANGUAGE=$(jq -r '.language' metadata.json)
COMPLEXITY=$(jq -r '.complexity' metadata.json)
TRAINING_QUALITY=$(jq -r '.training_quality' metadata.json)

# Convert SUBTASK to lowercase for subject
SUBTASK_LOWER=$(echo "${SUBTASK}" | tr '[:upper:]' '[:lower:]')

git commit -m "feat(synth-${TASK_ID}): ${SUBTASK_LOWER}

Platform: ${PLATFORM}-${LANGUAGE}
Complexity: ${COMPLEXITY}
Training Quality: ${TRAINING_QUALITY}/10

Task ID: ${TASK_ID}"
```

**Example**:
- ✅ CORRECT: `feat(synth-123): add infrastructure implementation`
- ❌ WRONG: `feat(synth-123): Add infrastructure implementation` (fails CI)

5. **Push branch**:
   ```bash
   BRANCH_NAME=$(git branch --show-current)
   git push origin ${BRANCH_NAME}
   ```

6. **Create PR**:
   ```bash
   AWS_SERVICES_COUNT=$(jq -r '.aws_services | length' metadata.json)
   SYNTH_GROUP=$(jq -r '.synth_group' ../../.claude/settings.local.json)

   gh pr create \
     --title "synth-${TASK_ID} {SUBTASK}" \
     --body "**Platform**: ${PLATFORM}-${LANGUAGE}
**Complexity**: ${COMPLEXITY}
**Training Quality**: ${TRAINING_QUALITY}/10
**AWS Services**: ${AWS_SERVICES_COUNT} services

Auto-generated infrastructure task.

Task ID: ${TASK_ID}

### Description
This PR contains auto-generated Infrastructure as Code for the specified task.

### IAC Link
[IAC-${TASK_ID}](https://labeling-z.turing.com/conversations/${TASK_ID}/view)

### PR Checklist
- [x] Code includes appropriate test coverage
- [x] Code includes proper integration tests
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Code properly commented
- [x] Prompt follows proper markdown format
- [x] Ideal response follows proper markdown format
- [x] Model response follows proper markdown format
- [x] Code in ideal response and tapstack are the same" \
     --base main \
     --head ${BRANCH_NAME} \
     --label "${SYNTH_GROUP}"
   ```

7. **Capture PR number**:
   ```bash
   PR_NUMBER=$(gh pr view ${BRANCH_NAME} --json number -q .number)

   if [ -z "$PR_NUMBER" ]; then
     echo "❌ Failed to capture PR number"
     exit 1
   fi

   echo "✅ Created PR #${PR_NUMBER}"
   PR_URL=$(gh pr view ${PR_NUMBER} --json url -q .url)
   echo "📎 PR URL: ${PR_URL}"
   ```

8. **Update CSV status**:
   ```bash
   cd ../..  # Return to main repo

   if [ ! -f ".claude/tasks.csv" ]; then
     echo "❌ ERROR: .claude/tasks.csv not found at $(pwd)"
     exit 1
   fi

   # Thread-safe CSV update (uses file locking for parallel execution)
   ./.claude/scripts/task-manager.sh mark-done "${TASK_ID}" "${PR_NUMBER}"

   if [ $? -ne 0 ]; then
     echo "❌ Failed to update .claude/tasks.csv"
     exit 1
   fi
   ```

9. **Cleanup worktree**:
   ```bash
   git worktree remove worktree/synth-${TASK_ID} --force
   git worktree list
   echo "✅ Worktree cleaned up. Branch synth-${TASK_ID} remains for PR."
   ```

10. **Final validation**:
    ```bash
    gh pr view ${PR_NUMBER} --json state,url,title

    if [ ! -d "worktree/synth-${TASK_ID}" ]; then
      echo "✅ Cleanup successful"
    else
      echo "⚠️ Worktree directory still exists"
    fi
    ```

**Note**: Branch `synth-{task_id}` remains for PR. GitHub auto-deletes after merge.

### Setup Worktree

**CRITICAL: Strict worktree structure enforcement**

1. **Extract task ID and check for existing directory**:
   ```bash
   # Clean up any stale task JSON files older than 1 hour (from failed previous runs)
   find .claude/task-*.json -type f -mmin +60 -delete 2>/dev/null || true
   
   # Extract task_id from iac-task-selector's JSON file (should exist)
   # Find the task JSON file created by iac-task-selector
   TASK_JSON_FILES=(.claude/task-*.json)
   if [ ! -f "${TASK_JSON_FILES[0]}" ]; then
       echo "❌ ERROR: No task JSON file found in .claude/"
       echo "   iac-task-selector should have created .claude/task-{task_id}.json"
       exit 1
   fi
   
   # Extract TASK_ID from the JSON file
   TASK_JSON=$(cat "${TASK_JSON_FILES[0]}")
   
   # Validate JSON is not empty and contains task_id
   if [ -z "$TASK_JSON" ] || ! echo "$TASK_JSON" | grep -q '"task_id"'; then
       echo "❌ ERROR: Invalid or empty JSON in task file: ${TASK_JSON_FILES[0]}"
       rm -f "${TASK_JSON_FILES[0]}"
       exit 1
   fi
   
   TASK_ID=$(echo "$TASK_JSON" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
   
   if [ -z "$TASK_ID" ]; then
       echo "❌ ERROR: Could not extract task_id from JSON file"
       rm -f "${TASK_JSON_FILES[0]}"
       exit 1
   fi
   
   echo "📋 Task ID: $TASK_ID"
   
   # Check if directory already exists (should not, but handle gracefully)
   WORKTREE_DIR="worktree/synth-${TASK_ID}"
   
   if [ -d "$WORKTREE_DIR" ]; then
       # Check if it's already a git worktree
       if [ -f "$WORKTREE_DIR/.git" ] || [ -d "$WORKTREE_DIR/.git" ]; then
           echo "⚠️  Worktree directory already exists and appears to be a git worktree"
           echo "   Skipping worktree creation, using existing worktree"
       else
           echo "❌ ERROR: Directory $WORKTREE_DIR exists but is not a git worktree"
           echo "   This should not happen - iac-task-selector should not create directories"
           echo "   Please remove the directory manually and retry"
           exit 1
       fi
   else
       # REQUIRED format - do not deviate:
       if ! git worktree add "$WORKTREE_DIR" -b synth-${TASK_ID}; then
           echo "❌ ERROR: Failed to create git worktree"
           echo "   Possible causes:"
           echo "   - Branch synth-${TASK_ID} already exists"
           echo "   - Permission issues"
           echo "   - Git repository corruption"
           echo "   Cleaning up temporary task JSON file..."
           rm -f ".claude/task-${TASK_ID}.json"
           exit 1
       fi
       echo "✅ Created git worktree: $WORKTREE_DIR"
   fi
   ```

   **Naming Rules**:
   - Directory: MUST be `worktree/synth-${TASK_ID}` (with forward slash)
   - Branch: MUST be `synth-${TASK_ID}` (matching directory name)
   - ❌ WRONG: `worktree-synth-${TASK_ID}`, `worktrees/`, `IAC-synth-${TASK_ID}`
   - ✅ CORRECT: `worktree/synth-${TASK_ID}`

2. **Load task data and create metadata.json/PROMPT.md**:
   ```bash
   # Store main repo root path before changing directories
   MAIN_REPO_ROOT="$(pwd)"
   
   # TASK_ID and TASK_JSON are already set from step 1
   # Set absolute path for cleanup
   TASK_JSON_FILE=".claude/task-${TASK_ID}.json"
   TASK_JSON_FILE_ABS="$MAIN_REPO_ROOT/$TASK_JSON_FILE"
   
   # Change to worktree directory
   cd worktree/synth-${TASK_ID}
   
   # Create metadata.json and PROMPT.md inside the worktree
   if ! ./.claude/scripts/create-task-files.sh "$TASK_JSON" "."; then
       echo "❌ ERROR: Failed to create metadata.json and PROMPT.md"
       echo "   Cleaning up worktree..."
       cd "$MAIN_REPO_ROOT"
       git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
       rm -f "$TASK_JSON_FILE_ABS"
       exit 1
   fi
   
   echo "✅ Created metadata.json and PROMPT.md in worktree"
   
   # Clean up temporary task JSON file (using absolute path)
   rm -f "$TASK_JSON_FILE_ABS"
   echo "✅ Cleaned up temporary task JSON file"
   ```

3. **Verify worktree setup**:
   ```bash
   # MANDATORY: Run automated verification
   bash .claude/scripts/verify-worktree.sh || exit 1
   ```

   **From this point forward, ALL commands run from this directory unless explicitly stated.**

4. **Validate worktree setup** (AUTOMATED):

   The `verify-worktree.sh` script automatically checks:
   - ✅ Location matches pattern: `*/worktree/synth-{task_id}`
   - ✅ Branch matches directory name
   - ✅ metadata.json exists (created in step 2)
   - ✅ Not on main/master branch
   - ✅ Exports environment variables ($WORKTREE_DIR, $TASK_ID, $TASK_BRANCH)

   **Manual verification (only if automated script fails)**:
   ```bash
   # Verify location
   pwd  # Must end with: /worktree/synth-{task_id}

   # Verify branch
   CURRENT_BRANCH=$(git branch --show-current)
   if [ "$CURRENT_BRANCH" != "synth-{task_id}" ]; then
     echo "❌ ERROR: Wrong branch. Expected synth-{task_id}, got $CURRENT_BRANCH"
     exit 1
   fi

   # Verify .claude instructions present
   if [ ! -f .claude/commands/task-coordinator.md ]; then
     echo "❌ ERROR: .claude instructions not found"
     exit 1
   fi

   echo "✅ Worktree structure validated"
   ```

   **If validation fails, STOP immediately and report BLOCKED.**

5. **Read platform enforcement**:
   - Must read `.claude/platform_enforcement.md`
   - Transform task to use platform+language declared in that file
   - Override platform+language from task description if different

6. **Multi-cloud check**:
   - If multi-cloud task, notify user and STOP
   - This project is AWS-only

7. **Working Directory Context**:
   - Now in: `worktree/synth-{task_id}/`
   - All file paths relative to this directory
   - All sub-agents work in this directory
   - Do not return to main repo until PHASE 5

8. **Verify metadata.json** (CRITICAL - should already exist from step 2):

```bash
# Verify metadata.json exists (created in step 2)
if [ ! -f "metadata.json" ]; then
    echo "❌ ERROR: metadata.json not found - step 2 should have created it"
    echo "   This indicates a failure in the file creation process"
    exit 1
fi

# Validate required fields are present
REQUIRED_FIELDS=("platform" "language" "complexity" "turn_type" "team" "startedAt" "subtask" "po_id")
MISSING_FIELDS=()

for field in "${REQUIRED_FIELDS[@]}"; do
    if ! grep -q "\"$field\":" metadata.json; then
        MISSING_FIELDS+=("$field")
    fi
done

if [ ${#MISSING_FIELDS[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing required fields in metadata.json: ${MISSING_FIELDS[*]}"
    exit 1
fi

echo "✅ metadata.json validated - all required fields present"
```

**Note**: `metadata.json` is created automatically in step 2 using `create-task-files.sh` which:
- Extracts platform and language from CSV task data (MANDATORY constraints)
- Sets `complexity` = EXACT value from CSV `difficulty` column
- Sets `team` from `.claude/settings.local.json` or defaults to "synth"
- Sets `turn_type` = "single"
- Sets `startedAt` = current timestamp
- Extracts `subtask` and `subject_labels` from CSV
- Sets `po_id` = task_id

Example metadata.json:
```json
{
  "platform": "cdk",
  "language": "ts",
  "complexity": "hard",
  "turn_type": "single",
  "po_id": "trainr97",
  "team": "synth",
  "startedAt": "2025-08-12T13:19:10-05:00",
  "subtask": "Application Deployment",
  "subject_labels": ["CI/CD Pipeline", "Security Configuration"],
  "aws_services": [],
}
```

**CRITICAL**: `aws_services` must be initialized as an empty array `[]`. It will be populated by iac-code-reviewer based on implemented services.

**Validate immediately**:
```bash
bash scripts/detect-metadata.sh
```

If fails, fix before proceeding. Common errors: missing team, startedAt, subtask, subject_labels, using "difficulty" instead of "complexity"

**Region setup** (if needed):
```bash
echo "us-east-1" > lib/AWS_REGION  # or specified region
```

### Context Optimization (Cost Reduction)

**Purpose**: Minimize redundant file reads and context loading.

**Guidelines for All Sub-Agents**:

1. **Cache Frequently Accessed Files**:
   - Read `metadata.json` once, reference cached content
   - Template files loaded once per phase
   - Use file modification timestamps to detect changes

2. **Avoid Redundant Operations**:
   - Check if file content already available before re-reading
   - Use `ls -l --time-style=full-iso` for modification times
   - Skip re-reading unchanged files

3. **Efficient Context Management**:
   - Check file sizes before comparing (e.g., IDEAL_RESPONSE vs TapStack)
   - Use checksums (md5sum/sha256sum) for quick equality checks
   - Load only necessary portions of large files

4. **Cross-Phase Communication**:
   - Document modified files per phase
   - Next phase skips validation of unmodified files
   - Share key metadata across phases without re-extraction

**Cost Impact**: 2-4% token reduction by eliminating redundant reads

8. **Install dependencies**:
```bash
# Python: pipenv install --dev --ignore-pipfile
# Not Python: npm ci
# If fails, report BLOCKED with error details
```

9. **Pass complete task context to iac-infra-generator**:
- Full task description including:
  - Background context
  - Problem statement
  - Environment/technology requirements
  - Specific constraints (region, security, compliance)
  - ALL AWS services mentioned
  - Platform and language from metadata.json (MANDATORY)
- **Do NOT summarize or paraphrase** - pass complete requirements
- Generator MUST honor platform/language from metadata.json

10. **Use selected task description for workflow. Start workflow.**
    - Report final status before handoff

**Important**: Do not generate `/lib/PROMPT.md` - delegate to subagent. Send COMPLETE task info including all constraints.

## Task Completion Requirements

If unable to finish task: set task status in CSV as "error" and put error info in trainr_notes column.

### Error Handling for PR Creation Failures (ENHANCED)

If PR creation fails:

1. **Capture error**:
   ```bash
   ERROR_MESSAGE="<detailed error>"
   ERROR_STEP="<step: commit/push/pr-create/csv-update>"
   ERROR_TYPE="<auth|network|git|permission|other>"
   ```

2. **Classify error type**:
   ```bash
   # Transient errors (should retry)
   TRANSIENT_ERRORS=("network" "timeout" "rate limit" "temporary" "connection")
   
   # Permanent errors (should not retry)
   PERMANENT_ERRORS=("permission denied" "invalid" "not found" "conflict" "already exists")
   ```

3. **Retry logic for transient errors**:
   ```bash
   MAX_RETRIES=3
   RETRY_DELAY=5  # seconds
   
   # Use retry-operation.sh script
   if echo "$ERROR_MESSAGE" | grep -qiE "$(IFS='|'; echo "${TRANSIENT_ERRORS[*]}")"; then
     echo "⚠️ Transient error detected, attempting retry..."
     if bash .claude/scripts/retry-operation.sh \
       "retry_${ERROR_STEP}_operation" \
       "$MAX_RETRIES" \
       "$RETRY_DELAY"; then
       echo "✅ Retry succeeded!"
       # Continue with normal flow
       exit 0
     fi
   fi
   ```

4. **Update CSV with error** (only if all retries failed):
   ```bash
   cd ../../  # Return to main repo if needed

   # Thread-safe error marking (uses file locking)
   ./.claude/scripts/task-manager.sh mark-error "${TASK_ID}" \
     "${ERROR_MESSAGE} (after ${MAX_RETRIES} retries)" \
     "${ERROR_STEP}"
   ```

5. **Report with recovery options**:
   ```
   ❌ Task ${TASK_ID} failed at ${ERROR_STEP}
   Error: ${ERROR_MESSAGE}
   Retries attempted: ${attempt}/${MAX_RETRIES}
   
   Recovery:
   - Auth issues: Run 'gh auth login' and retry PHASE 5
   - Network issues: Check connectivity and retry
   - Permission issues: Verify repository write access
   - Git issues: Check branch state and remote status
   ```

**Additional**:
- If issue in task description blocks deployment and can block future tasks, document in `.claude/lessons_learnt.md`

## Status Reporting Requirements

Always report in each log: taskId and deployment region (default: us-east-1).

All subagents MUST report using this format:

```markdown
**AGENT STATUS**: PHASE X.Y - [STATUS] - [CURRENT_STEP]
**TASK**: [Specific task being worked on]
**PROGRESS**: [X.Y/Z] phases completed
**NEXT ACTION**: [Next planned action]
**ISSUES**: [Blocking issues or NONE]
**BLOCKED**: [YES/NO - If YES, explain and resolution needed]
```

**Note**: Use standardized phase names (e.g., `PHASE 1.2`, `PHASE 2`, `PHASE 3`) as defined in `.claude/docs/references/phase-naming-convention.md`.

**Required Updates**:
- Start of execution
- Step completion
- Error encounters
- Blocking situations
- Phase completion

See `.claude/docs/references/error-handling.md` for detailed status reporting patterns.

## Usage

When presented with IaC task:

1. **Task Selection**: Use `iac-task-selector`
2. **Generate**: Use `iac-infra-generator` for initial implementation
3. **Validate**: Use `iac-infra-qa-trainer` to test and perfect solution
4. **Review**: Use `iac-code-reviewer` for production readiness

### Coordination Protocol

The coordinator will:
- Monitor sub-agent status reports
- Intervene when BLOCKED: YES reported
- Facilitate resolution by providing context/resources
- Ensure proper handoff between phases
- Maintain workflow visibility
- Escalate to user when multiple agents blocked requiring external resolution

### Issue Resolution Process

When sub-agents report issues:

1. **Non-blocking**: Log issue, monitor for escalation
2. **Blocking**: Coordinator immediately:
   - Analyzes blocking condition
   - Attempts automated resolution (file access, dependencies, etc.)
   - Provides specific guidance if unable to auto-resolve
   - Escalates to user with detailed description if automated resolution fails

This approach ensures robust, tested, compliant infrastructure code with full transparency and proactive issue resolution.
