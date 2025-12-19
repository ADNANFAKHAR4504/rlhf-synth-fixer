/**
 * networking.ts
 *
 * VPC, subnets, NAT Gateways, and networking infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkingStackArgs {
  environmentSuffix: string;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  tags?: { [key: string]: string };
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: NetworkingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:networking:NetworkingStack', name, args, opts);

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `payment-vpc-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-igw-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Public Subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const publicSubnetIdOutputs: pulumi.Output<string>[] = [];

    args.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: availabilityZones.names[index],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `payment-public-subnet-${index}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
      publicSubnetIdOutputs.push(subnet.id);
    });

    this.publicSubnetIds = publicSubnetIdOutputs;

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-public-rt-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Elastic IP for NAT Gateway
    const eip = new aws.ec2.Eip(
      `nat-eip-${args.environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // NAT Gateway (single for cost optimization)
    const natGateway = new aws.ec2.NatGateway(
      `nat-${args.environmentSuffix}`,
      {
        subnetId: publicSubnets[0].id,
        allocationId: eip.id,
        tags: {
          Name: `payment-nat-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Private Subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateSubnetIdOutputs: pulumi.Output<string>[] = [];

    args.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: availabilityZones.names[index],
          tags: {
            Name: `payment-private-subnet-${index}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
      privateSubnetIdOutputs.push(subnet.id);
    });

    this.privateSubnetIds = privateSubnetIdOutputs;

    // Private Route Table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-private-rt-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `private-route-${args.environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { parent: this }
    );

    // Associate private subnets with route table
    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
