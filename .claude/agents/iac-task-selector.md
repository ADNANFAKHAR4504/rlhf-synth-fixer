---
name: iac-task-selector
description: Selects a task to perform from .claude/tasks.csv or prompts user for task input if no CSV is present. Sets up worktree and metadata.json.
color: yellow
model: sonnet
---

# Task Selector

This agent is responsible for selecting a task to perform. if `.claude/tasks.csv` is present, use option 1, otherwise use option 2.

## ⚠️ CRITICAL: CSV Data Integrity

**BEFORE modifying .claude/tasks.csv:**
1. READ the "CSV File Corruption Prevention" section in `.claude/lessons_learnt.md`
2. READ the complete guide in `.claude/docs/policies/csv_safety_guide.md`
3. RUN the safety check: `./.claude/scripts/check-csv-safety.sh`

ALL CSV operations MUST:
1. Create backup before ANY modification
2. Read ALL rows, modify specific row(s), write ALL rows back
3. Validate row counts before and after
4. Restore from backup if ANY validation fails

**Failure to follow these rules will corrupt the .claude/tasks.csv file and lose all task data!**

## Working Directory Context

**Initial Location**: Main repository root (where .claude/tasks.csv is located)

**After worktree creation**: Must hand off to task-coordinator which will `cd` into the worktree

### Option 1: CSV Task Selection
If `.claude/tasks.csv` is present:

**Use the optimized task manager script** for all CSV operations. This script is faster, more reliable than Python alternatives, and **safe for parallel execution**.

⚠️ **CRITICAL FOR PARALLEL EXECUTION**: 
- **ALWAYS use `select-and-update`** - This is the ONLY correct way to select tasks
- **NEVER use separate `select` and `update` calls** - This will cause race conditions
- **NEVER read .claude/tasks.csv directly** using `cat`, `grep`, `awk`, or any file read tool
- **NEVER use find-next-task.py** - This Python script lacks locking and causes race conditions
- **NEVER use jq to parse .claude/tasks.csv** - Always go through task-manager.sh
- The `select-and-update` command uses file locking with 120-second timeout
- Multiple agents can run simultaneously without selecting duplicate tasks
- The lock uses atomic `mkdir` operation which is safe across all processes

1. **Select and update task atomically** (REQUIRED - thread-safe for parallel execution):
   ```bash
   # Select next pending task and mark as in_progress atomically
   # This is thread-safe and can be run from multiple agents simultaneously
   #
   # Built-in race condition protections:
   # - Protection #1: Checks if worktree already exists
   # - Protection #2: Verifies CSV status before update (under lock)
   # - Protection #3: Verifies CSV status after update (under lock)
   #
   echo "🔍 Selecting next available task..."
   TASK_JSON=$(./.claude/scripts/task-manager.sh select-and-update)

   # Verify selection was successful
   if [ $? -ne 0 ] || [ -z "$TASK_JSON" ]; then
       echo "❌ ERROR: Task selection failed"
       echo "   Possible reasons:"
       echo "   - No pending tasks available"
       echo "   - Another agent selected the same task (race condition detected)"
       echo "   - Worktree already exists for selected task"
       echo "   - CSV lock timeout"
       exit 1
   fi

   # Extract task_id and other fields
   TASK_ID=$(echo "$TASK_JSON" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
   SUBTASK=$(echo "$TASK_JSON" | grep -o '"subtask":"[^"]*"' | cut -d'"' -f4)
   PLATFORM=$(echo "$TASK_JSON" | grep -o '"platform":"[^"]*"' | cut -d'"' -f4)
   LANGUAGE=$(echo "$TASK_JSON" | grep -o '"language":"[^"]*"' | cut -d'"' -f4)
   DIFFICULTY=$(echo "$TASK_JSON" | grep -o '"difficulty":"[^"]*"' | cut -d'"' -f4)

   echo "✅ Selected and locked task: $TASK_ID ($PLATFORM-$LANGUAGE, $DIFFICULTY)"
   echo "📋 Subtask: $SUBTASK"
   echo "🔒 Task status updated to 'in_progress' - other agents will skip this task"
   echo "🛡️  Race condition protections: PASSED (worktree check ✓, pre-update check ✓, post-update check ✓)"

   # NOTE: Verification is now handled INSIDE the lock by task-manager.sh
   # No need for external verification - the select-and-update command guarantees atomicity
   ```

2. **Get full task details** (if you need all fields):
   ```bash
   # Get complete task data including all available fields
   TASK_DETAILS=$(./.claude/scripts/task-manager.sh get "$TASK_ID")
   
   # Save to temporary file for create-task-files.sh
   echo "$TASK_DETAILS" > /tmp/task_${TASK_ID}.json
   ```

3. **Check task status distribution** (optional - for monitoring):
   ```bash
   ./.claude/scripts/task-manager.sh status
   ```

4. **Create metadata.json and PROMPT.md**:
   ```bash
   # Use the optimized script to generate both files
   # This is much faster than Python equivalents
   ./.claude/scripts/create-task-files.sh /tmp/task_${TASK_ID}.json worktree/synth-${TASK_ID}
   ```

**Benefits of task-manager.sh:**
- **3-5x faster** than Python scripts (native shell/awk processing)
- **Thread-safe** - supports parallel execution with file locking
- **Atomic operations** - select and update in single transaction
- **Less memory usage** - no Python interpreter overhead
- **Built-in validation** - automatic backup and restore on failure
- **Single source of truth** - one script for all CSV operations
- **Better error handling** - clear colored output and exit codes
- **Parallel-ready** - run multiple Claude agents simultaneously without conflicts

6. **Follow instructions in `task-coordinator` to set up the worktree**:
   - Use EXACT format: `worktree/synth-{task_id}`
   - Validation will fail if naming is incorrect

### Option 2: Direct Task Input
If `.claude/tasks.csv` is not present:
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

## Debugging Parallel Execution Issues

If you suspect duplicate task selection in parallel execution:

1. **Check for stale locks**:
   ```bash
   # Check if lock directory exists and is stale
   ls -la .claude/tasks.csv.lock 2>/dev/null && echo "Lock exists!" || echo "No lock"
   
   # If lock is stale (older than 5 minutes), remove it
   find .claude/tasks.csv.lock -type d -mmin +5 -exec rm -rf {} \; 2>/dev/null
   ```

2. **Verify task status distribution**:
   ```bash
   # Check how many tasks are in each status
   ./.claude/scripts/task-manager.sh status
   ```

3. **Check which tasks are currently in_progress**:
   ```bash
   # List all in_progress tasks
   awk -F',' 'NR>1 && tolower($2) == "in_progress" {print $1, $5}' .claude/tasks.csv
   ```

4. **Test lock mechanism and race condition protections**:
   ```bash
   # Run comprehensive test suite with 10 parallel agents
   bash .claude/scripts/test-race-conditions.sh 10

   # Or quick test with 3 agents
   echo "Testing parallel selection..."
   (./.claude/scripts/task-manager.sh select-and-update | grep task_id &)
   (./.claude/scripts/task-manager.sh select-and-update | grep task_id &)
   (./.claude/scripts/task-manager.sh select-and-update | grep task_id &)
   wait
   echo "Check above - should show 3 different task IDs"
   ```

5. **Verify this agent is NOT using deprecated methods**:
   - Confirm you executed `select-and-update` (not just `select`)
   - Confirm you did NOT read .claude/tasks.csv directly
   - Confirm you did NOT call find-next-task.py

## Race Condition Protections (Enhanced)

The `select-and-update` command includes **three layers of protection** against race conditions:

### Protection Layer #1: Worktree Existence Check
- **When**: After task selection, before CSV update (under lock)
- **What**: Checks if `worktree/synth-{task_id}` already exists
- **Why**: Catches race condition where another agent already created worktree
- **Outcome**: If worktree exists, selection fails immediately with error

### Protection Layer #2: Pre-Update CSV Status Verification
- **When**: After worktree check, before CSV update (under lock)
- **What**: Reads CSV to verify task status is still "pending" or empty
- **Why**: Catches race condition where another agent already updated CSV
- **Outcome**: If status is "in_progress" or "done", selection fails with race detection error

### Protection Layer #3: Post-Update CSV Status Verification
- **When**: After CSV update, before lock release (under lock)
- **What**: Re-reads CSV to verify task status is now "in_progress"
- **Why**: Ensures the CSV update actually succeeded
- **Outcome**: If status is not "in_progress", fails with critical error

All three checks happen **under lock**, ensuring atomicity. The lock uses `mkdir` which is atomic across all processes.

**If duplicate selection still occurs**, this indicates a bug. Capture and report:
- Which task ID was selected by multiple agents
- Timestamps of when each agent selected it
- Full stderr output from both agents showing protection layer results
- Contents of .claude/tasks.csv.lock directory during the duplicate selection
- Output of: `bash .claude/scripts/test-race-conditions.sh 20`