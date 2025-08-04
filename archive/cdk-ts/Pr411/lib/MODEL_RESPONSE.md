```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

// Lambda Function Code
const lambdaCode = `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    const results = [];
    
    for (const record of event.Records) {
        try {
            // Extract S3 event information
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
            const eventName = record.eventName;
            
            console.log(\`Processing file: \${key} from bucket: \${bucket}\`);
            
            // Get the object from S3
            const s3 = new AWS.S3();
            const s3Object = await s3.getObject({
                Bucket: bucket,
                Key: key
            }).promise();
            
            let data;
            try {
                data = JSON.parse(s3Object.Body.toString());
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error(\`Invalid JSON format in file \${key}\`);
            }
            
            // Data validation
            if (!data || typeof data !== 'object') {
                throw new Error('Data must be a valid JSON object');
            }
            
            // Data transformation and enrichment
            const processedData = {
                recordId: data.id || \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
                timestamp: new Date().toISOString(),
                originalData: data,
                metadata: {
                    sourceFile: key,
                    sourceBucket: bucket,
                    processedAt: new Date().toISOString(),
                    region: process.env.AWS_REGION,
                    eventName: eventName,
                    fileSize: s3Object.ContentLength,
                    contentType: s3Object.ContentType
                },
                processingStatus: 'PROCESSED',
                dataHash: require('crypto').createHash('md5').update(JSON.stringify(data)).digest('hex')
            };
            
            // Store in DynamoDB with retry logic
            const putParams = {
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: processedData,
                ConditionExpression: 'attribute_not_exists(recordId)'
            };
            
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    await dynamodb.put(putParams).promise();
                    console.log(\`Successfully stored record: \${processedData.recordId}\`);
                    break;
                } catch (dynamoError) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw dynamoError;
                    }
                    console.log(\`DynamoDB put failed, retrying... (\${retryCount}/\${maxRetries})\`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                }
            }
            
            results.push({
                status: 'SUCCESS',
                recordId: processedData.recordId,
                file: key
            });
            
        } catch (error) {
            console.error(\`Error processing record:\`, error);
            
            // Store failed record information
            const failedRecord = {
                recordId: \`failed-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
                timestamp: new Date().toISOString(),
                processingStatus: 'FAILED',
                errorMessage: error.message,
                errorStack: error.stack,
                sourceFile: record.s3?.object?.key || 'unknown',
                sourceBucket: record.s3?.bucket?.name || 'unknown',
                region: process.env.AWS_REGION
            };
            
            try {
                await dynamodb.put({
                    TableName: process.env.DYNAMODB_TABLE_NAME,
                    Item: failedRecord
                }).promise();
            } catch (dynamoError) {
                console.error('Failed to store error record:', dynamoError);
            }
            
            results.push({
                status: 'FAILED',
                error: error.message,
                file: record.s3?.object?.key || 'unknown'
            });
        }
    }
    
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Processing completed',
            results: results,
            processedCount: results.filter(r => r.status === 'SUCCESS').length,
            failedCount: results.filter(r => r.status === 'FAILED').length
        })
    };
    
    console.log('Processing completed:', JSON.stringify(response, null, 2));
    return response;
};
`;

// Stream Processing Lambda Code
const streamProcessorCode = `
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('DynamoDB Stream event received:', JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
        try {
            const eventName = record.eventName;
            const dynamoRecord = record.dynamodb;
            
            console.log(\`Processing stream record: \${eventName}\`);
            
            // Process different types of DynamoDB stream events
            switch (eventName) {
                case 'INSERT':
                    console.log('New record inserted:', JSON.stringify(dynamoRecord.NewImage, null, 2));
                    // Implement audit logging or downstream processing
                    break;
                case 'MODIFY':
                    console.log('Record modified:', JSON.stringify(dynamoRecord.NewImage, null, 2));
                    // Implement change tracking or notifications
                    break;
                case 'REMOVE':
                    console.log('Record removed:', JSON.stringify(dynamoRecord.OldImage, null, 2));
                    // Implement cleanup or archival logic
                    break;
            }
            
        } catch (error) {
            console.error('Error processing stream record:', error);
        }
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Stream processing completed' })
    };
};
`;

// Primary Stack (us-east-1)
export class ServerlessDataProcessingStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly table: dynamodb.Table;
  public readonly processorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dead Letter Queue for failed Lambda executions
    const deadLetterQueue = new sqs.Queue(this, 'ServerlessDeadLetterQueue', {
      queueName: 'serverless-dlq-prod',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Primary S3 Bucket with security configurations
    this.bucket = new s3.Bucket(this, 'ServerlessDataIngestionBucket', {
      bucketName: 'serverless-data-ingestion-prod',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // DynamoDB Table with Global Tables support
    this.table = new dynamodb.Table(this, 'ServerlessProcessedDataTable', {
      tableName: 'serverless-processed-data-prod',
      partitionKey: {
        name: 'recordId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Global Secondary Index for querying by processing status
    this.table.addGlobalSecondaryIndex({
      indexName: 'ProcessingStatusIndex',
      partitionKey: {
        name: 'processingStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // IAM Role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'ServerlessLambdaRole', {
      roleName: 'serverless-lambda-role-prod',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific permissions to Lambda role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
        ],
        resources: [this.table.tableArn, `${this.table.tableArn}/index/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    // Primary Lambda Function for data processing
    this.processorFunction = new lambda.Function(
      this,
      'ServerlessDataProcessor',
      {
        functionName: 'serverless-data-processor-prod',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(lambdaCode),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        role: lambdaRole,
        environment: {
          DYNAMODB_TABLE_NAME: this.table.tableName,
          REGION: this.region,
        },
        deadLetterQueue: deadLetterQueue,
        reservedConcurrentExecutions: 100,
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // DynamoDB Stream Processor Lambda
    const streamProcessorRole = new iam.Role(this, 'StreamProcessorRole', {
      roleName: 'serverless-stream-processor-role-prod',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    streamProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: [this.table.tableStreamArn!],
      })
    );

    const streamProcessor = new lambda.Function(this, 'StreamProcessor', {
      functionName: 'serverless-stream-processor-prod',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(streamProcessorCode),
      timeout: cdk.Duration.minutes(2),
      memorySize: 256,
      role: streamProcessorRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // DynamoDB Stream Event Source
    streamProcessor.addEventSource(
      new lambda.DynamoEventSource(this.table, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
      })
    );

    // S3 Event Notification to trigger Lambda
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.processorFunction),
      {
        prefix: '',
        suffix: '.json',
      }
    );

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.processorFunction),
      {
        prefix: '',
        suffix: '.csv',
      }
    );

    // CloudWatch Alarms and Monitoring
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: 'serverless-lambda-errors-prod',
      metric: this.processorFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: 'serverless-lambda-duration-prod',
      metric: this.processorFunction.metricDuration({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 240000, // 4 minutes in milliseconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'ServerlessAlertTopic', {
      topicName: 'serverless-alerts-prod',
      displayName: 'Serverless Processing Alerts',
    });

    errorAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertTopic)
    );
    durationAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertTopic)
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: 'serverless-processing-dashboard-prod',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          this.processorFunction.metricInvocations(),
          this.processorFunction.metricErrors(),
        ],
        right: [this.processorFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Metrics',
        left: [
          this.table.metricConsumedReadCapacityUnits(),
          this.table.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    // Resource Tags
    cdk.Tags.of(this).add('Environment', 'prod');
    cdk.Tags.of(this).add('Project', 'serverless-data-processing');
    cdk.Tags.of(this).add('Region', 'primary');
    cdk.Tags.of(this).add('CostCenter', 'engineering');

    // Stack Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Primary S3 bucket for data ingestion',
      exportName: 'ServerlessBucketName',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB table for processed data',
      exportName: 'ServerlessTableName',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.processorFunction.functionArn,
      description: 'Lambda function ARN for data processing',
      exportName: 'ServerlessLambdaArn',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'Dead letter queue URL for failed processing',
      exportName: 'ServerlessDeadLetterQueueUrl',
    });
  }
}

// Secondary Stack (us-west-2) for Disaster Recovery
export class ServerlessDataProcessingSecondaryStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly processorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dead Letter Queue for secondary region
    const deadLetterQueue = new sqs.Queue(
      this,
      'ServerlessDeadLetterQueueSecondary',
      {
        queueName: 'serverless-dlq-prod-secondary',
        retentionPeriod: cdk.Duration.days(14),
        encryption: sqs.QueueEncryption.KMS_MANAGED,
      }
    );

    // Secondary S3 Bucket for disaster recovery
    this.bucket = new s3.Bucket(
      this,
      'ServerlessDataIngestionBucketSecondary',
      {
        bucketName: 'serverless-data-ingestion-prod-secondary',
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
      }
    );

    // Import the primary DynamoDB table ARN for Global Tables
    const primaryTableArn = cdk.Fn.importValue('ServerlessTableName');

    // IAM Role for secondary Lambda
    const lambdaRole = new iam.Role(this, 'ServerlessLambdaRoleSecondary', {
      roleName: 'serverless-lambda-role-prod-secondary',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/serverless-processed-data-prod`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/serverless-processed-data-prod/index/*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    // Secondary Lambda Function
    this.processorFunction = new lambda.Function(
      this,
      'ServerlessDataProcessorSecondary',
      {
        functionName: 'serverless-data-processor-prod-secondary',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(lambdaCode),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        role: lambdaRole,
        environment: {
          DYNAMODB_TABLE_NAME: 'serverless-processed-data-prod',
          REGION: this.region,
        },
        deadLetterQueue: deadLetterQueue,
        reservedConcurrentExecutions: 100,
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // S3 Event Notification for secondary region
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.processorFunction),
      {
        prefix: '',
        suffix: '.json',
      }
    );

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.processorFunction),
      {
        prefix: '',
        suffix: '.csv',
      }
    );

    // CloudWatch Monitoring for secondary region
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarmSecondary', {
      alarmName: 'serverless-lambda-errors-prod-secondary',
      metric: this.processorFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
    });

    // Resource Tags
    cdk.Tags.of(this).add('Environment', 'prod');
    cdk.Tags.of(this).add('Project', 'serverless-data-processing');
    cdk.Tags.of(this).add('Region', 'secondary');
    cdk.Tags.of(this).add('CostCenter', 'engineering');

    // Stack Outputs
    new cdk.CfnOutput(this, 'SecondaryBucketName', {
      value: this.bucket.bucketName,
      description: 'Secondary S3 bucket for disaster recovery',
      exportName: 'ServerlessSecondaryBucketName',
    });

    new cdk.CfnOutput(this, 'SecondaryLambdaFunctionArn', {
      value: this.processorFunction.functionArn,
      description: 'Secondary Lambda function ARN for data processing',
      exportName: 'ServerlessSecondaryLambdaArn',
    });
  }
}

// Route 53 Health Check and Failover Stack
export class ServerlessRoute53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Health check for primary region
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        type: 'HTTPS',
        resourcePath: '/',
        fullyQualifiedDomainName: `lambda.us-east-1.amazonaws.com`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      }
    );

    // Health check for secondary region
    const secondaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'SecondaryHealthCheck',
      {
        type: 'HTTPS',
        resourcePath: '/',
        fullyQualifiedDomainName: `lambda.us-west-2.amazonaws.com`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      }
    );

    // Resource Tags
    cdk.Tags.of(this).add('Environment', 'prod');
    cdk.Tags.of(this).add('Project', 'serverless-data-processing');
    cdk.Tags.of(this).add('Component', 'health-checks');
  }
}

// Main CDK App
export class ServerlessApp extends cdk.App {
  constructor() {
    super();

    // Primary Stack (us-east-1)
    const primaryStack = new ServerlessDataProcessingStack(
      this,
      'ServerlessDataProcessingPrimary',
      {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: 'us-east-1',
        },
        description: 'Primary serverless data processing stack in us-east-1',
      }
    );

    // Secondary Stack (us-west-2)
    const secondaryStack = new ServerlessDataProcessingSecondaryStack(
      this,
      'ServerlessDataProcessingSecondary',
      {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: 'us-west-2',
        },
        description: 'Secondary serverless data processing stack in us-west-2',
      }
    );

    // Route 53 Health Checks Stack
    const route53Stack = new ServerlessRoute53Stack(this, 'ServerlessRoute53', {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1', // Route 53 is global but health checks are created in us-east-1
      },
      description: 'Route 53 health checks for multi-region failover',
    });

    // Add dependencies
    secondaryStack.addDependency(primaryStack);
    route53Stack.addDependency(primaryStack);
    route53Stack.addDependency(secondaryStack);

    // Global Tags
    cdk.Tags.of(this).add('Project', 'serverless-data-processing');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Environment', 'prod');
  }
}

// Export the app
const app = new ServerlessApp();
```
