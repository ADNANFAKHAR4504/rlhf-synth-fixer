import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcComponentArgs {
  vpcCidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  tags: { [key: string]: string };
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

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...args.tags,
          Name: `vpc-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.vpcId = this.vpc.id;

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `igw-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Public Subnets
    this.publicSubnets = args.availabilityZones.map((az, index) => {
      const cidrBlock = `10.${index}.1.0/24`;
      return new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidrBlock,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `public-subnet-${index}-${args.environmentSuffix}`,
            Type: 'public',
          },
        },
        defaultResourceOptions
      );
    });

    this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.id);

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `public-rt-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Public Route to Internet
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      defaultResourceOptions
    );

    // Associate Public Subnets with Public Route Table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        defaultResourceOptions
      );
    });

    // Private Subnets
    this.privateSubnets = args.availabilityZones.map((az, index) => {
      const cidrBlock = `10.${index}.2.0/24`;
      return new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidrBlock,
          availabilityZone: az,
          tags: {
            ...args.tags,
            Name: `private-subnet-${index}-${args.environmentSuffix}`,
            Type: 'private',
          },
        },
        defaultResourceOptions
      );
    });

    this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.id);

    // Private Route Tables (one per AZ for potential NAT Gateway flexibility)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `private-rt-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...args.tags,
            Name: `private-rt-${index}-${args.environmentSuffix}`,
          },
        },
        defaultResourceOptions
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: this.privateSubnets[index].id,
          routeTableId: routeTable.id,
        },
        defaultResourceOptions
      );

      return routeTable;
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
