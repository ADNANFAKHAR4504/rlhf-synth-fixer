import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

export interface RoutingConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  domainName: string;
  primaryLambdaUrl: string;
  secondaryLambdaUrl: string;
}

export class RoutingConstruct extends Construct {
  public readonly healthCheckId: string;

  constructor(scope: Construct, id: string, props: RoutingConstructProps) {
    super(scope, id);

    const { environmentSuffix, primaryProvider } = props;

    // Use CloudWatch-based calculated health check instead of HTTPS health check
    // This avoids issues with Lambda URL FQDNs containing special characters at synthesis time
    // The calculated health check monitors a CloudWatch alarm which tracks Lambda errors

    // CloudWatch Alarm for Lambda Errors (used as health check source)
    const lambdaErrorAlarm = new CloudwatchMetricAlarm(
      this,
      'PrimaryLambdaErrorAlarm',
      {
        provider: primaryProvider,
        alarmName: `primary-lambda-error-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when primary Lambda has too many errors',
        treatMissingData: 'notBreaching',
        tags: {
          Name: `primary-lambda-error-alarm-${environmentSuffix}`,
        },
      }
    );

    // Health Check using CloudWatch Alarm
    const healthCheck = new Route53HealthCheck(this, 'PrimaryHealthCheck', {
      provider: primaryProvider,
      type: 'CLOUDWATCH_METRIC',
      cloudwatchAlarmName: lambdaErrorAlarm.alarmName,
      cloudwatchAlarmRegion: 'us-east-1',
      insufficientDataHealthStatus: 'Healthy',
      tags: {
        Name: `primary-health-check-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarm for Health Check Status
    new CloudwatchMetricAlarm(this, 'HealthCheckAlarm', {
      provider: primaryProvider,
      alarmName: `primary-region-health-alarm-${environmentSuffix}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HealthCheckStatus',
      namespace: 'AWS/Route53',
      period: 60,
      statistic: 'Minimum',
      threshold: 1,
      dimensions: {
        HealthCheckId: healthCheck.id,
      },
      alarmDescription: 'Alert when primary region health check fails',
      treatMissingData: 'breaching',
      tags: {
        Name: `primary-region-health-alarm-${environmentSuffix}`,
      },
    });

    // Note: Route53 hosted zone and DNS records are not created for ephemeral PR environments
    // as example.com is reserved by AWS. In production, these would be configured with
    // a real domain and proper failover routing.

    // Export values
    this.healthCheckId = healthCheck.id;
  }
}
