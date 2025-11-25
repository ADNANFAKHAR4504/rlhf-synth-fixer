import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcComponentArgs {
  vpcCidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcComponent', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...args.tags,
          Name: `vpc-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.vpcId = this.vpc.id;

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `igw-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Calculate subnet CIDRs based on the actual VPC CIDR block
    // Parse VPC CIDR to extract base network (needed for both public and private subnets)
    const vpcCidrParts = args.vpcCidr.split('/');
    const vpcBase = vpcCidrParts[0].split('.');
    const vpcPrefix = parseInt(vpcCidrParts[1]);

    // Calculate subnet size (assuming /24 subnets)
    const subnetSize = 24;

    // Public Subnets
    // Start from offset 50 to avoid conflicts with existing subnets
    // This provides a large buffer zone for commonly used lower CIDR ranges
    const publicSubnetOffset = 50;

    this.publicSubnets = args.availabilityZones.map((az, index) => {
      // Calculate subnet CIDR based on VPC CIDR
      // For /16 VPC: 10.0.0.0/16 -> subnets: 10.0.50.0/24, 10.0.51.0/24, etc.
      // Start from offset 50 to avoid conflicts with existing subnets
      let cidrBlock: string;
      if (vpcPrefix <= 16) {
        // VPC is /16 or larger, use third octet for subnet numbering
        // Start from offset 50 to avoid conflicts with existing subnets
        const thirdOctet = publicSubnetOffset + index;
        cidrBlock = `${vpcBase[0]}.${vpcBase[1]}.${thirdOctet}.0/${subnetSize}`;
      } else {
        // VPC is smaller than /16, need more complex calculation
        // For simplicity, use index in fourth octet
        const fourthOctet = (publicSubnetOffset + index) * 64; // Space subnets by 64 addresses
        cidrBlock = `${vpcBase[0]}.${vpcBase[1]}.${vpcBase[2]}.${fourthOctet}/${subnetSize}`;
      }

      return new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidrBlock,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...args.tags,
            Name: `public-subnet-${index}-${args.environmentSuffix}`,
            Type: 'public',
          },
        },
        defaultResourceOptions
      );
    });

    this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.id);

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `public-rt-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Public Route to Internet
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      defaultResourceOptions
    );

    // Associate Public Subnets with Public Route Table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        defaultResourceOptions
      );
    });

    // Private Subnets
    // Calculate subnet CIDRs based on the actual VPC CIDR block
    // Offset private subnets to avoid overlap with public subnets
    // Private subnets start at offset 100 (public subnets use 50-99)
    const privateSubnetOffset = 100;

    this.privateSubnets = args.availabilityZones.map((az, index) => {
      // Calculate subnet CIDR based on VPC CIDR
      // Private subnets start at offset 100 to avoid overlap with public subnets (50-99)
      let cidrBlock: string;
      if (vpcPrefix <= 16) {
        // VPC is /16 or larger, use third octet for subnet numbering
        // Private subnets start at offset 100 (e.g., 10.0.100.0/24, 10.0.101.0/24)
        const thirdOctet = privateSubnetOffset + index;
        cidrBlock = `${vpcBase[0]}.${vpcBase[1]}.${thirdOctet}.0/${subnetSize}`;
      } else {
        // VPC is smaller than /16, need more complex calculation
        // For simplicity, use index in fourth octet with offset
        const fourthOctet = (privateSubnetOffset + index) * 64; // Space subnets by 64 addresses
        cidrBlock = `${vpcBase[0]}.${vpcBase[1]}.${vpcBase[2]}.${fourthOctet}/${subnetSize}`;
      }

      return new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidrBlock,
          availabilityZone: az,
          tags: {
            ...args.tags,
            Name: `private-subnet-${index}-${args.environmentSuffix}`,
            Type: 'private',
          },
        },
        defaultResourceOptions
      );
    });

    this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.id);

    // Private Route Tables (one per AZ for potential NAT Gateway flexibility)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `private-rt-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...args.tags,
            Name: `private-rt-${index}-${args.environmentSuffix}`,
          },
        },
        defaultResourceOptions
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: this.privateSubnets[index].id,
          routeTableId: routeTable.id,
        },
        defaultResourceOptions
      );

      return routeTable;
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
