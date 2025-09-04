/**
 * vpc-stack.ts
 *
 * This module defines the VpcStack component for creating a secure VPC
 * with public subnet for the EC2 infrastructure.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export interface VpcStackOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetId: pulumi.Output<string>;
  internetGatewayId: pulumi.Output<string>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetId: pulumi.Output<string>;
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
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

    // Create public subnet
    const publicSubnet = new aws.ec2.Subnet(
      `tap-public-subnet-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `tap-public-subnet-${environmentSuffix}`,
          Type: 'public',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create route table for public subnet
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

    // Create route to internet gateway
    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate route table with public subnet
    new aws.ec2.RouteTableAssociation(
      `tap-public-rta-${environmentSuffix}`,
      {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.publicSubnetId = publicSubnet.id;
    this.internetGatewayId = internetGateway.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetId: this.publicSubnetId,
      internetGatewayId: this.internetGatewayId,
    });
  }
}
