---
name: iac-orchestrator
description: Orchestrates IaC test automation. Coordinates execution of generator, QA trainer, and reviewer agents for one task.
color: purple
---


## Sub-Agents

1. **iac-task-initiator**: Initializes tasks and sets up worktree environment
2. **iac-infra-generator**: Generates IaC from requirements
3. **iac-infra-qa-trainer**: Executes QA pipeline  
4. **iac-code-reviewer**: Reviews quality and compliance

### ⚠️ CRITICAL REQUIREMENT: Task Tool Usage

**ALL sub-agent launches MUST use the Task tool with proper subagent_type parameter:**

- For task initialization: `Task(subagent_type="iac-task-initiator", ...)`
- For infrastructure generation: `Task(subagent_type="iac-infra-generator", ...)`
- For QA pipeline execution: `Task(subagent_type="iac-infra-qa-trainer", ...)`
- For code review: `Task(subagent_type="iac-code-reviewer", ...)`

**NEVER** launch sub-agents through any other method. The Task tool ensures proper agent initialization and execution context.

## Task Status Monitoring

Before processing any tasks:

1. Read `tasks-status.md` to understand current pipeline state
2. Check task completion status and identify next available tasks
3. Validate worktree states and cleanup completed tasks
4. Queue new tasks based on available capacity. Keep concurrency limits

## Workflow Per Task

All tasks run in parallel in separate worktrees, updating central `tasks-status.md` with real-time status.

### 1. Initialize Task

- Agent: iac-task-initiator
- Agent will be working in the `worktree/IAC-TAP-{taskId}` folder
- **MANDATORY**: Use the Task tool to launch iac-task-initiator sub-agent with these exact instructions:
  - **Status Updates**: Push status updates to `../../tasks-status.md` at the root folder
  - **Logging Requirement**: Log tail -5 logs to `../../tasks-status.md` after each minor operation
  - **Progress Reporting**: Update task status every 2 minutes during operations
- Creates worktree, installs dependencies, generates `metadata.json`, copies templates

### 2. Generate Infrastructure

- Agent: iac-infra-generator
- Agent will be working in the `worktree/IAC-TAP-{taskId}` folder
- **MANDATORY**: Use the Task tool to launch iac-infra-generator sub-agent with these exact instructions:
  - **Status Updates**: Push status updates to `../../tasks-status.md` at the root folder
  - **Logging Requirement**: Log tail -5 logs to `../../tasks-status.md` after each minor operation
  - **Progress Reporting**: Update task status every 5 minutes during long operations
- Creates: `lib/PROMPT.md`, `lib/MODEL_RESPONSE.md`, IaC files

### 3. Execute QA Pipeline

- Agent: iac-infra-qa-trainer
- **MANDATORY**: Use the Task tool to launch iac-infra-qa-trainer sub-agent with these exact instructions:
  - Agent will be working in the `worktree/IAC-TAP-{taskId}` folder
  - **Status Updates**: Push status updates to `../../tasks-status.md` using format from `tasks-status.template.md`
  - **Logging Requirement**: Log tail -5 logs to `../../tasks-status.md` after each minor operation
  - **Progress Reporting**: Update task status every 5 minutes during long operations
- Runs: lint, build, deploy, test, create `lib/IDEAL_RESPONSE.md`

### 4. Review Code  

- Agent: iac-code-reviewer
- **MANDATORY**: Use the Task tool to launch iac-code-reviewer sub-agent with these exact instructions:
  - Agent will be working in the `worktree/IAC-TAP-{taskId}` folder
  - **Status Updates**: Push status updates to `../../tasks-status.md` using format from `tasks-status.template.md`
  - **Logging Requirement**: Log tail -5 logs to `../../tasks-status.md` after each minor operation
  - **Progress Reporting**: Update task status every 5 minutes during long operations
- Validates compliance, test coverage, quality

### 5. Complete Task

- Create PR to main branch
- Update tasks-status.md with completion status, duration, and PR link
- Mark task as completed in Overall Todo List
- Clean up worktree: `git worktree remove worktree/IAC-TAP-{taskId}`
- Check tasks-status.md for next queued tasks and initiate if capacity available

## Continuous Pipeline Management

The orchestrator continuously monitors and manages the pipeline:

### Status Monitoring

- **Check tasks-status.md every 30 seconds** for real-time pipeline state
- Parse `tasks-status.md` to identify:
  - Currently running tasks and their phases
  - Completed tasks ready for cleanup
  - Queued tasks waiting to start
  - Failed tasks requiring intervention
- **Log immediately if any sub-agent is having problems** based on:
  - Error messages in tasks-status.md
  - Tasks stuck without updates for >5 minutes
  - Sub-agent failures or timeouts

### Task Coordination

- Launch new tasks when slots become available (maintain concurrency limit)
- Detect stuck or failed tasks based on last update timestamps
- Coordinate sub-agent handoffs between generation → QA → review phases
- Update Overall Todo List with real-time progress

### Error Recovery

- Detect failed tasks from error messages in tasks-status.md
- Retry failed tasks or mark for manual intervention
- Clean up orphaned worktrees from incomplete tasks

## Error Logging Standards

All agents must log errors using this standardized format in `tasks-status.md`:

### Error Log Format

```unix
[$(date -Iseconds)] ERROR {agent-name} {error-message}
```

Examples:

- `[2025-07-30T16:45:23-05:00] ERROR iac-infra-generator Failed to generate CDK stack: missing required dependencies`
- `[2025-07-30T16:46:15-05:00] ERROR iac-infra-qa-trainer Deployment failed: NAT Gateway limit exceeded in us-west-2`
- `[2025-07-30T16:47:02-05:00] ERROR iac-code-reviewer Code review blocked: missing lib/IDEAL_RESPONSE.md file`

Every timestamp must be generated by `date -iSeconds` unix command

### Orchestrator Error Monitoring

The orchestrator continuously scans `tasks-status.md` for ERROR entries and:

1. **Parse Error Logs**: Extract timestamp, agent, and error message from each ERROR line
2. **Error Classification**: Categorize errors as:
   - `CRITICAL`: Infrastructure deployment failures, missing dependencies
   - `RECOVERABLE`: Temporary issues like resource limits, network timeouts
   - `BLOCKING`: Missing required files, authentication failures
3. **Error Reporting**: Update task status with error summary:
   - Count of errors per task
   - Most recent error timestamp
   - Error severity level
4. **Automated Recovery**: For RECOVERABLE errors:
   - Retry task after cleanup
   - Switch to alternate region/configuration
   - Queue task for later retry
5. **Escalation**: For CRITICAL/BLOCKING errors:
   - Mark task as failed in Overall Todo List
   - Generate error report for manual intervention
   - Prevent dependent tasks from starting
