import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface AlertingConstructProps {
  environmentSuffix: string;
  emailAddresses?: string[];
  auditTable: dynamodb.Table;
}

export class AlertingConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly reportTopic: sns.Topic;
  public readonly loggerLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: AlertingConstructProps) {
    super(scope, id);

    // Create alarm topic for critical alerts
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${cdk.Stack.of(this).stackName}-Alarms-${props.environmentSuffix}`,
      displayName: 'Monitoring System Alarms',
    });

    // Create report topic for non-critical notifications
    this.reportTopic = new sns.Topic(this, 'ReportTopic', {
      topicName: `${cdk.Stack.of(this).stackName}-Reports-${props.environmentSuffix}`,
      displayName: 'Monitoring System Reports',
    });

    // Add email subscriptions if provided
    const emails = props.emailAddresses || ['ops-team@example.com'];
    emails.forEach(email => {
      this.alarmTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(email, {
          json: false,
        })
      );

      this.reportTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(email, {
          json: false,
        })
      );
    });

    // Create Lambda function for logging alarm state changes to DynamoDB
    this.loggerLambda = new lambda.Function(this, 'AlarmLogger', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        const dynamodb = new DynamoDBClient({});
        
        exports.handler = async (event) => {
          console.log('Received SNS event:', JSON.stringify(event, null, 2));
          
          const message = JSON.parse(event.Records[0].Sns.Message);
          const timestamp = new Date().toISOString();
          
          const item = {
            id: { S: message.AlarmName + '-' + timestamp },
            timestamp: { S: timestamp },
            type: { S: 'ALARM' },
            alarmName: { S: message.AlarmName },
            alarmDescription: { S: message.AlarmDescription || 'No description' },
            newState: { S: message.NewStateValue },
            oldState: { S: message.OldStateValue },
            reason: { S: message.NewStateReason || 'No reason provided' },
            ttl: { N: String(Math.floor(Date.now() / 1000) + 2592000) } // 30 days
          };
          
          if (message.Trigger) {
            if (message.Trigger.MetricName) {
              item.metricName = { S: message.Trigger.MetricName };
            }
            if (message.Trigger.Namespace) {
              item.namespace = { S: message.Trigger.Namespace };
            }
          }
          
          await dynamodb.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: item
          }));
          
          console.log('Successfully logged alarm to DynamoDB');
          return { statusCode: 200 };
        };
      `),
      environment: {
        TABLE_NAME: props.auditTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions to the Lambda function
    props.auditTable.grantWriteData(this.loggerLambda);

    // Subscribe the logger Lambda to the alarm topic
    this.alarmTopic.addSubscription(
      new sns_subscriptions.LambdaSubscription(this.loggerLambda)
    );

    // Add tags
    cdk.Tags.of(this.alarmTopic).add('Purpose', 'AlarmNotifications');
    cdk.Tags.of(this.reportTopic).add('Purpose', 'ReportNotifications');

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarm notifications',
      exportName: `${cdk.Stack.of(this).stackName}-AlarmTopicArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReportTopicArn', {
      value: this.reportTopic.topicArn,
      description: 'SNS Topic ARN for report notifications',
      exportName: `${cdk.Stack.of(this).stackName}-ReportTopicArn-${props.environmentSuffix}`,
    });
  }
}
