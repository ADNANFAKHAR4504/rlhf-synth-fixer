/**
 * routing-stack.ts
 *
 * Route 53 health checks and failover routing policy.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RoutingStackArgs {
  environmentSuffix: string;
  primaryAlbDns: pulumi.Output<string>;
  secondaryAlbDns: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class RoutingStack extends pulumi.ComponentResource {
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly failoverDomainName: pulumi.Output<string>;

  constructor(
    name: string,
    args: RoutingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:routing:RoutingStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Route 53 Hosted Zone (assumes existing zone)
    // In production, use existing hosted zone ID
    // Using test domain pattern to avoid AWS reserved domains
    const hostedZone = new aws.route53.Zone(
      `failover-zone-${environmentSuffix}`,
      {
        name: `dr-failover-${environmentSuffix}.test.local`,
        tags: {
          ...tags,
          Name: `failover-zone-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Health Check for Primary ALB
    const primaryHealthCheck = new aws.route53.HealthCheck(
      `primary-health-check-${environmentSuffix}`,
      {
        type: 'HTTPS',
        resourcePath: '/health',
        fqdn: args.primaryAlbDns,
        port: 443,
        requestInterval: 30,
        failureThreshold: 2,
        measureLatency: true,
        tags: {
          ...tags,
          Name: `primary-health-check-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Primary Failover Record
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _primaryRecord = new aws.route53.Record(
      `primary-failover-record-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `app.dr-failover-${environmentSuffix}.test.local`,
        type: 'CNAME',
        ttl: 60,
        records: [args.primaryAlbDns],
        setIdentifier: 'primary',
        failoverRoutingPolicies: [
          {
            type: 'PRIMARY',
          },
        ],
        healthCheckId: primaryHealthCheck.id,
      },
      { parent: this, dependsOn: [primaryHealthCheck] }
    );

    // Secondary Failover Record
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _secondaryRecord = new aws.route53.Record(
      `secondary-failover-record-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `app.dr-failover-${environmentSuffix}.test.local`,
        type: 'CNAME',
        ttl: 60,
        records: [args.secondaryAlbDns],
        setIdentifier: 'secondary',
        failoverRoutingPolicies: [
          {
            type: 'SECONDARY',
          },
        ],
      },
      { parent: this }
    );

    // Outputs
    this.healthCheckId = primaryHealthCheck.id;
    this.failoverDomainName = pulumi.interpolate`app.dr-failover-${environmentSuffix}.test.local`;

    this.registerOutputs({
      healthCheckId: this.healthCheckId,
      failoverDomainName: this.failoverDomainName,
    });
  }
}
