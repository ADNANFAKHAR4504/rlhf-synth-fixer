import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface VpcComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
}

/**
 * VPC Component for environment-isolated networking
 */
export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTable: aws.ec2.RouteTable;
  public readonly vpcEndpointS3: aws.ec2.VpcEndpoint;
  public readonly vpcEndpointDynamoDB: aws.ec2.VpcEndpoint;

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcComponent', name, {}, opts);

    const { config, tags, environmentSuffix } = args;

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({ state: 'available' });

    // Create public subnets (3 AZs)
    this.publicSubnets = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: pulumi.interpolate`${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${i}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets (3 AZs)
    this.privateSubnets = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: pulumi.interpolate`${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${i + 10}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          tags: {
            ...tags,
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    }

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.internetGateway.id,
          },
        ],
        tags: {
          ...tags,
          Name: `public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route table (no NAT Gateway for cost optimization)
    this.privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `private-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create VPC Endpoint for S3 (gateway endpoint - free)
    this.vpcEndpointS3 = new aws.ec2.VpcEndpoint(
      `vpce-s3-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${aws.config.region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [this.publicRouteTable.id, this.privateRouteTable.id],
        tags: {
          ...tags,
          Name: `vpce-s3-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create VPC Endpoint for DynamoDB (gateway endpoint - free)
    this.vpcEndpointDynamoDB = new aws.ec2.VpcEndpoint(
      `vpce-dynamodb-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${aws.config.region}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [this.publicRouteTable.id, this.privateRouteTable.id],
        tags: {
          ...tags,
          Name: `vpce-dynamodb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
    });
  }
}
