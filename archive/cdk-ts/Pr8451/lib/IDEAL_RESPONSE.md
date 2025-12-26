# Serverless Infrastructure with Enhanced Observability - CDK TypeScript Implementation

## Overview
This implementation provides a production-ready serverless infrastructure using AWS CDK with TypeScript, featuring API Gateway, Lambda functions, S3 storage with KMS encryption, CloudWatch logging, AWS X-Ray distributed tracing, and EventBridge event-driven architecture.

## Architecture Components

### 1. Core Infrastructure Stack (`lib/tap-stack.ts`)
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environmentSuffix = 
      this.node.tryGetContext('environmentSuffix') || 
      (props as any)?.environmentSuffix || 
      'dev';

    new ServerlessStack(this, 'ServerlessStack', {
      ...props,
      environmentSuffix,
    });
  }
}
```

### 2. Serverless Infrastructure Stack (`lib/serverless-stack.ts`)

#### Key Resources Configuration

##### KMS Encryption Key
```typescript
const kmsKey = new kms.Key(this, 'ServerlessDataKey', {
  description: `KMS key for srv data encryption - ${environmentSuffix}`,
  enableKeyRotation: true,
  keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
  keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new kms.Alias(this, 'ServerlessDataKeyAlias', {
  aliasName: `alias/srv-data-${environmentSuffix}`,
  targetKey: kmsKey,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

##### X-Ray Distributed Tracing
```typescript
const xrayTracingConfig = new xray.CfnGroup(this, 'ServerlessXRayGroup', {
  groupName: `srv-trace-${environmentSuffix}`,
  filterExpression: `service("srv-handler-${environmentSuffix}")`,
});
```

##### EventBridge Event Bus
```typescript
const customEventBus = new events.EventBus(this, 'ServerlessEventBus', {
  eventBusName: `srv-events-${environmentSuffix}`,
  description: 'Custom event bus for serverless application events',
});

new events.Archive(this, 'ServerlessEventArchive', {
  sourceEventBus: customEventBus,
  archiveName: `srv-archive-${environmentSuffix}`,
  description: 'Archive for serverless application events',
  retention: cdk.Duration.days(7),
  eventPattern: {
    source: ['serverless.application'],
  },
});
```

##### S3 Bucket with Encryption
```typescript
const dataBucket = new s3.Bucket(this, 'ServerlessDataBucket', {
  bucketName: `srv-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
  encryption: s3.BucketEncryption.KMS,
  encryptionKey: kmsKey,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  versioned: true,
  enforceSSL: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
```

##### Main Lambda Function
```typescript
const lambdaFunction = new lambda.Function(this, 'ServerlessHandler', {
  functionName: `srv-handler-${environmentSuffix}`,
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline(lambdaCode),
  role: lambdaRole,
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,
  environment: {
    BUCKET_NAME: dataBucket.bucketName,
    KMS_KEY_ID: kmsKey.keyId,
    EVENT_BUS_NAME: customEventBus.eventBusName,
    XRAY_TRACING_GROUP: xrayTracingConfig.groupName!,
  },
  logGroup: lambdaLogGroup,
  insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
  tracing: lambda.Tracing.ACTIVE,
});
```

##### API Gateway with X-Ray Tracing
```typescript
const api = new apigateway.RestApi(this, 'ServerlessApi', {
  restApiName: `Serverless API - ${environmentSuffix}`,
  description: 'API Gateway for serverless Lambda function with X-Ray tracing',
  deployOptions: {
    stageName: environmentSuffix,
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
    dataTraceEnabled: true,
    metricsEnabled: true,
    tracingEnabled: true,
  },
  cloudWatchRole: true,
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
  },
});
```

##### Event Processing Lambda
```typescript
const eventProcessorFunction = new lambda.Function(this, 'EventProcessor', {
  functionName: `event-processor-${environmentSuffix}`,
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline(eventProcessorCode),
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,
  environment: {
    EVENT_BUS_NAME: customEventBus.eventBusName,
  },
  tracing: lambda.Tracing.ACTIVE,
});
```

##### EventBridge Rule
```typescript
const eventProcessingRule = new events.Rule(this, 'EventProcessingRule', {
  ruleName: `srv-event-proc-${environmentSuffix}`,
  description: 'Rule to process serverless application events',
  eventBus: customEventBus,
  eventPattern: {
    source: ['serverless.application'],
    detailType: ['API Request Processed'],
  },
});

eventProcessingRule.addTarget(new targets.LambdaFunction(eventProcessorFunction, {
  retryAttempts: 3,
}));
```

#### IAM Security Configuration

##### Lambda Execution Role with Least Privilege
```typescript
const lambdaRole = new iam.Role(this, 'ServerlessLambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
  inlinePolicies: {
    S3Access: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
          resources: [dataBucket.bucketArn, `${dataBucket.bucketArn}/*`],
        }),
      ],
    }),
    KMSAccess: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kms:Decrypt',
            'kms:Encrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          resources: [kmsKey.keyArn],
        }),
      ],
    }),
    CloudWatchLogs: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          resources: [lambdaLogGroup.logGroupArn],
        }),
      ],
    }),
    XRayAccess: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
            'xray:GetSamplingRules',
            'xray:GetSamplingTargets',
            'xray:GetSamplingStatisticSummaries',
          ],
          resources: ['*'],
        }),
      ],
    }),
    EventBridgeAccess: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['events:PutEvents', 'events:ListRules', 'events:DescribeRule'],
          resources: [
            customEventBus.eventBusArn,
            `arn:aws:events:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:rule/${customEventBus.eventBusName}/*`,
          ],
        }),
      ],
    }),
  },
});
```

### 3. Stack Outputs
```typescript
new cdk.CfnOutput(this, 'ApiGatewayUrl', {
  value: api.url,
  description: 'API Gateway invocation URL',
  exportName: `ServerlessApiUrl-${environmentSuffix}`,
});

new cdk.CfnOutput(this, 'LambdaFunctionArn', {
  value: lambdaFunction.functionArn,
  description: 'Lambda function ARN',
  exportName: `ServerlessLambdaArn-${environmentSuffix}`,
});

new cdk.CfnOutput(this, 'S3BucketName', {
  value: dataBucket.bucketName,
  description: 'S3 bucket name for data storage',
  exportName: `ServerlessS3Bucket-${environmentSuffix}`,
});

new cdk.CfnOutput(this, 'XRayTracingGroup', {
  value: xrayTracingConfig.groupName!,
  description: 'X-Ray tracing group name',
  exportName: `ServerlessXRayGroup-${environmentSuffix}`,
});

new cdk.CfnOutput(this, 'EventBusName', {
  value: customEventBus.eventBusName,
  description: 'Custom EventBridge bus name',
  exportName: `ServerlessEventBus-${environmentSuffix}`,
});
```

## Features

### Security
- **KMS Encryption**: All S3 data encrypted with customer-managed KMS keys with automatic rotation
- **IAM Least Privilege**: Lambda functions have minimal required permissions
- **SSL Enforcement**: S3 bucket policy enforces SSL for all operations
- **VPC-Independent**: No VPC required, reducing complexity and cost

### Observability
- **X-Ray Distributed Tracing**: Full request tracing across API Gateway and Lambda
- **CloudWatch Insights**: Lambda Insights enabled for enhanced monitoring
- **Structured Logging**: All components log with correlation IDs
- **Custom Metrics**: Performance and business metrics captured

### Event-Driven Architecture
- **EventBridge Integration**: Custom event bus for application events
- **Event Archive**: 7-day retention for event replay and debugging
- **Asynchronous Processing**: Event processor Lambda for decoupled processing
- **Retry Logic**: Built-in retry for event processing failures

### High Availability
- **Multi-AZ**: All managed services operate across availability zones
- **Auto-scaling**: Lambda automatically scales with demand
- **Versioning**: S3 bucket versioning enabled for data protection

### Cost Optimization
- **Serverless**: Pay-per-use pricing model
- **Auto-delete**: S3 objects automatically deleted on stack deletion
- **Resource Tagging**: Environment suffix for cost allocation

## Deployment

### Prerequisites
```bash
npm install
npm run build
```

### Deploy
```bash
export ENVIRONMENT_SUFFIX=prod
npm run cdk:deploy
```

### Test
```bash
# Unit tests with coverage
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm test
```

### Destroy
```bash
npm run cdk:destroy
```

## Testing Coverage

### Unit Tests (100% Coverage)
- KMS key configuration
- S3 bucket encryption settings
- Lambda function configuration
- IAM role policies
- API Gateway settings
- X-Ray tracing configuration
- EventBridge setup
- Stack outputs validation

### Integration Tests
- API Gateway endpoint accessibility
- Lambda function invocation
- S3 bucket operations with KMS
- CloudWatch logging verification
- X-Ray tracing validation
- EventBridge event processing
- End-to-end workflow testing
- Concurrent request handling

## Production Considerations

### Monitoring
- Set up CloudWatch alarms for Lambda errors and throttling
- Configure X-Ray service map alerts
- Monitor EventBridge failed invocations
- Track KMS key usage metrics

### Security Hardening
- Enable AWS Security Hub for compliance monitoring
- Implement API Gateway request throttling
- Add WAF rules for API Gateway protection
- Enable CloudTrail for audit logging

### Performance Optimization
- Adjust Lambda memory based on X-Ray traces
- Implement API Gateway caching for GET requests
- Use Lambda reserved concurrency for predictable performance
- Consider Lambda provisioned concurrency for cold start elimination

### Disaster Recovery
- Enable S3 cross-region replication
- Implement automated backups with AWS Backup
- Document recovery procedures
- Test disaster recovery scenarios regularly

## Compliance
- **Encryption at Rest**: KMS encryption for all data storage
- **Encryption in Transit**: HTTPS/SSL enforced for all communications
- **Audit Logging**: CloudWatch Logs for all component activities
- **Access Control**: IAM roles with least privilege principle
- **Data Residency**: Region-specific deployment ensures data locality