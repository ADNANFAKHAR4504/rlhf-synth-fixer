import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NatGatewayArgs {
  subnetId: pulumi.Input<string>;
  allocationId?: pulumi.Input<string>;
  connectivityType?: 'public' | 'private';
  tags?: Record<string, string>;
  name: string;
}

export interface NatGatewayResult {
  natGateway: aws.ec2.NatGateway;
  natGatewayId: pulumi.Output<string>;
  elasticIp?: aws.ec2.Eip;
  elasticIpId?: pulumi.Output<string>;
  publicIp?: pulumi.Output<string>;
}

export interface MultiAzNatGatewayArgs {
  publicSubnetIds: pulumi.Input<string>[];
  tags?: Record<string, string>;
  name: string;
}

export interface MultiAzNatGatewayResult {
  natGateways: NatGatewayResult[];
  natGatewayIds: pulumi.Output<string>[];
}

export class NatGatewayComponent extends pulumi.ComponentResource {
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly natGatewayId: pulumi.Output<string>;
  public readonly elasticIp?: aws.ec2.Eip;
  public readonly elasticIpId?: pulumi.Output<string>;
  public readonly publicIp?: pulumi.Output<string>;

  constructor(
    name: string,
    args: NatGatewayArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:NatGatewayComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    const connectivityType = args.connectivityType || 'public';
    let allocationId = args.allocationId;

    // Create Elastic IP for public NAT Gateway if not provided
    if (connectivityType === 'public' && !allocationId) {
      this.elasticIp = new aws.ec2.Eip(
        `${name}-eip`,
        {
          domain: 'vpc',
          tags: {
            ...defaultTags,
            Name: `${args.name}-eip`,
          },
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
      );

      this.elasticIpId = this.elasticIp.id;
      this.publicIp = this.elasticIp.publicIp;
      allocationId = this.elasticIp.id;
    }

    this.natGateway = new aws.ec2.NatGateway(
      `${name}-nat`,
      {
        subnetId: args.subnetId,
        allocationId: allocationId,
        connectivityType: connectivityType,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.natGatewayId = this.natGateway.id;

    this.registerOutputs({
      natGateway: this.natGateway,
      natGatewayId: this.natGatewayId,
      elasticIp: this.elasticIp,
      elasticIpId: this.elasticIpId,
      publicIp: this.publicIp,
    });
  }
}

export class MultiAzNatGatewayComponent extends pulumi.ComponentResource {
  public readonly natGateways: NatGatewayResult[];
  public readonly natGatewayIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: MultiAzNatGatewayArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:MultiAzNatGatewayComponent', name, {}, opts);

    this.natGateways = [];
    this.natGatewayIds = [];

    args.publicSubnetIds.forEach((subnetId, index) => {
      const natGatewayComponent = new NatGatewayComponent(
        `${name}-${index}`,
        {
          subnetId: subnetId,
          connectivityType: 'public',
          name: `${args.name}-${index}`,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
      );

      const result: NatGatewayResult = {
        natGateway: natGatewayComponent.natGateway,
        natGatewayId: natGatewayComponent.natGatewayId,
        elasticIp: natGatewayComponent.elasticIp,
        elasticIpId: natGatewayComponent.elasticIpId,
        publicIp: natGatewayComponent.publicIp,
      };

      this.natGateways.push(result);
      this.natGatewayIds.push(natGatewayComponent.natGatewayId);
    });

    this.registerOutputs({
      natGateways: this.natGateways,
      natGatewayIds: this.natGatewayIds,
    });
  }
}

export function createNatGateway(
  name: string,
  args: NatGatewayArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): NatGatewayResult {
  const natGatewayComponent = new NatGatewayComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    natGateway: natGatewayComponent.natGateway,
    natGatewayId: natGatewayComponent.natGatewayId,
    elasticIp: natGatewayComponent.elasticIp,
    elasticIpId: natGatewayComponent.elasticIpId,
    publicIp: natGatewayComponent.publicIp,
  };
}

export function createMultiAzNatGateway(
  name: string,
  args: MultiAzNatGatewayArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): MultiAzNatGatewayResult {
  const multiAzComponent = new MultiAzNatGatewayComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    natGateways: multiAzComponent.natGateways,
    natGatewayIds: multiAzComponent.natGatewayIds,
  };
}
