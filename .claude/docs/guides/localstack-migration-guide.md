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
│  5. Create new branch                                   │
│          ↓                                              │
│  6. Commit migrated files                               │
│          ↓                                              │
│  7. Push branch & create Pull Request                   │
│          ↓                                              │
│  8. Update migration log                                │
│          ↓                                              │
│  9. Cleanup worktree                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Pull Request Creation

On successful migration, the command automatically:

1. **Generates new PR ID**: `ls-{original_pr_id}` (e.g., `ls-Pr7179`)
2. **Creates a new branch**: `ls-synth-{original_pr_id}` (e.g., `ls-synth-Pr7179`)
3. **Copies migrated files** to `{platform}-{language}/ls-{PR_ID}/`
4. **Updates metadata.json** with new PR ID and original reference
5. **Creates a commit** with migration details
6. **Pushes the branch** to origin
7. **Creates a Pull Request** with:
   - Title: `[LocalStack] ls-{PR_ID} - {platform}/{language}`
   - Body: Task details, migration summary, deployment instructions
   - Base: `main`

### Naming Convention

| Item | Format | Example |
|------|--------|---------|
| New PR ID | `ls-{original_pr_id}` | `ls-Pr7179` |
| Branch | `ls-synth-{original_pr_id}` | `ls-synth-Pr7179` |
| Destination | `{platform}-{language}/ls-{pr_id}` | `cdk-ts/ls-Pr7179` |

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

### Deployment Instructions
./scripts/localstack-cdk-deploy.sh cdk-ts/ls-Pr7179
```

## Migration Log

All migrations are tracked in `.claude/reports/localstack-migrations.json`:

```json
{
  "created_at": "2025-12-17T...",
  "migrations": [
    {
      "task_path": "archive/cdk-ts/Pr7179",
      "destination": "cdk-ts/ls-Pr7179",
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

## Common Fixes Applied

The `localstack-fixer` agent automatically applies these fixes:

1. **Endpoint Configuration** - Adds LocalStack endpoint URLs
2. **S3 Path-Style Access** - Enables path-style access for S3
3. **IAM Simplification** - Simplifies IAM policies for LocalStack
4. **Removal Policies** - Sets DESTROY for LocalStack resources
5. **Resource Naming** - Simplifies complex resource names
6. **Test Configuration** - Updates integration tests for LocalStack

## Output Files

After migration, a new PR is created with these files:

```
{platform}-{language}/ls-{PR_ID}/
├── cfn-outputs/
│   └── flat-outputs.json      # Stack outputs
├── execution-output.md        # Migration log with deployment details
├── int-test-output.md         # Test results
├── lib/                       # Infrastructure code
├── test/                      # Integration tests
└── metadata.json              # Task metadata (updated with ls_pr_id)
```

Example for a CDK TypeScript task:

```
cdk-ts/ls-Pr7179/
├── cfn-outputs/
│   └── flat-outputs.json
├── execution-output.md
├── lib/
├── test/
└── metadata.json
```

The `metadata.json` is updated with:

```json
{
  "pr_id": "ls-Pr7179",
  "original_pr_id": "Pr7179",
  "localstack_migration": true,
  ...
}
```

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

# 2. Create destination directory (use ls-{original_pr_id} format)
mkdir -p cdk-ts/ls-Pr7179

# 3. Copy task files
cp -r archive/cdk-ts/Pr7179/* cdk-ts/ls-Pr7179/

# 4. Update metadata.json with new PR ID
cd cdk-ts/ls-Pr7179/
jq '. + {"pr_id": "ls-Pr7179", "original_pr_id": "Pr7179", "localstack_migration": true}' metadata.json > tmp.json && mv tmp.json metadata.json

# 5. Make LocalStack compatibility changes manually

# 6. Test deployment
../../scripts/localstack-cdk-deploy.sh

# 7. Test
../../scripts/localstack-cdk-test.sh

# 8. Commit and push
git add .
git commit -m "feat(localstack): migrate ls-Pr7179 for LocalStack compatibility"
git push -u origin ls-synth-Pr7179

# 9. Create PR
gh pr create --title "[LocalStack] ls-Pr7179 - cdk/ts" --body "LocalStack migration from Pr7179"
```

## Related Files

- `.claude/commands/localstack-migrate.md` - Main command
- `.claude/agents/localstack-task-selector.md` - Task selection agent
- `.claude/agents/localstack-deploy-tester.md` - Deployment testing agent
- `.claude/agents/localstack-fixer.md` - Fix automation agent
- `.claude/scripts/localstack-select-task.sh` - Selection helper script
- `.claude/reports/localstack-migrations.json` - Migration tracking log
