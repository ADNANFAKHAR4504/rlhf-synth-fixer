/**
 * vpc-stack.ts
 *
 * This module defines the VpcStack component for creating a secure VPC
 * with both public and private subnets, NAT gateways, and proper routing.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';
    const tags = args.tags || {};

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `tap-vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `tap-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create subnets in multiple AZs
    const privateSubnets: aws.ec2.Subnet[] = [];
    const publicSubnets: aws.ec2.Subnet[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    availabilityZones.then(azs => {
      const azCount = Math.min(azs.names.length, 3); // Use up to 3 AZs

      for (let i = 0; i < azCount; i++) {
        const az = azs.names[i];

        // Public subnet
        const publicSubnet = new aws.ec2.Subnet(
          `tap-public-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i * 2 + 1}.0/24`,
            availabilityZone: az,
            mapPublicIpOnLaunch: false, // Explicitly disable auto-assign public IP
            tags: {
              Name: `tap-public-subnet-${i}-${environmentSuffix}`,
              Type: 'public',
              ...tags,
            },
          },
          { parent: this }
        );

        publicSubnets.push(publicSubnet);

        // Private subnet
        const privateSubnet = new aws.ec2.Subnet(
          `tap-private-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i * 2 + 2}.0/24`,
            availabilityZone: az,
            tags: {
              Name: `tap-private-subnet-${i}-${environmentSuffix}`,
              Type: 'private',
              ...tags,
            },
          },
          { parent: this }
        );

        privateSubnets.push(privateSubnet);

        // Elastic IP for NAT Gateway
        const eip = new aws.ec2.Eip(
          `tap-nat-eip-${i}-${environmentSuffix}`,
          {
            domain: 'vpc',
            tags: {
              Name: `tap-nat-eip-${i}-${environmentSuffix}`,
              ...tags,
            },
          },
          { parent: this }
        );

        // NAT Gateway
        const natGateway = new aws.ec2.NatGateway(
          `tap-nat-${i}-${environmentSuffix}`,
          {
            allocationId: eip.id,
            subnetId: publicSubnet.id,
            tags: {
              Name: `tap-nat-${i}-${environmentSuffix}`,
              ...tags,
            },
          },
          { parent: this }
        );

        natGateways.push(natGateway);

        // Private route table
        const privateRouteTable = new aws.ec2.RouteTable(
          `tap-private-rt-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            tags: {
              Name: `tap-private-rt-${i}-${environmentSuffix}`,
              ...tags,
            },
          },
          { parent: this }
        );

        new aws.ec2.Route(
          `tap-private-route-${i}-${environmentSuffix}`,
          {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
          { parent: this }
        );

        new aws.ec2.RouteTableAssociation(
          `tap-private-rta-${i}-${environmentSuffix}`,
          {
            subnetId: privateSubnet.id,
            routeTableId: privateRouteTable.id,
          },
          { parent: this }
        );
      }
    });

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `tap-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
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
        `tap-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = vpc.id;
    this.privateSubnetIds = privateSubnets.map(s => s.id);
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.internetGatewayId = internetGateway.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      internetGatewayId: this.internetGatewayId,
    });
  }
}
