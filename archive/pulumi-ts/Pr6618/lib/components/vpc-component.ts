import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcComponentArgs {
  environmentSuffix: string;
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcComponent', name, {}, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: args.enableDnsHostnames ?? true,
        enableDnsSupport: args.enableDnsSupport ?? true,
        tags: {
          Name: `vpc-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    this.vpcId = this.vpc.id;

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Public Subnets
    this.publicSubnets = args.publicSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: args.availabilityZones[index],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${index}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
            Type: 'public',
          },
        },
        { parent: this }
      );
    });

    this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.id);

    // Create Private Subnets
    this.privateSubnets = args.privateSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: args.availabilityZones[index],
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `private-subnet-${index}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
            Type: 'private',
          },
        },
        { parent: this }
      );
    });

    this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.id);

    // Create Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `public-rt-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate Public Subnets with Public Route Table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Private Route Tables (one per AZ)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      return new aws.ec2.RouteTable(
        `private-rt-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `private-rt-${index}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
            AvailabilityZone: az,
          },
        },
        { parent: this }
      );
    });

    // Associate Private Subnets with Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTables[index].id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
