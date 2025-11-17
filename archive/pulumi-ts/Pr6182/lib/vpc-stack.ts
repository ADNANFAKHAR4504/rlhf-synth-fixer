/**
 * VPC Stack - Creates VPC, subnets, internet gateway, NAT gateways, and route tables
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, VpcOutputs } from './types';

export interface VpcStackArgs {
  config: EnvironmentConfig;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly outputs: VpcOutputs;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, {}, opts);

    const { config } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `${config.environment}-vpc-${config.environmentSuffix}`,
      {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...config.tags,
          Name: `${config.environment}-vpc-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `${config.environment}-igw-${config.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.environment}-igw-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets (2 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    config.availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `${config.environment}-public-subnet-${index + 1}-${config.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `${config.vpcCidr.split('.')[0]}.${config.vpcCidr.split('.')[1]}.${index * 2}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...config.tags,
            Name: `${config.environment}-public-subnet-${index + 1}-${config.environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `${config.environment}-private-subnet-${index + 1}-${config.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `${config.vpcCidr.split('.')[0]}.${config.vpcCidr.split('.')[1]}.${index * 2 + 1}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...config.tags,
            Name: `${config.environment}-private-subnet-${index + 1}-${config.environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    });

    // Create Elastic IPs for NAT Gateways
    const natEips: aws.ec2.Eip[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    publicSubnets.forEach((subnet, index) => {
      const eip = new aws.ec2.Eip(
        `${config.environment}-nat-eip-${index + 1}-${config.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...config.tags,
            Name: `${config.environment}-nat-eip-${index + 1}-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natEips.push(eip);

      const natGw = new aws.ec2.NatGateway(
        `${config.environment}-nat-gateway-${index + 1}-${config.environmentSuffix}`,
        {
          subnetId: subnet.id,
          allocationId: eip.id,
          tags: {
            ...config.tags,
            Name: `${config.environment}-nat-gateway-${index + 1}-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natGateways.push(natGw);
    });

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${config.environment}-public-rt-${config.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.environment}-public-rt-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `${config.environment}-public-route-${config.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${config.environment}-public-rta-${index + 1}-${config.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables (one per AZ) and associate with NAT Gateways
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `${config.environment}-private-rt-${index + 1}-${config.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...config.tags,
            Name: `${config.environment}-private-rt-${index + 1}-${config.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `${config.environment}-private-route-${index + 1}-${config.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[index].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `${config.environment}-private-rta-${index + 1}-${config.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map(s => s.id),
      privateSubnetIds: privateSubnets.map(s => s.id),
      natGatewayIds: natGateways.map(ng => ng.id),
    };

    this.registerOutputs({
      vpcId: this.outputs.vpcId,
      publicSubnetIds: this.outputs.publicSubnetIds,
      privateSubnetIds: this.outputs.privateSubnetIds,
      natGatewayIds: this.outputs.natGatewayIds,
    });
  }
}
