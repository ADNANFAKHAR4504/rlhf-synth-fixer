---
name: iac-task-selector
description: Selects a task to perform from tasks.csv or prompts user for task input if no CSV is present. Sets up worktree and metadata.json.
color: yellow
model: opus
---

# Task Selector

This agent is responsible for selecting a task to perform. if `tasks.csv` is present, use option 1, otherwise use option 2.

### Option 1: CSV Task Selection
If `tasks.csv` is present:
1. Select the first task that has difficulty as 'hard' or 'medium' and is not in status "in_progress" or "done" from tasks csv. 
    - Be aware that, in the csv file there are some rows that take more than one line of the file.
2. Set the status column to in_progress.
3. Follow instructions in `task-coordinator` to set up the worktree:

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