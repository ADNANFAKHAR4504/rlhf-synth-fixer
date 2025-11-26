import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface Route53ConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  alb: elbv2.ApplicationLoadBalancer;
}

export class Route53Construct extends Construct {
  public readonly hostedZone: route53.HostedZone;
  public readonly domainName: string;

  constructor(scope: Construct, id: string, props: Route53ConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, alb } = props;

    // Domain name based on environment and suffix
    this.domainName = `${environment}-app-${suffix}.test.local`;

    // Route 53 Hosted Zone - Requirement 5
    this.hostedZone = new route53.HostedZone(
      this,
      `HostedZone${environmentSuffix}${region}`,
      {
        zoneName: this.domainName,
        comment: `Hosted zone for ${environment} environment in ${region}`,
      }
    );

    // Primary record for this region with proper routing
    const isPrimary = region === 'us-west-2'; // us-west-2 is primary

    if (isPrimary) {
      // Primary record (simple routing)
      new route53.ARecord(this, `PrimaryRecord${environmentSuffix}${region}`, {
        zone: this.hostedZone,
        recordName: 'api', // api.{domain}
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        ttl: cdk.Duration.seconds(60),
      });

      // Root domain record (primary)
      new route53.ARecord(
        this,
        `RootPrimaryRecord${environmentSuffix}${region}`,
        {
          zone: this.hostedZone,
          target: route53.RecordTarget.fromAlias(
            new route53targets.LoadBalancerTarget(alb)
          ),
          ttl: cdk.Duration.seconds(60),
        }
      );
    } else {
      // Secondary record
      new route53.ARecord(
        this,
        `SecondaryRecord${environmentSuffix}${region}`,
        {
          zone: this.hostedZone,
          recordName: 'api-backup',
          target: route53.RecordTarget.fromAlias(
            new route53targets.LoadBalancerTarget(alb)
          ),
          ttl: cdk.Duration.seconds(60),
        }
      );

      // Root domain record (secondary)
      new route53.ARecord(
        this,
        `RootSecondaryRecord${environmentSuffix}${region}`,
        {
          zone: this.hostedZone,
          recordName: 'backup',
          target: route53.RecordTarget.fromAlias(
            new route53targets.LoadBalancerTarget(alb)
          ),
          ttl: cdk.Duration.seconds(60),
        }
      );
    }

    // Simple geolocation-based routing
    new route53.ARecord(this, `GeoRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      recordName: 'geo',
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      ttl: cdk.Duration.seconds(300),
    });

    // Simple routing for monitoring
    new route53.ARecord(this, `MonitoringRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      recordName: 'monitoring',
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      ttl: cdk.Duration.seconds(60),
    });

    // TXT record for domain verification
    new route53.TxtRecord(
      this,
      `DomainVerificationRecord${environmentSuffix}${region}`,
      {
        zone: this.hostedZone,
        recordName: '_verification',
        values: [`${environment}-verification-${suffix}`],
        ttl: cdk.Duration.seconds(300),
      }
    );

    // CAA record for certificate authority authorization
    new route53.CaaRecord(this, `CaaRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      values: [
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'amazon.com' },
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'amazontrust.com' },
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'awstrust.com' },
        { flag: 128, tag: route53.CaaTag.ISSUE, value: 'amazon.com' },
      ],
      ttl: cdk.Duration.seconds(3600),
    });

    // Apply tags
    cdk.Tags.of(this.hostedZone).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.hostedZone).add('Environment', environment);
    cdk.Tags.of(this.hostedZone).add('Region', region);
    cdk.Tags.of(this.hostedZone).add('Purpose', 'DNS');
  }

  private getContinentCode(region: string): route53.Continent | undefined {
    // Map AWS regions to continent codes for geolocation routing
    const regionToContinentMap: Record<string, route53.Continent> = {
      'us-east-1': route53.Continent.NORTH_AMERICA,
      'us-east-2': route53.Continent.NORTH_AMERICA,
      'us-west-1': route53.Continent.NORTH_AMERICA,
      'us-west-2': route53.Continent.NORTH_AMERICA,
      'ca-central-1': route53.Continent.NORTH_AMERICA,
      'eu-west-1': route53.Continent.EUROPE,
      'eu-west-2': route53.Continent.EUROPE,
      'eu-west-3': route53.Continent.EUROPE,
      'eu-central-1': route53.Continent.EUROPE,
      'eu-north-1': route53.Continent.EUROPE,
      'ap-northeast-1': route53.Continent.ASIA,
      'ap-northeast-2': route53.Continent.ASIA,
      'ap-southeast-1': route53.Continent.ASIA,
      'ap-southeast-2': route53.Continent.OCEANIA,
      'ap-south-1': route53.Continent.ASIA,
      'sa-east-1': route53.Continent.SOUTH_AMERICA,
    };

    return regionToContinentMap[region];
  }
}
