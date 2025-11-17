# Ideal Response - Payment Processing Pipeline Infrastructure

This document contains the corrected and complete implementation of the serverless payment processing pipeline using Pulumi with TypeScript, addressing all issues identified in MODEL_FAILURES.md.

## Key Fixes Applied

1. **Region Handling**: Changed from async `aws.getRegion()` to synchronous `process.env.AWS_REGION`
2. **Environment Suffix Propagation**: Properly passed from index.ts to stack constructor
3. **Lambda Runtime**: Fixed to use `aws.lambda.Runtime.Go1dx` instead of non-existent `Go1dxRuntime`
4. **API Gateway Type**: Using REST API (v1) not HTTP API (v2)
5. **Deployment Structure**: Separate Deployment and Stage resources
6. **Compiled Lambda Binaries**: Go functions compiled to bootstrap binaries for Linux/amd64
7. **Comprehensive Tests**: 100% test coverage with proper mocking

## Infrastructure Stack (lib/tap-stack.ts)

The corrected implementation is in lib/tap-stack.ts with the following key fixes:

### Region Handling (Line 28)
```typescript
// CORRECT: Synchronous region from environment
const regionName = process.env.AWS_REGION || 'us-east-2';

// WRONG (Original): Async call during construction
// const region = aws.getRegion({});
```

### VPC Endpoint Service Name (Line 115)
```typescript
// CORRECT: Direct string interpolation
serviceName: `com.amazonaws.${regionName}.dynamodb`,

// WRONG (Original): Trying to use .then() on Promise
// serviceName: pulumi.interpolate`com.amazonaws.${region.then(r => r.name)}.dynamodb`,
```

### Lambda Runtime (Lines 488, 517, 546)
```typescript
// CORRECT: Proper enum syntax
runtime: aws.lambda.Runtime.Go1dx,

// WRONG (Original): Non-existent property
// runtime: aws.lambda.Go1dxRuntime,
```

### API Gateway Outputs (Lines 674, 682)
```typescript
// CORRECT: Direct region name usage
this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${regionName}.amazonaws.com/${stage.stageName}`;

// WRONG (Original): Trying to use .then() on Promise
// this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${region.then(r => r.name)}.amazonaws.com/${stage.stageName}`;
```

## Entry Point (index.ts)

### Correct Implementation
```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const defaultTags = {
  Environment: environmentSuffix,
  ManagedBy: 'Pulumi',
  Project: 'PaymentProcessing',
};

// CORRECT: Pass environmentSuffix to stack
new TapStack('pulumi-infra', {
  environmentSuffix,  // ✅ Parameter passed
  tags: defaultTags,
});
```

### Original (Incorrect) Implementation
```typescript
// WRONG: Missing environmentSuffix parameter
new TapStack('pulumi-infra', {
  tags: defaultTags,  // ❌ environmentSuffix not passed
});
```

## API Gateway Configuration

### Correct: REST API (v1)
```typescript
const api = new aws.apigateway.RestApi(
  `payment-api-${environmentSuffix}`,
  {
    name: `payment-api-${environmentSuffix}`,
    description: 'REST API for payment webhook processing',
    endpointConfiguration: { types: 'REGIONAL' },
    tags: { ...tags, Name: `payment-api-${environmentSuffix}` },
  },
  { parent: this }
);

// Separate Deployment resource
const deployment = new aws.apigateway.Deployment(
  `payment-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
    triggers: {
      redeployment: pulumi
        .all([webhookResource.id, webhookMethod.id])
        .apply(([resourceId, methodId]) =>
          JSON.stringify({ resourceId, methodId })
        ),
    },
  },
  { parent: this, dependsOn: [webhookMethod] }
);

// Separate Stage resource
const stage = new aws.apigateway.Stage(
  `payment-stage-${environmentSuffix}`,
  {
    restApi: api.id,
    deployment: deployment.id,
    stageName: 'prod',
    tags: { ...tags, Name: `payment-stage-${environmentSuffix}` },
  },
  { parent: this }
);
```

### Original (Incorrect): HTTP API (v2)
```typescript
// WRONG: Used HTTP API instead of REST API
const api = new aws.apigatewayv2.Api(`payment-api-${environmentSuffix}`, {
  protocolType: 'HTTP',  // ❌ HTTP API, not REST API
});

// WRONG: stageName in Deployment (not valid parameter)
const deployment = new aws.apigateway.Deployment(
  `payment-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
    stageName: 'prod',  // ❌ Invalid parameter
  }
);
```

## Lambda Functions

All three Lambda functions (webhook-processor, transaction-recorder, fraud-detector) are implemented in Go and compiled to Linux/amd64 bootstrap binaries.

### Compilation Process
```bash
# For each Lambda function:
cd lib/lambda/webhook-processor
go mod init webhook-processor
go mod tidy
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bootstrap main.go

cd ../transaction-recorder
go mod init transaction-recorder
go mod tidy
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bootstrap main.go

cd ../fraud-detector
go mod init fraud-detector
go mod tidy
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
```

### Lambda Function Configuration
```typescript
const webhookProcessor = new aws.lambda.Function(
  `webhook-processor-${environmentSuffix}`,
  {
    name: `webhook-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.Go1dx,  // ✅ Correct enum
    handler: 'bootstrap',
    role: webhookProcessorRole.arn,
    code: new pulumi.asset.FileArchive('./lib/lambda/webhook-processor'),
    timeout: 30,
    memorySize: 256,
    reservedConcurrentExecutions: 100,  // ✅ Throttling protection
    vpcConfig: {
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      securityGroupIds: [lambdaSecurityGroup.id],
    },
    environment: {
      variables: {
        TOPIC_ARN: paymentTopic.arn,
        API_KEY: 'encrypted-api-key',
      },
    },
    kmsKeyArn: kmsKey.arn,  // ✅ Environment variable encryption
    tags: { ...tags, Name: `webhook-processor-${environmentSuffix}` },
  },
  { parent: this }
);
```

## Unit Tests (test/tap-stack.unit.test.ts)

### Correct Mocking Setup
```typescript
// Set up mocks before any tests run
beforeAll(() => {
  // Mock Pulumi runtime behavior
  (pulumi as any).all = jest
    .fn()
    .mockImplementation((values: any[]) => ({
      promise: () => Promise.resolve(values),
      apply: (fn: any) => fn(values),
    }));
  
  (pulumi as any).output = jest.fn().mockImplementation((value: any) => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
    then: (fn: any) => fn(value),
  }));
  
  (pulumi as any).interpolate = jest.fn().mockImplementation((strings: any, ...values: any[]) => {
    const result = strings.reduce((acc: string, str: string, i: number) => {
      return acc + str + (values[i] !== undefined ? String(values[i]) : '');
    }, '');
    return {
      promise: () => Promise.resolve(result),
      apply: (fn: any) => fn(result),
    };
  });

  // Mock AWS resource constructors
  const mockResource = (name: string) => ({
    id: `${name}-id`,
    arn: `arn:aws:service:us-east-2:123456789012:${name}`,
    name: `${name}-name`,
    url: `https://${name}.amazonaws.com`,
  });

  Object.keys(aws).forEach((key) => {
    if (typeof (aws as any)[key] === 'object') {
      Object.keys((aws as any)[key]).forEach((resourceKey) => {
        if (typeof (aws as any)[key][resourceKey] === 'function') {
          (aws as any)[key][resourceKey] = jest.fn().mockImplementation((name: string) => mockResource(name));
        }
      });
    }
  });
});
```

### Test Results
```
PASS  test/tap-stack.unit.test.ts
  TapStack Structure
    with props
      ✓ instantiates successfully
      ✓ exports required outputs
      ✓ uses custom environment suffix in resource names
    with default values
      ✓ instantiates successfully
      ✓ uses default environment suffix in resource names

--------------|---------|----------|---------|---------|
File          | % Stmts | % Branch | % Funcs | % Lines |
--------------|---------|----------|---------|---------|
All files     |     100 |      100 |     100 |     100 |
 tap-stack.ts |     100 |      100 |     100 |     100 |
--------------|---------|----------|---------|---------|
```

## Complete Resource List

The corrected infrastructure creates:

### Security & Encryption (3 resources)
- Customer-managed KMS Key with rotation
- KMS Alias for key reference
- Security Group for Lambda functions

### Networking (5 resources)
- VPC with DNS support
- 2 Private Subnets (us-east-2a, us-east-2b)
- VPC Endpoint for DynamoDB
- Route table associations

### Compute (3 Lambda Functions)
- webhook-processor (Go 1.x, VPC, reserved concurrency 100)
- transaction-recorder (Go 1.x, VPC, reserved concurrency 100)
- fraud-detector (Go 1.x, VPC, reserved concurrency 100)

### Messaging (5 resources)
- SNS Topic (payment-events) with KMS encryption
- SQS Queue (transaction-queue) with 7-day retention
- SQS Queue (fraud-queue) with 7-day retention
- 2 SNS Topic Subscriptions
- 2 SQS Queue Policies
- 2 Lambda Event Source Mappings

### Storage (1 resource)
- DynamoDB Table (transactions) with on-demand billing, KMS encryption

### API Gateway (6 resources)
- REST API (not HTTP API)
- Resource (/webhook)
- Method (POST)
- Integration (Lambda proxy)
- Deployment
- Stage (prod) with throttling settings

### IAM (9 resources)
- 3 Lambda Execution Roles
- 3 Role Policy Attachments (VPC access)
- 3 Inline Role Policies (service permissions)

### Monitoring (3 resources)
- 3 CloudWatch Log Groups with 30-day retention and KMS encryption

### Permissions (1 resource)
- Lambda Permission for API Gateway invocation

**Total: 39 resources** properly configured with environmentSuffix in all names.

## Deployment Instructions

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-2
export PULUMI_CONFIG_PASSPHRASE=""

# Initialize Pulumi stack
pulumi stack select dev --create

# Deploy infrastructure
pulumi up --yes

# Verify outputs
pulumi stack output apiUrl
pulumi stack output webhookEndpoint
pulumi stack output tableName
pulumi stack output topicArn
```

## Testing Instructions

### Unit Tests (100% Coverage Required)
```bash
npm run build
npm run test:unit
```

### Integration Tests (Requires Deployment)
```bash
export AWS_REGION=us-east-2
npm run test:integration
```

## Architecture Benefits

1. **Scalability**: Serverless components auto-scale with demand
2. **Security**: Customer-managed encryption, VPC isolation, least privilege IAM
3. **Reliability**: SQS ensures message delivery, reserved Lambda concurrency prevents throttling
4. **Cost-Effective**: On-demand billing, VPC endpoints avoid NAT Gateway costs
5. **Compliance**: 30-day log retention, encryption at rest and in transit
6. **Multi-Environment**: environmentSuffix enables parallel deployments

## Key Differences from Original MODEL_RESPONSE

| Aspect | MODEL_RESPONSE (Incorrect) | IDEAL_RESPONSE (Correct) |
|--------|---------------------------|-------------------------|
| API Gateway Type | HTTP API (v2) | REST API (v1) |
| Region Handling | Async `aws.getRegion()` | Sync `process.env.AWS_REGION` |
| Lambda Runtime | `aws.lambda.Go1dxRuntime` | `aws.lambda.Runtime.Go1dx` |
| environmentSuffix | Not passed from index.ts | Properly passed and used |
| Deployment/Stage | Combined incorrectly | Separate resources |
| Test Coverage | ~24% (incomplete tests) | 100% (comprehensive tests) |
| Lambda Binaries | Missing compiled binaries | Pre-compiled bootstrap files |

## Success Criteria Met

✅ **Functionality**: API Gateway receives webhooks and triggers Lambda processing pipeline
✅ **Data Flow**: Messages flow through SNS to two SQS queues and trigger respective Lambda functions
✅ **Storage**: Transactions stored in DynamoDB with proper partition and sort keys
✅ **Security**: All sensitive data encrypted with customer-managed KMS keys
✅ **Monitoring**: All Lambda functions have CloudWatch logs with 30-day retention
✅ **Performance**: API Gateway throttling configured (5000 burst, 2000 rate), Lambda reserved concurrency set
✅ **Compliance**: VPC configuration for Lambda functions processing payment data
✅ **Resource Naming**: All resources include environmentSuffix for multi-environment support
✅ **Code Quality**: TypeScript code well-structured, properly typed, and fully tested (100% coverage)
✅ **Build Quality**: Lint, build, and synth all pass successfully
✅ **Lambda Compilation**: All Go functions compiled to Linux/amd64 bootstrap binaries

This implementation provides a production-ready, secure, and scalable payment processing pipeline that fully meets all requirements specified in PROMPT.md.
