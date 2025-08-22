import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
// import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'; // Uncomment when SNS subscriptions are needed
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
// import * as iam from 'aws-cdk-lib/aws-iam'; // Uncomment when IAM resources are needed
import { Construct } from 'constructs';

export interface SecurityMonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityMonitoringStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: SecurityMonitoringStackProps
  ) {
    super(scope, id, props);

    // SNS topic for security alerts
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: `Security Alerts - ${props.environmentSuffix}`,
      enforceSSL: true,
    });

    // CloudWatch Alarms for VPC Flow Logs
    const rejectedConnectionsAlarm = new cloudwatch.Alarm(
      this,
      'RejectedConnectionsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/VPC',
          metricName: 'PacketDropCount',
          statistic: 'Sum',
        }),
        threshold: 100,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    rejectedConnectionsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // EventBridge rule for GuardDuty findings
    const guardDutyRule = new events.Rule(this, 'GuardDutyFindingsRule', {
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          severity: [7.0, 8.9], // High severity findings
        },
      },
    });

    guardDutyRule.addTarget(new targets.SnsTopic(securityAlertsTopic));

    // CloudWatch Dashboard for security metrics
    const securityDashboard = new cloudwatch.Dashboard(
      this,
      'SecurityDashboard',
      {
        dashboardName: `SecurityMetrics-${props.environmentSuffix}`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'VPC Flow Logs - Rejected Connections',
              left: [rejectedConnectionsAlarm.metric],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.SingleValueWidget({
              title: 'GuardDuty Findings (24h)',
              metrics: [
                new cloudwatch.Metric({
                  namespace: 'AWS/GuardDuty',
                  metricName: 'FindingCount',
                  statistic: 'Sum',
                }),
              ],
              width: 6,
              height: 6,
            }),
          ],
        ],
      }
    );

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'Security Alerts SNS Topic ARN',
    });

    new cdk.CfnOutput(this, 'SecurityDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${securityDashboard.dashboardName}`,
      description: 'Security Dashboard URL',
    });
  }
}
