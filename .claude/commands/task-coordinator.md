# Task Coordinator

Orchestrates the complete Infrastructure as Code development lifecycle by coordinating three specialized sub-agents.

## ⚠️ CRITICAL: Commit Message Requirements

**ALL commits MUST follow conventional commits format with lowercase subject:**

- Format: `<type>(<scope>): <subject in lowercase>`
- ✅ CORRECT: `feat(synth-{task_id}): add infrastructure for healthcare`
- ❌ WRONG: `feat(synth-{task_id}): Add infrastructure for healthcare`

The CI/CD pipeline validates commits using `commitlint` and will **FAIL** if the subject starts with uppercase. See Phase 5 for detailed commit instructions.

## Workflow

Execute these phases in sequence to deliver production-ready IaC:

### Phase 1: Task Selection

**Agent**: `iac-task-selector`

### Phase 2: Code Generation

**Agent**: `iac-infra-generator`

### Phase 3: QA Training & Validation

**Agent**: `iac-infra-qa-trainer`

### Phase 4: Code Review & Compliance

**Agent**: `iac-code-reviewer`

- **Cost-Optimized Iteration Logic**: If the `lib/MODEL_FAILURES.md` file reports minimal issues (not big deployment 
  issues deploying the MODEL_RESPONSE) AND `training_quality` score < 6, consider requesting iac-infra-generator to 
  add 1 additional AWS feature or service to increase task complexity.
  - **Maximum 1 additional iteration** to avoid excessive regeneration cycles
  - Only iterate if the current task would provide limited training value (score < 6)
  - The goal is to ensure meaningful differences between MODEL_RESPONSE.md and IDEAL_RESPONSE.md
  - Skip iteration if training_quality >= 6 (already provides good training value)
- **Cost Impact**: Reducing "always add 2 features" to "conditionally add 1 feature max" saves 5-10% by avoiding 
  unnecessary iterations

### Phase 5: PR Creation & Task Completion

**Agent**: `task-coordinator` (orchestrates final steps)

**Prerequisites**: 
- Phase 4 (code-reviewer) reports "Ready"
- GitHub CLI (`gh`) is installed and authenticated
- Git remote origin is accessible
- User has write permissions to the repository

**Pre-flight Checks**:
```bash
# Verify gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Verify gh CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

# Verify we're in the correct worktree directory
if [[ ! $(pwd) =~ worktree/synth-[^/]+$ ]]; then
    echo "❌ Not in worktree directory. Current: $(pwd)"
    exit 1
fi

echo "✅ Pre-flight checks passed"
```

**Steps**:

1. **Verify you're in worktree directory**:
   ```bash
   pwd  # Should end with: /worktree/synth-{task_id}
   ```

2. **Stage all changes**:
   ```bash
   git add .
   git status  # Review what will be committed
   ```

3. **Commit with standardized message**:
   
   **CRITICAL COMMIT MESSAGE FORMAT**: The CI/CD pipeline validates commits using `commitlint` with conventional commits format.
   
   **Requirements**:
   - Subject (text after colon and space) MUST start with lowercase letter
   - Format: `<type>(<scope>): <subject in lowercase>`
   - The pipeline will FAIL if subject starts with uppercase
   
   ```bash
   # Extract metadata for commit message
   TASK_ID=$(jq -r '.po_id' metadata.json)
   SUBTASK=$(jq -r '.subtask' metadata.json)
   PLATFORM=$(jq -r '.platform' metadata.json)
   LANGUAGE=$(jq -r '.language' metadata.json)
   COMPLEXITY=$(jq -r '.complexity' metadata.json)
   TRAINING_QUALITY=$(jq -r '.training_quality' metadata.json)
   
   # IMPORTANT: Convert SUBTASK to lowercase for subject
   SUBTASK_LOWER=$(echo "${SUBTASK}" | tr '[:upper:]' '[:lower:]')
   
   git commit -m "feat(synth-${TASK_ID}): ${SUBTASK_LOWER}

Platform: ${PLATFORM}-${LANGUAGE}
Complexity: ${COMPLEXITY}
Training Quality: ${TRAINING_QUALITY}/10

Task ID: ${TASK_ID}"
   ```
   
   **Example CORRECT commit**:
   ```
   feat(synth-{task_id}): add infrastructure implementation
   ```
   
   **Example WRONG commit** (will fail CI):
   ```
   feat(synth-{task_id}): Add infrastructure implementation  # Capital 'A' will fail
   ```

4. **Push branch to remote**:
   ```bash
   BRANCH_NAME=$(git branch --show-current)
   git push origin ${BRANCH_NAME}
   ```

5. **Create PR using gh CLI**:
   ```bash
   # Get AWS services count
   AWS_SERVICES_COUNT=$(jq -r '.aws_services | length' metadata.json)
   
   # Create PR with error handling
   if gh pr create \
     --title "Task ${TASK_ID}: ${SUBTASK}" \
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
- [x] Code follows the style guidelines
- [x] Self-review completed
- [x] Code properly commented
- [x] Prompt follows proper markdown format
- [x] Ideal response follows proper markdown format
- [x] Model response follows proper markdown format
- [x] Code in ideal response and tapstack are the same" \
     --base main \
     --head ${BRANCH_NAME} \
     --label "automated" \
     --label "complexity-${COMPLEXITY}"; then
     echo "✅ PR created successfully"
   else
     echo "❌ Failed to create PR. Checking if gh CLI is authenticated..."
     gh auth status
     echo "ERROR: PR creation failed. Task status will be updated to 'error'."
     exit 1
   fi
   ```

6. **Capture PR number and validate**:
   ```bash
   # Capture PR number with retry logic
   PR_NUMBER=$(gh pr view ${BRANCH_NAME} --json number -q .number)
   
   if [ -z "$PR_NUMBER" ]; then
     echo "❌ Failed to capture PR number"
     exit 1
   fi
   
   echo "✅ Created PR #${PR_NUMBER}"
   
   # Verify PR was created successfully
   PR_URL=$(gh pr view ${PR_NUMBER} --json url -q .url)
   echo "📎 PR URL: ${PR_URL}"
   ```

7. **Update CSV status to "done"**:
   ```bash
   # Return to main repo to update CSV
   cd ../..
   
   # Verify we're in the correct directory
   if [ ! -f "tasks.csv" ]; then
     echo "❌ ERROR: tasks.csv not found. Current directory: $(pwd)"
     exit 1
   fi
   
   # Update tasks.csv (using Python for safe CSV handling)
   python3 << 'PYTHON_SCRIPT'
import csv
import sys

task_id = "${TASK_ID}"
pr_number = "${PR_NUMBER}"

try:
    # Read CSV
    rows = []
    updated = False
    with open('tasks.csv', 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if row['task_id'] == task_id and row['status'] == 'in_progress':
                row['status'] = 'done'
                row['trainr_notes'] = f"Completed - PR #{pr_number}"
                updated = True
            rows.append(row)

    # Write back
    if updated:
        with open('tasks.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"✅ Updated task {task_id} status to 'done' with PR #{pr_number}")
    else:
        print(f"⚠️ Task {task_id} not found or not in 'in_progress' status")
        sys.exit(1)
except Exception as e:
    print(f"❌ ERROR updating CSV: {e}")
    sys.exit(1)
PYTHON_SCRIPT
   
   if [ $? -ne 0 ]; then
     echo "❌ Failed to update tasks.csv"
     exit 1
   fi
   ```

8. **Cleanup worktree**:
   ```bash
   # Remove worktree (keeps branch for PR)
   git worktree remove worktree/synth-${TASK_ID} --force
   
   # Verify cleanup
   git worktree list
   echo "✅ Worktree cleaned up. Branch synth-${TASK_ID} remains for PR."
   ```

9. **Final validation**:
   ```bash
   # Verify PR was created
   gh pr view ${PR_NUMBER} --json state,url,title
   
   # Verify worktree is cleaned up
   if [ ! -d "worktree/synth-${TASK_ID}" ]; then
     echo "✅ Cleanup successful"
   else
     echo "⚠️ Worktree directory still exists"
   fi
   ```

**Note**: Branch `synth-{task_id}` remains active for the PR. GitHub will auto-delete it after PR merge.


### Setup Worktree

**CRITICAL: Strict worktree structure enforcement**

1. **Create git worktree with EXACT naming convention**:
   ```bash
   # REQUIRED format - do not deviate from this:
   git worktree add worktree/synth-{task_id} -b synth-{task_id}
   ```
   
   **Naming Rules**:
   - Directory: MUST be `worktree/synth-{task_id}` (with forward slash)
   - Branch: MUST be `synth-{task_id}` (matching the directory name)
   - ❌ WRONG: `worktree-synth-{task_id}`, `worktrees/`, `worktree-{task_id}`, `IAC-synth-{task_id}`
   - ✅ CORRECT: `worktree/synth-{task_id}`

2. **Immediately change to worktree directory**:
   ```bash
   cd worktree/synth-{task_id}
   ```
   
   **From this point forward, ALL commands run from this directory unless explicitly stated otherwise.**

3. **Validate worktree setup before proceeding**:
   ```bash
   # Verify correct location
   pwd  # Must end with: /worktree/synth-{task_id}
   
   # Verify correct branch
   CURRENT_BRANCH=$(git branch --show-current)
   if [ "$CURRENT_BRANCH" != "synth-{task_id}" ]; then
     echo "❌ ERROR: Wrong branch. Expected synth-{task_id}, got $CURRENT_BRANCH"
     exit 1
   fi
   
   # Verify .claude instructions are present
   if [ ! -f .claude/commands/task-coordinator.md ]; then
     echo "❌ ERROR: .claude instructions not found. Worktree not created from main branch."
     exit 1
   fi
   
   echo "✅ Worktree structure validated successfully"
   ```
   
   **If validation fails, STOP immediately and report BLOCKED status.**

4. Must read `.claude/platform_enforcement.md` and transform the task to use the platform and language declared in that file.
   instead of the platform+language declared in the task description.

5. If its a multi-cloud task, notify the user and stop every execution. This project is only for AWS tasks.

6. **Working Directory Context**:
   - You are now in: `worktree/synth-{task_id}/`
   - All file paths are relative to this directory
   - All sub-agents will work in this directory
   - Do not return to main repo until Phase 5 (PR creation)
7. **Generate metadata.json with ALL required fields** (CRITICAL - validation will fail if any field is missing):
    - If `metadata.json` is not present, extract platform and language from the selected task
    - Validate `cli/create-task.ts` exists before mimicking its actions
    - If `cli/create-task.ts` is missing, use fallback platform detection logic:
    - Determine platform (cdk, cdktf, cfn, tf, pulumi) from task description
    - Determine language (ts, py, yaml, json, hcl) from task description
    - Prefer TypeScript for tests only, avoid Python where possible (unless the project is in python e.g. pulumi-py, cdktf-py)
    - Set `complexity` (NOT "difficulty") from CSV difficulty field
    - Set `team` as "synth" (REQUIRED - validation will fail without this)
    - Set `startedAt` as current timestamp using `date -Iseconds` (REQUIRED - validation will fail without this)
    - **Extract `subtask` and `subject_labels` from tasks.csv** (REQUIRED - validation will fail without these):
      - Read the selected task row from tasks.csv
      - Get the `subtask` value from the subtask column
      - Get the `subject_labels` value from the subject_labels column (parse as JSON array)
      - Both fields MUST be included in metadata.json
    - Do not add more fields to metadata.json than the ones shown in the example below
    - Validate `templates/` directory exists and contains required platform template
    - If template missing, report BLOCKED status with specific template needed
    - Copy appropriate template from `templates/` directory
    - Generate `metadata.json` with ALL required fields. Set `po_id` field to the task_id value. Example:

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
       "subject_labels": ["CI/CD Pipeline", "Security Configuration as Code"]
     }
   ```

   - **Validate metadata.json immediately after creation**:
     - Run: `bash scripts/detect-metadata.sh` to verify all required fields are present
     - If validation fails, fix the metadata.json before proceeding
     - Common errors: missing `team`, missing `startedAt`, missing `subtask`, missing `subject_labels`, using `difficulty` instead of `complexity`
   - If the deployment needs to be done in a specific region, create the file `lib/AWS_REGION` with the
     region name. e.g: `echo "us-east-1" > lib/AWS_REGION`

### Context Optimization (Cost Reduction Strategy)

**Purpose**: Minimize redundant file reads and context loading across agent phases.

**Guidelines for All Sub-Agents**:

1. **Cache Frequently Accessed Files**:
   - Read `metadata.json` once and reference the cached content across operations
   - Template files should be loaded once per phase, not repeatedly
   - Use file modification timestamps to detect changes before re-reading

2. **Avoid Redundant File Operations**:
   - Before reading a file, check if you already have its current content
   - Use `ls -l --time-style=full-iso` to check modification times
   - Skip re-reading files that haven't changed since last access

3. **Efficient Context Management**:
   - When comparing files (e.g., IDEAL_RESPONSE vs TapStack), check file sizes first
   - Use checksums (md5sum/sha256sum) for quick equality checks before detailed comparison
   - Load only necessary portions of large files when possible

4. **Cross-Phase Communication**:
   - Each phase should document what files it modified
   - Next phase can skip validation of unmodified files
   - Share key metadata across phases without re-extraction

**Cost Impact**: These optimizations reduce token usage by 2-4% across all phases by eliminating redundant reads.

8. Install dependencies inside the worktree with error handling:
    - If language is py: `pipenv install --dev --ignore-pipfile`
    - If language is not py: `npm ci`
    - If installation fails, report BLOCKED status with error details
9. Use the selected task description for the workflow. Start the workflow.
    - Report final status before handoff to next agent

Important: Do not generate the `/lib/PROMPT.md` code, delegate that to the subagent. Send the task information to the generator agent


## Task Completion Requirements
Important: If, for any reason, you're unable to finish the task. set the task status in the csv as "error" and put the error
information inside the trainr_notes column of that task.

### Error Handling for PR Creation Failures

If PR creation fails at any step:

1. **Capture the error details**:
   ```bash
   ERROR_MESSAGE="<detailed error description>"
   ERROR_STEP="<which step failed: commit/push/pr-create/csv-update>"
   ```

2. **Update CSV with error status**:
   ```bash
   cd ../../  # Return to main repo if not already there
   
   python3 << 'PYTHON_SCRIPT'
import csv
import sys

task_id = "${TASK_ID}"
error_msg = "${ERROR_MESSAGE}"
error_step = "${ERROR_STEP}"

try:
    rows = []
    updated = False
    with open('tasks.csv', 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if row['task_id'] == task_id and row['status'] == 'in_progress':
                row['status'] = 'error'
                row['trainr_notes'] = f"PR creation failed at {error_step}: {error_msg}"
                updated = True
            rows.append(row)

    if updated:
        with open('tasks.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"✅ Updated task {task_id} status to 'error'")
    else:
        print(f"⚠️ Task {task_id} not found or not in 'in_progress' status")
except Exception as e:
    print(f"❌ ERROR updating CSV: {e}")
    sys.exit(1)
PYTHON_SCRIPT
   ```

3. **Report to user with recovery options**:
   ```
   ❌ Task ${TASK_ID} failed at ${ERROR_STEP}
   Error: ${ERROR_MESSAGE}
   
   Recovery options:
   - For auth issues: Run 'gh auth login' and retry Phase 5
   - For network issues: Check connectivity and retry
   - For permission issues: Verify repository write access
   - For git issues: Check branch state and remote status
   ```

Additional:
- If you find an issue in the task description that blocks you from deploying the infrastructure properly, and its an issue
  that can block future tasks, document it in `.claude/lessons_learnt.md`

## Status Reporting Requirements
You must always report in each log, the taskId you're working on and the region specified for deployment (default is us-east-1).

All subagents MUST report their execution status to the coordinator using the following format:

### Status Format

```markdown
**AGENT STATUS**: [PHASE] - [STATUS] - [CURRENT_STEP]
**TASK**: [Specific task being worked on]
**PROGRESS**: [X/Y] steps completed
**NEXT ACTION**: [Description of next planned action]
**ISSUES**: [Any blocking issues or errors encountered - NONE if no issues]
**BLOCKED**: [YES/NO - If YES, explain blocking reason and required resolution]
```

### Required Status Updates

Each sub-agent must provide status updates at these key points:

- **Start of execution**: Report phase initiation with task description
- **Step completion**: Report after each major workflow step with current task
- **Error encounters**: Immediate status report when errors occur with blocking status
- **Blocking situations**: Report when unable to proceed and what's needed to continue
- **Phase completion**: Final status with outcomes and handoff details

### Agent-Specific Reporting
Please refer to the specific agent's documentation for reporting requirements.

## Usage

When presented with an IaC task:

1. **Task Selection**: Use `iac-task-selector` to choose the task
2. **Generate**: Use `iac-infra-generator` to create initial implementation
3. **Validate**: Use `iac-infra-qa-trainer` to test and perfect the solution
4. **Review**: Use `iac-code-reviewer` to ensure production readiness

### Coordination Protocol

The coordinator will:

- Monitor all sub-agent status reports for task progress and blocking issues
- Intervene immediately when agents report BLOCKED: YES status
- Facilitate resolution of blocking issues by providing additional context or resources
- Ensure proper handoff between phases with complete task and issue status
- Maintain overall workflow visibility with real-time status tracking
- Escalate to user when multiple agents report blocking issues that require external resolution

### Issue Resolution Process

When sub-agents report issues or blocking conditions:

1. **Non-blocking issues**: Coordinator logs the issue and monitors for escalation
2. **Blocking issues**: Coordinator immediately:
   - Analyzes the blocking condition reported by the sub-agent
   - Attempts automated resolution (file access, dependency installation, etc.)
   - If unable to resolve, provides specific guidance to the sub-agent
   - Escalates to user with detailed issue description if automated resolution fails

This coordinated approach ensures robust, tested, and compliant infrastructure code with full execution
transparency and proactive issue resolution.
