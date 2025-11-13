/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * network-stack.ts
 *
 * Creates VPC with public and private subnets, NAT gateways, and internet gateway.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create 2 public subnets in different AZs
    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: azs.names[0],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: azs.names[1],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create 2 private subnets in different AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: azs.names[0],
        tags: {
          Name: `private-subnet-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: azs.names[1],
        tags: {
          Name: `private-subnet-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(
      `nat-eip-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const eip2 = new aws.ec2.Eip(
      `nat-eip-2-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create NAT Gateways in public subnets
    const natGw1 = new aws.ec2.NatGateway(
      `nat-gw-1-${environmentSuffix}`,
      {
        allocationId: eip1.id,
        subnetId: publicSubnet1.id,
        tags: {
          Name: `nat-gw-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const natGw2 = new aws.ec2.NatGateway(
      `nat-gw-2-${environmentSuffix}`,
      {
        allocationId: eip2.id,
        subnetId: publicSubnet2.id,
        tags: {
          Name: `nat-gw-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Create private route tables
    const privateRouteTable1 = new aws.ec2.RouteTable(
      `private-rt-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-1-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const privateRouteTable2 = new aws.ec2.RouteTable(
      `private-rt-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-2-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Add routes to NAT Gateways
    new aws.ec2.Route(
      `private-route-1-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable1.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw1.id,
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `private-route-2-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable2.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw2.id,
      },
      { parent: this }
    );

    // Associate private subnets with private route tables
    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable1.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable2.id,
      },
      { parent: this }
    );

    // Expose outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
