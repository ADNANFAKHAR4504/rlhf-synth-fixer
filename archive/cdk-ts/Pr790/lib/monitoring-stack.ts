import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
// import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  kmsKey: kms.Key;
  environmentSuffix?: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix || 'dev';

    // SNS topic for security alerts
    const alertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      displayName: 'Security Alerts',
      masterKey: props.kmsKey,
    });

    // CloudWatch dashboard for security metrics
    const securityDashboard = new cloudwatch.Dashboard(
      this,
      'SecurityDashboard',
      {
        dashboardName: `SecureInfrastructure-Monitoring-${suffix}`,
      }
    );

    // GuardDuty findings metric
    const guardDutyMetric = new cloudwatch.Metric({
      namespace: 'AWS/GuardDuty',
      metricName: 'FindingCount',
      statistic: 'Sum',
    });

    // Config compliance metric
    const configComplianceMetric = new cloudwatch.Metric({
      namespace: 'AWS/Config',
      metricName: 'ComplianceByConfigRule',
      statistic: 'Average',
    });

    // Create alarms
    new cloudwatch.Alarm(this, 'GuardDutyFindingsAlarm', {
      metric: guardDutyMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when GuardDuty detects threats',
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Add widgets to dashboard
    securityDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'GuardDuty Findings',
        left: [guardDutyMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Config Rule Compliance',
        left: [configComplianceMetric],
        width: 12,
      })
    );

    // Security log group
    new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: '/aws/security/audit',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: props.kmsKey,
    });

    cdk.Tags.of(this).add('Component', 'Monitoring');
  }
}
