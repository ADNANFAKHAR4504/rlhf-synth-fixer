```yaml
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class ServerlessDataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table with Streams
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'dev-orders-table-backend',
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // 2. Audit DynamoDB Table with GSI
    const auditTable = new dynamodb.Table(this, 'AuditTable', {
      tableName: 'dev-audit-table-backend',
      partitionKey: {
        name: 'auditId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by failure type
    auditTable.addGlobalSecondaryIndex({
      indexName: 'failure-type-index',
      partitionKey: {
        name: 'failureType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // 3. Private S3 Bucket
    const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: 'dev-processed-data-bucket-backend',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 4. Dead Letter Queue
    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: 'dev-processing-dlq-backend',
      retentionPeriod: cdk.Duration.days(14),
    });

    // 5. IAM Role for Main Processing Lambda
    const processingLambdaRole = new iam.Role(this, 'ProcessingLambdaRole', {
      roleName: 'dev-processing-lambda-role-backend',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant specific permissions to processing lambda
    processingLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetRecords',
        'dynamodb:GetShardIterator',
        'dynamodb:DescribeStream',
        'dynamodb:ListStreams',
      ],
      resources: [ordersTable.tableStreamArn!],
    }));

    processingLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl',
      ],
      resources: [`${processedDataBucket.bucketArn}/*`],
    }));

    // 6. Main Processing Lambda Function
    const processingLambda = new lambda.Function(this, 'ProcessingLambda', {
      functionName: 'dev-order-processor-lambda-backend',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: processingLambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        BUCKET_NAME: processedDataBucket.bucketName,
      },
      deadLetterQueue: deadLetterQueue,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();

        exports.handler = async (event) => {
          console.log('Processing DynamoDB stream event:', JSON.stringify(event, null, 2));

          const bucketName = process.env.BUCKET_NAME;
          const results = [];

          for (const record of event.Records) {
            try {
              // Extract data from DynamoDB stream record
              const eventName = record.eventName;
              const dynamoData = record.dynamodb;

              // Enrich data with metadata
              const enrichedData = {
                recordId: \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
                processingTimestamp: new Date().toISOString(),
                processingStatus: 'SUCCESS',
                eventName: eventName,
                originalData: dynamoData,
                metadata: {
                  processedBy: 'dev-order-processor-lambda-backend',
                  region: process.env.AWS_REGION,
                  requestId: context.awsRequestId
                }
              };

              // Create structured S3 key
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const key = \`processed-data/\${year}/\${month}/\${day}/\${enrichedData.recordId}.json\`;

              // Store in S3
              await s3.putObject({
                Bucket: bucketName,
                Key: key,
                Body: JSON.stringify(enrichedData, null, 2),
                ContentType: 'application/json'
              }).promise();

              results.push({
                recordId: enrichedData.recordId,
                status: 'SUCCESS',
                s3Key: key
              });

              console.log(\`Successfully processed record: \${enrichedData.recordId}\`);

            } catch (error) {
              console.error('Error processing record:', error);
              results.push({
                status: 'ERROR',
                error: error.message
              });
              throw error; // This will send the record to DLQ after retries
            }
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Processing completed',
              results: results
            })
          };
        };
      `),
    });

    // 7. Event Source Mapping for DynamoDB Stream
    processingLambda.addEventSource(new lambdaEventSources.DynamoEventSource(ordersTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
      retryAttempts: 3,
      onFailure: new lambdaEventSources.SqsDestination(deadLetterQueue),
    }));

    // 8. IAM Role for Audit Lambda
    const auditLambdaRole = new iam.Role(this, 'AuditLambdaRole', {
      roleName: 'dev-audit-lambda-role-backend',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant specific permissions to audit lambda
    auditLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:GetItem',
      ],
      resources: [auditTable.tableArn, `${auditTable.tableArn}/index/*`],
    }));

    auditLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
      ],
      resources: [deadLetterQueue.queueArn],
    }));

    // 9. Audit Lambda Function
    const auditLambda = new lambda.Function(this, 'AuditLambda', {
      functionName: 'dev-audit-processor-lambda-backend',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: auditLambdaRole,
      timeout: cdk.Duration.minutes(3),
      environment: {
        AUDIT_TABLE_NAME: auditTable.tableName,
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const { v4: uuidv4 } = require('uuid');

        exports.handler = async (event) => {
          console.log('Processing DLQ messages for audit:', JSON.stringify(event, null, 2));

          const tableName = process.env.AUDIT_TABLE_NAME;

          for (const record of event.Records) {
            try {
              const messageBody = JSON.parse(record.body);
              const timestamp = new Date().toISOString();
              const auditId = uuidv4();

              // Determine failure type based on message content
              let failureType = 'UNKNOWN_ERROR';
              if (messageBody.errorMessage) {
                if (messageBody.errorMessage.includes('timeout')) {
                  failureType = 'TIMEOUT_ERROR';
                } else if (messageBody.errorMessage.includes('permission')) {
                  failureType = 'PERMISSION_ERROR';
                } else if (messageBody.errorMessage.includes('validation')) {
                  failureType = 'VALIDATION_ERROR';
                } else {
                  failureType = 'PROCESSING_ERROR';
                }
              }

              const auditRecord = {
                auditId: auditId,
                timestamp: timestamp,
                failureType: failureType,
                requestId: messageBody.requestContext?.requestId || 'unknown',
                functionArn: messageBody.requestContext?.functionArn || 'unknown',
                streamInformation: {
                  eventSourceArn: messageBody.eventSourceArn,
                  records: messageBody.records || []
                },
                dlqMessageContext: {
                  messageId: record.messageId,
                  receiptHandle: record.receiptHandle,
                  attributes: record.attributes,
                  messageAttributes: record.messageAttributes
                },
                completeDlqMessage: messageBody,
                processingMetadata: {
                  auditProcessedBy: 'dev-audit-processor-lambda-backend',
                  auditProcessedAt: timestamp,
                  region: process.env.AWS_REGION
                }
              };

              await dynamodb.put({
                TableName: tableName,
                Item: auditRecord
              }).promise();

              console.log(\`Audit record created: \${auditId}\`);

            } catch (error) {
              console.error('Error creating audit record:', error);
              throw error;
            }
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Audit processing completed',
              processedRecords: event.Records.length
            })
          };
        };
      `),
    });

    // 10. Event Source Mapping for Audit Lambda from DLQ
    auditLambda.addEventSource(new lambdaEventSources.SqsEventSource(deadLetterQueue, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(10),
    }));

    // 11. CloudWatch Alarm for Lambda Errors
    const errorAlarm = new cloudwatch.Alarm(this, 'ProcessingLambdaErrorAlarm', {
      alarmName: 'dev-processing-lambda-errors-backend',
      metric: processingLambda.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm for processing lambda errors',
    });

    // 12. Resource Tagging
    const tags = {
      Environment: 'dev',
      Team: 'backend',
      Project: 'serverless-data-processing',
      ManagedBy: 'CDK',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // 13. Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: ordersTable.tableName,
      description: 'Name of the DynamoDB orders table',
      exportName: 'dev-orders-table-name-backend',
    });

    new cdk.CfnOutput(this, 'ProcessingLambdaFunctionName', {
      value: processingLambda.functionName,
      description: 'Name of the processing Lambda function',
      exportName: 'dev-processing-lambda-name-backend',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: processedDataBucket.bucketName,
      description: 'Name of the S3 bucket for processed data',
      exportName: 'dev-s3-bucket-name-backend',
    });

    new cdk.CfnOutput(this, 'AuditTableName', {
      value: auditTable.tableName,
      description: 'Name of the audit DynamoDB table',
      exportName: 'dev-audit-table-name-backend',
    });

    new cdk.CfnOutput(this, 'AuditLambdaFunctionName', {
      value: auditLambda.functionName,
      description: 'Name of the audit Lambda function',
      exportName: 'dev-audit-lambda-name-backend',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'URL of the Dead Letter Queue',
      exportName: 'dev-dlq-url-backend',
    });
  }
}

// App instantiation
const app = new cdk.App();
new ServerlessDataProcessingStack(app, 'ServerlessDataProcessingStack', {
  env: {
    region: 'us-east-1',
  },
});
```
