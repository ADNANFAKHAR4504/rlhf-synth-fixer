/**
 * VPC Stack - Creates networking infrastructure with public subnets
 * for the SecureApp project with proper security group configuration.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class VPCStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:VPCStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `SecureApp-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `SecureApp-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `SecureApp-igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `SecureApp-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets in different AZs
    this.publicSubnet1 = new aws.ec2.Subnet(
      `SecureApp-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `SecureApp-public-subnet-1-${environmentSuffix}`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    this.publicSubnet2 = new aws.ec2.Subnet(
      `SecureApp-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `SecureApp-public-subnet-2-${environmentSuffix}`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `SecureApp-public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `SecureApp-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to internet gateway
    new aws.ec2.Route(
      `SecureApp-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate route table with public subnets
    new aws.ec2.RouteTableAssociation(
      `SecureApp-public-rta-1-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        subnetId: this.publicSubnet1.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `SecureApp-public-rta-2-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        subnetId: this.publicSubnet2.id,
      },
      { parent: this }
    );

    // Create security group for web access
    this.webSecurityGroup = new aws.ec2.SecurityGroup(
      `SecureApp-web-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for web servers',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `SecureApp-web-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export values
    this.vpcId = this.vpc.id;
    this.publicSubnetIds = [this.publicSubnet1.id, this.publicSubnet2.id];
    this.defaultSecurityGroupId = this.vpc.defaultSecurityGroupId;
    this.webSecurityGroupId = this.webSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      webSecurityGroupId: this.webSecurityGroupId,
    });
  }
}
