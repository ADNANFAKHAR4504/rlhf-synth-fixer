import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  region: string;
  allowedCidr: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly ec2SecurityGroupId: pulumi.Output<string>;
  public readonly rdsSecurityGroupId: pulumi.Output<string>;

  constructor(name: string, args: NetworkStackArgs, opts?: ResourceOptions) {
    super('tap:stack:NetworkStack', name, args, opts);

    const { environmentSuffix, region, allowedCidr, tags } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${region}-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `tap-vpc-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-igw-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create subnets with hardcoded availability zones for now
    const publicSubnet1 = new aws.ec2.Subnet(
      `tap-public-subnet-0-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${region}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `tap-public-subnet-0-${region}-${environmentSuffix}`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `tap-public-subnet-1-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${region}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `tap-public-subnet-1-${region}-${environmentSuffix}`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    const privateSubnet1 = new aws.ec2.Subnet(
      `tap-private-subnet-0-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: `${region}a`,
        tags: {
          ...tags,
          Name: `tap-private-subnet-0-${region}-${environmentSuffix}`,
          Type: 'Private',
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `tap-private-subnet-1-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: `${region}b`,
        tags: {
          ...tags,
          Name: `tap-private-subnet-1-${region}-${environmentSuffix}`,
          Type: 'Private',
        },
      },
      { parent: this }
    );

    const publicSubnets = [publicSubnet1, publicSubnet2];
    const privateSubnets = [privateSubnet1, privateSubnet2];

    // NAT Gateway (in first public subnet)
    const eip = new aws.ec2.Eip(
      `tap-nat-eip-${region}-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `tap-nat-eip-${region}-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [igw] }
    );

    const natGw = new aws.ec2.NatGateway(
      `tap-nat-gw-${region}-${environmentSuffix}`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          ...tags,
          Name: `tap-nat-gw-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-public-rt-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-public-route-${region}-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `tap-private-rt-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-private-rt-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-private-route-${region}-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      },
      { parent: this }
    );

    // Associate subnets with route tables
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-public-rta-${i}-${region}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-private-rta-${i}-${region}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-alb-sg-${region}-${environmentSuffix}`,
      {
        name: `tap-alb-sg-${region}-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-alb-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `tap-ec2-sg-${region}-${environmentSuffix}`,
      {
        name: `tap-ec2-sg-${region}-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: [allowedCidr],
            description: 'SSH from allowed CIDR',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-ec2-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-rds-sg-${region}-${environmentSuffix}-primary`,
      {
        name: `tap-rds-sg-${region}-${environmentSuffix}-primary`,
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [ec2SecurityGroup.id],
            description: 'MySQL from EC2 instances',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-rds-sg-${region}-${environmentSuffix}-primary`,
        },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.albSecurityGroupId = albSecurityGroup.id;
    this.ec2SecurityGroupId = ec2SecurityGroup.id;
    this.rdsSecurityGroupId = rdsSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albSecurityGroupId: this.albSecurityGroupId,
      ec2SecurityGroupId: this.ec2SecurityGroupId,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
    });
  }
}
