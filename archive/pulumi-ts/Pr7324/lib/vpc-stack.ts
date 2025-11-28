/**
 * vpc-stack.ts
 *
 * Defines the VPC infrastructure for multi-region deployment.
 * Creates VPC with public/private subnets across 3 AZs, IGW, NAT Gateways, and route tables.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface VpcStackArgs {
  region: string;
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, args, opts);

    const region = args.region;
    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Determine VPC CIDR block based on region or use provided value
    // Default: primary region (ap-southeast-1) = 10.0.0.0/16, secondary (ap-southeast-2) = 10.1.0.0/16
    const vpcCidr =
      args.vpcCidr ||
      (region === 'ap-southeast-1' ? '10.0.0.0/16' : '10.1.0.0/16');
    const cidrPrefix = vpcCidr.split('.')[1]; // Extract second octet (0 or 1)

    // Get availability zones for the region
    const azs = aws.getAvailabilityZones(
      { state: 'available' },
      { parent: this }
    );

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `${name}-vpc-${envSuffix}-e7`,
          Region: region,
          Purpose: 'multi-region-dr',
        },
      },
      { parent: this }
    );

    this.vpcId = this.vpc.id;

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `${name}-igw-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    // Create public subnets (3 AZs)
    this.publicSubnets = [];
    this.publicSubnetIds = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.${cidrPrefix}.${i}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `${name}-public-subnet-${i}-${envSuffix}-e7`,
            Region: region,
            Type: 'public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
      this.publicSubnetIds.push(subnet.id);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `${name}-public-rt-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    // Route to Internet Gateway
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs and NAT Gateways for each public subnet
    this.natGateways = [];
    this.publicSubnets.forEach((subnet, i) => {
      const eip = new aws.ec2.Eip(
        `${name}-nat-eip-${i}`,
        {
          domain: 'vpc',
          tags: {
            ...tags,
            Name: `${name}-nat-eip-${i}-${envSuffix}-e7`,
            Region: region,
          },
        },
        { parent: this, dependsOn: [this.internetGateway] }
      );

      const natGw = new aws.ec2.NatGateway(
        `${name}-nat-gw-${i}`,
        {
          subnetId: subnet.id,
          allocationId: eip.id,
          tags: {
            ...tags,
            Name: `${name}-nat-gw-${i}-${envSuffix}-e7`,
            Region: region,
          },
        },
        { parent: this, dependsOn: [this.internetGateway, eip] }
      );
      this.natGateways.push(natGw);
    });

    // Create private subnets (3 AZs)
    this.privateSubnets = [];
    this.privateSubnetIds = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.${cidrPrefix}.${10 + i}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          tags: {
            ...tags,
            Name: `${name}-private-subnet-${i}-${envSuffix}-e7`,
            Region: region,
            Type: 'private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
      this.privateSubnetIds.push(subnet.id);

      // Create private route table for this subnet
      const privateRouteTable = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `${name}-private-rt-${i}-${envSuffix}-e7`,
            Region: region,
          },
        },
        { parent: this }
      );

      // Route to NAT Gateway
      new aws.ec2.Route(
        `${name}-private-route-${i}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[i].id,
        },
        { parent: this }
      );

      // Associate private subnet with private route table
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create security group for Lambda and Aurora
    this.securityGroup = new aws.ec2.SecurityGroup(
      `${name}-sg`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for Lambda and Aurora access',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [vpcCidr],
            description: 'PostgreSQL access within VPC',
          },
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            self: true,
            description: 'Allow all traffic within security group',
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
          ...tags,
          Name: `${name}-sg-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      securityGroupId: this.securityGroup.id,
    });
  }
}
