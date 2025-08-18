// lib/components/networking.ts

/**
 * Network Infrastructure Component
 * Creates VPC, subnets, security groups, NAT gateways, and VPC endpoints
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkInfrastructureArgs {
  environment: string;
  tags: { [key: string]: string };
}

export class NetworkInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly igw: aws.ec2.InternetGateway;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly natEips: aws.ec2.Eip[];
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly lambdaSecurityGroup: aws.ec2.SecurityGroup;
  public readonly vpcEndpointSecurityGroup: aws.ec2.SecurityGroup;
  public readonly dynamodbEndpoint: aws.ec2.VpcEndpoint;
  public readonly s3Endpoint: aws.ec2.VpcEndpoint;
  public readonly kinesisEndpoint: aws.ec2.VpcEndpoint;

  constructor(
    name: string,
    args: NetworkInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:Infrastructure', name, {}, opts);

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...args.tags, Name: `${name}-vpc` },
      },
      { parent: this }
    );

    // Internet Gateway
    this.igw = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: { ...args.tags, Name: `${name}-igw` },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({ state: 'available' });
    console.log(
      `DEBUG: get_availability_zones returned: ${azs.then(zones => zones.names)}`
    );

    // Public Subnets
    this.publicSubnets = [];
    this.publicSubnetIds = [];

    for (let i = 0; i < 2; i++) {
      const azName = azs.then(zones => zones.names[i]);

      const subnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azName,
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `${name}-public-subnet-${i + 1}`,
            Type: 'Public',
          },
        },
        { parent: this }
      );

      this.publicSubnets.push(subnet);
      this.publicSubnetIds.push(subnet.id);
    }

    // Private Subnets
    this.privateSubnets = [];
    this.privateSubnetIds = [];

    for (let i = 0; i < 2; i++) {
      const azName = azs.then(zones => zones.names[i]);

      const subnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azName,
          tags: {
            ...args.tags,
            Name: `${name}-private-subnet-${i + 1}`,
            Type: 'Private',
          },
        },
        { parent: this }
      );

      this.privateSubnets.push(subnet);
      this.privateSubnetIds.push(subnet.id);
    }

    // NAT Gateway EIPs
    this.natEips = [];
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const eip = new aws.ec2.Eip(
        `${name}-nat-eip-${i + 1}`,
        {
          domain: 'vpc',
          tags: { ...args.tags, Name: `${name}-nat-eip-${i + 1}` },
        },
        {
          parent: this,
          dependsOn: [this.igw],
        }
      );
      this.natEips.push(eip);
    }

    // NAT Gateways
    this.natGateways = [];
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const nat = new aws.ec2.NatGateway(
        `${name}-nat-${i + 1}`,
        {
          allocationId: this.natEips[i].id,
          subnetId: this.publicSubnets[i].id,
          tags: { ...args.tags, Name: `${name}-nat-${i + 1}` },
        },
        { parent: this }
      );
      this.natGateways.push(nat);
    }

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: { ...args.tags, Name: `${name}-public-rt` },
      },
      { parent: this }
    );

    // Public Route
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.igw.id,
      },
      { parent: this }
    );

    // Public Route Table Associations
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i + 1}`,
        {
          subnetId: this.publicSubnets[i].id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Private Route Tables
    this.privateRouteTables = [];
    for (let i = 0; i < this.privateSubnets.length; i++) {
      const rt = new aws.ec2.RouteTable(
        `${name}-private-rt-${i + 1}`,
        {
          vpcId: this.vpc.id,
          tags: { ...args.tags, Name: `${name}-private-rt-${i + 1}` },
        },
        { parent: this }
      );

      // Private Route
      new aws.ec2.Route(
        `${name}-private-route-${i + 1}`,
        {
          routeTableId: rt.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[i].id,
        },
        { parent: this }
      );

      // Private Route Table Association
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i + 1}`,
        {
          subnetId: this.privateSubnets[i].id,
          routeTableId: rt.id,
        },
        { parent: this }
      );

      this.privateRouteTables.push(rt);
    }

    // Lambda Security Group
    this.lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-lambda-sg`,
      {
        name: `${name}-lambda-sg`,
        description: 'Security group for Lambda functions',
        vpcId: this.vpc.id,
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP outbound',
          },
        ],
        tags: { ...args.tags, Name: `${name}-lambda-sg` },
      },
      { parent: this }
    );

    // VPC Endpoint Security Group
    this.vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-vpc-endpoint-sg`,
      {
        name: `${name}-vpc-endpoint-sg`,
        description: 'Security group for VPC endpoints',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            securityGroups: [this.lambdaSecurityGroup.id],
            description: 'HTTPS from Lambda',
          },
        ],
        tags: { ...args.tags, Name: `${name}-vpc-endpoint-sg` },
      },
      { parent: this }
    );

    // Create VPC Endpoints and assign to readonly properties
    const vpcEndpoints = this.createVpcEndpoints(name, args.tags);

    // Use Object.defineProperty to assign to readonly properties
    Object.defineProperty(this, 'dynamodbEndpoint', {
      value: vpcEndpoints.dynamodbEndpoint,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 's3Endpoint', {
      value: vpcEndpoints.s3Endpoint,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 'kinesisEndpoint', {
      value: vpcEndpoints.kinesisEndpoint,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      lambdaSecurityGroupId: this.lambdaSecurityGroup.id,
      vpcEndpointSecurityGroupId: this.vpcEndpointSecurityGroup.id,
    });
  }

  /**
   * Create VPC endpoints for AWS services
   */
  private createVpcEndpoints(
    name: string,
    tags: { [key: string]: string }
  ): {
    dynamodbEndpoint: aws.ec2.VpcEndpoint;
    s3Endpoint: aws.ec2.VpcEndpoint;
    kinesisEndpoint: aws.ec2.VpcEndpoint;
  } {
    const region = aws.getRegion();

    // DynamoDB VPC Endpoint (Gateway)
    const dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `${name}-dynamodb-endpoint`,
      {
        vpcId: this.vpc.id,
        serviceName: region.then(r => `com.amazonaws.${r.name}.dynamodb`),
        vpcEndpointType: 'Gateway',
        routeTableIds: this.privateRouteTables.map(rt => rt.id),
        tags: { ...tags, Name: `${name}-dynamodb-endpoint` },
      },
      { parent: this }
    );

    // S3 VPC Endpoint (Gateway)
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `${name}-s3-endpoint`,
      {
        vpcId: this.vpc.id,
        serviceName: region.then(r => `com.amazonaws.${r.name}.s3`),
        vpcEndpointType: 'Gateway',
        routeTableIds: this.privateRouteTables.map(rt => rt.id),
        tags: { ...tags, Name: `${name}-s3-endpoint` },
      },
      { parent: this }
    );

    // Kinesis VPC Endpoint (Interface)
    const kinesisEndpoint = new aws.ec2.VpcEndpoint(
      `${name}-kinesis-endpoint`,
      {
        vpcId: this.vpc.id,
        serviceName: region.then(
          r => `com.amazonaws.${r.name}.kinesis-streams`
        ),
        vpcEndpointType: 'Interface',
        subnetIds: this.privateSubnetIds,
        securityGroupIds: [this.vpcEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `${name}-kinesis-endpoint` },
      },
      { parent: this }
    );

    return {
      dynamodbEndpoint,
      s3Endpoint,
      kinesisEndpoint,
    };
  }
}
