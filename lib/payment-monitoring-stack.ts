import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DashboardsConstruct } from './constructs/dashboards';
import { AlarmsConstruct } from './constructs/alarms';
import { NotificationsConstruct } from './constructs/notifications';
import { LogProcessingConstruct } from './constructs/log-processing';
import { LogRetentionConstruct } from './constructs/log-retention';
import * as logs from 'aws-cdk-lib/aws-logs';

export class PaymentMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    // SNS Topics for notifications
    const notifications = new NotificationsConstruct(this, 'Notifications');

    // Log processing Lambda and metric filters
    const logProcessing = new LogProcessingConstruct(this, 'LogProcessing');

    // Dedicated log group for monitoring
    const monitoringLogGroup = new logs.LogGroup(
      this,
      'PaymentMonitoringLogGroup',
      {
        logGroupName: `/aws/monitoring/payment-${cdk.Stack.of(this).stackName}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Optional metric filter for errors in log processing
    new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup: monitoringLogGroup,
      metricNamespace: 'PaymentMonitoring',
      metricName: 'ErrorCount',
      filterPattern: logs.FilterPattern.literal('ERROR'),
      metricValue: '1',
    });

    // CloudWatch Alarms (exclude API Gateway alarms as they're in dedicated stack)
    const alarms = new AlarmsConstruct(this, 'Alarms', {
      operationalTopic: notifications.operationalTopic,
      securityTopic: notifications.securityTopic,
      excludeApiGatewayAlarms: true,
    });

    // CloudWatch Dashboards
    new DashboardsConstruct(this, 'Dashboards', {
      alarms: alarms.alarms,
    });

    // Log retention and S3 export
    new LogRetentionConstruct(this, 'LogRetention');

    // Add permissions for Lambda to write logs
    monitoringLogGroup.grantWrite(logProcessing.logProcessor);

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

    new cdk.CfnOutput(this, 'MonitoringLogGroupName', {
      value: monitoringLogGroup.logGroupName,
      description: 'CloudWatch Log Group used for monitoring',
    });
  }
}
