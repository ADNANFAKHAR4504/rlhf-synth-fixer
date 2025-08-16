import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Construct } from 'constructs';

export interface DnsProps {
  hostedZoneId: string; // Route53 hosted zone ID (e.g., Z123ABC...)
  recordName: string; // e.g., app.example.com
  primaryAlbDns: string; // DNS name of the primary ALB
  primaryAlbZoneId: string; // Canonical hosted zone ID of the primary ALB
  secondaryAlbDns: string; // DNS name of the secondary ALB
  secondaryAlbZoneId: string; // Canonical hosted zone ID of the secondary ALB
  healthCheckPath?: string; // Optional health check path
  primaryProvider: AwsProvider; // AWS provider for primary region
  secondaryProvider: AwsProvider; // AWS provider for secondary region
  environment: string; // Environment name (e.g., dev, prod)
}

/**
 * Creates:
 * - HTTPS health checks for each region's ALB
 * - Two latency-based alias A-records pointing at each ALB
 */
export class Dns extends Construct {
  constructor(scope: Construct, id: string, props: DnsProps) {
    super(scope, id);

    const path = props.healthCheckPath ?? '/';

    // Health checks (HTTPS) for primary ALB
    const primaryHc = new Route53HealthCheck(this, 'primaryHc', {
      type: 'HTTPS',
      fqdn: props.primaryAlbDns,
      resourcePath: path,
      requestInterval: 30,
      failureThreshold: 3,
      tags: { Name: `${props.environment}-hc-primary` },
      provider: props.primaryProvider,
    });

    // Health checks (HTTPS) for secondary ALB
    const secondaryHc = new Route53HealthCheck(this, 'secondaryHc', {
      type: 'HTTPS',
      fqdn: props.secondaryAlbDns,
      resourcePath: path,
      requestInterval: 30,
      failureThreshold: 3,
      tags: { Name: `${props.environment}-hc-secondary` },
      provider: props.secondaryProvider,
    });

    // Latency alias record (primary)
    new Route53Record(this, 'primaryLatencyRec', {
      zoneId: props.hostedZoneId,
      name: props.recordName,
      type: 'A',
      setIdentifier: 'primary',
      alias: {
        name: props.primaryAlbDns,
        zoneId: props.primaryAlbZoneId,
        evaluateTargetHealth: true,
      },
      latencyRoutingPolicy: {
        region: props.primaryProvider.region!,
      },
      healthCheckId: primaryHc.id,
      provider: props.primaryProvider,
    });

    // Latency alias record (secondary)
    new Route53Record(this, 'secondaryLatencyRec', {
      zoneId: props.hostedZoneId,
      name: props.recordName,
      type: 'A',
      setIdentifier: 'secondary',
      alias: {
        name: props.secondaryAlbDns,
        zoneId: props.secondaryAlbZoneId,
        evaluateTargetHealth: true,
      },
      latencyRoutingPolicy: {
        region: props.secondaryProvider.region!,
      },
      healthCheckId: secondaryHc.id,
      provider: props.secondaryProvider,
    });
  }
}
