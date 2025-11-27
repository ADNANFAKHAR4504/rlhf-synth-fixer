import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { NetworkConfig } from './types';

export class NetworkingComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: NetworkConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:networking:NetworkingComponent', name, {}, opts);

    const tags = {
      Name: `${name}-${args.region}-${args.environmentSuffix}`,
      Environment: args.environmentSuffix,
      Region: args.region,
    };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${args.region}-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: `igw-${args.region}-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.cidr.split('.').slice(0, 2).join('.')}.${i}.0/24`,
          availabilityZone: args.availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `public-subnet-${i}-${args.region}-${args.environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.cidr.split('.').slice(0, 2).join('.')}.${i + 10}.0/24`,
          availabilityZone: args.availabilityZones[i],
          mapPublicIpOnLaunch: false,
          tags: {
            ...tags,
            Name: `private-subnet-${i}-${args.region}-${args.environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const eip = new aws.ec2.Eip(
        `${name}-eip-${i}`,
        {
          domain: 'vpc',
          tags: {
            ...tags,
            Name: `eip-${i}-${args.region}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways
    this.natGateways = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const nat = new aws.ec2.NatGateway(
        `${name}-nat-${i}`,
        {
          allocationId: eips[i].id,
          subnetId: this.publicSubnets[i].id,
          tags: {
            ...tags,
            Name: `nat-${i}-${args.region}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [this.internetGateway] }
      );
      this.natGateways.push(nat);
    }

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `public-rt-${args.region}-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Add VPC Peering Route to Public Route Table (if provided)
    if (args.peeringConnectionId && args.peerCidr) {
      new aws.ec2.Route(
        `${name}-public-peer-route`,
        {
          routeTableId: this.publicRouteTable.id,
          destinationCidrBlock: args.peerCidr,
          vpcPeeringConnectionId: args.peeringConnectionId,
        },
        { parent: this }
      );
    }

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables (one per AZ)
    this.privateRouteTables = [];
    this.privateSubnets.forEach((subnet, i) => {
      const rt = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `private-rt-${i}-${args.region}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `${name}-private-route-${i}`,
        {
          routeTableId: rt.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[i].id,
        },
        { parent: this }
      );

      // Add VPC Peering Route to Private Route Table (if provided)
      if (args.peeringConnectionId && args.peerCidr) {
        new aws.ec2.Route(
          `${name}-private-peer-route-${i}`,
          {
            routeTableId: rt.id,
            destinationCidrBlock: args.peerCidr,
            vpcPeeringConnectionId: args.peeringConnectionId,
          },
          { parent: this }
        );
      }

      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: rt.id,
        },
        { parent: this }
      );

      this.privateRouteTables.push(rt);
    });

    // Create Security Group
    this.securityGroup = new aws.ec2.SecurityGroup(
      `${name}-sg`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for application resources',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [args.cidr],
            description: 'Allow PostgreSQL within VPC',
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
        tags: { ...tags, Name: `sg-${args.region}-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      securityGroupId: this.securityGroup.id,
    });
  }
}
