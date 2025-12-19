/**
 * route53-stack.ts
 *
 * Defines Route 53 hosted zone with health checks and failover routing.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Route53StackArgs {
  primaryRegion: string;
  secondaryRegion: string;
  primaryEndpoint: pulumi.Input<string>;
  secondaryEndpoint: pulumi.Input<string>;
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class Route53Stack extends pulumi.ComponentResource {
  public readonly hostedZone: aws.route53.Zone;
  public readonly primaryHealthCheck: aws.route53.HealthCheck;
  public readonly secondaryHealthCheck: aws.route53.HealthCheck;
  public readonly zoneId: pulumi.Output<string>;
  public readonly nameServers: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: Route53StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:route53:Route53Stack', name, args, opts);

    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create hosted zone
    this.hostedZone = new aws.route53.Zone(
      `${name}-zone`,
      {
        name: `tapdr-${envSuffix}-e7.local`,
        comment: 'Hosted zone for multi-region DR application',
        tags: {
          ...tags,
          Name: `${name}-hosted-zone-${envSuffix}-e7`,
          Purpose: 'multi-region-dr',
        },
      },
      { parent: this }
    );

    // Create health check for primary region
    this.primaryHealthCheck = new aws.route53.HealthCheck(
      `${name}-primary-health`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [],
        tags: {
          ...tags,
          Name: `${name}-primary-health-${envSuffix}-e7`,
          Region: args.primaryRegion,
        },
      },
      { parent: this }
    );

    // Create health check for secondary region
    this.secondaryHealthCheck = new aws.route53.HealthCheck(
      `${name}-secondary-health`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [],
        tags: {
          ...tags,
          Name: `${name}-secondary-health-${envSuffix}-e7`,
          Region: args.secondaryRegion,
        },
      },
      { parent: this }
    );

    // Create primary failover record
    new aws.route53.Record(
      `${name}-primary-record`,
      {
        zoneId: this.hostedZone.zoneId,
        name: `app.tapdr-${envSuffix}-e7.local`,
        type: 'CNAME',
        ttl: 60,
        records: [args.primaryEndpoint],
        setIdentifier: 'primary',
        failoverRoutingPolicies: [
          {
            type: 'PRIMARY',
          },
        ],
        healthCheckId: this.primaryHealthCheck.id,
      },
      { parent: this }
    );

    // Create secondary failover record
    new aws.route53.Record(
      `${name}-secondary-record`,
      {
        zoneId: this.hostedZone.zoneId,
        name: `app.tapdr-${envSuffix}-e7.local`,
        type: 'CNAME',
        ttl: 60,
        records: [args.secondaryEndpoint],
        setIdentifier: 'secondary',
        failoverRoutingPolicies: [
          {
            type: 'SECONDARY',
          },
        ],
        healthCheckId: this.secondaryHealthCheck.id,
      },
      { parent: this }
    );

    this.zoneId = this.hostedZone.zoneId;
    this.nameServers = this.hostedZone.nameServers;

    this.registerOutputs({
      zoneId: this.hostedZone.zoneId,
      nameServers: this.hostedZone.nameServers,
    });
  }
}
