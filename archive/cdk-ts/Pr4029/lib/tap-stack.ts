import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get notification email with default value
    const notificationEmail =
      props?.notificationEmail ||
      this.node.tryGetContext('notificationEmail') ||
      'admin@example.com';

    // DynamoDB Table for Notification Logs
    const notificationTable = new dynamodb.Table(this, 'NotificationTable', {
      tableName: `notification-logs-${environmentSuffix}`,
      partitionKey: {
        name: 'notificationId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for querying by status
    notificationTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'deliveryStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // SNS Topic for Order Notifications
    const orderNotificationTopic = new sns.Topic(
      this,
      'OrderNotificationTopic',
      {
        topicName: `order-notifications-${environmentSuffix}`,
        displayName: 'Order Notification Distribution Topic',
      }
    );

    // Add email subscription to SNS topic
    orderNotificationTopic.addSubscription(
      new subs.EmailSubscription(notificationEmail)
    );

    // Lambda Function for Email Formatting
    const emailFormatterFunction = new lambda.Function(
      this,
      'EmailFormatterFunction',
      {
        functionName: `email-formatter-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const ses = new SESClient({});
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const results = [];
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.Sns.Message);
      const notificationId = record.Sns.MessageId;
      const timestamp = Date.now();
      
      // Extract order details
      const orderId = message.orderId || 'N/A';
      const customerEmail = message.customerEmail;
      const orderAmount = message.orderAmount || 0;
      const items = message.items || [];
      
      // Format email body
      const emailBody = \`
Dear Customer,

Your order #\${orderId} has been confirmed!

Order Details:
- Order ID: \${orderId}
- Total Amount: $\${orderAmount}
- Items: \${items.join(', ')}

Thank you for your purchase!

Best regards,
Retail Platform Team
      \`.trim();
      
      // Send email via SES
      const emailParams = {
        Source: process.env.SENDER_EMAIL,
        Destination: {
          ToAddresses: [customerEmail],
        },
        Message: {
          Subject: {
            Data: \`Order Confirmation - #\${orderId}\`,
          },
          Body: {
            Text: {
              Data: emailBody,
            },
          },
        },
      };
      
      await ses.send(new SendEmailCommand(emailParams));
      
      // Log to DynamoDB
      await dynamodb.send(new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          notificationId: { S: notificationId },
          timestamp: { N: timestamp.toString() },
          notificationType: { S: 'EMAIL' },
          orderId: { S: orderId },
          recipient: { S: customerEmail },
          deliveryStatus: { S: 'SENT' },
          messageBody: { S: emailBody },
        },
      }));
      
      results.push({ notificationId, status: 'SUCCESS' });
      
    } catch (error) {
      console.error('Error processing record:', error);
      results.push({ error: error.message, status: 'FAILED' });
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ processed: results.length, results }),
  };
};
      `),
        environment: {
          TABLE_NAME: notificationTable.tableName,
          SENDER_EMAIL: notificationEmail,
        },
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Lambda Function for SMS Formatting
    const smsFormatterFunction = new lambda.Function(
      this,
      'SmsFormatterFunction',
      {
        functionName: `sms-formatter-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const sns = new SNSClient({});
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const results = [];
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.Sns.Message);
      const notificationId = record.Sns.MessageId;
      const timestamp = Date.now();
      
      // Extract order details
      const orderId = message.orderId || 'N/A';
      const phoneNumber = message.phoneNumber;
      const orderAmount = message.orderAmount || 0;
      
      // Format SMS message (keep it short for SMS)
      const smsBody = \`Order #\${orderId} confirmed! Total: $\${orderAmount}. Thank you for your purchase!\`;
      
      // Send SMS via SNS
      await sns.send(new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: smsBody,
      }));
      
      // Log to DynamoDB
      await dynamodb.send(new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          notificationId: { S: notificationId },
          timestamp: { N: timestamp.toString() },
          notificationType: { S: 'SMS' },
          orderId: { S: orderId },
          recipient: { S: phoneNumber },
          deliveryStatus: { S: 'SENT' },
          messageBody: { S: smsBody },
        },
      }));
      
      results.push({ notificationId, status: 'SUCCESS' });
      
    } catch (error) {
      console.error('Error processing record:', error);
      
      // Log failure to DynamoDB
      try {
        await dynamodb.send(new PutItemCommand({
          TableName: process.env.TABLE_NAME,
          Item: {
            notificationId: { S: record.Sns.MessageId },
            timestamp: { N: Date.now().toString() },
            notificationType: { S: 'SMS' },
            deliveryStatus: { S: 'FAILED' },
            errorMessage: { S: error.message },
          },
        }));
      } catch (dbError) {
        console.error('Failed to log error to DynamoDB:', dbError);
      }
      
      results.push({ error: error.message, status: 'FAILED' });
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ processed: results.length, results }),
  };
};
      `),
        environment: {
          TABLE_NAME: notificationTable.tableName,
        },
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to Lambda functions
    notificationTable.grantWriteData(emailFormatterFunction);
    notificationTable.grantWriteData(smsFormatterFunction);

    // Grant SES permissions to email formatter
    emailFormatterFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    // Grant SNS SMS permissions to SMS formatter
    smsFormatterFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: ['*'],
      })
    );

    // Subscribe Lambda functions to SNS topic
    orderNotificationTopic.addSubscription(
      new subs.LambdaSubscription(emailFormatterFunction, {
        filterPolicy: {
          channel: sns.SubscriptionFilter.stringFilter({
            allowlist: ['email', 'both'],
          }),
        },
      })
    );

    orderNotificationTopic.addSubscription(
      new subs.LambdaSubscription(smsFormatterFunction, {
        filterPolicy: {
          channel: sns.SubscriptionFilter.stringFilter({
            allowlist: ['sms', 'both'],
          }),
        },
      })
    );

    // CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      'NotificationDashboard',
      {
        dashboardName: `notification-metrics-${environmentSuffix}`,
      }
    );

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'SNS Messages Published',
        left: [orderNotificationTopic.metricNumberOfMessagesPublished()],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          emailFormatterFunction.metricInvocations(),
          smsFormatterFunction.metricInvocations(),
        ],
      })
    );

    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          emailFormatterFunction.metricErrors(),
          smsFormatterFunction.metricErrors(),
        ],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          emailFormatterFunction.metricDuration(),
          smsFormatterFunction.metricDuration(),
        ],
      })
    );

    // CloudWatch Alarms
    const emailErrorAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'EmailErrorAlarm',
      {
        alarmName: `email-formatter-errors-${environmentSuffix}`,
        metric: emailFormatterFunction.metricErrors(),
        threshold: 10,
        evaluationPeriods: 1,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    const smsErrorAlarm = new cdk.aws_cloudwatch.Alarm(this, 'SmsErrorAlarm', {
      alarmName: `sms-formatter-errors-${environmentSuffix}`,
      metric: smsFormatterFunction.metricErrors(),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `notification-alarms-${environmentSuffix}`,
      displayName: 'Notification System Alarms',
    });

    alarmTopic.addSubscription(new subs.EmailSubscription(notificationEmail));

    emailErrorAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );
    smsErrorAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: orderNotificationTopic.topicArn,
      description: 'ARN of the notification topic',
      exportName: `notification-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NotificationTableName', {
      value: notificationTable.tableName,
      description: 'Name of the notification logs table',
      exportName: `notification-table-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
