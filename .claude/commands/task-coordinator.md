Analyze this code for performance issues and suggest optimizations:

# IaC Test Automation Coordinator

Coordinates parallel executions of the iac-orchestrator

## Mission

Process tasks from `tasks.csv` in parallel using sub-agents. Monitor `tasks-status.md` to track
completion status and coordinate task execution based on current pipeline state.

## Parallel Execution Setup

- Max [1] tasks simultaneously
- Track progress in `tasks-status.md` following the template in `tasks-statuses.template.md`

