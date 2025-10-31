# Claude Agent Scripts

This directory contains scripts **specifically designed for Claude agent orchestration and task management**. These scripts are **NOT** part of the CI/CD pipeline and should only be used by Claude agents.

## Scripts in This Directory

### Task Management Scripts

1. **`task-manager.sh`**
   - Purpose: Thread-safe task selection and management from .claude/tasks.csv
   - Features: File locking for parallel agent execution
   - Commands:
     - `select-and-update` - Atomically select and mark task as in-progress
     - `get <task_id>` - Get full task details
     - `status` - Show task status distribution
     - `update <task_id> <status> <message>` - Update task status

2. **`create-task-files.sh`**
   - Purpose: Generate metadata.json and PROMPT.md for agent tasks
   - Input: Task JSON or task ID
   - Output: Creates metadata.json and lib/PROMPT.md in specified directory

3. **`check-csv-safety.sh`**
   - Purpose: Pre-flight check before agents modify .claude/tasks.csv
   - Validates: CSV integrity, backup existence, agent code patterns
   - **MANDATORY**: Run before any CSV modification

4. **`validate-tasks-csv.py`**
   - Purpose: Validate CSV file integrity and structure
   - Commands:
     - Default: Validate current .claude/tasks.csv
     - `--create-backup` - Create backup file
     - `--restore` - Restore from backup

5. **`test-parallel-locking.sh`**
   - Purpose: Test parallel agent execution and file locking
   - Usage: Simulates multiple agents selecting tasks simultaneously

## Usage in Agent Instructions

These scripts are referenced in:
- `.claude/agents/iac-task-selector.md`
- `.claude/commands/task-coordinator.md`
- `.claude/lessons_learnt.md`
- `.claude/csv_safety_guide.md`

## Important Notes

⚠️ **These scripts are NOT used in the CI/CD pipeline** (`dockerEntryPoint.sh`, GitHub Actions)

✅ **Only Claude agents should call these scripts**

✅ **All paths use `.claude/scripts/` prefix**

## CI/CD Pipeline Scripts

For CI/CD pipeline scripts (build, deploy, test, etc.), see the `/scripts` directory at the repository root.

