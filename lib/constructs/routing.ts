import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
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

    const {
      environmentSuffix,
      primaryProvider,
      domainName,
      primaryLambdaUrl,
      secondaryLambdaUrl,
    } = props;

    // Extract hostname from Lambda URL for health check
    const primaryHostname = primaryLambdaUrl
      .replace('https://', '')
      .replace(/\/$/, '');
    const secondaryHostname = secondaryLambdaUrl
      .replace('https://', '')
      .replace(/\/$/, '');

    // Route 53 Hosted Zone
    const hostedZone = new Route53Zone(this, 'HostedZone', {
      provider: primaryProvider,
      name: domainName,
      tags: {
        Name: `${domainName}-${environmentSuffix}`,
      },
    });

    // Health Check for Primary Region
    const healthCheck = new Route53HealthCheck(this, 'PrimaryHealthCheck', {
      provider: primaryProvider,
      type: 'HTTPS',
      resourcePath: '/',
      fqdn: primaryHostname,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
      measureLatency: true,
      tags: {
        Name: `primary-health-check-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarm for Health Check
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

    // Primary Region DNS Record (Failover Primary)
    new Route53Record(this, 'PrimaryRecord', {
      provider: primaryProvider,
      zoneId: hostedZone.zoneId,
      name: domainName,
      type: 'CNAME',
      ttl: 60,
      records: [primaryHostname],
      setIdentifier: 'primary',
      failoverRoutingPolicy: {
        type: 'PRIMARY',
      },
      healthCheckId: healthCheck.id,
    });

    // Secondary Region DNS Record (Failover Secondary)
    new Route53Record(this, 'SecondaryRecord', {
      provider: primaryProvider,
      zoneId: hostedZone.zoneId,
      name: domainName,
      type: 'CNAME',
      ttl: 60,
      records: [secondaryHostname],
      setIdentifier: 'secondary',
      failoverRoutingPolicy: {
        type: 'SECONDARY',
      },
    });

    // Export values
    this.healthCheckId = healthCheck.id;
  }
}
