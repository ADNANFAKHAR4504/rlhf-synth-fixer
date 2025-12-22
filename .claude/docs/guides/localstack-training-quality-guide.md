# LocalStack Training Quality Enhancement Guide

## Purpose

This guide provides strategies to achieve **training quality scores of 9+** when fixing LocalStack PRs using the `localstack-fixer` agent. It maps Category A fixes and complexity factors to LocalStack-compatible services.

## Quick Reference: LocalStack Service Compatibility

### ✅ High Compatibility (Use for Category A Fixes)

| Service            | Category A Fix Opportunities                 |
| ------------------ | -------------------------------------------- |
| **S3**             | Encryption, bucket policies, lifecycle rules |
| **DynamoDB**       | KMS encryption, IAM policies, streams        |
| **SQS**            | Encryption, dead-letter queues, policies     |
| **SNS**            | Encryption, access policies, subscriptions   |
| **IAM**            | Least-privilege policies, roles, boundaries  |
| **KMS**            | Key rotation, policies, encryption contexts  |
| **CloudWatch**     | Alarms, dashboards, log retention            |
| **Logs**           | Log groups, metric filters, retention        |
| **SecretsManager** | Secret rotation, resource policies           |
| **SSM**            | Parameter encryption, policies               |
| **EventBridge**    | Event rules, dead-letter configs             |

### ⚠️ Medium Compatibility (Use with Caution)

| Service        | Notes                              |
| -------------- | ---------------------------------- |
| Lambda         | Works, some edge cases with layers |
| API Gateway    | Basic REST APIs work well          |
| Step Functions | Basic workflows supported          |
| Kinesis        | Basic streaming works              |
| CloudFormation | Core features work                 |

### ❌ Low/Pro-Only (Avoid for Training Quality)

| Service    | Alternative                       |
| ---------- | --------------------------------- |
| EKS        | Use Lambda + Step Functions       |
| AppSync    | Use API Gateway + Lambda          |
| RDS        | Use DynamoDB                      |
| EC2 (full) | Use Lambda                        |
| Cognito    | Use IAM + API Gateway authorizers |
| SageMaker  | Out of scope                      |

---

## Achieving Score 9: The Formula

```
Final Score = Base (8) + MODEL_FAILURES (+1 to +2) + Complexity (+1 to +2)
            = 9 to 10 (capped at 10)
```

### Path to Score 9 (Minimum +1)

Choose ONE of:

1. **One Category A fix** (+1 MODEL_FAILURES)
2. **One complexity factor** (+1 Complexity)

### Path to Score 10 (Minimum +2)

Choose combination totaling +2:

1. **Two Category A fixes** (+2 MODEL_FAILURES)
2. **One Category A + One complexity factor** (+1 + +1)
3. **Two complexity factors** (rarely possible alone)

---

## LocalStack-Compatible Category A Fixes

### 1. KMS Encryption (HIGH Priority)

**What**: Add KMS encryption to resources that support it.

**LocalStack Services**: S3, DynamoDB, SQS, SNS, SecretsManager, SSM

**Implementation Examples**:

```typescript
// CDK TypeScript - S3 with KMS
import * as kms from 'aws-cdk-lib/aws-kms';

const key = new kms.Key(this, 'MyKey', {
  enableKeyRotation: true,
  description: 'KMS key for encrypting resources',
});

const bucket = new s3.Bucket(this, 'SecureBucket', {
  encryption: s3.BucketEncryption.KMS,
  encryptionKey: key,
  bucketKeyEnabled: true,
});
```

```typescript
// CDK TypeScript - DynamoDB with KMS
const table = new dynamodb.Table(this, 'SecureTable', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
  encryptionKey: key,
});
```

```python
# CDK Python - SQS with KMS
from aws_cdk import aws_kms as kms
from aws_cdk import aws_sqs as sqs

key = kms.Key(self, "QueueKey", enable_key_rotation=True)

queue = sqs.Queue(self, "SecureQueue",
    encryption=sqs.QueueEncryption.KMS,
    encryption_master_key=key
)
```

### 2. IAM Least-Privilege Policies (HIGH Priority)

**What**: Replace overly permissive policies with least-privilege.

**LocalStack Services**: All services supporting IAM

**Common Fixes**:

```typescript
// ❌ BAD: Overly permissive
const badPolicy = new iam.PolicyStatement({
  actions: ['s3:*'],
  resources: ['*'],
});

// ✅ GOOD: Least privilege
const goodPolicy = new iam.PolicyStatement({
  actions: ['s3:GetObject', 's3:PutObject'],
  resources: [bucket.arnForObjects('*')],
  conditions: {
    StringEquals: {
      's3:x-amz-acl': 'bucket-owner-full-control',
    },
  },
});
```

```typescript
// Lambda with specific permissions
const lambdaRole = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
});

// Grant only required permissions
table.grantReadWriteData(lambdaRole);
bucket.grantRead(lambdaRole, 'input/*');
bucket.grantWrite(lambdaRole, 'output/*');
```

### 3. CloudWatch Monitoring & Alarms (HIGH Priority)

**What**: Add monitoring, alarms, and dashboards.

**LocalStack Services**: CloudWatch, Logs (fully supported)

**Implementation Examples**:

```typescript
// CDK TypeScript - CloudWatch Alarms
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

// Lambda error alarm
const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
  metric: lambdaFn.metricErrors({
    period: Duration.minutes(5),
  }),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: 'Lambda function errors detected',
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

// DynamoDB throttle alarm
const throttleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
  metric: table.metricThrottledRequests({
    period: Duration.minutes(1),
  }),
  threshold: 1,
  evaluationPeriods: 2,
});
```

```typescript
// CloudWatch Dashboard
const dashboard = new cloudwatch.Dashboard(this, 'ServiceDashboard', {
  dashboardName: `${props.environmentSuffix}-dashboard`,
});

dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Lambda Invocations',
    left: [lambdaFn.metricInvocations()],
  }),
  new cloudwatch.GraphWidget({
    title: 'DynamoDB Read/Write',
    left: [table.metricConsumedReadCapacityUnits()],
    right: [table.metricConsumedWriteCapacityUnits()],
  })
);
```

### 4. Error Handling & Dead-Letter Queues (HIGH Priority)

**What**: Add proper error handling with DLQs.

**LocalStack Services**: SQS, Lambda, SNS, EventBridge

**Implementation Examples**:

```typescript
// Lambda with DLQ
const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
  retentionPeriod: Duration.days(14),
  encryption: sqs.QueueEncryption.KMS_MANAGED,
});

const lambdaFn = new lambda.Function(this, 'ProcessorFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  deadLetterQueue: dlq,
  retryAttempts: 2,
});
```

```typescript
// SQS with DLQ
const mainQueue = new sqs.Queue(this, 'MainQueue', {
  deadLetterQueue: {
    queue: dlq,
    maxReceiveCount: 3,
  },
});
```

### 5. SecretsManager Integration (MEDIUM Priority)

**What**: Replace hardcoded credentials with SecretsManager.

**LocalStack Services**: SecretsManager (fully supported)

**Implementation Examples**:

```typescript
// Create secret
const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
  secretName: `${props.environmentSuffix}/database/credentials`,
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'admin' }),
    generateStringKey: 'password',
    excludePunctuation: true,
  },
});

// Grant Lambda access to secret
dbSecret.grantRead(lambdaFn);

// Pass secret ARN to Lambda
lambdaFn.addEnvironment('SECRET_ARN', dbSecret.secretArn);
```

---

## LocalStack-Compatible Complexity Factors

### Factor 1: Multiple Services (3+) — +1

**Requirement**: Use 3+ AWS services with integrations.

**Best LocalStack Combinations**:

```yaml
# Combination A: Event Processing (All HIGH compatibility)
services:
  - S3 (trigger source)
  - Lambda (processor)
  - DynamoDB (storage)
  - SQS (queue)
  - CloudWatch (monitoring)

# Combination B: API Backend (HIGH/MEDIUM)
services:
  - API Gateway (entry point)
  - Lambda (handlers)
  - DynamoDB (data)
  - SecretsManager (credentials)
  - CloudWatch (logs)

# Combination C: Event-Driven (All HIGH)
services:
  - EventBridge (events)
  - SQS (queuing)
  - SNS (notifications)
  - Lambda (processing)
  - S3 (storage)
```

### Factor 2: Security Best Practices — +1

**Requirements** (at least 2 of these):

- KMS encryption on data stores
- IAM least-privilege policies
- Resource-based policies
- Encryption in transit

**LocalStack Implementation**:

```typescript
// Security best practices bundle
const securityBundle = {
  // KMS key with rotation
  kmsKey: new kms.Key(this, 'Key', {
    enableKeyRotation: true,
    alias: `alias/${props.environmentSuffix}-key`,
  }),

  // S3 with security
  bucket: new s3.Bucket(this, 'Bucket', {
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    versioned: true,
  }),

  // DynamoDB with security
  table: new dynamodb.Table(this, 'Table', {
    encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
    encryptionKey: kmsKey,
    pointInTimeRecovery: true,
  }),
};
```

### Factor 3: Event-Driven Architecture — +1

**Requirements**: Async processing with events/queues.

**LocalStack Implementation**:

```typescript
// Event-driven pattern
const eventBus = new events.EventBus(this, 'AppEventBus', {
  eventBusName: `${props.environmentSuffix}-events`,
});

// Event rule with target
const rule = new events.Rule(this, 'ProcessingRule', {
  eventBus,
  eventPattern: {
    source: ['app.orders'],
    detailType: ['OrderCreated'],
  },
});

rule.addTarget(
  new targets.LambdaFunction(processorFn, {
    deadLetterQueue: dlq,
    retryAttempts: 2,
  })
);
```

### Factor 4: Serverless Patterns — +1

**Requirements**: Lambda-based architecture with proper configurations.

**LocalStack Implementation**:

```typescript
// Serverless API pattern
const api = new apigateway.RestApi(this, 'Api', {
  restApiName: `${props.environmentSuffix}-api`,
  deployOptions: {
    stageName: 'prod',
    tracingEnabled: true,
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
  },
});

const items = api.root.addResource('items');
items.addMethod('GET', new apigateway.LambdaIntegration(listFn));
items.addMethod('POST', new apigateway.LambdaIntegration(createFn));
```

---

## Training Quality Checklist for LocalStack PRs

### Pre-Fix Assessment

```markdown
## Training Quality Pre-Assessment

### Current MODEL_RESPONSE Analysis

- [ ] Has KMS encryption? (If no → Category A opportunity)
- [ ] Has proper IAM policies? (If overly permissive → Category A opportunity)
- [ ] Has CloudWatch monitoring? (If no → Category A opportunity)
- [ ] Has error handling/DLQs? (If no → Category A opportunity)
- [ ] Has SecretsManager for credentials? (If hardcoded → Category A opportunity)

### Complexity Analysis

- [ ] Service count: \_\_\_ (3+ needed for bonus)
- [ ] Security practices present? (KMS, IAM, encryption)
- [ ] Event-driven patterns? (EventBridge, SQS, SNS)
- [ ] Serverless architecture? (Lambda, API Gateway)

### Estimated Score Before Fixes

- Base: 8
- MODEL_FAILURES potential: +\_\_\_
- Complexity potential: +\_\_\_
- Estimated: \_\_\_/10
```

### Post-Fix Documentation

```markdown
## Training Quality Assessment

**Final Score**: {SCORE}/10

### Scoring Breakdown

- Base Score: 8
- MODEL_FAILURES Adjustment: +{X} (Category A fixes applied)
- Complexity Adjustment: +{Y} (factors present)

### Category A Fixes Applied (LocalStack-Compatible)

1. ✅ {Fix description} - {Service used}
2. ✅ {Fix description} - {Service used}

### Complexity Factors Present

- [ ] Multiple services (3+): {list services}
- [ ] Security best practices: {list practices}
- [ ] Event-driven: {yes/no}
- [ ] Serverless: {yes/no}

### LocalStack Verification

- [ ] All services used are HIGH/MEDIUM compatibility
- [ ] No Pro-only services required
- [ ] Deployment to LocalStack successful
```

---

## Common Patterns for Score 9+

### Pattern 1: Secure Data Pipeline (Score: 9-10)

```
S3 (trigger) → Lambda → DynamoDB
    ↓
CloudWatch (monitoring)
    ↓
KMS (encryption everywhere)
```

**Category A Fixes**:

- Add KMS encryption to S3, DynamoDB (+2)
- Add CloudWatch alarms (+1 if not present)

**Complexity**: 4 services, security practices (+2)

### Pattern 2: Event-Driven Processing (Score: 9-10)

```
EventBridge → SQS → Lambda → DynamoDB
                ↓
              DLQ (error handling)
```

**Category A Fixes**:

- Add DLQ for error handling (+1)
- Add IAM least-privilege (+1)

**Complexity**: Event-driven, multiple services (+2)

### Pattern 3: Secure API Backend (Score: 9-10)

```
API Gateway → Lambda → DynamoDB
                 ↓
           SecretsManager
```

**Category A Fixes**:

- Replace hardcoded creds with SecretsManager (+1)
- Add KMS encryption (+1)

**Complexity**: Multiple services, serverless (+2)

---

## Integration with localstack-fixer

When the `localstack-fixer` agent runs, it should:

1. **Analyze MODEL_RESPONSE** for Category A opportunities
2. **Check service compatibility** against LocalStack
3. **Apply fixes** in priority order (security first)
4. **Document fixes** with correct categories
5. **Verify score** meets ≥8 threshold

### Priority Order for LocalStack Fixes

```yaml
training_quality_fixes:
  priority_1_category_a:
    - kms_encryption # Highest impact, fully supported
    - iam_least_privilege # High impact, fully supported
    - cloudwatch_alarms # High impact, fully supported
    - error_handling_dlq # High impact, SQS/Lambda supported

  priority_2_category_a:
    - secretsmanager # Medium impact, fully supported
    - resource_policies # Medium impact, IAM supported

  priority_3_complexity:
    - ensure_3plus_services
    - add_event_patterns
    - enable_security_practices
```

---

## Troubleshooting

### Score Still Below 9?

1. **Check service compatibility**: Are you using Pro-only services?
2. **Verify Category A fixes**: Are fixes documented correctly?
3. **Count services**: Do you have 3+ with integrations?
4. **Review MODEL_FAILURES.md**: Are fixes categorized as A, not C?

### LocalStack Deployment Fails?

1. **Check service support**: Use HIGH compatibility services
2. **Simplify patterns**: Avoid complex service configurations
3. **Use alternatives**: Replace unsupported services

---

## Related Documentation

- `.claude/docs/policies/training-quality-guide.md` - Full scoring rubric
- `.claude/config/localstack.yaml` - Service compatibility matrix
- `.claude/agents/localstack-fixer.md` - Agent workflow
- `.claude/commands/localstack-fix.md` - Command usage
