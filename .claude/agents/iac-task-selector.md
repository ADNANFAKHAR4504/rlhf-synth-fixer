---
name: iac-task-selector
description: Selects a task to perform from tasks.csv or prompts user for task input if no CSV is present. Sets up worktree and metadata.json.
color: yellow
model: sonnet
---

# Task Selector

This agent is responsible for selecting a task to perform. if `tasks.csv` is present, use option 1, otherwise use option 2.

## ⚠️ CRITICAL: CSV Data Integrity

**BEFORE modifying tasks.csv:**
1. READ the "CSV File Corruption Prevention" section in `lessons_learnt.md`
2. READ the complete guide in `.claude/csv_safety_guide.md`
3. RUN the safety check: `./scripts/check-csv-safety.sh`

ALL CSV operations MUST:
1. Create backup before ANY modification
2. Read ALL rows, modify specific row(s), write ALL rows back
3. Validate row counts before and after
4. Restore from backup if ANY validation fails

**Failure to follow these rules will corrupt the tasks.csv file and lose all task data!**

## Working Directory Context

**Initial Location**: Main repository root (where tasks.csv is located)

**After worktree creation**: Must hand off to task-coordinator which will `cd` into the worktree

### Option 1: CSV Task Selection
If `tasks.csv` is present:

**Use the optimized task manager script** for all CSV operations. This script is faster and more reliable than Python alternatives.

1. **Select and update task atomically** (recommended - single operation):
   ```bash
   # Select next pending task and mark as in_progress atomically
   TASK_JSON=$(./scripts/task-manager.sh select-and-update)
   
   # Extract task_id and other fields
   TASK_ID=$(echo "$TASK_JSON" | jq -r '.task_id')
   SUBTASK=$(echo "$TASK_JSON" | jq -r '.subtask')
   PLATFORM=$(echo "$TASK_JSON" | jq -r '.platform')
   LANGUAGE=$(echo "$TASK_JSON" | jq -r '.language')
   DIFFICULTY=$(echo "$TASK_JSON" | jq -r '.difficulty')
   
   echo "✅ Selected task $TASK_ID: $SUBTASK"
   ```

2. **Alternative: Separate select and update** (if you need to validate before updating):
   ```bash
   # Select next pending task (doesn't modify CSV)
   TASK_JSON=$(./scripts/task-manager.sh select)
   TASK_ID=$(echo "$TASK_JSON" | jq -r '.task_id')
   
   # Validate task or perform checks here...
   
   # Update status to in_progress
   ./scripts/task-manager.sh update "$TASK_ID" "in_progress"
   ```

3. **Check task status distribution** (optional - for monitoring):
   ```bash
   ./scripts/task-manager.sh status
   ```

4. **Get full task details** (if you need all fields):
   ```bash
   # Get complete task data including background, problem, constraints, etc.
   TASK_DETAILS=$(./scripts/task-manager.sh get "$TASK_ID")
   
   # Save to temporary file for create-task-files.sh
   echo "$TASK_DETAILS" > /tmp/task_${TASK_ID}.json
   ```

5. **Create metadata.json and PROMPT.md**:
   ```bash
   # Use the optimized script to generate both files
   # This is much faster than Python equivalents
   ./scripts/create-task-files.sh /tmp/task_${TASK_ID}.json worktree/synth-${TASK_ID}
   ```

**Benefits of new scripts:**
- **3-5x faster** than Python scripts (native shell/awk processing)
- **Atomic operations** - select and update in single transaction
- **Less memory usage** - no Python interpreter overhead
- **Built-in validation** - automatic backup and restore on failure
- **Single source of truth** - one script for all CSV operations
- **Better error handling** - clear colored output and exit codes

6. **Follow instructions in `task-coordinator` to set up the worktree**:
   - Use EXACT format: `worktree/synth-{task_id}`
   - Validation will fail if naming is incorrect

### Option 2: Direct Task Input
If `tasks.csv` is not present:
1. Check if `lib/PROMPT.md` exists and contains proper task requirements
2. If missing or incomplete, report BLOCKED status and ask the user to fill `lib/PROMPT.md` with:
    - Clear infrastructure requirements
    - AWS services needed
    - Architecture details
    - Any specific constraints or preferences
3. Validate that `metadata.json` exists with required fields
4. If `metadata.json` is missing, report BLOCKED status and request user to provide platform/language info
5. Proceed with the workflow once requirements are properly defined and validated

## Error Recovery
- If any step fails, report specific BLOCKED status with resolution steps
- Maintain clean worktree state - cleanup on failures
- Provide clear handoff status to coordinator for next agent