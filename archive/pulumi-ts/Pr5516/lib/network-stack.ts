import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  region: string;
  availabilityZones: string[];
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
    super('tap:network:NetworkStack', name, args, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `vpc-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `igw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets (one per AZ)
    this.publicSubnets = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `public-subnet-${az}-${args.environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
    });

    // Create private subnets (one per AZ)
    this.privateSubnets = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index + 10}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `private-subnet-${az}-${args.environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
    });

    // Allocate Elastic IPs for NAT Gateways
    const eips = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Eip(
        `nat-eip-${index}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `nat-eip-${az}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create NAT Gateways (one per AZ for high availability)
    this.natGateways = args.availabilityZones.map((az, index) => {
      return new aws.ec2.NatGateway(
        `nat-${index}-${args.environmentSuffix}`,
        {
          allocationId: eips[index].id,
          subnetId: this.publicSubnets[index].id,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `nat-${az}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [this.internetGateway] }
      );
    });

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `public-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables (one per AZ)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `private-rt-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `private-rt-${az}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Add route to NAT Gateway
      new aws.ec2.Route(
        `private-route-${index}-${args.environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index].id,
        },
        { parent: this }
      );

      // Associate private subnet with its route table
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: this.privateSubnets[index].id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );

      return routeTable;
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
    });
  }
}
