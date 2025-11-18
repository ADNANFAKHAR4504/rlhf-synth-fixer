import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface Route53FailoverStackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryDbEndpoint: string;
  drDbEndpoint: string;
  primaryMonitoringTopicArn: string;
}

export class Route53FailoverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Route53FailoverStackProps) {
    super(scope, id, props);

    const { environmentSuffix, primaryMonitoringTopicArn } = props;
    // primaryDbEndpoint and drDbEndpoint would be used for actual record sets in production

    // Import SNS topic for notifications
    const monitoringTopic = sns.Topic.fromTopicArn(
      this,
      `MonitoringTopic-${environmentSuffix}`,
      primaryMonitoringTopicArn
    );

    // Note: In production, you would create Route53 record sets in an existing hosted zone
    // pointing to primaryDbEndpoint and drDbEndpoint with failover routing policies.
    // For this implementation, we create health checks that can be used with any hosted zone.

    // Route53 Health Check for Primary Database
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      `PrimaryDbHealthCheck-${environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'CALCULATED',
          childHealthChecks: [],
          healthThreshold: 1,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `primary-db-health-check-${environmentSuffix}`,
          },
        ],
      }
    );

    // Route53 Health Check for DR Database
    const drHealthCheck = new route53.CfnHealthCheck(
      this,
      `DrDbHealthCheck-${environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'CALCULATED',
          childHealthChecks: [],
          healthThreshold: 1,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `dr-db-health-check-${environmentSuffix}`,
          },
        ],
      }
    );

    // CloudWatch alarm for primary health check
    const primaryHealthCheckAlarm = new cloudwatch.Alarm(
      this,
      `PrimaryHealthCheckAlarm-${environmentSuffix}`,
      {
        alarmName: `primary-health-check-alarm-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Route53',
          metricName: 'HealthCheckStatus',
          dimensionsMap: {
            HealthCheckId: primaryHealthCheck.attrHealthCheckId,
          },
          statistic: 'Minimum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    primaryHealthCheckAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(monitoringTopic)
    );

    // Composite Alarm for failover decision
    const compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      `FailoverCompositeAlarm-${environmentSuffix}`,
      {
        compositeAlarmName: `failover-composite-alarm-${environmentSuffix}`,
        alarmDescription: 'Composite alarm for database failover decision',
        alarmRule: cloudwatch.AlarmRule.fromAlarm(
          primaryHealthCheckAlarm,
          cloudwatch.AlarmState.ALARM
        ),
        actionsEnabled: true,
      }
    );

    compositeAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(monitoringTopic)
    );

    // Failover record set group
    // Note: In production, you would create actual record sets pointing to the database endpoints
    // This is a placeholder showing the structure

    // Outputs
    new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
      value: primaryHealthCheck.attrHealthCheckId,
      description: 'Primary Health Check ID',
      exportName: `PrimaryHealthCheckId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DrHealthCheckId', {
      value: drHealthCheck.attrHealthCheckId,
      description: 'DR Health Check ID',
      exportName: `DrHealthCheckId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CompositeAlarmArn', {
      value: compositeAlarm.alarmArn,
      description: 'Composite Alarm ARN',
      exportName: `CompositeAlarmArn-${environmentSuffix}`,
    });
  }
}
