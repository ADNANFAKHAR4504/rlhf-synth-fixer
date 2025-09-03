# CDK TypeScript Infrastructure Code


## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
// import * as scheduler from '@aws-cdk/aws-scheduler-alpha'; // Removed due to version incompatibility
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix from environment variable or context
    const environmentSuffix =
      process.env.ENVIRONMENT_SUFFIX ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // KMS key for encryption at rest (healthcare compliance)
    const encryptionKey = new kms.Key(this, 'HealthcareEncryptionKey', {
      description: 'KMS key for healthcare application encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Tables for healthcare data
    const patientsTable = new dynamodb.Table(this, 'PatientsTable', {
      tableName: `patients-${this.region}-${environmentSuffix}`,
      partitionKey: { name: 'patientId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'recordDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const analyticsTable = new dynamodb.Table(this, 'AnalyticsTable', {
      tableName: `analytics-${this.region}-${environmentSuffix}`,
      partitionKey: {
        name: 'analyticsId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topics for notifications
    const notificationsTopic = new sns.Topic(this, 'NotificationsTopic', {
      topicName: `healthcare-notifications-${this.region}-${environmentSuffix}`,
      displayName: 'Healthcare Application Notifications',
      masterKey: encryptionKey,
    });

    const alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      topicName: `healthcare-alerts-${this.region}-${environmentSuffix}`,
      displayName: 'Healthcare Critical Alerts',
      masterKey: encryptionKey,
    });

    // SQS Queues for background processing
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `patient-processing-${this.region}-${environmentSuffix}`,
      encryptionMasterKey: encryptionKey,
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'ProcessingDLQ', {
          queueName: `patient-processing-dlq-${this.region}-${environmentSuffix}`,
          encryptionMasterKey: encryptionKey,
        }),
        maxReceiveCount: 3,
      },
    });

    const analyticsQueue = new sqs.Queue(this, 'AnalyticsQueue', {
      queueName: `analytics-processing-${this.region}-${environmentSuffix}`,
      encryptionMasterKey: encryptionKey,
      visibilityTimeout: cdk.Duration.minutes(10),
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'AnalyticsDLQ', {
          queueName: `analytics-processing-dlq-${this.region}-${environmentSuffix}`,
          encryptionMasterKey: encryptionKey,
        }),
        maxReceiveCount: 3,
      },
    });

    // Lambda execution roles with least privilege
    const patientProcessorRole = new iam.Role(this, 'PatientProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        PatientDataAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:Query',
              ],
              resources: [patientsTable.tableArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [notificationsTopic.topicArn, alertsTopic.topicArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [analyticsQueue.queueArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    const notificationProcessorRole = new iam.Role(
      this,
      'NotificationProcessorRole',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          NotificationAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [notificationsTopic.topicArn, alertsTopic.topicArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'sqs:ReceiveMessage',
                  'sqs:DeleteMessage',
                  'sqs:GetQueueAttributes',
                ],
                resources: [processingQueue.queueArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [encryptionKey.keyArn],
              }),
            ],
          }),
        },
      }
    );

    const analyticsProcessorRole = new iam.Role(
      this,
      'AnalyticsProcessorRole',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          AnalyticsAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                resources: [analyticsTable.tableArn, patientsTable.tableArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'sqs:ReceiveMessage',
                  'sqs:DeleteMessage',
                  'sqs:GetQueueAttributes',
                ],
                resources: [analyticsQueue.queueArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [encryptionKey.keyArn],
              }),
            ],
          }),
        },
      }
    );

    // Lambda functions with enhanced logging
    const patientProcessorFunction = new lambda.Function(
      this,
      'PatientProcessorFunction',
      {
        functionName: `patient-processor-${this.region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'patient-processor.handler',
        code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const dynamodb = new DynamoDBClient();
const sns = new SNSClient();
const sqs = new SQSClient();

exports.handler = async (event, context) => {
  console.log('Processing patient data:', JSON.stringify(event, null, 2));
  
  try {
    // Process patient data
    const patientData = event.patientData || {};
    const patientId = patientData.patientId || context.requestId;
    
    // Store patient record in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.PATIENTS_TABLE,
      Item: {
        patientId: { S: patientId },
        recordDate: { S: new Date().toISOString() },
        data: { S: JSON.stringify(patientData) },
        status: { S: 'processed' }
      }
    }));
    
    // Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.NOTIFICATIONS_TOPIC,
      Message: JSON.stringify({
        type: 'patient_processed',
        patientId: patientId,
        timestamp: new Date().toISOString()
      }),
      Subject: 'Patient Data Processed'
    }));
    
    // Queue analytics processing
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.ANALYTICS_QUEUE,
      MessageBody: JSON.stringify({
        patientId: patientId,
        action: 'analyze',
        timestamp: new Date().toISOString()
      })
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Patient data processed successfully',
        patientId: patientId
      })
    };
  } catch (error) {
    console.error('Error processing patient data:', error);
    
    // Send alert for error
    await sns.send(new PublishCommand({
      TopicArn: process.env.ALERTS_TOPIC,
      Message: JSON.stringify({
        type: 'processing_error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      Subject: 'Patient Processing Error'
    }));
    
    throw error;
  }
};
      `),
        role: patientProcessorRole,
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          PATIENTS_TABLE: patientsTable.tableName,
          NOTIFICATIONS_TOPIC: notificationsTopic.topicArn,
          ALERTS_TOPIC: alertsTopic.topicArn,
          ANALYTICS_QUEUE: analyticsQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        architecture: lambda.Architecture.ARM_64, // Use Graviton2 for better performance
      }
    );

    const notificationProcessorFunction = new lambda.Function(
      this,
      'NotificationProcessorFunction',
      {
        functionName: `notification-processor-${this.region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'notification-processor.handler',
        code: lambda.Code.fromInline(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient();

exports.handler = async (event) => {
  console.log('Processing notifications:', JSON.stringify(event, null, 2));
  
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    
    // Process different types of notifications
    switch (message.type) {
      case 'appointment_reminder':
        await sns.send(new PublishCommand({
          TopicArn: process.env.NOTIFICATIONS_TOPIC,
          Message: JSON.stringify({
            type: 'reminder',
            patientId: message.patientId,
            appointmentDate: message.appointmentDate,
            message: 'Appointment reminder'
          }),
          Subject: 'Appointment Reminder'
        }));
        break;
        
      case 'test_results':
        await sns.send(new PublishCommand({
          TopicArn: process.env.NOTIFICATIONS_TOPIC,
          Message: JSON.stringify({
            type: 'results',
            patientId: message.patientId,
            results: message.results,
            message: 'Test results available'
          }),
          Subject: 'Test Results Available'
        }));
        break;
        
      default:
        console.log('Unknown notification type:', message.type);
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Notifications processed successfully' })
  };
};
      `),
        role: notificationProcessorRole,
        timeout: cdk.Duration.minutes(3),
        memorySize: 256,
        environment: {
          NOTIFICATIONS_TOPIC: notificationsTopic.topicArn,
          ALERTS_TOPIC: alertsTopic.topicArn,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        architecture: lambda.Architecture.ARM_64,
      }
    );

    const analyticsProcessorFunction = new lambda.Function(
      this,
      'AnalyticsProcessorFunction',
      {
        functionName: `analytics-processor-${this.region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'analytics-processor.handler',
        code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient();

exports.handler = async (event) => {
  console.log('Processing analytics:', JSON.stringify(event, null, 2));
  
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    
    // Perform analytics processing
    const analyticsResult = await performAnalytics(message.patientId);
    
    // Store analytics results
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.ANALYTICS_TABLE,
      Item: {
        analyticsId: { S: \`\${message.patientId}-\${Date.now()}\` },
        timestamp: { S: new Date().toISOString() },
        patientId: { S: message.patientId },
        results: { S: JSON.stringify(analyticsResult) },
        type: { S: 'patient_analysis' }
      }
    }));
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Analytics processed successfully' })
  };
};

async function performAnalytics(patientId) {
  // Simulate analytics processing
  return {
    patientId: patientId,
    riskScore: Math.floor(Math.random() * 100),
    recommendations: ['Regular checkup recommended', 'Monitor vital signs'],
    processedAt: new Date().toISOString()
  };
}
      `),
        role: analyticsProcessorRole,
        timeout: cdk.Duration.minutes(10),
        memorySize: 1024,
        environment: {
          ANALYTICS_TABLE: analyticsTable.tableName,
          PATIENTS_TABLE: patientsTable.tableName,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        architecture: lambda.Architecture.ARM_64,
      }
    );

    // Response Streaming Function for real-time data
    const streamingApiFunction = new lambda.Function(
      this,
      'StreamingApiFunction',
      {
        functionName: `streaming-api-${this.region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'streaming-api.handler',
        code: lambda.Code.fromInline(`
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient();

exports.handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  const patientId = event.pathParameters?.patientId;
  
  if (!patientId) {
    responseStream.write('{"error": "Patient ID required"}');
    responseStream.end();
    return;
  }
  
  responseStream.write('{"status": "streaming", "data": [');
  
  try {
    // Stream patient data in chunks
    const result = await dynamodb.send(new QueryCommand({
      TableName: process.env.PATIENTS_TABLE,
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: {
        ':patientId': { S: patientId }
      }
    }));
    
    for (let i = 0; i < result.Items.length; i++) {
      const item = result.Items[i];
      const record = {
        recordDate: item.recordDate.S,
        data: JSON.parse(item.data.S),
        status: item.status.S
      };
      
      if (i > 0) responseStream.write(',');
      responseStream.write(JSON.stringify(record));
      
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    responseStream.write(']}');
  } catch (error) {
    responseStream.write(\`,"error": "\${error.message}"}\`);
  }
  
  responseStream.end();
});
      `),
        role: new iam.Role(this, 'StreamingApiRole', {
          assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AWSLambdaBasicExecutionRole'
            ),
          ],
          inlinePolicies: {
            StreamingAccess: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['dynamodb:Query'],
                  resources: [patientsTable.tableArn],
                }),
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['kms:Decrypt'],
                  resources: [encryptionKey.keyArn],
                }),
              ],
            }),
          },
        }),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          PATIENTS_TABLE: patientsTable.tableName,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        architecture: lambda.Architecture.ARM_64,
      }
    );

    // SQS event sources for Lambda functions
    notificationProcessorFunction.addEventSource(
      new cdk.aws_lambda_event_sources.SqsEventSource(processingQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(30),
      })
    );

    analyticsProcessorFunction.addEventSource(
      new cdk.aws_lambda_event_sources.SqsEventSource(analyticsQueue, {
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.seconds(60),
      })
    );

    // EventBridge Rules for scheduled tasks (using EventBridge instead of Scheduler)
    const dailyAnalyticsRule = new events.Rule(this, 'DailyAnalyticsRule', {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      description: 'Run daily analytics processing for healthcare data',
    });

    dailyAnalyticsRule.addTarget(
      new targets.LambdaFunction(analyticsProcessorFunction, {
        event: events.RuleTargetInput.fromObject({
          type: 'scheduled_analytics',
          timestamp: events.EventField.time,
        }),
      })
    );

    // Hourly health checks
    const hourlyHealthCheckRule = new events.Rule(
      this,
      'HourlyHealthCheckRule',
      {
        schedule: events.Schedule.rate(cdk.Duration.hours(1)),
        description: 'Hourly health check for patient processing system',
      }
    );

    hourlyHealthCheckRule.addTarget(
      new targets.LambdaFunction(patientProcessorFunction, {
        event: events.RuleTargetInput.fromObject({
          type: 'health_check',
          timestamp: events.EventField.time,
        }),
      })
    );

    // CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      'HealthcareDashboard',
      {
        dashboardName: `healthcare-dashboard-${this.region}-${environmentSuffix}`,
      }
    );

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Function Invocations',
        left: [
          patientProcessorFunction.metricInvocations(),
          notificationProcessorFunction.metricInvocations(),
          analyticsProcessorFunction.metricInvocations(),
        ],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Function Errors',
        left: [
          patientProcessorFunction.metricErrors(),
          notificationProcessorFunction.metricErrors(),
          analyticsProcessorFunction.metricErrors(),
        ],
      })
    );

    // Outputs for cross-stack references
    new cdk.CfnOutput(this, 'PatientsTableName', {
      value: patientsTable.tableName,
      description: 'Name of the patients DynamoDB table',
    });

    new cdk.CfnOutput(this, 'AnalyticsTableName', {
      value: analyticsTable.tableName,
      description: 'Name of the analytics DynamoDB table',
    });

    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: notificationsTopic.topicArn,
      description: 'ARN of the notifications SNS topic',
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: alertsTopic.topicArn,
      description: 'ARN of the alerts SNS topic',
    });

    new cdk.CfnOutput(this, 'PatientProcessorFunctionArn', {
      value: patientProcessorFunction.functionArn,
      description: 'ARN of the patient processor Lambda function',
    });

    new cdk.CfnOutput(this, 'StreamingApiFunctionArn', {
      value: streamingApiFunction.functionArn,
      description: 'ARN of the streaming API Lambda function',
    });
  }
}
```
