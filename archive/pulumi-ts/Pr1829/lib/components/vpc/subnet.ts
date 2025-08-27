import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SubnetArgs {
  vpcId: pulumi.Input<string>;
  cidrBlock: string;
  availabilityZone: pulumi.Input<string>; // CHANGED: Allow Input<string> for dynamic AZs
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

// UPDATED: Support both static and dynamic subnet configurations
export interface SubnetGroupArgs {
  vpcId: pulumi.Input<string>;
  publicSubnets: pulumi.Input<
    Array<{
      cidrBlock: string;
      availabilityZone: pulumi.Input<string>; // CHANGED: Support dynamic AZs
      name: string;
    }>
  >;
  privateSubnets: pulumi.Input<
    Array<{
      cidrBlock: string;
      availabilityZone: pulumi.Input<string>; // CHANGED: Support dynamic AZs
      name: string;
    }>
  >;
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
        availabilityZone: args.availabilityZone, // Now supports dynamic Input<string>
        mapPublicIpOnLaunch: args.mapPublicIpOnLaunch ?? args.isPublic,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
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

// NEW: Enhanced SubnetGroupComponent to handle dynamic configurations
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

    // FIXED: Handle dynamic subnet configurations properly
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];

    // Handle dynamic public subnets
    const publicSubnetsInput = pulumi.output(args.publicSubnets);
    publicSubnetsInput.apply(publicSubnets => {
      publicSubnets.forEach((subnetConfig, index) => {
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
          { parent: this, provider: opts?.provider }
        );

        this.publicSubnets.push({
          subnet: subnetComponent.subnet,
          subnetId: subnetComponent.subnetId,
          availabilityZone: subnetComponent.availabilityZone,
        });

        this.publicSubnetIds.push(subnetComponent.subnetId);
      });
      return publicSubnets;
    });

    // Handle dynamic private subnets
    const privateSubnetsInput = pulumi.output(args.privateSubnets);
    privateSubnetsInput.apply(privateSubnets => {
      privateSubnets.forEach((subnetConfig, index) => {
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
          { parent: this, provider: opts?.provider }
        );

        this.privateSubnets.push({
          subnet: subnetComponent.subnet,
          subnetId: subnetComponent.subnetId,
          availabilityZone: subnetComponent.availabilityZone,
        });

        this.privateSubnetIds.push(subnetComponent.subnetId);
      });
      return privateSubnets;
    });

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
  opts?: pulumi.ComponentResourceOptions
): SubnetResult {
  const subnetComponent = new SubnetComponent(name, args, opts);
  return {
    subnet: subnetComponent.subnet,
    subnetId: subnetComponent.subnetId,
    availabilityZone: subnetComponent.availabilityZone,
  };
}

export function createSubnetGroup(
  name: string,
  args: SubnetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SubnetGroupResult {
  const subnetGroupComponent = new SubnetGroupComponent(name, args, opts);
  return {
    publicSubnets: subnetGroupComponent.publicSubnets,
    privateSubnets: subnetGroupComponent.privateSubnets,
    publicSubnetIds: subnetGroupComponent.publicSubnetIds,
    privateSubnetIds: subnetGroupComponent.privateSubnetIds,
  };
}
