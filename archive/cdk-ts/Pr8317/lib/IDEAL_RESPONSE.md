```yaml
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {
  DynamoEventSource,
  SqsDlq,
  SqsEventSource,
} from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Hardcode 'dev' environment for integration tests (CI/CD uses pr<number> for other environments)
    const environmentSuffix = 'dev';

    // Apply consistent tagging across all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Project', 'ServerlessDataProcessing');

    // 1. DynamoDB Table with Streams
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: `${environmentSuffix}-orders-table-backend`,
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 2. S3 Bucket for Processed Data (Private and Secure)
    const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: `${environmentSuffix}-processed-data-bucket-backend-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 3. SQS Dead Letter Queue
    const processingDlq = new sqs.Queue(this, 'ProcessingDlq', {
      queueName: `${environmentSuffix}-processing-dlq-backend`,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.minutes(12), // 6x the audit Lambda timeout (2 minutes)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 4. IAM Role for Lambda (Least Privilege)
    const lambdaRole = new iam.Role(this, 'OrderProcessorLambdaRole', {
      roleName: `${environmentSuffix}-order-processor-lambda-role-backend`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific permissions for DynamoDB Streams
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: [ordersTable.tableStreamArn!],
      })
    );

    // Add specific permissions for S3
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${processedDataBucket.bucketArn}/*`],
      })
    );

    // Note: SQS DLQ permissions are handled automatically by the DynamoEventSource onFailure configuration

    // 4.1. DynamoDB Table for Audit Logs
    const auditLogsTable = new dynamodb.Table(this, 'AuditLogsTable', {
      tableName: `${environmentSuffix}-audit-logs-table-backend`,
      partitionKey: {
        name: 'auditId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Add GSI for querying by failure type or date
    auditLogsTable.addGlobalSecondaryIndex({
      indexName: 'failure-type-index',
      partitionKey: {
        name: 'failureType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 5. Lambda Function for Processing
    const orderProcessorLambda = new lambda.Function(
      this,
      'OrderProcessorLambda',
      {
        functionName: `${environmentSuffix}-order-processor-lambda-backend`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        role: lambdaRole,
        timeout: cdk.Duration.minutes(5),
        environment: {
          S3_BUCKET_NAME: processedDataBucket.bucketName,
        },
        code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

        const s3Client = new S3Client({});

        exports.handler = async (event) => {
          console.log('Processing DynamoDB stream records:', JSON.stringify(event, null, 2));

          for (const record of event.Records) {
            // Extract record data
            const eventName = record.eventName;
            const dynamodbRecord = record.dynamodb;

            // Enrich data with metadata
            const enrichedData = {
              recordId: record.dynamodb.Keys?.orderId?.S || 'unknown',
              eventType: eventName,
              processingTimestamp: new Date().toISOString(),
              processedBy: 'order-processor-lambda',
              processingStatus: 'completed',
              originalData: dynamodbRecord,
              metadata: {
                awsRegion: record.awsRegion,
                eventSource: record.eventSource,
                eventVersion: record.eventVersion
              }
            };

            // Create structured S3 key
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const recordId = enrichedData.recordId;
            const s3Key = \`processed-data/\${year}/\${month}/\${day}/\${recordId}-\${Date.now()}.json\`;

            // Store enriched data in S3
            const putObjectCommand = new PutObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: s3Key,
              Body: JSON.stringify(enrichedData, null, 2),
              ContentType: 'application/json'
            });

            await s3Client.send(putObjectCommand);
            console.log(\`Successfully processed and stored record: \${s3Key}\`);
          }

          return { statusCode: 200, body: 'Processing complete' };
        };
      `),
      }
    );

    // 6. Event Source Mapping (DynamoDB Stream to Lambda)
    orderProcessorLambda.addEventSource(
      new DynamoEventSource(ordersTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        retryAttempts: 3,
        onFailure: new SqsDlq(processingDlq),
      })
    );

    // 6.1. IAM Role for Audit Lambda
    const auditLambdaRole = new iam.Role(this, 'AuditLambdaRole', {
      roleName: `${environmentSuffix}-audit-lambda-role-backend`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions for DynamoDB audit table
    auditLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:GetItem',
        ],
        resources: [auditLogsTable.tableArn],
      })
    );

    // Add permissions for SQS DLQ
    auditLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes',
        ],
        resources: [processingDlq.queueArn],
      })
    );

    // 6.2. Audit Lambda Function
    const auditLambda = new lambda.Function(this, 'AuditLambda', {
      functionName: `${environmentSuffix}-audit-lambda-backend`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: auditLambdaRole,
      timeout: cdk.Duration.minutes(2),
      environment: {
        AUDIT_TABLE_NAME: auditLogsTable.tableName,
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        const { marshall } = require('@aws-sdk/util-dynamodb');

        const dynamoClient = new DynamoDBClient({});

        exports.handler = async (event) => {
          console.log('Processing DLQ messages for audit:', JSON.stringify(event, null, 2));

          for (const record of event.Records) {
            try {
              // Parse the SQS message body (contains the DLQ failure details)
              const dlqMessage = JSON.parse(record.body);

              // Extract key information for audit
              const auditRecord = {
                auditId: \`audit-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
                timestamp: new Date().toISOString(),
                failureType: dlqMessage.responseContext?.functionError || 'Unknown',
                requestId: dlqMessage.requestContext?.requestId,
                functionArn: dlqMessage.requestContext?.functionArn,
                condition: dlqMessage.requestContext?.condition,
                invokeCount: dlqMessage.requestContext?.approximateInvokeCount,
                statusCode: dlqMessage.responseContext?.statusCode,
                executedVersion: dlqMessage.responseContext?.executedVersion,
                streamInfo: dlqMessage.DDBStreamBatchInfo ? {
                  shardId: dlqMessage.DDBStreamBatchInfo.shardId,
                  streamArn: dlqMessage.DDBStreamBatchInfo.streamArn,
                  batchSize: dlqMessage.DDBStreamBatchInfo.batchSize,
                  approximateArrivalOfFirstRecord: dlqMessage.DDBStreamBatchInfo.approximateArrivalOfFirstRecord
                } : null,
                rawDlqMessage: JSON.stringify(dlqMessage),
                processedAt: new Date().toISOString(),
                source: 'DLQ-Audit-Lambda'
              };

              // Store audit record in DynamoDB
              const putCommand = new PutItemCommand({
                TableName: process.env.AUDIT_TABLE_NAME,
                Item: marshall(auditRecord)
              });

              await dynamoClient.send(putCommand);
              console.log(\`Audit record stored: \${auditRecord.auditId}\`);

            } catch (error) {
              console.error('Error processing audit record:', error);
              // Don't throw - we don't want to create a circular DLQ situation
            }
          }

          return { statusCode: 200, body: 'Audit processing complete' };
        };
      `),
    });

    // 6.3. SQS Event Source for Audit Lambda
    auditLambda.addEventSource(
      new SqsEventSource(processingDlq, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    // 7. CloudWatch Alarm for Lambda Errors
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${environmentSuffix}-lambda-error-alarm-backend`,
      alarmDescription: 'Alarm for Lambda function errors',
      metric: orderProcessorLambda.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: ordersTable.tableName,
      description: 'DynamoDB Table Name for orders',
      exportName: `DynamoDBTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: orderProcessorLambda.functionName,
      description: 'Lambda function name for order processing',
      exportName: `LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: processedDataBucket.bucketName,
      description: 'S3 bucket name for processed data',
      exportName: `S3BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: processingDlq.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: `DLQUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchAlarmName', {
      value: lambdaErrorAlarm.alarmName,
      description: 'CloudWatch Alarm name for Lambda errors',
      exportName: `CloudWatchAlarmName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuditTableName', {
      value: auditLogsTable.tableName,
      description: 'DynamoDB table name for audit logs',
      exportName: `AuditTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuditLambdaName', {
      value: auditLambda.functionName,
      description: 'Lambda function name for audit processing',
      exportName: `AuditLambdaName-${environmentSuffix}`,
    });
  }
}
```
