import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Route53ComponentArgs {
  environment: string;
  vpcId: pulumi.Output<string>;
  zoneName: string;
  tags: { [key: string]: string };
}

export class Route53Component extends pulumi.ComponentResource {
  public readonly zone: aws.route53.Zone;
  public readonly id: pulumi.Output<string>;

  constructor(
    name: string,
    args: Route53ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:Route53Component', name, {}, opts);

    const resourceOpts = { parent: this };

    // Create private hosted zone
    this.zone = new aws.route53.Zone(
      `${args.environment}-payment-zone`,
      {
        name: args.zoneName,
        vpcs: [
          {
            vpcId: args.vpcId,
          },
        ],
        comment: `Private hosted zone for ${args.environment} payment processing`,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-zone`,
        },
      },
      resourceOpts
    );

    this.id = this.zone.id;

    this.registerOutputs({
      zoneId: this.id,
      zoneName: this.zone.name,
    });
  }

  createRecord(
    name: string,
    recordName: string,
    target: pulumi.Output<string>
  ): aws.route53.Record {
    return new aws.route53.Record(
      name,
      {
        zoneId: this.zone.id,
        name: recordName,
        type: 'CNAME',
        ttl: 300,
        records: [target],
      },
      { parent: this }
    );
  }
}
