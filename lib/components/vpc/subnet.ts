import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SubnetArgs {
  vpcId: pulumi.Input<string>;
  cidrBlock: string;
  availabilityZone: string;
  mapPublicIpOnLaunch?: boolean;
  isPublic: boolean;
  tags?: Record<string, string>;
  name: string;
}

export interface SubnetResult {
  subnet: aws.ec2.Subnet;
  subnetId: pulumi.Output<string>;
  availabilityZone: pulumi.Output<string>;
}

export interface SubnetGroupArgs {
  vpcId: pulumi.Input<string>;
  publicSubnets: Array<{
    cidrBlock: string;
    availabilityZone: string;
    name: string;
  }>;
  privateSubnets: Array<{
    cidrBlock: string;
    availabilityZone: string;
    name: string;
  }>;
  tags?: Record<string, string>;
}

export interface SubnetGroupResult {
  publicSubnets: SubnetResult[];
  privateSubnets: SubnetResult[];
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
}

export class SubnetComponent extends pulumi.ComponentResource {
  public readonly subnet: aws.ec2.Subnet;
  public readonly subnetId: pulumi.Output<string>;
  public readonly availabilityZone: pulumi.Output<string>;

  constructor(
    name: string,
    args: SubnetArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:SubnetComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      Type: args.isPublic ? 'Public' : 'Private',
      ...args.tags,
    };

    this.subnet = new aws.ec2.Subnet(
      `${name}-subnet`,
      {
        vpcId: args.vpcId,
        cidrBlock: args.cidrBlock,
        availabilityZone: args.availabilityZone,
        mapPublicIpOnLaunch: args.mapPublicIpOnLaunch ?? args.isPublic,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.subnetId = this.subnet.id;
    this.availabilityZone = this.subnet.availabilityZone;

    this.registerOutputs({
      subnet: this.subnet,
      subnetId: this.subnetId,
      availabilityZone: this.availabilityZone,
    });
  }
}

export class SubnetGroupComponent extends pulumi.ComponentResource {
  public readonly publicSubnets: SubnetResult[];
  public readonly privateSubnets: SubnetResult[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: SubnetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:SubnetGroupComponent', name, {}, opts);

    this.publicSubnets = args.publicSubnets.map((subnetConfig, index) => {
      const subnetComponent = new SubnetComponent(
        `${name}-public-${index}`,
        {
          vpcId: args.vpcId,
          cidrBlock: subnetConfig.cidrBlock,
          availabilityZone: subnetConfig.availabilityZone,
          isPublic: true,
          mapPublicIpOnLaunch: true,
          name: subnetConfig.name,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
      );

      return {
        subnet: subnetComponent.subnet,
        subnetId: subnetComponent.subnetId,
        availabilityZone: subnetComponent.availabilityZone,
      };
    });

    this.privateSubnets = args.privateSubnets.map((subnetConfig, index) => {
      const subnetComponent = new SubnetComponent(
        `${name}-private-${index}`,
        {
          vpcId: args.vpcId,
          cidrBlock: subnetConfig.cidrBlock,
          availabilityZone: subnetConfig.availabilityZone,
          isPublic: false,
          mapPublicIpOnLaunch: false,
          name: subnetConfig.name,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
      );

      return {
        subnet: subnetComponent.subnet,
        subnetId: subnetComponent.subnetId,
        availabilityZone: subnetComponent.availabilityZone,
      };
    });

    this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.subnetId);
    this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.subnetId);

    this.registerOutputs({
      publicSubnets: this.publicSubnets,
      privateSubnets: this.privateSubnets,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}

export function createSubnet(
  name: string,
  args: SubnetArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): SubnetResult {
  const subnetComponent = new SubnetComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    subnet: subnetComponent.subnet,
    subnetId: subnetComponent.subnetId,
    availabilityZone: subnetComponent.availabilityZone,
  };
}

export function createSubnetGroup(
  name: string,
  args: SubnetGroupArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): SubnetGroupResult {
  const subnetGroupComponent = new SubnetGroupComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    publicSubnets: subnetGroupComponent.publicSubnets,
    privateSubnets: subnetGroupComponent.privateSubnets,
    publicSubnetIds: subnetGroupComponent.publicSubnetIds,
    privateSubnetIds: subnetGroupComponent.privateSubnetIds,
  };
}
