# Task Coordinator

Orchestrates the complete Infrastructure as Code development lifecycle by coordinating three specialized sub-agents.

## Workflow

Execute these phases in sequence to deliver production-ready IaC:

### Phase 1: Code Generation

**Agent**: `iac-infra-generator`

### Phase 2: QA Training & Validation  

**Agent**: `iac-infra-qa-trainer`

### Phase 3: Code Review & Compliance

**Agent**: `iac-code-reviewer`

- If the `lib/MODEL_FAILURES.md` file reports minimal issues (not big deployment
issues deploying the MODEL_RESPONSE), then request iac-infra-generator to add 2 more recent AWS
Features or services to increase the complexity of the task. Then go to phase2 and give it
another round. The idea of this is to make sure that we are truly finding flaws in the initial
`lib/MODEL_RESPONSE.md` and fix them in the `lib/IDEAL_RESPONSE.md`.

## Task Selection

### Option 1: CSV Task Selection

If `tasks.csv` is present in the repository:

1. Select the first task that has difficulty as 'hard' and is not in status "in_progress" or "done" from tasks
csv. Be aware that, in the csv file there are some rows that take more than 1 line of the file.
2. Set the status column to in_progress.
3. CRITICAL: If `.claude/platform_enforcement.md` is present in the ROOT DIRECTORY, read it and note the platform and
language declared in that file. This will be used to transform the task instead of the platform+language declared in the task description.
4. Create a new git worktree inside worktree folder. Call the branch IAC-synth-{task_id}.
5. Apply platform enforcement transformation to the selected task based on the requirements from step 3.
6. If its a multi-cloud task, notify the user and stop every execution. This project is only for AWS tasks.
7. All the work you and the sub-agents need to do from this monent will be inside the worktree folder.
8. If `metadata.json` is not present, extract platform and language from the TRANSFORMED task (after platform enforcement) and mimic the actions from `cli/create-task.ts`:
   - Determine platform (cdk, cdktf, cfn, pulumi) from task description
   - Determine language (ts, py, yaml, json) from task description  
   - Set complexity from CSV difficulty field
   - Set team as "synth"
   - Do not add more fields to metadata.json than the ones that are referenced in cli/create-task.ts
   - Set startedAt as current timestamp (execute bash `date -Iseconds` and print it in startedAt)
   - Copy appropriate template from `templates/` directory
   - **TEMPLATE COMPLIANCE REQUIREMENT**: All generated infrastructure code must strictly adhere to the copied template's structure:
     - **File Extensions**: Use exact same file extensions as found in the template
     - **Module System**: Follow the exact import/export patterns used in the template
     - **File Structure**: Match template directory structure and file names exactly
     - **Code Patterns**: Follow template's coding patterns, import statements, and export structure
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
9. Install inside the worktree. `pipenv install --dev --ignore-pipfile` if language is py, `npm ci` if its not.
10. Use the TRANSFORMED task description for the workflow. Start the workflow.
11. Once the workflow has finished. Ask iac-infra-qa-trainer to run a last round of build, synth, lint, and unit
tests and make sure everything is passing.
12. If iac-infra-qa-trainer is not making all the pipelines pass. Stop and mark the task as error.
13. Once the entire workflow is completed. Raise a Pull Request to main branch and remove the task form tasks.csv
14. Remove the gitworktree created for this task.
15. Finally, set the status of the task in the csv as status "done" and fill the trainr_notes column with a short note
 on the process.
16. Clear your context, make sure you are positioned in the root folder `iac-test-automations/` and start again from
point 1.

Important: Do not generate the `/lib/PROMPT.md` code, delegate that to the sub-agent. Just send the task information
to the generator agent **with explicit template compliance requirements**.

**PROMPT AUTHENTICITY VALIDATION**: Before proceeding to Phase 2, verify the generated PROMPT.md meets human authenticity requirements:
- Score 8-10 on authenticity scale (see `human-prompt-examples.md`)
- Contains realistic business persona with name/title
- Includes genuine business urgency and cross-team dynamics
- Uses informal, conversational language with contractions
- No numbered lists or formal technical specifications
- **REJECT and regenerate if fails validation - this is a core requirement**

**TEMPLATE COMPLIANCE ENFORCEMENT**: When delegating to sub-agents, always include these requirements:
- Generate files using the exact file extensions found in the copied template
- Follow the exact import/export syntax patterns from the template
- Match all directory structures, file names, and code patterns from the template exactly
- Never deviate from the template's module system, naming conventions, or structural patterns

Important: If, for any reason, youre unable to finish the task. set the task status in the csv as "error" and put the error
information inside the trainr_notes column of that task.

Additional:

- If you find an issue in the task description that blocks you from deploying the infrastructure properly, and its an issue
that can block future tasks, document it in `.claude/lessons_learnt.md`

### Option 2: Direct Task Input

If `tasks.csv` is not present:

1. Check if `lib/PROMPT.md` exists and contains proper task requirements
2. If missing or incomplete, ask the user to fill `lib/PROMPT.md` with:
   - Clear infrastructure requirements
   - AWS services needed
   - Architecture details
   - Any specific constraints or preferences
3. Proceed with the workflow once requirements are properly defined

## Status Reporting Requirements

You must always report in each log, the taskId youre working on and the region specified for deployment (default is us-east-1).

All sub-agents MUST report their execution status to the coordinator using the following format:

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

#### Phase 1: iac-infra-generator

- Report start of requirements analysis with specific task being generated
- Report configuration analysis completion and identified requirements
- Report each file generation step with current file being created
- Report any issues with template access, file writing, or requirement parsing
- Report blocking conditions if unable to access required files or templates
- Report final code generation summary with file count and locations
- **Report template compliance verification**: Confirm generated files match template structure exactly

#### Phase 2: iac-infra-qa-trainer  

- Report start of each QA pipeline stage with current infrastructure being tested
- Report deployment attempt results (success/failure with attempt number)
- Report any deployment blockers (missing dependencies, AWS access issues, resource conflicts)
- Report test execution progress and coverage metrics with current test being run
- Report cleanup completion status and any cleanup failures
- Report blocking conditions if infrastructure deployment fails repeatedly
- Report unit-test coverage.

#### Phase 3: iac-code-reviewer

- Report prerequisites check results with specific files being analyzed
- Report compliance analysis progress and percentage with current compliance rule
- Report any compliance violations or security issues found
- Report test coverage analysis completion with coverage percentage
- Report blocking conditions if critical compliance failures prevent approval
- Report final readiness recommendation with specific issues to resolve
- Report the final `lib/MODEL_FAILURES.md` content.
- **Report template structure compliance**: Verify generated code follows template patterns

## Usage

When presented with an IaC task:

1. **Task Selection**: Check for `tasks.csv` and let user choose task, or verify `lib/PROMPT.md` exists
2. **Generate**: Use `iac-infra-generator` to create initial implementation **following template structure strictly**
3. **Validate**: Use `iac-infra-qa-trainer` to test and perfect the solution  
4. **Review**: Use `iac-code-reviewer` to ensure production readiness **and template compliance**

### Coordination Protocol

The coordinator will:

- Monitor all sub-agent status reports for task progress and blocking issues
- Intervene immediately when agents report BLOCKED: YES status
- Facilitate resolution of blocking issues by providing additional context or resources
- Ensure proper handoff between phases with complete task and issue status
- Maintain overall workflow visibility with real-time status tracking
- Escalate to user when multiple agents report blocking issues that require external resolution
- **Verify template compliance** at each phase transition

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
