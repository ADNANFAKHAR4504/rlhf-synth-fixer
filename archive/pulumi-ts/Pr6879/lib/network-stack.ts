/**
 * Network Stack - VPC, Subnets, NAT Gateways, Internet Gateway
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  vpcCidr: string;
  availabilityZones: string[];
  tags: { [key: string]: string };
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:NetworkStack', name, {}, opts);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
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
      { parent: this }
    );

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...args.tags,
          Name: `igw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.internetGatewayId = igw.id;

    // Create public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    for (let i = 0; i < args.availabilityZones.length; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i + 1}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: publicSubnetCidrs[i],
          availabilityZone: args.availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `public-subnet-${i + 1}-${args.environmentSuffix}`,
            Tier: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...args.tags,
          Name: `public-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i + 1}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const eip = new aws.ec2.Eip(
        `nat-eip-${i + 1}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...args.tags,
            Name: `nat-eip-${i + 1}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const natGw = new aws.ec2.NatGateway(
        `nat-gw-${i + 1}-${args.environmentSuffix}`,
        {
          allocationId: eips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...args.tags,
            Name: `nat-gw-${i + 1}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natGateways.push(natGw);
    }

    // Create private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateSubnetCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    for (let i = 0; i < args.availabilityZones.length; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i + 1}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: privateSubnetCidrs[i],
          availabilityZone: args.availabilityZones[i],
          mapPublicIpOnLaunch: false,
          tags: {
            ...args.tags,
            Name: `private-subnet-${i + 1}-${args.environmentSuffix}`,
            Tier: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Create route tables for private subnets (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${i + 1}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...args.tags,
            Name: `private-rt-${i + 1}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Add route to NAT Gateway
      new aws.ec2.Route(
        `private-route-${i + 1}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      // Associate private subnet with its route table
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i + 1}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGatewayId,
    });
  }
}
