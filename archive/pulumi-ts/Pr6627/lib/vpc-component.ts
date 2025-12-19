import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * Arguments for the VpcComponent.
 */
export interface VpcComponentArgs {
  /**
   * The CIDR block for the VPC.
   */
  vpcCidr: string;

  /**
   * List of availability zones to use for subnets.
   */
  availabilityZones: string[];

  /**
   * Environment suffix for resource naming.
   */
  environmentSuffix: string;

  /**
   * Tags to apply to all resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * A reusable Pulumi ComponentResource that creates a VPC with public and private subnets
 * across multiple availability zones.
 *
 * This component creates:
 * - A VPC with the specified CIDR block
 * - Public subnets in each AZ
 * - Private subnets in each AZ
 * - An Internet Gateway for public subnet access
 * - Route tables for public subnets
 *
 * Note: NAT Gateways are NOT created to reduce costs for synthetic tasks.
 * Use VPC Endpoints for S3/DynamoDB access from private subnets instead.
 */
export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcComponent', name, {}, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          Name: `vpc-${args.environmentSuffix}`,
          ...tags,
        })),
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          Name: `igw-${args.environmentSuffix}`,
          ...tags,
        })),
      },
      { parent: this }
    );

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          Name: `public-rt-${args.environmentSuffix}`,
          ...tags,
        })),
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

    // Calculate subnet CIDR blocks
    const subnetCidrBlocks = this.calculateSubnetCidrs(
      args.vpcCidr,
      args.availabilityZones.length
    );

    // Create public and private subnets in each AZ
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];

    args.availabilityZones.forEach((az, index) => {
      // Create public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${args.environmentSuffix}-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrBlocks.publicSubnets[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([args.tags]).apply(([tags]) => ({
            Name: `public-subnet-${args.environmentSuffix}-${az}`,
            Type: 'Public',
            ...tags,
          })),
        },
        { parent: this }
      );

      // Associate public subnet with public route table
      new aws.ec2.RouteTableAssociation(
        `public-rta-${args.environmentSuffix}-${index}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );

      this.publicSubnets.push(publicSubnet);
      this.publicSubnetIds.push(publicSubnet.id);

      // Create private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${args.environmentSuffix}-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrBlocks.privateSubnets[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: pulumi.all([args.tags]).apply(([tags]) => ({
            Name: `private-subnet-${args.environmentSuffix}-${az}`,
            Type: 'Private',
            ...tags,
          })),
        },
        { parent: this }
      );

      this.privateSubnets.push(privateSubnet);
      this.privateSubnetIds.push(privateSubnet.id);
    });

    this.vpcId = this.vpc.id;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGateway.id,
    });
  }

  /**
   * Calculate CIDR blocks for public and private subnets.
   * Splits the VPC CIDR into equally-sized subnets for public and private use.
   */
  private calculateSubnetCidrs(
    vpcCidr: string,
    azCount: number
  ): { publicSubnets: string[]; privateSubnets: string[] } {
    // Simple CIDR calculation for 2 AZs
    // For production use, consider using a library like 'ip' or 'ipaddr.js'
    const [baseIp, vpcPrefix] = vpcCidr.split('/');
    const prefix = parseInt(vpcPrefix);

    // Calculate subnet prefix (add 2 bits for 4 subnets total: 2 public + 2 private)
    const subnetPrefix = prefix + 2;

    const baseOctets = baseIp.split('.').map(Number);
    const thirdOctet = baseOctets[2];

    const publicSubnets: string[] = [];
    const privateSubnets: string[] = [];

    for (let i = 0; i < azCount; i++) {
      // Public subnets: .0.0, .64.0
      publicSubnets.push(
        `${baseOctets[0]}.${baseOctets[1]}.${thirdOctet + i * 64}.0/${subnetPrefix}`
      );

      // Private subnets: .128.0, .192.0
      privateSubnets.push(
        `${baseOctets[0]}.${baseOctets[1]}.${thirdOctet + 128 + i * 64}.0/${subnetPrefix}`
      );
    }

    return { publicSubnets, privateSubnets };
  }
}
