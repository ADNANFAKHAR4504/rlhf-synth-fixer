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

## Task Selection

### Option 1: CSV Task Selection

If `tasks.csv` is present in the repository:

1. Read and display available tasks from the CSV file
2. Ask the user to select which task to work on by number or ID. Check if the user has already given the
ID in the initial prompt and ask for confirmation.
3. Create a new git worktree inside worktree folder. Call the branch IAC-synth-{TaskId}.
4. All the work you and the sub-agents need to do from this monent will be inside the worktree folder.
5. If `metadata.json` is not present, extract platform and language from the selected task and mimic the actions from `cli/create-task.ts`:
   - Determine platform (cdk, cdktf, cfn, pulumi) from task description
   - Determine language (ts, py, yaml, json) from task description  
   - Set complexity from CSV difficulty field
   - Set team as "synth"
   - Do not add more fields to metadata.json than the ones that are referenced in cli/create-task.ts
   - Set startedAt as current timestamp (execute bash `date -Iseconds` and print it in startedAt)
   - Copy appropriate template from `templates/` directory
   - Generate `metadata.json` with extracted information
   - If the deployment needs to be done in a specific region, create the file `lib/AWS_REGION` with the
   region name. e.g: `echo "us-east-1" > lib/AWS_REGION`
6. Use the selected task description for the workflow.
7. Once the entire workflow is completed. Raise a Pull Request to main branch and remove the task form tasks.csv

Important: Do not generate the `/lib/PROMPT.md` code, delegate that to the sub-agent. Just send the task information
to the generator agent

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

#### Phase 2: iac-infra-qa-trainer  

- Report start of each QA pipeline stage with current infrastructure being tested
- Report deployment attempt results (success/failure with attempt number)
- Report any deployment blockers (missing dependencies, AWS access issues, resource conflicts)
- Report test execution progress and coverage metrics with current test being run
- Report cleanup completion status and any cleanup failures
- Report blocking conditions if infrastructure deployment fails repeatedly

#### Phase 3: iac-code-reviewer

- Report prerequisites check results with specific files being analyzed
- Report compliance analysis progress and percentage with current compliance rule
- Report any compliance violations or security issues found
- Report test coverage analysis completion with coverage percentage
- Report blocking conditions if critical compliance failures prevent approval
- Report final readiness recommendation with specific issues to resolve

## Usage

When presented with an IaC task:

1. **Task Selection**: Check for `tasks.csv` and let user choose task, or verify `lib/PROMPT.md` exists
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
