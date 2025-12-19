# Infrastructure Changes Required

This document describes the infrastructure changes needed to fix the MODEL_RESPONSE to produce a working, deployable CDK stack.

## 1. DynamoDB Table Construct

**Issue**: MODEL_RESPONSE uses deprecated `dynamodb.Table` construct for global tables.

**Fix**: Replace with `dynamodb.TableV2` construct which properly supports global table replication.

```typescript
// Before (MODEL_RESPONSE)
const taskTable = new dynamodb.Table(this, 'TaskTable', {
  replicationRegions: ['us-west-2'],
  // ...
});

// After (IDEAL_RESPONSE)
const taskTable = new dynamodb.TableV2(this, 'TaskTable', {
  replicas: [
    {
      region: 'us-west-2',
      contributorInsights: true,
    },
  ],
  // ...
});
```

## 2. DynamoDB VPC Endpoint Type and Subnet Specification

**Issue**: MODEL_RESPONSE creates an Interface VPC Endpoint for DynamoDB which is incorrect. DynamoDB requires a Gateway VPC Endpoint. Additionally, gateway endpoints require explicit subnet selection to ensure route table IDs are available during synthesis.

**Fix**: Change from Interface to Gateway endpoint with explicit subnet selection.

```typescript
// Before (MODEL_RESPONSE)
vpc.addInterfaceEndpoint('DynamoDBEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.DYNAMODB,
  privateDnsEnabled: true,
});

// After (IDEAL_RESPONSE)
vpc.addGatewayEndpoint('DynamoDBEndpoint', {
  service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
  subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
});

// Also add S3 gateway endpoint for Lambda to access S3 buckets
vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
  subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
});
```

## 3. Resource Removal Policies

**Issue**: MODEL_RESPONSE uses `cdk.RemovalPolicy.RETAIN` for KMS keys and DynamoDB tables, preventing stack cleanup.

**Fix**: Change to `cdk.RemovalPolicy.DESTROY` for test environment deployability.

```typescript
// Before (MODEL_RESPONSE)
const kmsKey = new kms.Key(this, 'TaskSystemKMSKey', {
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// After (IDEAL_RESPONSE)
const kmsKey = new kms.Key(this, 'TaskSystemKMSKey', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

## 4. S3 Bucket Configuration

**Issue**: MODEL_RESPONSE S3 buckets lack `autoDeleteObjects: true` and `eventBridgeEnabled: true`, and have hardcoded bucket names without environment suffix.

**Fix**: Add proper cleanup configuration and dynamic naming.

```typescript
// Before (MODEL_RESPONSE)
const bucket1 = new s3.Bucket(this, 'TaskBucket1', {
  bucketName: `task-bucket-1-${this.account}`,
  // missing eventBridgeEnabled and autoDeleteObjects
});

// After (IDEAL_RESPONSE)
const bucket1 = new s3.Bucket(this, 'TaskBucket1', {
  bucketName: `task-bucket-1-${this.account}-${environmentSuffix}`,
  eventBridgeEnabled: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
```

## 5. Lambda Function Implementation

**Issue**: MODEL_RESPONSE uses `NodejsFunction` which requires esbuild bundling and external file path. This fails when Lambda code file does not exist.

**Fix**: Use `lambda.Function` with `Code.fromInline()` for inline code.

```typescript
// Before (MODEL_RESPONSE)
const taskProcessor = new NodejsFunction(this, 'TaskProcessor', {
  entry: path.join(__dirname, 'lambda/task-processor.ts'),
  // ...
});

// After (IDEAL_RESPONSE)
const taskProcessor = new lambda.Function(this, 'TaskProcessor', {
  code: lambda.Code.fromInline(taskProcessorCode),
  handler: 'index.handler',
  // ...
});
```

## 6. Lambda Event Source Mapping

**Issue**: MODEL_RESPONSE incorrectly creates EventSourceMapping by passing it to addEventSource.

**Fix**: Use `lambdaEventSources.SqsEventSource` instead.

```typescript
// Before (MODEL_RESPONSE)
taskProcessor.addEventSource(new lambda.EventSourceMapping(this, 'SQSEventSource', {
  eventSourceArn: taskQueue.queueArn,
  batchSize: 10,
  maxBatchingWindow: cdk.Duration.seconds(5),
}));

// After (IDEAL_RESPONSE)
taskProcessor.addEventSource(
  new lambdaEventSources.SqsEventSource(this.taskQueue, {
    batchSize: 10,
    maxBatchingWindow: cdk.Duration.seconds(5),
  })
);
```

## 7. Resource Naming with Environment Suffix

**Issue**: MODEL_RESPONSE hardcodes resource names without environment suffix causing naming conflicts in multi-environment deployments.

**Fix**: Append environmentSuffix to all resource names.

```typescript
// Before (MODEL_RESPONSE)
queueName: 'distributed-task-queue',
tableName: 'distributed-task-table',

// After (IDEAL_RESPONSE)
queueName: `distributed-task-queue-${environmentSuffix}`,
tableName: `distributed-task-table-${environmentSuffix}`,
```

## 8. SSM Parameter Paths

**Issue**: MODEL_RESPONSE uses static SSM parameter paths without environment suffix.

**Fix**: Include environmentSuffix in parameter paths for isolation.

```typescript
// Before (MODEL_RESPONSE)
parameterName: '/distributed-task-system/queue-url',

// After (IDEAL_RESPONSE)
parameterName: `/distributed-task-system/${environmentSuffix}/queue-url`,
```

## 9. CloudWatch Alarm Configuration

**Issue**: MODEL_RESPONSE alarm lacks explicit comparison operator.

**Fix**: Add explicit comparison operator for clarity.

```typescript
// Before (MODEL_RESPONSE)
new cloudwatch.Alarm(this, 'DLQAlarm', {
  threshold: 10,
  // missing comparisonOperator
});

// After (IDEAL_RESPONSE)
new cloudwatch.Alarm(this, 'DLQAlarm', {
  threshold: 10,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
});
```

## 10. VPC Configuration

**Issue**: MODEL_RESPONSE uses 3 AZs with 3 NAT Gateways which is expensive and unnecessary for test environments.

**Fix**: Reduce to 2 AZs with 1 NAT Gateway.

```typescript
// Before (MODEL_RESPONSE)
const vpc = new ec2.Vpc(this, 'TaskSystemVPC', {
  maxAzs: 3,
  natGateways: 1,
});

// After (IDEAL_RESPONSE)
const vpc = new ec2.Vpc(this, 'TaskSystemVPC', {
  maxAzs: 2,
  natGateways: 1,
});
```

## 11. KMS Key Alias

**Issue**: MODEL_RESPONSE does not set a KMS key alias making it harder to identify.

**Fix**: Add alias with environment suffix.

```typescript
// Before (MODEL_RESPONSE)
const kmsKey = new kms.Key(this, 'TaskSystemKMSKey', {
  // no alias
});

// After (IDEAL_RESPONSE)
const kmsKey = new kms.Key(this, 'TaskSystemKMSKey', {
  alias: `alias/task-system-key-${environmentSuffix}`,
});
```

## 12. Missing Stack Outputs

**Issue**: MODEL_RESPONSE outputs lack export names for cross-stack references.

**Fix**: Add exportName to all CfnOutputs.

```typescript
// Before (MODEL_RESPONSE)
new cdk.CfnOutput(this, 'TaskQueueUrl', {
  value: taskQueue.queueUrl,
  description: 'URL of the task queue',
});

// After (IDEAL_RESPONSE)
new cdk.CfnOutput(this, 'TaskQueueUrl', {
  value: this.taskQueue.queueUrl,
  description: 'URL of the task queue',
  exportName: `TaskQueueUrl-${environmentSuffix}`,
});
```

## 13. DynamoDB Billing Configuration

**Issue**: MODEL_RESPONSE uses `billingMode: dynamodb.BillingMode.PAY_PER_REQUEST` which is the old API.

**Fix**: Use `billing: dynamodb.Billing.onDemand()` with TableV2.

```typescript
// Before (MODEL_RESPONSE)
billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

// After (IDEAL_RESPONSE)
billing: dynamodb.Billing.onDemand(),
```

## 14. Missing Import for Lambda Event Sources

**Issue**: MODEL_RESPONSE does not import the lambda-event-sources module.

**Fix**: Add the required import.

```typescript
// Missing in MODEL_RESPONSE
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
```

## 15. Public Stack Properties

**Issue**: MODEL_RESPONSE does not expose resources as public properties for testing.

**Fix**: Add public readonly properties for all major resources.

```typescript
// Missing in MODEL_RESPONSE
public readonly taskQueue: sqs.Queue;
public readonly dlq: sqs.Queue;
public readonly taskTable: dynamodb.TableV2;
// etc.
```

## Summary

The MODEL_RESPONSE contained 15 infrastructure issues that prevented successful deployment and cleanup. The primary categories of fixes include:

1. Incorrect construct usage (DynamoDB Table vs TableV2)
2. Wrong VPC endpoint type for DynamoDB
3. Missing removal policies for resource cleanup
4. Lambda function bundling issues
5. Resource naming conflicts
6. Missing environment isolation
