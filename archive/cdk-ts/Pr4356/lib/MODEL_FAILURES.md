# MODEL_FAILURES.md

## Overview
This document records all failures, errors, and issues encountered during the implementation of the serverless application infrastructure using AWS CDK in TypeScript. Each failure includes the error details, root cause, and the resolution applied.

---

## Failure 1: Build Error - Lambda Metric Method Not Found

### Error Message
```
lib/stacks/monitoring-stack.ts:258:60 - error TS2339: Property 'metricConcurrentExecutions' does not exist on type 'Function'.
```

### Context
- **Phase**: Build (running `./scripts/build.sh`)
- **File**: `lib/stacks/monitoring-stack.ts:258`
- **Timestamp**: During initial build after code generation

### Root Cause
The monitoring stack was attempting to use `metricConcurrentExecutions()` method on the Lambda Function construct, but this method does not exist in the AWS CDK Lambda Function API. This appears to be an invalid method name or outdated API usage.

### Impact
- Build failed completely
- Could not proceed to deployment
- Blocking issue that prevented any infrastructure deployment

### Resolution
Changed the metric method from `metricConcurrentExecutions()` to `metricInvocations()`, which is a valid method in the Lambda Function construct:

```typescript
// Before (INCORRECT):
new cloudwatch.SingleValueWidget({
  title: 'Lambda Concurrent Executions',
  metrics: [props.lambdaFunction.metricConcurrentExecutions()],
  width: 6,
  height: 6,
}),

// After (CORRECT):
new cloudwatch.SingleValueWidget({
  title: 'Lambda Invocations',
  metrics: [props.lambdaFunction.metricInvocations()],
  width: 6,
  height: 6,
}),
```

### Lessons Learned
- Always verify method names against the latest AWS CDK API documentation
- Use IDE autocomplete or TypeScript type checking to catch invalid method names
- Consider using CDK's built-in metric constants instead of method calls

---

## Failure 2: Deployment Error - Reserved Concurrent Executions Exceeds Account Limit

### Error Message
```
Resource handler returned message: "Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [10]. (Service: Lambda, Status Code: 400, Request ID: ...)"
```

### Context
- **Phase**: Deployment (running `./scripts/deploy.sh`)
- **Stack**: `LambdaStack-dev`
- **Resource**: Lambda Function `serverless-data-processor-dev`

### Root Cause
The Lambda function configuration included `reservedConcurrentExecutions: 10`, which attempted to reserve 10 concurrent execution units for this function. However, this would reduce the account's unreserved concurrent execution capacity below the minimum required threshold of 10.

AWS accounts have a default concurrent execution limit (typically 1000), and reserving executions for one function reduces the available pool for other functions. The account must always maintain at least 10 unreserved concurrent executions.

### Impact
- Deployment failed at LambdaStack-dev
- Infrastructure was partially deployed (VPC, Storage, Secrets stacks succeeded)
- Required manual intervention to fix and redeploy

### Resolution
Removed the `reservedConcurrentExecutions` configuration from the Lambda function:

```typescript
// Before (INCORRECT):
this.dataProcessorFunction = new lambda.Function(
  this,
  `DataProcessor-${props.environmentSuffix}`,
  {
    functionName: `serverless-data-processor-${props.environmentSuffix}`,
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    // ... other config
    reservedConcurrentExecutions: 10,  // ❌ REMOVED THIS LINE
  }
);

// After (CORRECT):
this.dataProcessorFunction = new lambda.Function(
  this,
  `DataProcessor-${props.environmentSuffix}`,
  {
    functionName: `serverless-data-processor-${props.environmentSuffix}`,
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    // ... other config
    // No reservedConcurrentExecutions specified - uses account pool
  }
);
```

### Lessons Learned
- Reserved concurrent executions should only be used when specific throttling guarantees are required
- Always consider account-wide limits when setting function-level concurrency
- For most applications, using the shared concurrency pool is sufficient and more flexible
- Document account limits and quotas before implementing resource reservations

---

## Failure 3: Lambda Runtime Error - Module 'aws-sdk' Not Found

### Error Message
```
Runtime.ImportModuleError: Error: Cannot find module 'aws-sdk'
Require stack:
- /var/task/index.js
- /var/runtime/index.mjs
```

### Context
- **Phase**: Integration Testing (end-to-end test execution)
- **Resource**: Lambda function `serverless-data-processor-dev`
- **Runtime**: Node.js 22.x
- **Error Type**: Runtime.ImportModuleError

### Root Cause
The Lambda function code was using AWS SDK v2 (`require('aws-sdk')`), which is NOT available in Node.js 18+ runtimes. Starting with Node.js 18, AWS Lambda only includes AWS SDK v3, which has a different module structure and API.

The inline Lambda code contained:
```javascript
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();
```

This code works in Node.js 16 and earlier (which bundled AWS SDK v2), but fails in Node.js 18+ runtimes.

### Impact
- Lambda function failed to initialize
- All API Gateway requests returned HTTP 502 (Bad Gateway)
- End-to-end integration test failed
- Complete service outage for the application

### Resolution
Rewrote the Lambda function code to use AWS SDK v3 with the new modular imports:

```javascript
// Before (AWS SDK v2 - INCORRECT for Node.js 22):
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();

// After (AWS SDK v3 - CORRECT for Node.js 22):
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { randomUUID } = require('crypto');

const dynamoClient = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const secretsClient = new SecretsManagerClient({});
```

Key changes:
1. Modular imports instead of monolithic `aws-sdk` package
2. Explicit command classes (`PutCommand`, `PutObjectCommand`, `GetSecretValueCommand`)
3. Client instantiation with `.send()` method for commands
4. `randomUUID()` from Node.js crypto instead of `AWS.util.uuid.v4()`

### Lessons Learned
- Always match SDK version to Lambda runtime version
- Node.js 18+ requires AWS SDK v3 (modular packages)
- AWS SDK v3 has different API patterns (command-based, not method-based)
- Test Lambda functions immediately after deployment to catch runtime errors
- Consider using Lambda layers for SDK dependencies to ensure version consistency

### AWS SDK Migration Reference
| AWS SDK v2 | AWS SDK v3 |
|-----------|-----------|
| `require('aws-sdk')` | `require('@aws-sdk/client-*')` |
| `new AWS.DynamoDB.DocumentClient()` | `DynamoDBDocumentClient.from(new DynamoDBClient())` |
| `dynamodb.put({...}).promise()` | `dynamodb.send(new PutCommand({...}))` |
| `s3.putObject({...}).promise()` | `s3.send(new PutObjectCommand({...}))` |
| `AWS.util.uuid.v4()` | `randomUUID()` from Node.js crypto |

---

## Failure 4: Integration Test Failures - Missing CloudFormation Outputs

### Error Message
```
ResourceNotFoundException: Requested resource not found: Table: serverless-data-table-dev2 not found
TypeError: fetch failed - getaddrinfo ENOTFOUND is6tk2jp3e.execute-api.us-east-1.amazonaws.com
```

### Context
- **Phase**: Integration Testing (running `./scripts/integration-tests.sh`)
- **Environment**: ENVIRONMENT_SUFFIX=dev2
- **Test File**: `test/tap-stack.int.test.ts`

### Root Cause
Multiple issues contributed to test failures:

1. **Wrong Environment Suffix**: Tests were running with `ENVIRONMENT_SUFFIX=dev2`, but the serverless application stacks were deployed with suffix `dev` (not `dev2`). The `dev2` suffix was from a different, unrelated deployment.

2. **Incomplete Output Collection**: The `get-outputs.sh` script only collected outputs from stacks matching the pattern `TapStack${ENVIRONMENT_SUFFIX}`, which found `TapStackdev` and `TapStackdev2` but missed the individual nested stacks:
   - `ApiGatewayStack-dev`
   - `StorageStack-dev`
   - `LambdaStack-dev`
   - `VpcStack-dev`
   - `SecretsStack-dev`
   - `MonitoringStack-dev`
   - `SecurityStack-dev`

3. **Stale Output Data**: The `cfn-outputs/flat-outputs.json` contained outputs from multiple previous deployments (us-east-1, different suffixes), causing tests to use wrong endpoint URLs.

### Impact
- 13 out of 15 integration tests initially failed
- Tests looked for resources in wrong environment (dev2 instead of dev)
- Tests attempted to connect to wrong API Gateway endpoints
- False negative test results prevented validation of correct deployment

### Resolution

**Step 1**: Corrected environment suffix
```bash
export ENVIRONMENT_SUFFIX=dev  # Changed from dev2
```

**Step 2**: Manually collected outputs from all deployed stacks using Python script:
```python
stacks = [
    "SecretsStack-dev",
    "StorageStack-dev",
    "VpcStack-dev",
    "LambdaStack-dev",
    "ApiGatewayStack-dev",
    "MonitoringStack-dev",
    "SecurityStack-dev"
]

for stack in stacks:
    result = subprocess.run(
        ["aws", "cloudformation", "describe-stacks", "--stack-name", stack,
         "--query", "Stacks[0].Outputs", "--output", "json"],
        capture_output=True, text=True, check=True
    )
    outputs = json.loads(result.stdout)
    # Collect all OutputKey and OutputValue pairs
```

**Step 3**: Verified correct outputs in `cfn-outputs/flat-outputs.json`:
```json
{
  "ApiEndpoint": "https://ke1tnpkluk.execute-api.ap-northeast-1.amazonaws.com/dev/",
  "TableName": "serverless-data-table-dev",
  "BucketName": "serverless-data-bucket-dev-097219365021",
  "FunctionArn": "arn:aws:lambda:ap-northeast-1:097219365021:function:serverless-data-processor-dev",
  // ... 23 total outputs
}
```

### Lessons Learned
- Ensure test environment variables match deployed environment suffix
- Output collection scripts should discover stacks dynamically, not rely on naming patterns
- Clean stale output files before running new deployments
- Use AWS tags to identify related stacks instead of name patterns
- Implement validation in test setup to verify environment matches deployment

### Recommended Fix for get-outputs.sh
Instead of:
```bash
aws cloudformation list-stacks --query "StackSummaries[?contains(StackName, \`TapStack${ENVIRONMENT_SUFFIX}\`)].StackName"
```

Use tag-based discovery:
```bash
aws cloudformation list-stacks --query "StackSummaries[?Tags[?Key=='Environment' && Value=='${ENVIRONMENT_SUFFIX}']].StackName"
```

---

## Failure 5: S3 Integration Test Error - Bucket ARN vs Bucket Name

### Error Message
```
EndpointError: Invalid ARN: Unrecognized format: arn:aws:s3:::serverless-data-bucket-dev-097219365021 (type: serverless-data-bucket-dev-097219365021)
```

### Context
- **Phase**: Integration Testing
- **Test**: S3 bucket access tests
- **AWS SDK**: @aws-sdk/client-s3

### Root Cause
The S3 integration tests were searching the CloudFormation outputs for the bucket name, but the search logic was finding keys that contained S3 bucket ARNs instead of bucket names. When the test passed an ARN to the `HeadBucketCommand`, the S3 client rejected it because bucket commands require bucket names, not ARNs.

Original test code:
```typescript
const actualBucketName = Object.keys(outputs).find((key) =>
  outputs[key] && outputs[key].toString().includes(`serverless-data-bucket-${environmentSuffix}`)
);
const bucket = outputs[actualBucketName];  // This could be an ARN!
```

The CloudFormation outputs contained:
- `BucketName`: `serverless-data-bucket-dev-097219365021` ✅ (correct)
- `ExportsOutputFnGetAttDataBucketdevF09F479BArnD621038A`: `arn:aws:s3:::serverless-data-bucket-dev-097219365021` ❌ (ARN)

The search was finding the ARN key first.

### Impact
- 2 S3 integration tests failed
- S3 bucket access could not be verified
- False negative on bucket configuration validation

### Resolution
Updated the test to prioritize the `BucketName` key and explicitly filter out ARNs:

```typescript
// Prefer BucketName key first
let bucket = outputs['BucketName'] || outputs[`DataBucketName-${environmentSuffix}`];

// Fallback to search, but exclude ARNs
if (!bucket) {
  const actualBucketName = Object.keys(outputs).find((key) =>
    key.includes('BucketName') &&
    outputs[key] &&
    outputs[key].toString().includes(`serverless-data-bucket-${environmentSuffix}`) &&
    !outputs[key].toString().includes('arn:')  // ✅ Filter out ARNs
  );
  bucket = actualBucketName ? outputs[actualBucketName] : null;
}
```

### Lessons Learned
- CloudFormation outputs can contain multiple representations of the same resource (name, ARN, ID)
- Always validate output format before using in API calls
- Prefer explicit output keys (e.g., `BucketName`) over pattern matching
- Add validation filters (e.g., exclude strings starting with `arn:`) when searching outputs
- AWS SDK commands have specific input requirements (bucket name vs ARN)

---

## Summary Statistics

### Total Failures: 5
- **Build-time**: 1 (metric method error)
- **Deployment-time**: 1 (reserved concurrency limit)
- **Runtime**: 1 (AWS SDK version mismatch)
- **Testing**: 2 (wrong environment, ARN vs name)

### Resolution Time
- **Build error**: Immediate (5 minutes)
- **Deployment error**: Immediate (3 minutes)
- **Lambda runtime error**: Moderate (15 minutes - required code rewrite and redeployment)
- **Integration test setup**: Moderate (10 minutes - manual output collection)
- **S3 test error**: Quick (5 minutes)

### Final Outcome
All failures were successfully resolved:
- ✅ Build: Passed
- ✅ Deployment: All 8 stacks deployed successfully
- ✅ Unit Tests: 60 tests passed, 100% coverage
- ✅ Integration Tests: 15/15 tests passed
- ✅ End-to-End Test: Data flow API → Lambda → DynamoDB → S3 verified

---

## Model Improvement Recommendations

Based on these failures, future AI models should:

1. **API Verification**: Always verify method names against official AWS CDK documentation before code generation. The `metricConcurrentExecutions()` error suggests the model may have used outdated or incorrect API knowledge.

2. **Runtime Compatibility**: When generating Lambda function code, check the runtime version and use the appropriate AWS SDK version:
   - Node.js ≤ 16: AWS SDK v2 (`aws-sdk`)
   - Node.js ≥ 18: AWS SDK v3 (`@aws-sdk/client-*`)

3. **Account Limits Awareness**: Avoid setting `reservedConcurrentExecutions` unless explicitly required, as it can cause deployment failures based on account-specific limits.

4. **Output Collection**: Generate scripts that discover resources dynamically using tags rather than name patterns. This makes the infrastructure more portable and reduces environment-specific failures.

5. **Test Data Type Validation**: When generating integration tests that read CloudFormation outputs, add type validation to ensure the correct format (e.g., bucket name vs ARN) is used for SDK calls.

6. **Environment Consistency**: Ensure test environment variables match deployment configuration. Generate validation checks in test setup to fail fast if environments don't match.

---

## Conclusion

All failures encountered were typical of real-world infrastructure development and were resolved systematically. The failures provided valuable learning opportunities about:
- AWS CDK API evolution and deprecation
- AWS service limits and quotas
- AWS SDK version compatibility with Lambda runtimes
- CloudFormation output handling and type safety
- Test environment configuration management

The final implementation successfully meets all requirements with 100% test coverage and passing integration tests, demonstrating the resilience of the infrastructure code.
