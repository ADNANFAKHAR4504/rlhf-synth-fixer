import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BaseInfrastructureArgs {
  environmentSuffix: string;
  environment: string;
  vpcCidr: string;
  availabilityZones: string[];
}

export class BaseInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly databaseSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsCluster: aws.ecs.Cluster;

  constructor(
    name: string,
    args: BaseInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:BaseInfrastructure', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create public subnets
    this.publicSubnets = [];
    this.publicSubnetIds = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.vpcCidr.split('.')[0]}.${args.vpcCidr.split('.')[1]}.${index * 16}.0/20`,
          availabilityZone: pulumi.interpolate`${aws.getRegionOutput().name}${az}`,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${az}-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
            Type: 'public',
          },
        },
        defaultResourceOptions
      );
      this.publicSubnets.push(subnet);
      this.publicSubnetIds.push(subnet.id);
    });

    // Create NAT Gateway (only 1 for cost optimization)
    const eip = new aws.ec2.Eip(
      `nat-eip-${args.environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.natGateway = new aws.ec2.NatGateway(
      `nat-${args.environmentSuffix}`,
      {
        allocationId: eip.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          Name: `nat-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create private subnets
    this.privateSubnets = [];
    this.privateSubnetIds = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.vpcCidr.split('.')[0]}.${args.vpcCidr.split('.')[1]}.${128 + index * 16}.0/20`,
          availabilityZone: pulumi.interpolate`${aws.getRegionOutput().name}${az}`,
          tags: {
            Name: `private-subnet-${az}-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
            Type: 'private',
          },
        },
        defaultResourceOptions
      );
      this.privateSubnets.push(subnet);
      this.privateSubnetIds.push(subnet.id);
    });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `public-rt-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      defaultResourceOptions
    );

    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        defaultResourceOptions
      );
    });

    // Create route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-rt-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    new aws.ec2.Route(
      `private-route-${args.environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      defaultResourceOptions
    );

    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        defaultResourceOptions
      );
    });

    // Create security group for ECS tasks
    this.securityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for ECS tasks',
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
          Name: `ecs-sg-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create security group for RDS
    this.databaseSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for RDS Aurora',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [this.securityGroup.id],
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
          Name: `rds-sg-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create ECS cluster
    this.ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `ecs-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `ecs-cluster-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      ecsClusterArn: this.ecsCluster.arn,
    });
  }
}
