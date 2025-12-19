import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly availabilityZones: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const vpcCidr = args.vpcCidr || '10.0.0.0/16';

    // Get availability zones
    const availableAzs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-igw-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create public subnets (2 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < 2; i++) {
      const az = pulumi.output(availableAzs).apply(azs => azs.names[i]);

      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'public',
          })),
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);

      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-eip-${i}-${args.environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      // NAT Gateway
      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i}-${args.environmentSuffix}`,
        {
          subnetId: publicSubnet.id,
          allocationId: eip.id,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-${i}-${args.environmentSuffix}`,
          })),
        },
        { parent: this, dependsOn: [igw] }
      );
      natGateways.push(natGateway);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: az,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'private',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-rt-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `payment-public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private route tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-rt-${i}-${args.environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.availabilityZones = pulumi
      .output(availableAzs)
      .apply(azs => azs.names.slice(0, 2));

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      availabilityZones: this.availabilityZones,
    });
  }
}
