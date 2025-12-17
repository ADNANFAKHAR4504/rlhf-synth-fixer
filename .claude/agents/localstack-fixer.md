---
name: localstack-fixer
description: Iteratively fixes IaC tasks to make them LocalStack-compatible, applying minimal targeted changes focused on compatibility.
color: orange
model: sonnet
---

# LocalStack Fixer Agent

Fixes IaC tasks to make them deployable to LocalStack with minimal, focused changes.

## Input Parameters

- `WORK_DIR` - Working directory containing task files
- `PLATFORM` - IaC platform (cdk, cfn, tf, pulumi)
- `LANGUAGE` - Programming language
- `DEPLOY_ERRORS` - Array of deployment errors
- `TEST_ERRORS` - Array of test errors

## Core Principles

1. **Minimal Changes**: Only modify what's necessary for LocalStack compatibility
2. **Preserve Logic**: Never change business logic or core functionality
3. **Document Everything**: Log all changes in execution-output.md
4. **Iterative Approach**: Fix one issue at a time, re-test after each fix
5. **Maximum 5 Iterations**: Escalate if not fixed within iterations

## Fix Strategy

### Iteration Loop

```bash
MAX_ITERATIONS=5
ITERATION=0
FIX_SUCCESS=false
FIX_FAILURE_REASON=""
ITERATIONS_USED=0

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  ITERATIONS_USED=$ITERATION

  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "🔧 FIX ITERATION $ITERATION of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════"
  echo ""

  # Document iteration start
  echo "" >> execution-output.md
  echo "## Fix Iteration $ITERATION" >> execution-output.md
  echo "" >> execution-output.md

  # 1. Analyze current errors
  # 2. Apply targeted fix
  # 3. Re-attempt deployment
  # 4. Check result

  # ... (fix logic based on error type)

  # Re-test deployment
  # ... (deployment test)

  if [ "$DEPLOY_SUCCESS" = true ] && [ "$TEST_SUCCESS" = true ]; then
    FIX_SUCCESS=true
    echo "✅ Fix successful on iteration $ITERATION"
    break
  fi
done

if [ "$FIX_SUCCESS" != true ]; then
  FIX_FAILURE_REASON="Maximum iterations ($MAX_ITERATIONS) reached without success"
fi
```

## Common Fixes by Error Type

### 1. Missing LocalStack Endpoint Configuration

**Error Pattern**: `UnrecognizedClientException`, `Could not connect`

**CDK TypeScript Fix**:

```typescript
// Add at top of stack file
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

// For resources that need it
if (isLocalStack) {
  // LocalStack-specific configuration
}
```

**CDK Python Fix**:

```python
import os

is_localstack = 'localhost' in os.environ.get('AWS_ENDPOINT_URL', '') or \
                '4566' in os.environ.get('AWS_ENDPOINT_URL', '')
```

**Terraform Fix**:

```hcl
# Add to providers.tf or main.tf
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style          = true

  endpoints {
    s3             = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    cloudformation = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    logs           = "http://localhost:4566"
    sns            = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    kms            = "http://localhost:4566"
    events         = "http://localhost:4566"
    apigateway     = "http://localhost:4566"
    kinesis        = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    rds            = "http://localhost:4566"
    ecs            = "http://localhost:4566"
  }
}
```

**Pulumi Fix**:

```typescript
// In Pulumi.localstack.yaml or code
const awsConfig = new pulumi.Config('aws');
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');

// Set provider config programmatically if needed
```

### 2. S3 Path-Style Access Issues

**Error Pattern**: `InvalidBucketName`, `The bucket you are attempting to access must be addressed using the specified endpoint`

**Fix - Environment Variables**:

```bash
export AWS_S3_FORCE_PATH_STYLE=true
export S3_SKIP_SIGNATURE_VALIDATION=1
```

**Fix - CDK TypeScript**:

```typescript
// S3 buckets work, but ensure no virtual-hosted style URLs
const bucket = new s3.Bucket(this, 'MyBucket', {
  bucketName: `my-bucket-${environmentSuffix}`, // Simple names work best
  removalPolicy: isLocalStack
    ? cdk.RemovalPolicy.DESTROY
    : cdk.RemovalPolicy.RETAIN,
  autoDeleteObjects: isLocalStack,
});
```

### 3. Unsupported AWS Services

**Error Pattern**: `Service not available`, `UnsupportedOperation`

**LocalStack Community Limitations**:

- AppSync - Not available (Pro only)
- Amplify - Not available (Pro only)
- SageMaker - Not available (Pro only)
- EKS - Limited (Pro only for full support)
- Some advanced features of supported services

**Fix Strategy - Conditional Resource Creation**:

```typescript
// CDK TypeScript
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');

// Only create in real AWS, skip for LocalStack
if (!isLocalStack) {
  const api = new appsync.GraphqlApi(this, 'Api', {
    // AppSync config
  });
}

// Or provide a mock/stub for LocalStack
const apiEndpoint = isLocalStack
  ? 'http://localhost:4566/mock-api'
  : api.graphqlUrl;
```

**Fix Strategy - CloudFormation Conditions**:

```yaml
Conditions:
  IsNotLocalStack: !Not [!Equals [!Ref AWS::StackName, 'tap-stack-localstack']]

Resources:
  MyAppSyncApi:
    Type: AWS::AppSync::GraphQLApi
    Condition: IsNotLocalStack
    Properties:
      # ...
```

### 4. IAM Policy Issues

**Error Pattern**: `MalformedPolicyDocument`, `Invalid principal`

**Fix - Simplify IAM for LocalStack**:

```typescript
// CDK - Simplified IAM for LocalStack
const policy = isLocalStack
  ? new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['*'],
      resources: ['*'],
    })
  : new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [bucket.arnForObjects('*')],
    });
```

**CloudFormation Fix**:

```yaml
# Use simpler policy structure
PolicyDocument:
  Version: '2012-10-17'
  Statement:
    - Effect: Allow
      Action:
        - 's3:*'
      Resource: '*'
```

### 5. Resource Naming Issues

**Error Pattern**: `Invalid resource name`, `Name too long`

**Fix - Use Simpler Names**:

```typescript
// CDK
const resourceName = isLocalStack
  ? `simple-${environmentSuffix}`
  : `complex-multi-part-name-${region}-${environmentSuffix}`;
```

### 6. Missing Parameters

**Error Pattern**: `Parameter validation failed`, `Missing required parameter`

**Fix - CloudFormation Default Parameters**:

```yaml
Parameters:
  Environment:
    Type: String
    Default: dev
    Description: Environment suffix

  # Add defaults for all parameters
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
```

### 7. RemovalPolicy Issues

**Error Pattern**: Resources not cleaning up, stuck deployments

**Fix - Set DESTROY for LocalStack**:

```typescript
// CDK
const removalPolicy = isLocalStack
  ? cdk.RemovalPolicy.DESTROY
  : cdk.RemovalPolicy.RETAIN;

new s3.Bucket(this, 'Bucket', {
  removalPolicy,
  autoDeleteObjects: isLocalStack,
});

new dynamodb.Table(this, 'Table', {
  removalPolicy,
});
```

### 8. Integration Test Fixes

**Error Pattern**: Tests failing with connection errors

**Fix - Update Test Configuration**:

```typescript
// test/tap-stack.int.test.ts
import { S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';

const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');

// Load outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8')
);

// Configure clients for LocalStack
const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
});

describe('Integration Tests', () => {
  test('should connect to S3', async () => {
    // Test implementation
  });
});
```

## Fix Application Process

````bash
apply_fix() {
  local fix_type="$1"
  local file="$2"
  local description="$3"

  echo "### Fix: $description" >> execution-output.md
  echo "" >> execution-output.md
  echo "**File:** \`$file\`" >> execution-output.md
  echo "" >> execution-output.md
  echo "**Change:**" >> execution-output.md
  echo '```diff' >> execution-output.md

  # Apply the fix and capture diff
  # ... (fix implementation)

  echo '```' >> execution-output.md
  echo "" >> execution-output.md
}
````

## Re-Deployment Test

After each fix, re-run deployment:

```bash
test_deployment() {
  echo "🔄 Testing deployment after fix..."

  # Reset LocalStack state
  curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null || true

  # Run deployment based on platform
  case "$PLATFORM" in
    cdk)
      cdklocal deploy --all --require-approval never 2>&1
      ;;
    cfn)
      awslocal cloudformation create-stack \
        --stack-name tap-stack-localstack \
        --template-body file://lib/TapStack.yml \
        --capabilities CAPABILITY_IAM 2>&1
      ;;
    tf)
      cd lib && tflocal apply -auto-approve 2>&1 && cd ..
      ;;
    pulumi)
      pulumi up --yes 2>&1
      ;;
  esac

  return $?
}
```

## Output Variables

```bash
# Set at end of agent execution
FIX_SUCCESS=true/false
FIX_FAILURE_REASON="reason if failed"
ITERATIONS_USED=N
FIXES_APPLIED="list of fixes applied"
```

## Exit Codes

- `0` - Successfully fixed, deployment and tests pass
- `1` - Unable to fix within maximum iterations
- `2` - Uses unsupported services that cannot be fixed

## Documentation

All changes MUST be documented in `execution-output.md`:

````markdown
## Fix Iteration 1

**Error Analyzed:**
UnrecognizedClientException: The security token included in the request is invalid

**Root Cause:**
Missing LocalStack endpoint configuration

**Fix Applied:**

- File: `lib/tap-stack.ts`
- Added LocalStack detection and endpoint configuration

```diff
+ const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');
+
  export class TapStack extends cdk.Stack {
```
````

**Result:** Deployment still failing (different error)

---

## Fix Iteration 2

**Error Analyzed:**
S3 bucket creation failed - InvalidBucketName

**Root Cause:**
Bucket name too complex for LocalStack

**Fix Applied:**

- File: `lib/tap-stack.ts`
- Simplified bucket naming for LocalStack

```diff
- bucketName: `my-complex-bucket-name-${region}-${account}-${suffix}`,
+ bucketName: isLocalStack ? `bucket-${suffix}` : `my-complex-bucket-name-${region}-${account}-${suffix}`,
```

**Result:** ✅ Deployment successful!

````

## Escalation

If fixes fail after maximum iterations:

```bash
if [ "$FIX_SUCCESS" != true ]; then
  echo "" >> execution-output.md
  echo "## ⚠️ ESCALATION REQUIRED" >> execution-output.md
  echo "" >> execution-output.md
  echo "Unable to fix within $MAX_ITERATIONS iterations." >> execution-output.md
  echo "" >> execution-output.md
  echo "**Remaining Issues:**" >> execution-output.md
  echo "- $DEPLOY_ERRORS" >> execution-output.md
  echo "- $TEST_ERRORS" >> execution-output.md
  echo "" >> execution-output.md
  echo "**Possible Causes:**" >> execution-output.md
  echo "1. Uses Pro-only LocalStack features" >> execution-output.md
  echo "2. Complex service dependencies" >> execution-output.md
  echo "3. Requires manual intervention" >> execution-output.md

  FIX_FAILURE_REASON="Max iterations reached - manual review required"
fi
````
