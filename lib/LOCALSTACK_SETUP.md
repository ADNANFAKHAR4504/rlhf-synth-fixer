# LocalStack Setup for CloudFormation Tasks

This document explains how this task handles LocalStack-specific requirements without modifying common repository scripts.

## Problem

The CloudFormation template `TapStack.yml` requires an SSM parameter for the RDS database password:

```yaml
MasterUserPassword: !Sub '{{resolve:ssm-secure:${DBPassword}}}'
```

This parameter must exist before CloudFormation deployment, but LocalStack doesn't have it by default.

## WRONG Approach (What We Fixed)

Previously, we incorrectly modified common scripts:
- `scripts/localstack-ci-deploy.sh` - Added SSM parameter creation
- `scripts/localstack-cloudformation-deploy.sh` - Added SSM parameter setup
- `scripts/setup-localstack-ssm.sh` - Created new shared script

**Why This Was Wrong:**
1. These scripts are shared across ALL tasks in the repository
2. Modifying them for one task's needs breaks isolation
3. Other tasks might have different SSM parameter requirements
4. Creates maintenance burden and potential conflicts

## CORRECT Approach (Current Implementation)

We handle the SSM parameter requirement within the task scope using test setup:

### File: `test/setup-localstack.ts`

```typescript
import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'us-west-2',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

async function setupSSMParameters() {
  const putCommand = new PutParameterCommand({
    Name: '/myapp/database/password',
    Value: 'TestPassword123!',
    Type: 'SecureString',
    Description: 'Database password for LocalStack testing',
    Overwrite: true,
  });

  await ssmClient.send(putCommand);
}

export { setupSSMParameters };
```

### File: `test/tap-stack.int.test.ts`

```typescript
import { setupSSMParameters } from './setup-localstack';

describe('TapStack CloudFormation Integration Tests', () => {
  beforeAll(async () => {
    // Setup LocalStack prerequisites (SSM parameters) if using LocalStack
    if (process.env.AWS_ENDPOINT_URL) {
      await setupSSMParameters();
    }

    // ... rest of test setup
  });

  // ... tests
});
```

## Why This Approach Is Better

1. **Task Isolation**: Only affects this task, not others
2. **Clear Ownership**: The task owns its prerequisites
3. **Maintainable**: Easy to modify for this task without affecting others
4. **Standard Pattern**: Test setup is a recognized pattern for test prerequisites
5. **LocalStack Aware**: Only runs when `AWS_ENDPOINT_URL` is set

## How It Works

1. Integration tests detect LocalStack via `AWS_ENDPOINT_URL` environment variable
2. If LocalStack is detected, `setupSSMParameters()` runs in `beforeAll()` hook
3. SSM parameter is created: `/myapp/database/password` = `TestPassword123!`
4. CloudFormation deployment can now resolve the parameter
5. RDS instance receives the password successfully

## For Future Tasks

If your task needs SSM parameters or other LocalStack-specific setup:

1. Create `test/setup-localstack.ts` with your setup logic
2. Import and call setup functions in your test's `beforeAll()` hook
3. Make it conditional on `process.env.AWS_ENDPOINT_URL`
4. **NEVER** modify common scripts in `scripts/`, `.claude/`, or `.github/`

## Repository Protection Rules

### STRICTLY FORBIDDEN (Never Modify)

- `scripts/` - Shell scripts for CI/CD and deployment
- `.claude/scripts/` - Agent configurations
- `.github/workflows/` - GitHub Actions workflows
- `config/` - Schema and configuration files

### ALLOWED TO MODIFY (Task-Specific)

- `lib/` - Your IaC source code (CloudFormation, Terraform, CDK, etc.)
- `test/` - Your test files and test setup
- `metadata.json` - Task metadata
- `jest.config.js` - Test configuration (only if coverage >= 80%)
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies only (NOT scripts section)

## Questions?

If you're unsure whether a file should be modified, ask:
1. Is this file used by other tasks? → Don't modify
2. Can I solve this in `lib/` or `test/`? → Do that instead
3. Is this a common script or config? → Don't modify

When in doubt, keep changes within `lib/` and `test/` directories.
