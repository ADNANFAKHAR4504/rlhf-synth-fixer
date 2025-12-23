import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcComponentArgs {
  cidr: string;
  availabilityZoneCount: number;
  environment: string;
  tags: { [key: string]: string };
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly vpcCidr: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly vpc: aws.ec2.Vpc;
  public readonly internetGateway: aws.ec2.InternetGateway;

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:VpcComponent', name, {}, opts);

    const resourceOpts = { parent: this };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${args.environment}-payment-vpc`,
      {
        cidrBlock: args.cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-vpc`,
        },
      },
      resourceOpts
    );

    this.vpcId = this.vpc.id;
    this.vpcCidr = this.vpc.cidrBlock;

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${args.environment}-payment-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-igw`,
        },
      },
      resourceOpts
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create public and private subnets in each AZ
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];

    for (let i = 0; i < args.availabilityZoneCount; i++) {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `${args.environment}-payment-public-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: this.calculateSubnetCidr(args.cidr, i * 2),
          availabilityZone: azs.names[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `${args.environment}-payment-public-${i}`,
            Type: 'public',
          },
        },
        resourceOpts
      );

      this.publicSubnetIds.push(publicSubnet.id);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `${args.environment}-payment-private-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: this.calculateSubnetCidr(args.cidr, i * 2 + 1),
          availabilityZone: azs.names[i],
          tags: {
            ...args.tags,
            Name: `${args.environment}-payment-private-${i}`,
            Type: 'private',
          },
        },
        resourceOpts
      );

      this.privateSubnetIds.push(privateSubnet.id);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${args.environment}-payment-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-public-rt`,
        },
      },
      resourceOpts
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `${args.environment}-payment-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      resourceOpts
    );

    // Associate public subnets with public route table
    this.publicSubnetIds.forEach((subnetId, i) => {
      new aws.ec2.RouteTableAssociation(
        `${args.environment}-payment-public-rta-${i}`,
        {
          subnetId: subnetId,
          routeTableId: publicRouteTable.id,
        },
        resourceOpts
      );
    });

    // Create private route table (no NAT Gateway for cost optimization)
    const privateRouteTable = new aws.ec2.RouteTable(
      `${args.environment}-payment-private-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-private-rt`,
        },
      },
      resourceOpts
    );

    // Associate private subnets with private route table
    this.privateSubnetIds.forEach((subnetId, i) => {
      new aws.ec2.RouteTableAssociation(
        `${args.environment}-payment-private-rta-${i}`,
        {
          subnetId: subnetId,
          routeTableId: privateRouteTable.id,
        },
        resourceOpts
      );
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      vpcCidr: this.vpcCidr,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }

  private calculateSubnetCidr(vpcCidr: string, index: number): string {
    const parts = vpcCidr.split('/');
    const baseIp = parts[0].split('.');
    const newThirdOctet = parseInt(baseIp[2]) + index;
    return `${baseIp[0]}.${baseIp[1]}.${newThirdOctet}.0/24`;
  }
}
