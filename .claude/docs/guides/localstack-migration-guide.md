# LocalStack Migration Guide

This guide explains how to use the LocalStack migration system to test and migrate IaC tasks from the archive folder to LocalStack.

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

## Quick Start

### 1. Start LocalStack

```bash
./scripts/localstack-start.sh
```

### 2. Run a Migration

```bash
# Migrate a specific task
/localstack-migrate ./archive/cdk-ts/Pr7179

# Or by PR number
/localstack-migrate Pr7179

# Or let the system pick the next task
/localstack-migrate --next
```

## Selection Modes

### Manual Selection

```bash
# By full path
/localstack-migrate ./archive/cdk-ts/Pr7179

# By PR number (auto-finds in archive/)
/localstack-migrate Pr7179
```

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
│  1. Select Task (manual or auto)                        │
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
│  5. Update migration log                                │
│          ↓                                              │
│  6. Move to archive-localstack/ (if successful)         │
│          ↓                                              │
│  7. Cleanup worktree                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Migration Log

All migrations are tracked in `.claude/reports/localstack-migrations.json`:

```json
{
  "created_at": "2025-12-17T...",
  "migrations": [
    {
      "task_path": "archive/cdk-ts/Pr7179",
      "destination": "archive-localstack/Pr7179-cdk-ts",
      "platform": "cdk",
      "language": "ts",
      "pr_id": "Pr7179",
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

| Service | Status | Notes |
|---------|--------|-------|
| S3 | ✅ Excellent | Full support |
| DynamoDB | ✅ Excellent | Full support |
| SQS | ✅ Excellent | Full support |
| SNS | ✅ Excellent | Full support |
| IAM | ✅ Good | Simplified policies |
| KMS | ✅ Good | Basic encryption |
| CloudWatch | ✅ Good | Logs and metrics |
| Secrets Manager | ✅ Good | Full support |
| SSM | ✅ Good | Parameter Store |
| EventBridge | ✅ Good | Events and rules |

### Medium Compatibility

| Service | Status | Notes |
|---------|--------|-------|
| Lambda | ⚠️ Good | May need Docker |
| API Gateway | ⚠️ Good | REST APIs |
| Step Functions | ⚠️ Good | State machines |
| Kinesis | ⚠️ Moderate | Basic streams |

### Low Compatibility (May Require Pro)

| Service | Status | Notes |
|---------|--------|-------|
| ECS | ⚠️ Limited | Basic support |
| RDS | ⚠️ Limited | Simulated |
| EC2 | ⚠️ Limited | Mocked |
| EKS | ❌ Pro only | Not in Community |
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

After migration, these files are created:

```
archive-localstack/Pr7179-cdk-ts/
├── cfn-outputs/
│   └── flat-outputs.json      # Stack outputs
├── execution-output.md        # Deployment log
├── int-test-output.md         # Test results
├── lib/                       # Infrastructure code
├── test/                      # Integration tests
└── metadata.json              # Task metadata
```

## Troubleshooting

### LocalStack Not Running

```bash
# Start LocalStack
./scripts/localstack-start.sh

# Check health
curl http://localhost:4566/_localstack/health | jq
```

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
# 1. Copy task to archive-localstack
cp -r archive/cdk-ts/Pr7179 archive-localstack/Pr7179-cdk-ts/

# 2. Navigate to the task
cd archive-localstack/Pr7179-cdk-ts/

# 3. Make LocalStack compatibility changes manually

# 4. Deploy
../../scripts/localstack-cdk-deploy.sh

# 5. Test
../../scripts/localstack-cdk-test.sh
```

## Related Files

- `.claude/commands/localstack-migrate.md` - Main command
- `.claude/agents/localstack-task-selector.md` - Task selection agent
- `.claude/agents/localstack-deploy-tester.md` - Deployment testing agent
- `.claude/agents/localstack-fixer.md` - Fix automation agent
- `.claude/scripts/localstack-select-task.sh` - Selection helper script
- `.claude/reports/localstack-migrations.json` - Migration tracking log

