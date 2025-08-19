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
3. Create a new git worktree inside the worktree folder. Must call the branch synth-{task_id} and name worktree same as branch.
4. Must read `.claude/platform_enforcement.md` and transform the task to use the platform and language declared in that file.
   instead of the platform+language declared in the task description.
5. If its a multi-cloud task, notify the user and stop every execution. This project is only for AWS tasks.
6. All the work you and the sub-agents need to do from this moment will be inside the worktree folder.
7. Platform and Language Detection with Error Handling:
   - If `metadata.json` is not present, extract platform and language from the selected task
   - Validate `cli/create-task.ts` exists before mimicking its actions
   - If `cli/create-task.ts` is missing, use fallback platform detection logic:
    - Determine platform (cdk, cdktf, cfn, tf, pulumi) from task description
    - Determine language (ts, py, yaml, json, hcl) from task description
    - Prefer TypeScript for tests only, avoid Python where possible (unless the project is in python e.g. pulumi-py, cdktf-py)
    - Set complexity from CSV difficulty field
    - Set team as "synth"
    - Do not add more fields to metadata.json than the ones that are referenced in cli/create-task.ts
    - Set startedAt as current timestamp (execute bash `date -Iseconds` and print it in startedAt)
    - Validate `templates/` directory exists and contains required platform template
    - If template missing, report BLOCKED status with specific template needed
    - Copy appropriate template from `templates/` directory
    - Generate `metadata.json` with extracted information. Make sure `po_id` field is set with the task_id value. e.g:

   ```json
    {
       "platform": "cdk",
       "language": "ts",
       "complexity": "hard",
       "turn_type": "single",
       "po_id": "trainr97",
       "team": "synth",
       "startedAt": "2025-08-12T13:19:10-05:00"
     }
   ```

    - If the deployment needs to be done in a specific region, create the file `lib/AWS_REGION` with the
      region name. e.g: `echo "us-east-1" > lib/AWS_REGION`
8. Install dependencies inside the worktree with error handling:
   - If language is py: `pipenv install --dev --ignore-pipfile`
   - If language is not py: `npm ci`
   - If installation fails, report BLOCKED status with error details
9. Use the selected task description for the workflow. Start the workflow.
   - Report final status before handoff to next agent

Important: Do not generate the `/lib/PROMPT.md` code, delegate that to the subagent. Send the task information to the generator agent


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