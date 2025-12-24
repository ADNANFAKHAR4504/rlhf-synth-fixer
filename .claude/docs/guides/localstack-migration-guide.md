# LocalStack Migration Guide

This guide explains how to use the LocalStack migration system to test and migrate IaC tasks from the archive folder (or directly from GitHub PRs) to LocalStack.

## Overview

The LocalStack migration system consists of:

1. **`/localstack-migrate` command** - Main entry point for migrations
2. **`localstack-task-selector` agent** - Intelligent task selection
3. **`localstack-deploy-tester` agent** - Tests LocalStack deployability
4. **`localstack-fixer` agent** - Fixes compatibility issues

## Prerequisites

Before using the migration system, ensure:

1. **LocalStack is running**:

   ```bash
   ./scripts/localstack-start.sh
   ```

2. **Required tools are installed**:
   - `awslocal` - AWS CLI for LocalStack
   - `jq` - JSON processor
   - `cdklocal` (for CDK tasks)
   - `tflocal` (for Terraform tasks)
   - `gh` - GitHub CLI (for fetching PRs not in archive)

3. **GitHub CLI authenticated** (for GitHub fetch feature):
   ```bash
   gh auth login
   ```

## Quick Start

### 1. Start LocalStack

```bash
./scripts/localstack-start.sh
```

### 2. Run a Migration

```bash
# Migrate a specific task from archive
/localstack-migrate ./archive/cdk-ts/Pr7179

# Or by PR number (auto-fetches from GitHub if not in archive)
/localstack-migrate Pr7179

# Force fetch from GitHub even if task exists in archive
/localstack-migrate --github Pr2077

# Or let the system pick the next task
/localstack-migrate --next
```

## Selection Modes

### Manual Selection

```bash
# By full path
/localstack-migrate ./archive/cdk-ts/Pr7179

# By PR number (auto-finds in archive/, fetches from GitHub if not found)
/localstack-migrate Pr7179
```

### GitHub Fetch

When a PR is not found in the local archive directory, the command automatically fetches it from GitHub:

```bash
# Auto-fetch from GitHub if Pr2077 not in archive
/localstack-migrate Pr2077

# Force fetch from GitHub (even if exists in archive)
/localstack-migrate --github Pr2077

# Works with just the number too
/localstack-migrate --github 2077
```

**Requirements for GitHub fetch:**

1. GitHub CLI (`gh`) must be installed
2. Must be authenticated: `gh auth login`
3. PR must exist in `TuringGpt/iac-test-automations` repository
4. PR must contain a valid task structure (metadata.json, lib/ directory)

### Platform-Specific

```bash
# Migrate next un-migrated CDK TypeScript task
/localstack-migrate --platform cdk-ts

# Available platforms:
# cdk-ts, cdk-py, cdk-go, cdk-java
# cfn-yaml, cfn-json
# tf-hcl
# pulumi-ts, pulumi-py, pulumi-go
```

### AWS Service Filter

```bash
# Migrate a task that uses S3
/localstack-migrate --service S3

# Migrate a task that uses Lambda
/localstack-migrate --service Lambda
```

### Smart Selection

Intelligently picks tasks with highest LocalStack compatibility:

```bash
/localstack-migrate --smart
```

Smart selection considers:

- AWS services used (high/medium/low compatibility)
- Platform type (CloudFormation > CDK > Terraform > Pulumi)
- Task complexity (medium > hard > expert)

### Random Selection

```bash
/localstack-migrate --random
```

### View Statistics

```bash
/localstack-migrate --stats
```

## Migration Workflow

```
┌─────────────────────────────────────────────────────────┐
│                  /localstack-migrate                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Select Task (manual, auto, or from GitHub PR)       │
│          ↓                                              │
│  2. Copy to worktree/localstack-{PR}/                   │
│          ↓                                              │
│  3. Reset LocalStack state                              │
│          ↓                                              │
│  4. localstack-deploy-tester agent                      │
│     - Install dependencies                              │
│     - Attempt deployment                                │
│     - Run integration tests                             │
│          ↓                                              │
│     ┌────┴────┐                                         │
│     ↓         ↓                                         │
│  [Success]  [Failure]                                   │
│     │         │                                         │
│     │    localstack-fixer agent                         │
│     │    - Analyze errors                               │
│     │    - Apply fixes (max 5 iterations)               │
│     │    - Re-test deployment                           │
│     │         │                                         │
│     │    ┌────┴────┐                                    │
│     │    ↓         ↓                                    │
│     │  [Fixed]  [Failed]                                │
│     │    │         │                                    │
│     └────┼─────────┘                                    │
│          ↓                                              │
│  5. Create branch: ls-synth-{PR_ID}                     │
│          ↓                                              │
│  6. Update metadata.json with ls-{PR_ID}                │
│          ↓                                              │
│  7. Commit files to project root                        │
│          ↓                                              │
│  8. Push branch & create Pull Request                   │
│          ↓                                              │
│  9. PR Pipeline handles deployment & testing            │
│          ↓                                              │
│  10. Cleanup worktree                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Pull Request Creation

On successful migration, the command automatically:

1. **Generates new PR ID**: `ls-{original_pr_id}` (e.g., `ls-Pr7179`)
2. **Creates a new branch**: `ls-synth-{original_pr_id}` (e.g., `ls-synth-Pr7179`)
3. **Updates metadata.json** with new PR ID, original reference, and `localstack_migration: true`
4. **Copies migrated files** to project root (standard PR structure)
5. **Creates a commit** with migration details
6. **Pushes the branch** to origin
7. **Creates a Pull Request** - the PR pipeline handles deployment and testing

### Naming Convention

| Item      | Format                      | Example           |
| --------- | --------------------------- | ----------------- |
| New PR ID | `ls-{original_pr_id}`       | `ls-Pr7179`       |
| Branch    | `ls-synth-{original_pr_id}` | `ls-synth-Pr7179` |

### Pipeline Automation

The PR pipeline will automatically:

1. Run linting and validation
2. Deploy to LocalStack
3. Run integration tests
4. Report results

**No manual deployment needed** - the pipeline handles everything.

### Example PR Created

```
[LocalStack] ls-Pr7179 - cdk/ts

## LocalStack Migration

### Task Details
- New PR ID: ls-Pr7179
- Original PR ID: Pr7179
- Platform: cdk
- Language: ts
- AWS Services: S3, Lambda, DynamoDB

### Migration Summary
This task was migrated to be LocalStack-compatible.

### Pipeline
This PR will be processed by the CI/CD pipeline which will:
1. Run linting and validation
2. Deploy to LocalStack
3. Run integration tests
4. Report results
```

## Migration Log

All migrations are tracked in `.claude/reports/localstack-migrations.json`:

```json
{
  "created_at": "2025-12-17T...",
  "migrations": [
    {
      "task_path": "archive/cdk-ts/Pr7179",
      "new_pr_url": "https://github.com/TuringGpt/iac-test-automations/pull/1234",
      "new_pr_number": "1234",
      "branch": "ls-synth-Pr7179",
      "platform": "cdk",
      "language": "ts",
      "ls_pr_id": "ls-Pr7179",
      "original_pr_id": "Pr7179",
      "aws_services": ["S3", "Lambda", "DynamoDB"],
      "status": "success",
      "reason": null,
      "iterations_used": 2,
      "attempted_at": "2025-12-17T..."
    }
  ],
  "summary": {
    "total_attempted": 10,
    "successful": 8,
    "failed": 2
  }
}
```

## LocalStack Service Compatibility

### High Compatibility (Community Edition)

| Service         | Status       | Notes               |
| --------------- | ------------ | ------------------- |
| S3              | ✅ Excellent | Full support        |
| DynamoDB        | ✅ Excellent | Full support        |
| SQS             | ✅ Excellent | Full support        |
| SNS             | ✅ Excellent | Full support        |
| IAM             | ✅ Good      | Simplified policies |
| KMS             | ✅ Good      | Basic encryption    |
| CloudWatch      | ✅ Good      | Logs and metrics    |
| Secrets Manager | ✅ Good      | Full support        |
| SSM             | ✅ Good      | Parameter Store     |
| EventBridge     | ✅ Good      | Events and rules    |

### Medium Compatibility

| Service        | Status      | Notes           |
| -------------- | ----------- | --------------- |
| Lambda         | ⚠️ Good     | May need Docker |
| API Gateway    | ⚠️ Good     | REST APIs       |
| Step Functions | ⚠️ Good     | State machines  |
| Kinesis        | ⚠️ Moderate | Basic streams   |

### Low Compatibility (May Require Pro)

| Service | Status      | Notes            |
| ------- | ----------- | ---------------- |
| ECS     | ⚠️ Limited  | Basic support    |
| RDS     | ⚠️ Limited  | Simulated        |
| EC2     | ⚠️ Limited  | Mocked           |
| EKS     | ❌ Pro only | Not in Community |
| AppSync | ❌ Pro only | Not in Community |

## Common Fixes Applied (Batch Approach)

The `localstack-fixer` agent uses a **batch fix approach** for speed - it applies ALL applicable fixes in ONE iteration before re-deploying, instead of fixing one issue at a time.

### Fix Priority Order

| Priority    | Fix                    | When Applied                 |
| ----------- | ---------------------- | ---------------------------- |
| 🔴 Critical | Endpoint Configuration | Always (if not present)      |
| 🔴 Critical | S3 Path-Style Access   | If using S3/buckets          |
| 🟡 High     | Removal Policies       | Always (if not present)      |
| 🟡 High     | Test Configuration     | If test/ exists              |
| 🟡 Medium   | IAM Simplification     | If IAM errors detected       |
| 🟡 Medium   | Resource Naming        | If naming errors detected    |
| 🟡 Medium   | Unsupported Services   | If service errors detected   |
| 🟢 Low      | Default Parameters     | If parameter errors detected |

### Performance Improvement

With batch fix approach:

- **Old**: 5 fixes = 5 deployment cycles (~5 minutes)
- **New**: 5 fixes = 1-2 deployment cycles (~1-2 minutes)
- **Time saved**: 60-80% for typical migrations

## PR Structure

The PR is created with standard project structure at the root level:

```
/
├── lib/                       # Infrastructure code (LocalStack-compatible)
├── test/                      # Integration tests (updated for LocalStack)
├── metadata.json              # Task metadata (updated with ls_pr_id)
├── Pipfile or package.json    # Dependencies (if applicable)
└── cdk.json / Pulumi.yaml     # Platform config (if applicable)
```

The `metadata.json` is updated with migration tracking fields:

```json
{
  "po_id": "LS-trainr97",
  "provider": "localstack",
  "wave": "P1",
  "migrated_from": {
    "po_id": "trainr97",
    "pr": "Pr7179"
  },
  ...
}
```

**Migration Tracking Fields:**

- `po_id`: New ID with `LS-` prefix (e.g., `LS-trainr97`)
- `migrated_from.po_id`: Original task's PO ID before migration
- `migrated_from.pr`: Original PR number (e.g., `Pr7179`)

The PR pipeline handles:

- Deployment to LocalStack
- Integration testing
- Output file generation (cfn-outputs/, execution-output.md, etc.)

## Metadata Schema Compliance

**CRITICAL**: The `metadata.json` must comply with the schema at `config/schemas/metadata.schema.json`.

### Common CI/CD Failures

If you see errors like:

- `Invalid #/subtask (schema path: #/properties/subtask/enum)`
- `Invalid #/subject_labels/1 (schema path: #/properties/subject_labels/items/enum)`
- `Invalid #/task_id (schema path: #/additionalProperties)`

This means the metadata.json has fields or values not allowed by the schema.

### Fields NOT Allowed

The schema has `additionalProperties: false`. These fields must be REMOVED:

| Field                            | Action                                           |
| -------------------------------- | ------------------------------------------------ |
| `task_id`                        | Remove (use `po_id` instead)                     |
| `training_quality`               | Remove                                           |
| `training_quality_justification` | Remove                                           |
| `coverage`                       | Remove                                           |
| `author`                         | Remove                                           |
| `dockerS3Location`               | Remove                                           |
| `pr_id`                          | Remove                                           |
| `localstack_migration`           | Remove (use `migrated_from` object for tracking) |
| `testDependencies`               | Remove (not part of metadata schema)             |
| `background`                     | Remove (not part of metadata schema)             |

### Type Conversion Notes

The sanitization script automatically handles these type conversions:

| Field            | If Found As            | Converted To           |
| ---------------- | ---------------------- | ---------------------- |
| `subject_labels` | string                 | array with single item |
| `aws_services`   | comma-separated string | array (split by comma) |

### Migration Tracking Object (Optional)

The `migrated_from` object tracks the original task lineage:

```json
{
  "migrated_from": {
    "po_id": "trainr97",
    "pr": "Pr7179"
  }
}
```

| Field                  | Type   | Description                          |
| ---------------------- | ------ | ------------------------------------ |
| `migrated_from.po_id`  | string | Original task PO ID before migration |
| `migrated_from.pr`     | string | Original PR number (e.g., `Pr7179`)  |
| `localstack_migration` | Remove |

### Subtask Mapping

Old tasks may have invalid subtask values. Map them:

| Invalid Value                            | Valid Value                                   |
| ---------------------------------------- | --------------------------------------------- |
| "Security and Compliance Implementation" | "Security, Compliance, and Governance"        |
| "Security Configuration"                 | "Security, Compliance, and Governance"        |
| "Database Management"                    | "Provisioning of Infrastructure Environments" |
| "Monitoring Setup"                       | "Infrastructure QA and Management"            |

### Subject Labels Mapping

Only these 12 labels are valid:

- Environment Migration
- Cloud Environment Setup
- Multi-Environment Consistency
- Web Application Deployment
- Serverless Infrastructure (Functions as Code)
- CI/CD Pipeline
- Failure Recovery Automation
- Security Configuration as Code
- IaC Diagnosis/Edits
- IaC Optimization
- Infrastructure Analysis/Monitoring
- General Infrastructure Tooling QA

## Troubleshooting

### LocalStack Not Running

```bash
# Start LocalStack
./scripts/localstack-start.sh

# Check health
curl http://localhost:4566/_localstack/health | jq
```

### GitHub CLI Not Installed or Authenticated

```bash
# Install GitHub CLI
# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Authenticate
gh auth login

# Verify authentication
gh auth status
```

### PR Not Found on GitHub

```bash
# Verify PR exists
gh pr view 2077 --repo TuringGpt/iac-test-automations

# List recent PRs
gh pr list --repo TuringGpt/iac-test-automations --limit 10
```

### GitHub Fetch Failed - Missing Files

If the PR doesn't contain a valid task structure:

1. Ensure the PR has `metadata.json` in the root
2. Ensure the PR has a `lib/` directory with IaC code
3. Check if the PR is a draft or incomplete

### Deployment Keeps Failing

1. Check if services are supported in LocalStack Community
2. View detailed errors in `execution-output.md`
3. Try manual deployment for debugging:
   ```bash
   cd worktree/localstack-{PR}/
   ./scripts/localstack-cdk-deploy.sh  # or appropriate script
   ```

### Tests Failing

1. Ensure `cfn-outputs/flat-outputs.json` exists
2. Check test configuration uses LocalStack endpoints
3. View test output in `int-test-output.md`

## Manual Migration

If automatic migration fails, you can migrate manually:

```bash
# 1. Create a new branch (use ls-synth-{original_pr_id} format)
git checkout -b ls-synth-Pr7179

# 2. Copy task files to project root
cp -r archive/cdk-ts/Pr7179/lib ./
cp -r archive/cdk-ts/Pr7179/test ./
cp archive/cdk-ts/Pr7179/metadata.json ./

# 3. Update metadata.json with new PR ID
jq '. + {"pr_id": "ls-Pr7179", "original_pr_id": "Pr7179", "localstack_migration": true, "provider": "localstack"}' metadata.json > tmp.json && mv tmp.json metadata.json

# 4. Make LocalStack compatibility changes manually

# 5. Commit and push
git add lib/ test/ metadata.json
git commit -m "feat(localstack): ls-Pr7179 - LocalStack compatible task"
git push -u origin ls-synth-Pr7179

# 6. Create PR - pipeline will handle deployment and testing
gh pr create --title "[LocalStack] ls-Pr7179 - cdk/ts" --body "LocalStack migration from Pr7179"
```

**Note:** The PR pipeline will automatically deploy and test. No manual deployment needed.

## Parallel Execution (Multiple Agents)

The migration command supports running multiple instances in parallel for different PRs. This is useful for migrating many tasks quickly using multiple Claude agents.

### Running 5 Agents in Parallel

```bash
# Reset LocalStack once before starting (optional)
curl -X POST http://localhost:4566/_localstack/state/reset

# Then in 5 separate terminals/agents, run with --no-reset:
# Agent 1: /localstack-migrate --no-reset Pr7179
# Agent 2: /localstack-migrate --no-reset Pr7180
# Agent 3: /localstack-migrate --no-reset Pr7181
# Agent 4: /localstack-migrate --no-reset Pr7182
# Agent 5: /localstack-migrate --no-reset Pr7183
```

### Parallel Execution Features

| Challenge                        | Solution                                      |
| -------------------------------- | --------------------------------------------- |
| LocalStack state reset conflicts | `--no-reset` flag + unique stack names per PR |
| Git branch conflicts             | **Git worktrees** for isolated operations     |
| Migration log race conditions    | **File locking** mechanism                    |
| Working directory conflicts      | Separate directories per PR                   |

### Important: Always Use `--no-reset`

When running multiple agents in parallel, **always use the `--no-reset` flag**. This prevents one agent from resetting LocalStack and destroying another agent's deployed resources.

Each migration automatically uses a unique stack name (`tap-stack-{PR_ID}`) to prevent CloudFormation stack conflicts.

## Configuration

All LocalStack migration settings are centralized in `.claude/config/localstack.yaml`.

### Key Configuration Sections

| Section                 | Description                            |
| ----------------------- | -------------------------------------- |
| `iteration`             | Max iterations, batch fix settings     |
| `timeouts`              | Deployment, test, install timeouts     |
| `localstack`            | Endpoint, region, credentials          |
| `batch_fix`             | Fix priority, preventive fixes         |
| `service_compatibility` | High/Medium/Low/Pro-only services      |
| `smart_selection`       | Scoring for task selection             |
| `parallel`              | Parallel execution settings            |
| `platforms`             | CDK, CFN, TF, Pulumi specific settings |

### Example Configuration Changes

```yaml
# Increase max iterations
iteration:
  max_fix_iterations: 5

# Disable batch fix (revert to one-at-a-time)
batch_fix:
  enabled: false

# Change LocalStack endpoint
localstack:
  endpoint: 'http://localstack:4566'

# Adjust parallel execution
parallel:
  max_concurrent_agents: 5
```

## Related Files

- `.claude/config/localstack.yaml` - **Central configuration file**
- `.claude/commands/localstack-migrate.md` - Main command
- `.claude/agents/localstack-task-selector.md` - Task selection agent
- `.claude/agents/localstack-deploy-tester.md` - Deployment testing agent
- `.claude/agents/localstack-fixer.md` - Fix automation agent
- `.claude/scripts/localstack-select-task.sh` - Selection helper script
- `.claude/reports/localstack-migrations.json` - Migration tracking log
