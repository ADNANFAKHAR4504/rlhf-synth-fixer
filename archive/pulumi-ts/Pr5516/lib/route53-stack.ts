import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Route53StackArgs {
  environmentSuffix: string;
  albDnsName: pulumi.Input<string>;
  albZoneId: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class Route53Stack extends pulumi.ComponentResource {
  public readonly healthCheck: aws.route53.HealthCheck;
  public readonly hostedZone?: aws.route53.Zone;
  public readonly record?: aws.route53.Record;

  constructor(
    name: string,
    args: Route53StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:route53:Route53Stack', name, args, opts);

    // Create Route53 Health Check for ALB
    // Note: In production, you would use HTTPS with a valid certificate
    this.healthCheck = new aws.route53.HealthCheck(
      `alb-health-check-${args.environmentSuffix}`,
      {
        type: 'HTTPS',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        measureLatency: true,
        fqdn: args.albDnsName,
        port: 443,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `alb-health-check-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Note: Creating a hosted zone and DNS records requires a domain
    // Uncomment and modify the following if you have a domain configured

    /*
    // Get or create hosted zone
    this.hostedZone = new aws.route53.Zone(`zone-${args.environmentSuffix}`, {
      name: 'example.com', // Replace with your domain
      tags: {
        ...pulumi.output(args.tags).apply(t => t),
        Name: `zone-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create DNS record with failover routing
    this.record = new aws.route53.Record(`record-${args.environmentSuffix}`, {
      zoneId: this.hostedZone.zoneId,
      name: `app-${args.environmentSuffix}.example.com`, // Replace with your subdomain
      type: 'A',
      aliases: [{
        name: args.albDnsName,
        zoneId: args.albZoneId,
        evaluateTargetHealth: true,
      }],
      setIdentifier: `primary-${args.environmentSuffix}`,
      failoverRoutingPolicies: [{
        type: 'PRIMARY',
      }],
      healthCheckId: this.healthCheck.id,
    }, { parent: this });
    */

    this.registerOutputs({
      healthCheckId: this.healthCheck.id,
    });
  }
}
