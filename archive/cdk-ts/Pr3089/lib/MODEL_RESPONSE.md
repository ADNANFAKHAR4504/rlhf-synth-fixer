### Reasoning Trace

---

The user wants me to create a serverless application using AWS CDK with TypeScript. Here's what they need:

1. Lambda functions for data processing
2. S3 bucket for storage
3. DynamoDB for metadata tracking
4. Lambda Fault Injection Service for resilience testing
5. CloudWatch Application Signals for monitoring
6. Security with encryption and least privilege
7. Lambda timeout of 30 seconds
8. Environment variables for configuration
9. Error handling and logging
10. Deployable to us-west-2
11. Modular code structure with separate files

I'll create:

1. Main stack file (app-stack.ts)
2. Lambda construct file (lambda-construct.ts)
3. Storage construct file (storage-construct.ts)
4. A Lambda function handler example
5. The CDK app entry point

I'll make sure to:

- Use proper TypeScript typing
- Follow AWS best practices
- Implement least privilege IAM policies
- Add encryption for S3 and DynamoDB
- Include proper error handling
- Add CloudWatch logging
- Configure Lambda Fault Injection Service
- Set up CloudWatch Application Signals

### Answer

---

I'll help you build a serverless application using AWS CDK with TypeScript that includes all the features you've requested. Let me create a modular, secure, and well-structured solution.

## Project Structure

First, let's set up the project structure:

```
serverless-app/
├── lib/
│   ├── constructs/
│   │   ├── lambda-construct.ts
│   │   └── storage-construct.ts
│   ├── app-stack.ts
│   └── lambda/
│       └── data-processor.ts
├── bin/
│   └── app.ts
├── package.json
└── tsconfig.json
```

## Storage Construct (`lib/constructs/storage-construct.ts`)

```typescript
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface StorageConstructProps {
  /**
   * Prefix for resource names
   */
  prefix: string;

  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;
}

export class StorageConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;
  public readonly metadataTable: dynamodb.Table;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { prefix, environment } = props;

    // Create KMS key for encryption
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for ${prefix} ${environment} environment`,
      alias: `alias/${prefix}-${environment}-key`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY, // For dev/test environments
    });

    // Create S3 bucket with encryption and versioning
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName:
        `${prefix}-data-${environment}-${this.node.addr}`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: { days: 30 },
          enabled: true,
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: { days: 60 },
            },
          ],
          enabled: true,
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For dev/test environments
    });

    // Create DynamoDB table for metadata
    this.metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      tableName: `${prefix}-metadata-${environment}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add global secondary index for querying by status
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
```

## Lambda Construct (`lib/constructs/lambda-construct.ts`)

```typescript
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as path from 'path';

export interface LambdaConstructProps {
  /**
   * Prefix for resource names
   */
  prefix: string;

  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;

  /**
   * S3 bucket for data storage
   */
  dataBucket: s3.Bucket;

  /**
   * DynamoDB table for metadata
   */
  metadataTable: dynamodb.Table;

  /**
   * KMS key for encryption
   */
  encryptionKey: kms.Key;
}

export class LambdaConstruct extends Construct {
  public readonly dataProcessor: lambda.Function;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { prefix, environment, dataBucket, metadataTable, encryptionKey } =
      props;

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${prefix}-alarms-${environment}`,
      masterKey: encryptionKey,
    });

    // Create IAM role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for ${prefix} Lambda functions`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions for fault injection
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'fis:InjectApiInternalError',
          'fis:InjectApiThrottleError',
          'fis:InjectApiUnavailableError',
        ],
        resources: ['*'],
      })
    );

    // Create Lambda function
    this.dataProcessor = new lambda.Function(this, 'DataProcessor', {
      functionName: `${prefix}-data-processor-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'data-processor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      timeout: Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        TABLE_NAME: metadataTable.tableName,
        ENVIRONMENT: environment,
        LOG_LEVEL: environment === 'prod' ? 'info' : 'debug',
        POWERTOOLS_SERVICE_NAME: `${prefix}-data-processor`,
        POWERTOOLS_METRICS_NAMESPACE: prefix,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      reservedConcurrentExecutions: environment === 'prod' ? 100 : 10,
      environmentEncryption: encryptionKey,
    });

    // Grant permissions
    dataBucket.grantReadWrite(this.dataProcessor);
    metadataTable.grantReadWriteData(this.dataProcessor);
    encryptionKey.grantEncryptDecrypt(this.dataProcessor);

    // Enable Lambda Insights
    this.dataProcessor.addLayers(
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        'LambdaInsightsLayer',
        `arn:aws:lambda:us-west-2:580247275435:layer:LambdaInsightsExtension:21`
      )
    );

    // Add permissions for Lambda Insights
    this.dataProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'AWS/Lambda-Insights',
          },
        },
      })
    );

    // Create CloudWatch alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
      alarmName: `${prefix}-lambda-errors-${environment}`,
      metric: this.dataProcessor.metricErrors({
        period: Duration.minutes(5),
        statistic: 'sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const throttleAlarm = new cloudwatch.Alarm(this, 'ThrottleAlarm', {
      alarmName: `${prefix}-lambda-throttles-${environment}`,
      metric: this.dataProcessor.metricThrottles({
        period: Duration.minutes(5),
        statistic: 'sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'DurationAlarm', {
      alarmName: `${prefix}-lambda-duration-${environment}`,
      metric: this.dataProcessor.metricDuration({
        period: Duration.minutes(5),
        statistic: 'average',
      }),
      threshold: 25000, // 25 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm actions
    [errorAlarm, throttleAlarm, durationAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cwactions.SnsAction(this.alarmTopic));
    });

    // Create Application Signals dashboard
    new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
      dashboardName: `${prefix}-application-signals-${environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Invocations',
            left: [this.dataProcessor.metricInvocations()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: [this.dataProcessor.metricErrors()],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Duration',
            left: [this.dataProcessor.metricDuration()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Throttles',
            left: [this.dataProcessor.metricThrottles()],
            width: 12,
          }),
        ],
      ],
    });
  }
}
```

## Lambda Function Handler (`lib/lambda/data-processor.ts`)

```typescript
import { Context, S3Event } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger({ serviceName: process.env.POWERTOOLS_SERVICE_NAME });
const metrics = new Metrics({
  namespace: process.env.POWERTOOLS_METRICS_NAMESPACE,
});
const tracer = new Tracer({ serviceName: process.env.POWERTOOLS_SERVICE_NAME });

const s3Client = tracer.captureAWSv3Client(
  new S3Client({ region: 'us-west-2' })
);
const dynamoClient = tracer.captureAWSv3Client(
  new DynamoDBClient({ region: 'us-west-2' })
);

const BUCKET_NAME = process.env.BUCKET_NAME!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: S3Event,
  context: Context
): Promise<void> => {
  const segment = tracer.getSegment();

  logger.info('Processing S3 event', {
    requestId: context.requestId,
    eventRecords: event.Records.length,
  });

  metrics.addMetric('ProcessedEvents', MetricUnits.Count, event.Records.length);

  try {
    for (const record of event.Records) {
      const subsegment = segment?.addNewSubsegment('processRecord');

      try {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, ' ')
        );

        logger.info('Processing object', { bucket, key });

        // Create metadata entry
        const metadataId = uuidv4();
        const timestamp = Date.now();

        await dynamoClient.send(
          new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              id: { S: metadataId },
              timestamp: { N: timestamp.toString() },
              status: { S: 'processing' },
              bucket: { S: bucket },
              key: { S: key },
              size: { N: record.s3.object.size.toString() },
              eventTime: { S: record.eventTime },
              ttl: { N: (timestamp + 86400000).toString() }, // 24 hours TTL
            },
          })
        );

        // Simulate processing (in real app, this would be actual processing logic)
        await processData(bucket, key);

        // Update status to completed
        await dynamoClient.send(
          new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: {
              id: { S: metadataId },
              timestamp: { N: timestamp.toString() },
            },
            UpdateExpression:
              'SET #status = :status, completedAt = :completedAt',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': { S: 'completed' },
              ':completedAt': { N: Date.now().toString() },
            },
          })
        );

        metrics.addMetric('ProcessedSuccessfully', MetricUnits.Count, 1);
        logger.info('Successfully processed object', {
          bucket,
          key,
          metadataId,
        });
      } catch (error) {
        logger.error('Error processing record', error as Error, {
          record: JSON.stringify(record),
        });

        metrics.addMetric('ProcessingErrors', MetricUnits.Count, 1);
        throw error;
      } finally {
        subsegment?.close();
      }
    }
  } catch (error) {
    logger.error('Handler error', error as Error);
    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};

async function processData(bucket: string, key: string): Promise<void> {
  const subsegment = tracer.getSegment()?.addNewSubsegment('processData');

  try {
    // Get object from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(getCommand);
    const data = (await response.Body?.transformToString()) || '';

    // Simulate data processing with some async operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

    // Example: Transform and save processed data
    const processedData = {
      originalKey: key,
      processedAt: new Date().toISOString(),
      dataLength: data.length,
      // Add your processing logic here
    };

    const processedKey = `processed/${key}`;
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: processedKey,
      Body: JSON.stringify(processedData),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    logger.debug('Data processed successfully', {
      originalKey: key,
      processedKey,
    });
  } finally {
    subsegment?.close();
  }
}
```

## Main Stack (`lib/app-stack.ts`)

```typescript
import { Stack, StackProps, Tags, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { StorageConstruct } from './constructs/storage-construct';
import { LambdaConstruct } from './constructs/lambda-construct';

export interface AppStackProps extends StackProps {
  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;

  /**
   * Email address for alarm notifications
   */
  alarmEmail?: string;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const prefix = 'serverless-app';
    const { environment, alarmEmail } = props;

    // Add tags to all resources
    Tags.of(this).add('Project', prefix);
    Tags.of(this).add('Environment', environment);
    Tags.of(this).add('ManagedBy', 'CDK');

    // Create storage resources
    const storage = new StorageConstruct(this, 'Storage', {
      prefix,
      environment,
    });

    // Create Lambda resources
    const lambdaConstruct = new LambdaConstruct(this, 'Lambda', {
      prefix,
      environment,
      dataBucket: storage.dataBucket,
      metadataTable: storage.metadataTable,
      encryptionKey: storage.encryptionKey,
    });

    // Add S3 event notification to trigger Lambda
    storage.dataBucket.addEventNotification(
      s3n.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaConstruct.dataProcessor),
      {
        prefix: 'incoming/',
        suffix: '.json',
      }
    );

    // Subscribe email to alarm topic if provided
    if (alarmEmail) {
      lambdaConstruct.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(alarmEmail)
      );
    }

    // Outputs
    new CfnOutput(this, 'BucketName', {
      value: storage.dataBucket.bucketName,
      description: 'Name of the S3 bucket for data storage',
    });

    new CfnOutput(this, 'TableName', {
      value: storage.metadataTable.tableName,
      description: 'Name of the DynamoDB table for metadata',
    });

    new CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaConstruct.dataProcessor.functionName,
      description: 'Name of the data processor Lambda function',
    });

    new CfnOutput(this, 'AlarmTopicArn', {
      value: lambdaConstruct.alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });
  }
}
```

## CDK App Entry Point (`bin/app.ts`)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';
const alarmEmail = app.node.tryGetContext('alarmEmail');

new AppStack(app, `ServerlessApp-${environment}`, {
  environment,
  alarmEmail,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: `Serverless data processing application - ${environment}`,
});
```

## Package.json Dependencies

```json
{
  "name": "serverless-app",
  "version": "1.0.0",
  "bin": {
    "app": "bin/app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy:dev": "npm run build && cdk deploy --context environment=dev",
    "deploy:prod": "npm run build && cdk deploy --context environment=prod --context alarmEmail=alerts@example.com"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "20.8.10",
    "aws-cdk": "2.104.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "@aws-lambda-powertools/logger": "^1.14.0",
    "@aws-lambda-powertools/metrics": "^1.14.0",
    "@aws-lambda-powertools/tracer": "^1.14.0",
    "@aws-sdk/client-dynamodb": "^3.445.0",
    "@aws-sdk/client-s3": "^3.445.0",
    "@types/aws-lambda": "^8.10.125",
    "@types/uuid": "^9.0.6",
    "aws-cdk-lib": "2.104.0",
    "constructs": "^10.3.0",
    "source-map-support": "^0.5.21",
    "uuid": "^9.0.1"
  }
}
```

## Key Features Implemented

### 1. **Security**

- All resources are encrypted using a customer-managed KMS key
- IAM roles follow least privilege principle
- S3 bucket has versioning, SSL enforcement, and public access blocking
- Lambda functions use encrypted environment variables

### 2. **Monitoring & Observability**

- CloudWatch alarms for errors, throttles, and duration
- Lambda Insights enabled for enhanced metrics
- AWS X-Ray tracing for distributed tracing
- Structured logging with Lambda Powertools

### 3. **Resilience & Testing**

- Lambda Fault Injection Service permissions added
- Error handling with proper logging
- DynamoDB with point-in-time recovery
- S3 lifecycle policies for cost optimization

### 4. **Best Practices**

- Modular, reusable constructs
- Environment-based configuration
- Proper tagging for resource management
- CloudFormation outputs for easy reference

## Deployment

To deploy this application:

```bash
# Install dependencies
npm install

# Deploy to dev environment
npm run deploy:dev

# Deploy to production with alarm email
npm run deploy:prod
```

The application will automatically handle:

- Creating all necessary IAM roles and policies
- Setting up encryption for all resources
- Configuring monitoring and alarms
- Establishing event-driven processing from S3 to Lambda
