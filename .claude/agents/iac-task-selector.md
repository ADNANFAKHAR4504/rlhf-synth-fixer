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
1. **Read tasks.csv using proper CSV parser** (handles multi-line rows):
   ```python
   import csv
   
   with open('tasks.csv', 'r', newline='', encoding='utf-8') as f:
       reader = csv.DictReader(f)
       for row in reader:
           difficulty = row['difficulty']
           status = row['status']
           if difficulty in ['hard', 'medium'] and status not in ['in_progress', 'done']:
               # This is our task
               selected_task = row
               break
   ```
   
2. **Extract task metadata from the selected CSV row**:
    - Get `task_id` column value
    - Get `subtask` column value
    - Get `subject_labels` column value (it's a JSON array string like `["CI/CD Pipeline", "Security Configuration as Code"]`)
    - Parse the subject_labels as a JSON array
    - Pass these values to the task-coordinator for inclusion in metadata.json

3. **Update status column to "in_progress"** (with backup and validation):
   ```python
   import csv
   import shutil
   import sys
   
   # CRITICAL: Create backup before modifying
   shutil.copy2('tasks.csv', 'tasks.csv.backup')
   
   # Read all rows
   rows = []
   original_count = 0
   with open('tasks.csv', 'r', newline='', encoding='utf-8') as f:
       reader = csv.DictReader(f)
       fieldnames = reader.fieldnames
       for row in reader:
           original_count += 1
           if row['task_id'] == selected_task_id:
               row['status'] = 'in_progress'
           rows.append(row)
   
   # VALIDATION: Ensure we haven't lost any rows
   if len(rows) != original_count:
       print(f"❌ ERROR: Row count mismatch. Original: {original_count}, Current: {len(rows)}")
       print("Restoring from backup...")
       shutil.copy2('tasks.csv.backup', 'tasks.csv')
       sys.exit(1)
   
   # VALIDATION: Ensure we have all fieldnames
   if not fieldnames or len(fieldnames) == 0:
       print("❌ ERROR: No fieldnames found in CSV")
       print("Restoring from backup...")
       shutil.copy2('tasks.csv.backup', 'tasks.csv')
       sys.exit(1)
   
   # Write back all rows
   with open('tasks.csv', 'w', newline='', encoding='utf-8') as f:
       writer = csv.DictWriter(f, fieldnames=fieldnames)
       writer.writeheader()
       writer.writerows(rows)
   
   # VALIDATION: Verify the write was successful
   verify_count = 0
   with open('tasks.csv', 'r', newline='', encoding='utf-8') as f:
       reader = csv.DictReader(f)
       for row in reader:
           verify_count += 1
   
   if verify_count != original_count:
       print(f"❌ ERROR: Write verification failed. Expected {original_count} rows, found {verify_count}")
       print("Restoring from backup...")
       shutil.copy2('tasks.csv.backup', 'tasks.csv')
       sys.exit(1)
   
   print(f"✅ Successfully updated task {selected_task_id} status to 'in_progress' ({verify_count} total rows preserved)")
   ```

4. **Validate task complexity matches requirements** (Quality assurance):
   - Extract AWS services count from task description
   - Validate against difficulty level:
     - "hard" or "expert" tasks: Should have 5+ AWS services
     - "medium" tasks: Should have 3-5 AWS services
     - "easy" tasks: Should have 1-3 AWS services
   - If mismatch detected:
     - Log warning: "Task {task_id} marked as {difficulty} but appears to have {count} services"
     - Add note to trainr_notes in CSV for review
     - Proceed with task but flag for quality review
   - **Quality Impact**: Ensures consistent difficulty levels across training data

5. **Follow instructions in `task-coordinator` to set up the worktree**:
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