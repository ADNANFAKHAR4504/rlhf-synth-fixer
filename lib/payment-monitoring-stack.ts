import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DashboardsConstruct } from './constructs/dashboards';
import { AlarmsConstruct } from './constructs/alarms';
import { NotificationsConstruct } from './constructs/notifications';
import { LogProcessingConstruct } from './constructs/log-processing';
import { LogRetentionConstruct } from './constructs/log-retention';

export class PaymentMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS Topics for notifications
    const notifications = new NotificationsConstruct(this, 'Notifications');

    // Log processing Lambda and metric filters
    const logProcessing = new LogProcessingConstruct(this, 'LogProcessing');

    // CloudWatch Alarms
    const alarms = new AlarmsConstruct(this, 'Alarms', {
      operationalTopic: notifications.operationalTopic,
      securityTopic: notifications.securityTopic,
    });

    // CloudWatch Dashboards
    new DashboardsConstruct(this, 'Dashboards', {
      alarms: alarms.alarms,
    });

    // Log retention and S3 export
    new LogRetentionConstruct(this, 'LogRetention');

    // Stack outputs
    new cdk.CfnOutput(this, 'OperationalTopicArn', {
      value: notifications.operationalTopic.topicArn,
      description: 'SNS Topic ARN for operational alerts',
    });

    new cdk.CfnOutput(this, 'SecurityTopicArn', {
      value: notifications.securityTopic.topicArn,
      description: 'SNS Topic ARN for security alerts',
    });

    new cdk.CfnOutput(this, 'LogProcessorFunctionName', {
      value: logProcessing.logProcessor.functionName,
      description: 'Log processor Lambda function name',
    });
  }
}