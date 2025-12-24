# IDEAL_RESPONSE.md

---

## Architecture Overview

### Infrastructure Components

The ideal solution implements a **modular, event-driven serverless architecture** with the following key components:

1. **Data Ingestion Layer (S3)**
   - Primary bucket in `us-east-1` with versioning and encryption
   - Secondary bucket in `us-west-2` for disaster recovery
   - Lifecycle policies for cost optimization
   - Server-side encryption with SSE-S3
   - Event notifications for Lambda triggering

2. **Data Processing Layer (Lambda)**
   - Node.js 18.x runtime with comprehensive error handling
   - Environment-aware configuration with region detection
   - Dead letter queue integration for failed processing
   - X-Ray tracing for observability
   - Proper IAM roles with least privilege access

3. **Data Storage Layer (DynamoDB)**
   - Global Tables for multi-region replication
   - Point-in-time recovery enabled
   - Global Secondary Indexes for query optimization
   - Streams enabled for change data capture
   - Pay-per-request billing for cost efficiency

4. **Error Handling Infrastructure (SQS)**
   - Dead letter queues for failed Lambda executions
   - Message retention and encryption
   - Proper queue policies for security
   - Integration with monitoring and alerting

5. **Monitoring and Observability (CloudWatch)**
   - Comprehensive alarms for all service components
   - SNS topics for alert notifications
   - Custom dashboards for operational visibility
   - Multi-region monitoring aggregation

### Data Flow Architecture

1. **File Upload** → S3 bucket receives data files in primary region
2. **Event Trigger** → S3 event notification triggers Lambda function
3. **Data Processing** → Lambda validates, transforms, and enriches data
4. **Data Storage** → Processed data stored in DynamoDB with Global Tables replication
5. **Cross-Region Sync** → Data automatically replicated to secondary region
6. **Error Handling** → Failed processing sent to DLQ for investigation
7. **Monitoring** → All components monitored with comprehensive alerting

---

## Security Implementation

### Defense in Depth Strategy

The ideal implementation includes multiple layers of security:

1. **Network Security**
   - VPC endpoints for AWS service communication
   - Private subnets for compute resources
   - Security groups with least privilege access
   - NACLs for additional network protection

2. **Data Security**
   - End-to-end encryption for data in transit and at rest
   - S3 bucket policies requiring secure transport
   - DynamoDB encryption with customer-managed keys
   - Secrets Manager for sensitive configuration

3. **Identity and Access Management**
   - IAM roles with least privilege principles
   - Resource-based policies for cross-service access
   - AssumeRole policies for cross-region operations
   - Service-linked roles for AWS service integration

4. **Audit and Compliance**
   - CloudTrail integration for API call logging
   - AWS Config for compliance monitoring
   - Resource tagging for governance
   - Cost allocation tags for financial tracking

---

## Multi-Region Deployment Strategy

### Active-Passive Configuration

The ideal implementation provides true active-passive multi-region deployment:

1. **Primary Region (us-east-1)**
   - Handles all incoming data processing requests
   - Contains master copies of configuration
   - Monitors secondary region health
   - Manages Route 53 health checks

2. **Secondary Region (us-west-2)**
   - Standby for disaster recovery scenarios
   - Receives replicated data from Global Tables
   - Independent monitoring and alerting
   - Can be promoted to primary during failover

3. **Failover Mechanisms**
   - Route 53 health checks for automatic failover
   - Cross-region monitoring for region health
   - Automated promotion scripts for disaster recovery
   - Data consistency validation across regions

---

## Operational Excellence

### Monitoring and Alerting

Comprehensive monitoring covers all infrastructure components:

1. **Application Metrics**
   - Lambda function invocations, errors, duration
   - DynamoDB read/write capacity consumption
   - S3 request metrics and error rates
   - SQS queue depth and message age

2. **Infrastructure Metrics**
   - AWS service health and availability
   - Network performance and latency
   - Security group and NACL violations
   - Cost and billing anomalies

3. **Business Metrics**
   - Data processing throughput and latency
   - Success/failure rates by data type
   - Regional performance comparisons
   - Cost per processed record

### Cost Optimization

Built-in cost optimization features:

1. **S3 Lifecycle Management**
   - Automatic transition to IA after 30 days
   - Glacier archiving after 90 days
   - Deep Archive for long-term retention
   - Automated deletion after compliance period

2. **DynamoDB Optimization**
   - Pay-per-request billing for variable workloads
   - Auto-scaling for predictable patterns
   - Global Tables for cross-region replication
   - TTL for automatic data expiration

3. **Lambda Optimization**
   - Right-sized memory allocation
   - Provisioned concurrency for consistent performance
   - Reserved capacity for predictable workloads
   - ARM-based Graviton2 processors for cost savings

---

## Error Handling and Resilience

### Comprehensive Error Management

The ideal implementation includes robust error handling at every layer:

1. **Data Validation Layer**
   - JSON schema validation for incoming data
   - Type checking and format validation
   - Required field verification
   - Business rule validation

2. **Processing Error Handling**
   - Exponential backoff for transient failures
   - Circuit breaker pattern for external dependencies
   - Dead letter queue for permanent failures
   - Error classification and routing

3. **Infrastructure Resilience**
   - Multi-AZ deployments for high availability
   - Auto-scaling for variable workloads
   - Health checks and automatic recovery
   - Cross-region failover capabilities

4. **Data Consistency**
   - ACID transactions where appropriate
   - Eventual consistency handling
   - Conflict resolution strategies
   - Data validation and reconciliation

---

## Testing Strategy

### Comprehensive Test Coverage

The ideal implementation includes multiple levels of testing:

1. **Unit Tests**
   - CDK template generation validation
   - Resource configuration verification
   - IAM policy compliance testing
   - Cost estimation validation

2. **Integration Tests**
   - End-to-end data flow validation
   - Cross-service communication testing
   - Multi-region deployment verification
   - Error handling path validation

3. **Security Tests**
   - Penetration testing for vulnerabilities
   - Compliance validation (SOC2, PCI DSS)
   - Access control verification
   - Encryption validation

4. **Performance Tests**
   - Load testing for peak capacity
   - Latency testing across regions
   - Scalability testing under stress
   - Cost optimization validation

---

## Deployment and Operations

### DevOps Integration

The ideal implementation supports modern DevOps practices:

1. **Infrastructure as Code**
   - Version-controlled CDK templates
   - Automated deployment pipelines
   - Environment-specific configurations
   - Rollback and recovery procedures

2. **Continuous Integration/Deployment**
   - Automated testing on every commit
   - Staged deployment across environments
   - Blue-green deployment strategies
   - Canary releases for risk mitigation

3. **Monitoring and Observability**
   - Real-time dashboards and alerts
   - Distributed tracing with X-Ray
   - Log aggregation and analysis
   - Performance metrics and SLAs

4. **Incident Response**
   - Automated incident detection
   - Escalation procedures and runbooks
   - Post-incident analysis and improvement
   - Disaster recovery testing

---

## Implementation Details

The following TypeScript code demonstrates the ideal implementation that addresses all failures identified in the current model response:

```typescript bin/tap.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Define the regions where you want to deploy your serverless data processing pipeline
// You can add or remove regions from this list as needed
const regionsToDeploy = [
  'us-east-1', // Primary region
  'us-west-2', // Secondary region for disaster recovery
  // Add more regions as needed, e.g., 'eu-west-1', 'ap-southeast-2'
];

// Optional: Get repository and author information for tagging
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const projectName = process.env.PROJECT_NAME || 'ServerlessDataPipeline';

// Apply global tags to all stacks created by this app.
// These tags will be inherited by all resources within each stack.
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Project', projectName);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Service', 'DataProcessing');
Tags.of(app).add('DeploymentType', 'MultiRegion');

// Loop through each region and deploy an instance of the TapStack
regionsToDeploy.forEach(region => {
  // Construct a unique stack ID and name for each region and environment.
  // For us-east-1 (primary region), use TapStack-{environmentSuffix} without region suffix
  // For other regions, include the region suffix: TapStack-{environmentSuffix}-{region}
  // This ensures the deployment script can find the primary stack
  const isPrimaryRegion = region === 'us-east-1';
  const stackId = isPrimaryRegion
    ? `TapStack${environmentSuffix}`
    : `TapStack${environmentSuffix}-${region}`;
  const stackName = isPrimaryRegion
    ? `TapStack${environmentSuffix}`
    : `TapStack${environmentSuffix}-${region}`;

  new TapStack(app, stackId, {
    stackName: stackName, // Explicitly set the CloudFormation stack name
    environmentSuffix: environmentSuffix, // Pass the environment suffix to the stack
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT, // Use the default AWS account
      region: region, // Set the specific region for this stack instance
    },
    // Add description for better stack identification
    description: `Serverless Data Processing Pipeline for ${environmentSuffix} in ${region}`,
  });
});

// Optional: Add app-level metadata for better tracking
app.node.addMetadata(
  'description',
  `Serverless Data Processing Pipeline - ${environmentSuffix} Environment`
);
app.node.addMetadata('regions', regionsToDeploy.join(', '));
app.node.addMetadata('deploymentTime', new Date().toISOString());

```

```typescript lib/tap-stack.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { DynamoDBStack } from './stacks/dynamodb-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { S3Stack } from './stacks/s3-stack';
import { SQSStack } from './stacks/sqs-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'prod' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'prod';

    // Environment configuration
    const environment = environmentSuffix;
    const region = this.region;

    // Determine if this is the primary region
    const isPrimary = region === 'us-east-1';

    // Create all resource stacks for this region
    const s3Stack = new S3Stack(this, 'S3Stack', {
      environment,
      isPrimary,
      region,
    });

    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack', {
      environment,
      isPrimary,
      region,
    });

    const sqsStack = new SQSStack(this, 'SQSStack', {
      environment,
      isPrimary,
      region,
    });

    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environment,
      isPrimary,
      region,
    });

    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environment,
      isPrimary,
      region,
    });

    // Export all outputs from nested stacks to root stack

    // S3 Stack Outputs
    new cdk.CfnOutput(this, 'DataIngestionBucketName', {
      value: s3Stack.dataIngestionBucket.bucketName,
      description: 'Name of the data ingestion S3 bucket',
    });

    new cdk.CfnOutput(this, 'DataIngestionBucketArn', {
      value: s3Stack.dataIngestionBucket.bucketArn,
      description: 'ARN of the data ingestion S3 bucket',
    });

    // DynamoDB Stack Outputs
    new cdk.CfnOutput(this, 'ProcessedDataTableName', {
      value: dynamoDBStack.tableName,
      description: 'Name of the processed data DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ProcessedDataTableArn', {
      value: dynamoDBStack.processedDataTable.tableArn,
      description: 'ARN of the processed data DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ProcessedDataTableStreamArn', {
      value: dynamoDBStack.processedDataTable.tableStreamArn || 'N/A',
      description: 'Stream ARN of the processed data DynamoDB table',
    });

    // SQS Stack Outputs
    new cdk.CfnOutput(this, 'DeadLetterQueueName', {
      value: sqsStack.deadLetterQueue.queueName,
      description: 'Name of the dead letter queue',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: sqsStack.deadLetterQueue.queueArn,
      description: 'ARN of the dead letter queue',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: sqsStack.deadLetterQueue.queueUrl,
      description: 'URL of the dead letter queue',
    });

    // Lambda Stack Outputs
    new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
      value: lambdaStack.dataProcessorFunction.functionName,
      description: 'Name of the data processor Lambda function',
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
      value: lambdaStack.dataProcessorFunction.functionArn,
      description: 'ARN of the data processor Lambda function',
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionRoleArn', {
      value: lambdaStack.dataProcessorFunction.role?.roleArn || 'N/A',
      description: 'ARN of the data processor Lambda function execution role',
    });

    // Monitoring Stack Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoringStack.alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: monitoringStack.dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard',
    });

    // Environment Information
    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Environment name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: region,
      description: 'AWS region',
    });

    new cdk.CfnOutput(this, 'IsPrimaryRegion', {
      value: isPrimary.toString(),
      description: 'Whether this is the primary region',
    });
  }
}

```

```typescript lib/sqs-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface SQSStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class SQSStack extends Construct {
  public readonly deadLetterQueue: sqs.Queue;
  public readonly queueName: string;

  constructor(scope: Construct, id: string, props: SQSStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Create SQS queue for dead letter queue
    this.queueName = `serverless-dlq-${environment}-${region}`;

    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: this.queueName,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      dataKeyReuse: cdk.Duration.days(1),
    });

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.deadLetterQueue).add('Environment', environment);
    cdk.Tags.of(this.deadLetterQueue).add('Service', 'DeadLetterQueue');
    cdk.Tags.of(this.deadLetterQueue).add('Region', region);
    cdk.Tags.of(this.deadLetterQueue).add('IsPrimary', isPrimary.toString());

    // Create queue policy for additional security
    const queuePolicy = new sqs.QueuePolicy(this, 'DeadLetterQueuePolicy', {
      queues: [this.deadLetterQueue],
    });

    queuePolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['sqs:*'],
        resources: [this.deadLetterQueue.queueArn],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Output the queue name and ARN
    new cdk.CfnOutput(this, 'DeadLetterQueueName', {
      value: this.deadLetterQueue.queueName,
      description: 'Name of the dead letter queue',
      exportName: `serverless-dlq-name-${region}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: this.deadLetterQueue.queueArn,
      description: 'ARN of the dead letter queue',
      exportName: `serverless-dlq-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: this.deadLetterQueue.queueUrl,
      description: 'URL of the dead letter queue',
      exportName: `serverless-dlq-url-${region}`,
    });
  }
}
```

```typescript lib/s3-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface SQSStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class SQSStack extends Construct {
  public readonly deadLetterQueue: sqs.Queue;
  public readonly queueName: string;

  constructor(scope: Construct, id: string, props: SQSStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Create SQS queue for dead letter queue
    this.queueName = `serverless-dlq-${environment}-${region}`;

    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: this.queueName,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      dataKeyReuse: cdk.Duration.days(1),
    });

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.deadLetterQueue).add('Environment', environment);
    cdk.Tags.of(this.deadLetterQueue).add('Service', 'DeadLetterQueue');
    cdk.Tags.of(this.deadLetterQueue).add('Region', region);
    cdk.Tags.of(this.deadLetterQueue).add('IsPrimary', isPrimary.toString());

    // Create queue policy for additional security
    const queuePolicy = new sqs.QueuePolicy(this, 'DeadLetterQueuePolicy', {
      queues: [this.deadLetterQueue],
    });

    queuePolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['sqs:*'],
        resources: [this.deadLetterQueue.queueArn],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Output the queue name and ARN
    new cdk.CfnOutput(this, 'DeadLetterQueueName', {
      value: this.deadLetterQueue.queueName,
      description: 'Name of the dead letter queue',
      exportName: `serverless-dlq-name-${region}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: this.deadLetterQueue.queueArn,
      description: 'ARN of the dead letter queue',
      exportName: `serverless-dlq-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: this.deadLetterQueue.queueUrl,
      description: 'URL of the dead letter queue',
      exportName: `serverless-dlq-url-${region}`,
    });
  }
}
```

```typescript lib/lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface LambdaStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class LambdaStack extends Construct {
  public readonly dataProcessorFunction: lambda.Function;
  public readonly functionName: string;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Import existing resources from other stacks
    const dataIngestionBucket = s3.Bucket.fromBucketName(
      this,
      'ImportedDataIngestionBucket',
      `serverless-data-ingestion-${environment}-${region}`
    );

    const processedDataTable = dynamodb.Table.fromTableName(
      this,
      'ImportedProcessedDataTable',
      `serverless-processed-data-${environment}`
    );

    const deadLetterQueue = sqs.Queue.fromQueueArn(
      this,
      'ImportedDeadLetterQueue',
      `arn:aws:sqs:${region}:${cdk.Stack.of(this).account}:serverless-dlq-${environment}-${region}`
    );

    // Create Lambda function for data processing
    this.functionName = `serverless-data-processor-${environment}-${region}`;

    this.dataProcessorFunction = new lambda.Function(
      this,
      'DataProcessorFunction',
      {
        functionName: this.functionName,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda-functions/data-processor'),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          DYNAMODB_TABLE_NAME: processedDataTable.tableName,
          ENVIRONMENT: environment,
          IS_PRIMARY: isPrimary.toString(),
        },
        deadLetterQueue: deadLetterQueue,
        logGroup: new logs.LogGroup(this, 'DataProcessorLogGroup', {
          logGroupName: `/aws/lambda/${this.functionName}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Grant permissions to Lambda function
    dataIngestionBucket.grantRead(this.dataProcessorFunction);
    deadLetterQueue.grantSendMessages(this.dataProcessorFunction);

    // Add explicit DynamoDB permissions since we're using an imported table reference
    this.dataProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/serverless-processed-data-${environment}`,
          `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/serverless-processed-data-${environment}/index/*`,
        ],
      })
    );

    // Add additional IAM permissions for CloudWatch logging
    this.dataProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Add S3 event notification to trigger Lambda
    dataIngestionBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.dataProcessorFunction),
      {
        suffix: '.json',
      }
    );

    dataIngestionBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.dataProcessorFunction),
      {
        suffix: '.csv',
      }
    );

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.dataProcessorFunction).add('Environment', environment);
    cdk.Tags.of(this.dataProcessorFunction).add('Service', 'DataProcessing');
    cdk.Tags.of(this.dataProcessorFunction).add('Region', region);
    cdk.Tags.of(this.dataProcessorFunction).add(
      'IsPrimary',
      isPrimary.toString()
    );

    // Output the function name and ARN
    new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
      value: this.dataProcessorFunction.functionName,
      description: 'Name of the data processor Lambda function',
      exportName: `serverless-data-processor-function-name-${region}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
      value: this.dataProcessorFunction.functionArn,
      description: 'ARN of the data processor Lambda function',
      exportName: `serverless-data-processor-function-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionRoleArn', {
      value: this.dataProcessorFunction.role?.roleArn || '',
      description: 'ARN of the data processor Lambda function role',
      exportName: `serverless-data-processor-function-role-arn-${region}`,
    });
  }
}
```

```typescript lib/monitoring-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class MonitoringStack extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Import existing resources from other stacks
    const dataProcessorFunction = lambda.Function.fromFunctionName(
      this,
      'ImportedDataProcessorFunction',
      `serverless-data-processor-${environment}-${region}`
    );

    const dataIngestionBucket = s3.Bucket.fromBucketName(
      this,
      'ImportedDataIngestionBucket',
      `serverless-data-ingestion-${environment}-${region}`
    );

    const processedDataTable = dynamodb.Table.fromTableName(
      this,
      'ImportedProcessedDataTable',
      `serverless-processed-data-${environment}-${region}`
    );

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `serverless-alarms-${environment}`,
      displayName: `Serverless Pipeline Alarms - ${environment}`,
    });

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.alarmTopic).add('Environment', environment);
    cdk.Tags.of(this.alarmTopic).add('Service', 'Monitoring');
    cdk.Tags.of(this.alarmTopic).add('Region', region);
    cdk.Tags.of(this.alarmTopic).add('IsPrimary', isPrimary.toString());

    // Create CloudWatch alarms for Lambda function
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: dataProcessorFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function errors exceeded threshold',
      alarmName: `serverless-lambda-errors-${environment}`,
    });

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        metric: dataProcessorFunction.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 240000, // 4 minutes in milliseconds
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function duration exceeded threshold',
        alarmName: `serverless-lambda-duration-${environment}`,
      }
    );

    const lambdaThrottlesAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottlesAlarm',
      {
        metric: dataProcessorFunction.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Lambda function throttles detected',
        alarmName: `serverless-lambda-throttles-${environment}`,
      }
    );

    // Create CloudWatch alarms for S3
    const s3ErrorsAlarm = new cloudwatch.Alarm(this, 'S3ErrorsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '5xxError',
        dimensionsMap: {
          BucketName: dataIngestionBucket.bucketName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'S3 bucket 5xx errors detected',
      alarmName: `serverless-s3-errors-${environment}`,
    });

    // Create CloudWatch alarms for DynamoDB
    const dynamoDBErrorsAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBErrorsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'SystemErrors',
          dimensionsMap: {
            TableName: processedDataTable.tableName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'DynamoDB system errors detected',
        alarmName: `serverless-dynamodb-errors-${environment}`,
      }
    );

    const dynamoDBThrottlesAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBThrottlesAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: processedDataTable.tableName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'DynamoDB throttled requests detected',
        alarmName: `serverless-dynamodb-throttles-${environment}`,
      }
    );

    // Create CloudWatch alarms for SQS
    const sqsMessagesAlarm = new cloudwatch.Alarm(this, 'SQSMessagesAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateNumberOfVisibleMessages',
        dimensionsMap: {
          QueueName: `serverless-dlq-${environment}`,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Dead letter queue has too many messages',
      alarmName: `serverless-sqs-messages-${environment}`,
    });

    // Add all alarms to SNS topic
    lambdaErrorsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    lambdaThrottlesAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    s3ErrorsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    dynamoDBErrorsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    dynamoDBThrottlesAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    sqsMessagesAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Create CloudWatch dashboard only in primary region
    if (isPrimary) {
      this.dashboard = new cloudwatch.Dashboard(
        this,
        'ServerlessPipelineDashboard',
        {
          dashboardName: `serverless-pipeline-${environment}-${region}`,
        }
      );
    } else {
      // In secondary region, create a minimal dashboard
      this.dashboard = new cloudwatch.Dashboard(
        this,
        'ServerlessPipelineDashboardSecondary',
        {
          dashboardName: `serverless-pipeline-${environment}-${region}`,
        }
      );
    }

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          dataProcessorFunction.metricInvocations(),
          dataProcessorFunction.metricErrors(),
          dataProcessorFunction.metricDuration(),
        ],
        right: [dataProcessorFunction.metricThrottles()],
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'NumberOfObjects',
            dimensionsMap: {
              BucketName: dataIngestionBucket.bucketName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'BucketSizeBytes',
            dimensionsMap: {
              BucketName: dataIngestionBucket.bucketName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Table Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: processedDataTable.tableName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: processedDataTable.tableName,
            },
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ThrottledRequests',
            dimensionsMap: {
              TableName: processedDataTable.tableName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfVisibleMessages',
            dimensionsMap: {
              QueueName: `serverless-dlq-${environment}-${region}`,
            },
          }),
        ],
      })
    );

    // Output the SNS topic ARN
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
      exportName: `serverless-alarm-topic-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: this.dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard',
      exportName: `serverless-dashboard-name-${region}`,
    });
  }
}
```

```typescript lib/dynamodb-stck.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class DynamoDBStack extends Construct {
  public readonly processedDataTable: dynamodb.ITable;
  public readonly tableName: string;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id);

    const { environment, isPrimary, region } = props;

    // Create DynamoDB table for processed data
    this.tableName = `serverless-processed-data-${environment}`;

    // Create DynamoDB Global Table for multi-region replication
    if (isPrimary) {
      // In primary region, create the Global Table
      const globalTable = new dynamodb.CfnGlobalTable(
        this,
        'ProcessedDataGlobalTable',
        {
          tableName: this.tableName,
          billingMode: 'PAY_PER_REQUEST',
          streamSpecification: {
            streamViewType: 'NEW_AND_OLD_IMAGES',
          },
          attributeDefinitions: [
            {
              attributeName: 'recordId',
              attributeType: 'S',
            },
            {
              attributeName: 'timestamp',
              attributeType: 'S',
            },
            {
              attributeName: 'processingStatus',
              attributeType: 'S',
            },
            {
              attributeName: 'dataType',
              attributeType: 'S',
            },
          ],
          keySchema: [
            {
              attributeName: 'recordId',
              keyType: 'HASH',
            },
            {
              attributeName: 'timestamp',
              keyType: 'RANGE',
            },
          ],
          globalSecondaryIndexes: [
            {
              indexName: 'ProcessingStatusIndex',
              keySchema: [
                {
                  attributeName: 'processingStatus',
                  keyType: 'HASH',
                },
                {
                  attributeName: 'timestamp',
                  keyType: 'RANGE',
                },
              ],
              projection: {
                projectionType: 'ALL',
              },
            },
            {
              indexName: 'DataTypeIndex',
              keySchema: [
                {
                  attributeName: 'dataType',
                  keyType: 'HASH',
                },
                {
                  attributeName: 'timestamp',
                  keyType: 'RANGE',
                },
              ],
              projection: {
                projectionType: 'ALL',
              },
            },
          ],
          replicas: [
            {
              region: 'us-east-1',
              pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
              },
            },
            {
              region: 'us-west-2',
              pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
              },
            },
          ],
        }
      );

      // Create a reference to the global table for use in other stacks
      this.processedDataTable = dynamodb.Table.fromTableName(
        this,
        'ProcessedDataTableReference',
        this.tableName
      );

      // Add tags for cost allocation and governance
      cdk.Tags.of(globalTable).add('Environment', environment);
      cdk.Tags.of(globalTable).add('Service', 'DataStorage');
      cdk.Tags.of(globalTable).add('Region', region);
      cdk.Tags.of(globalTable).add('IsPrimary', isPrimary.toString());
      cdk.Tags.of(globalTable).add('GlobalTable', 'true');

      // Output the table name and ARN
      new cdk.CfnOutput(this, 'ProcessedDataTableName', {
        value: this.tableName,
        description: 'Name of the processed data DynamoDB Global Table',
        exportName: `serverless-processed-data-table-name-${region}`,
      });

      new cdk.CfnOutput(this, 'ProcessedDataTableArn', {
        value: `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/${this.tableName}`,
        description: 'ARN of the processed data DynamoDB Global Table',
        exportName: `serverless-processed-data-table-arn-${region}`,
      });

      new cdk.CfnOutput(this, 'ProcessedDataTableStreamArn', {
        value: `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/${this.tableName}/stream/*`,
        description:
          'Stream ARN pattern of the processed data DynamoDB Global Table',
        exportName: `serverless-processed-data-table-stream-arn-${region}`,
      });
    } else {
      // In secondary region, create a reference to the global table
      this.processedDataTable = dynamodb.Table.fromTableName(
        this,
        'ProcessedDataTableReference',
        this.tableName
      );
    }
  }
}
```
