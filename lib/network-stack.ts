import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];

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
      `${name}-vpc`,
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
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-igw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}`,
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

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}`,
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

    // Create single Elastic IP for NAT Gateway (to avoid EIP limit)
    const eip = new aws.ec2.Eip(
      `${name}-nat-eip`,
      {
        domain: 'vpc',
        tags: {
          ...args.tags,
          Name: `${name}-nat-eip-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create single NAT Gateway (cost optimization, avoid EIP limit)
    const natGateway = new aws.ec2.NatGateway(
      `${name}-nat-gw`,
      {
        allocationId: eip.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          ...args.tags,
          Name: `${name}-nat-gw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );
    this.natGateways = [natGateway];

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${name}-public-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public route
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: this.publicSubnets[i].id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create private route tables
    this.privateRouteTables = [];
    for (let i = 0; i < 2; i++) {
      const privateRouteTable = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...args.tags,
            Name: `${name}-private-rt-${i}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Create private route (all use the single NAT gateway)
      new aws.ec2.Route(
        `${name}-private-route-${i}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { parent: this }
      );

      // Associate private subnet with private route table
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}`,
        {
          subnetId: this.privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );

      this.privateRouteTables.push(privateRouteTable);
    }

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
    });
  }
}
