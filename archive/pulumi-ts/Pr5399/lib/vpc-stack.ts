/**
 * VPC Stack Component
 *
 * Creates a VPC with public and private subnets across multiple availability zones,
 * NAT gateways for private subnet internet access, and an internet gateway for public access.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Get available AZs
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnets in 2 AZs
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Public',
            ...args.tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create private subnets in 2 AZs
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            Name: `private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Private',
            ...args.tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Add route to internet gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 2; i++) {
      const eip = new aws.ec2.Eip(
        `nat-eip-${i}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            Name: `nat-eip-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways in public subnets
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 2; i++) {
      const natGateway = new aws.ec2.NatGateway(
        `nat-gw-${i}-${args.environmentSuffix}`,
        {
          allocationId: eips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            Name: `nat-gw-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Create private route tables and associate with NAT Gateways
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `private-rt-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `private-route-${i}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.internetGatewayId = internetGateway.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGatewayId,
    });
  }
}
