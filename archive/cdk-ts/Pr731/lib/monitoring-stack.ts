import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  snsTopicArn: string;
}

export class MonitoringStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const alertTopic = sns.Topic.fromTopicArn(
      this,
      'AlertTopic',
      props.snsTopicArn
    );

    // CloudWatch alarms for security monitoring
    const securityAlarm = new cloudwatch.Alarm(
      this,
      `${props.environmentSuffix}-security-alarm`,
      {
        alarmName: `${props.environmentSuffix}-security-events`,
        alarmDescription: 'Alarm for security events from GuardDuty',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/GuardDuty',
          metricName: 'FindingCount',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    securityAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // Multi-region GuardDuty setup (using custom resource or manual setup)
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];
    regions.forEach((region, _index) => {
      if (region !== cdk.Stack.of(this).region) {
        // Note: For multi-region GuardDuty, you would need to deploy separate stacks
        // or use a custom resource. This is a placeholder for the concept.
        new cdk.CfnOutput(this, `GuardDutyRegion${_index}`, {
          value: `GuardDuty should be enabled in ${region}`,
          description: `Manual setup required for GuardDuty in ${region}`,
        });
      }
    });
  }
}
