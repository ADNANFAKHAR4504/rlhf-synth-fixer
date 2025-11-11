import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly databaseSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetCidrs: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-igw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Public Subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: pulumi
            .output(availabilityZones)
            .apply(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Public',
          })),
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Private Subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: pulumi
            .output(availabilityZones)
            .apply(azs => azs.names[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Private',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Database Subnets (3 AZs)
    const databaseSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-database-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${20 + i}.0/24`,
          availabilityZone: pulumi
            .output(availabilityZones)
            .apply(azs => azs.names[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-database-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Database',
          })),
        },
        { parent: this }
      );
      databaseSubnets.push(subnet);
    }

    // Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-eip-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // NAT Gateways (one per AZ for high availability)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(
        `payment-nat-${i + 1}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      natGateways.push(nat);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private Route Tables (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Database Route Tables (isolated, no internet access)
    databaseSubnets.forEach((subnet, i) => {
      const dbRouteTable = new aws.ec2.RouteTable(
        `payment-db-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-db-rt-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-db-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: dbRouteTable.id,
        },
        { parent: this }
      );
    });

    // Outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.databaseSubnetIds = pulumi.output(databaseSubnets.map(s => s.id));
    this.privateSubnetCidrs = pulumi
      .all(privateSubnets.map(s => s.cidrBlock))
      .apply(cidrs =>
        cidrs.filter((cidr): cidr is string => cidr !== undefined)
      );

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
    });
  }
}
