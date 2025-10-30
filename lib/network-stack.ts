import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:network:NetworkStack', name, args, opts);

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...args.tags,
          Name: `${name}-vpc-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-igw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create 2 public subnets for ALB
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `${name}-public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(publicSubnet);
    }

    // Create 2 private subnets for ECS tasks
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            ...args.tags,
            Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(privateSubnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-public-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public route to internet gateway
    new aws.ec2.Route(
      `${name}-public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: this.publicSubnets[i].id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create private route table (no NAT gateway for cost optimization)
    const privateRouteTable = new aws.ec2.RouteTable(
      `${name}-private-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-private-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate private subnets with private route table
    for (let i = 0; i < this.privateSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: this.privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // Security Group for ALB - allows HTTPS inbound
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...args.tags,
          Name: `${name}-alb-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Security Group for ECS tasks - allows traffic from ALB only
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-ecs-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow traffic from ALB on port 3000 (frontend)',
          },
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow traffic from ALB on port 8080 (backend)',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...args.tags,
          Name: `${name}-ecs-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: pulumi
        .output(this.publicSubnets)
        .apply(subnets => subnets.map(s => s.id)),
      privateSubnetIds: pulumi
        .output(this.privateSubnets)
        .apply(subnets => subnets.map(s => s.id)),
    });
  }
}
