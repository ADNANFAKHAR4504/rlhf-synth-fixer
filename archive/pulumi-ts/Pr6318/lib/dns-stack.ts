import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DnsStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  primaryAlbDnsName: pulumi.Output<string>;
  drAlbDnsName: pulumi.Output<string>;
  primaryAlbZoneId: pulumi.Output<string>;
  drAlbZoneId: pulumi.Output<string>;
  primaryProvider: aws.Provider;
}

export class DnsStack extends pulumi.ComponentResource {
  public readonly primaryEndpoint: pulumi.Output<string>;
  public readonly drEndpoint: pulumi.Output<string>;
  public readonly hostedZoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DnsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:dns:DnsStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      primaryAlbDnsName,
      drAlbDnsName,
      primaryAlbZoneId,
      drAlbZoneId,
      primaryProvider,
    } = args;

    // Create hosted zone in primary region
    const hostedZone = new aws.route53.Zone(
      `payments-zone-${environmentSuffix}`,
      {
        name: `payments-${environmentSuffix}.internal`,
        comment: 'Managed by Pulumi for DR setup',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payments-zone-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Health check for primary ALB
    const primaryHealthCheck = new aws.route53.HealthCheck(
      `primary-hc-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health.html',
        fqdn: primaryAlbDnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-hc-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Health check for DR ALB
    const drHealthCheck = new aws.route53.HealthCheck(
      `dr-hc-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health.html',
        fqdn: drAlbDnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-hc-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary failover record
    new aws.route53.Record(
      `primary-record-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `payments-${environmentSuffix}.internal`,
        type: 'A',
        setIdentifier: `primary-${environmentSuffix}`,
        failoverRoutingPolicies: [
          {
            type: 'PRIMARY',
          },
        ],
        aliases: [
          {
            name: primaryAlbDnsName,
            zoneId: primaryAlbZoneId,
            evaluateTargetHealth: true,
          },
        ],
        healthCheckId: primaryHealthCheck.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // DR failover record
    new aws.route53.Record(
      `dr-record-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `payments-${environmentSuffix}.internal`,
        type: 'A',
        setIdentifier: `dr-${environmentSuffix}`,
        failoverRoutingPolicies: [
          {
            type: 'SECONDARY',
          },
        ],
        aliases: [
          {
            name: drAlbDnsName,
            zoneId: drAlbZoneId,
            evaluateTargetHealth: true,
          },
        ],
        healthCheckId: drHealthCheck.id,
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryEndpoint = pulumi.interpolate`http://${primaryAlbDnsName}`;
    this.drEndpoint = pulumi.interpolate`http://${drAlbDnsName}`;
    this.hostedZoneId = hostedZone.zoneId;

    this.registerOutputs({
      primaryEndpoint: this.primaryEndpoint,
      drEndpoint: this.drEndpoint,
      hostedZoneId: this.hostedZoneId,
    });
  }
}
