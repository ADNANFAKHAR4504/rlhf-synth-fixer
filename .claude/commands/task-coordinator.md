# Task Coordinator

Orchestrates the complete Infrastructure as Code development lifecycle by coordinating three specialized sub-agents.

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

- If the `lib/MODEL_FAILURES.md` file reports minimal issues (not big deployment issues deploying the MODEL_RESPONSE), 
  then request iac-infra-generator to add two more recent AWS Features or services to increase the complexity of the
  task. Then go to phase2 and give it another round. The idea of this is to make sure that we are truly finding flaws 
  in the initial `lib/MODEL_RESPONSE.md` and fix them in the `lib/IDEAL_RESPONSE.md`.


### Setup Worktree
1. Create a new git worktree inside the worktree folder. Must call the branch synth-{task_id} and name worktree same as branch.
2. Must read `.claude/platform_enforcement.md` and transform the task to use the platform and language declared in that file.
   instead of the platform+language declared in the task description.
3. If its a multi-cloud task, notify the user and stop every execution. This project is only for AWS tasks.
4. All the work you and the sub-agents need to do from this moment will be inside the worktree folder.
5. Platform and Language Detection with Error Handling:
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
      region name. e.g: `echo "us-west-1" > lib/AWS_REGION`
6. Install dependencies inside the worktree with error handling:
    - If language is py: `pipenv install --dev --ignore-pipfile`
    - If language is not py: `npm ci`
    - If installation fails, report BLOCKED status with error details
7. Use the selected task description for the workflow. Start the workflow.
    - Report final status before handoff to next agent

Important: Do not generate the `/lib/PROMPT.md` code, delegate that to the subagent. Send the task information to the generator agent


## Task Completion Requirements
Important: If, for any reason, you're unable to finish the task. set the task status in the csv as "error" and put the error
information inside the trainr_notes column of that task.

Additional:
- If you find an issue in the task description that blocks you from deploying the infrastructure properly, and its an issue
  that can block future tasks, document it in `.claude/lessons_learnt.md`

## Status Reporting Requirements
You must always report in each log, the taskId you're working on and the region specified for deployment (default is us-west-1).

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
