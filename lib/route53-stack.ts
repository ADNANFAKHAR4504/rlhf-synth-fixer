import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface Route53StackArgs {
  environmentSuffix: string;
  domainName: string;
  subdomain: string;
  albDnsName: pulumi.Input<string>;
  albZoneId: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class Route53Stack extends pulumi.ComponentResource {
  public readonly hostedZone: aws.route53.Zone;
  public readonly aRecord: aws.route53.Record;
  public readonly fullDomainName: pulumi.Output<string>;

  constructor(
    name: string,
    args: Route53StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:route53:Route53Stack', name, args, opts);

    // Get or create hosted zone for the domain
    this.hostedZone = new aws.route53.Zone(
      `${name}-zone-${args.environmentSuffix}`,
      {
        name: args.domainName,
        tags: {
          ...args.tags,
          Name: `${name}-zone-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create A record pointing to ALB
    const fullDomain = `${args.subdomain}.${args.domainName}`;
    this.fullDomainName = pulumi.output(fullDomain);

    this.aRecord = new aws.route53.Record(
      `${name}-a-record-${args.environmentSuffix}`,
      {
        zoneId: this.hostedZone.zoneId,
        name: fullDomain,
        type: 'A',
        aliases: [
          {
            name: args.albDnsName,
            zoneId: args.albZoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      { parent: this }
    );

    this.registerOutputs({
      fullDomainName: this.fullDomainName,
      nameServers: this.hostedZone.nameServers,
    });
  }
}
