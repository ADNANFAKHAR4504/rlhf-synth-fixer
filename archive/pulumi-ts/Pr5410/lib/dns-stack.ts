import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DnsStackArgs {
  environmentSuffix: string;
  domainName?: string;
  albDnsName: pulumi.Output<string>;
  albZoneId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DnsStack extends pulumi.ComponentResource {
  public readonly hostedZoneId?: pulumi.Output<string>;
  public readonly nameServers?: pulumi.Output<string[]>;
  public readonly recordName?: pulumi.Output<string>;

  constructor(
    name: string,
    args: DnsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:dns:DnsStack', name, args, opts);

    // Only create DNS resources if domain name is provided
    if (args.domainName) {
      // Create Route53 hosted zone
      const hostedZone = new aws.route53.Zone(
        `payment-zone-${args.environmentSuffix}`,
        {
          name: args.domainName,
          comment: `Hosted zone for payment processing platform - ${args.environmentSuffix}`,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-zone-${args.environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      // Create A record pointing to ALB
      const record = new aws.route53.Record(
        `payment-record-${args.environmentSuffix}`,
        {
          zoneId: hostedZone.zoneId,
          name: args.domainName,
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

      this.hostedZoneId = hostedZone.zoneId;
      this.nameServers = hostedZone.nameServers;
      this.recordName = record.name;

      this.registerOutputs({
        hostedZoneId: this.hostedZoneId,
        nameServers: this.nameServers,
        recordName: this.recordName,
      });
    } else {
      this.registerOutputs({});
    }
  }
}
