/**
 * Networking Infrastructure Component
 * Handles VPC, subnets, security groups, and network-related resources
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

interface NetworkingInfrastructureArgs {
  region: string;
  isPrimary: boolean;
  environment: string;
  tags: Record<string, string>;
}

export class NetworkingInfrastructure extends ComponentResource {
  private readonly region: string;
  private readonly isPrimary: boolean;
  private readonly environment: string;
  private readonly tags: Record<string, string>;
  private readonly regionSuffix: string;
  private readonly provider?: aws.Provider;
  private readonly vpcCidr: string;

  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[] = [];
  public readonly privateSubnets: aws.ec2.Subnet[] = [];
  public readonly natGateways: aws.ec2.NatGateway[] = [];
  public readonly privateRts: aws.ec2.RouteTable[] = [];
  public readonly igw: aws.ec2.InternetGateway;
  public readonly publicRt: aws.ec2.RouteTable;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ebSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: NetworkingInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:Networking', name, {}, opts);

    this.region = args.region;
    this.isPrimary = args.isPrimary;
    this.environment = args.environment;
    this.tags = args.tags;
    this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');

    this.provider = opts?.provider as aws.Provider | undefined;
    this.vpcCidr = args.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16';

    this.vpc = this.createVpc();
    this.igw = this.createInternetGateway();
    this.albSecurityGroup = this.createAlbSecurityGroup();
    this.ebSecurityGroup = this.createEbSecurityGroup();

    // Create subnets and route tables synchronously to avoid readonly issues
    this.createSubnets();
    this.createNatGateways();
    this.publicRt = this.createRouteTablesAndAssociations();

    this.registerOutputs({
      vpcId: this.vpc.id,
      vpcCidr: this.vpc.cidrBlock,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      albSecurityGroupId: this.albSecurityGroup.id,
      ebSecurityGroupId: this.ebSecurityGroup.id,
    });
  }

  /**
   * Create VPC with DNS support
   */
  private createVpc(): aws.ec2.Vpc {
    return new aws.ec2.Vpc(
      `vpc-${this.regionSuffix}`,
      {
        cidrBlock: this.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...this.tags, Name: `nova-vpc-${this.regionSuffix}` },
      },
      { parent: this }
    );
  }

  /**
   * Get availability zones for the region with fallback
   */
  private getAvailabilityZones(): string[] {
    // Detect LocalStack environment
    const isLocalStack =
      !!process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      !!process.env.AWS_ENDPOINT_URL?.includes('localstack');

    // Region-specific AZ mapping for reliable deployments
    // Note: us-west-1 uses 'b' for LocalStack (which doesn't support 'c') and 'c' for real AWS (which doesn't have 'b')
    const regionAzMap: Record<string, string[]> = {
      'us-east-1': ['us-east-1a', 'us-east-1b'],
      'us-east-2': ['us-east-2a', 'us-east-2b'],
      'us-west-1': isLocalStack
        ? ['us-west-1a', 'us-west-1b']
        : ['us-west-1a', 'us-west-1c'],
      'us-west-2': ['us-west-2a', 'us-west-2b'],
      'us-gov-east-1': ['us-gov-east-1a', 'us-gov-east-1b'],
      'us-gov-west-1': ['us-gov-west-1a', 'us-gov-west-1b'],
      'eu-west-1': ['eu-west-1a', 'eu-west-1b'],
      'eu-central-1': ['eu-central-1a', 'eu-central-1b'],
      'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b'],
      'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c'],
    };

    const availableAzs = regionAzMap[this.region];
    if (availableAzs) {
      console.log(
        `Using known AZs for ${this.region}${isLocalStack ? ' (LocalStack)' : ''}:`,
        availableAzs
      );
      return availableAzs;
    }

    // Fallback for unknown regions
    console.log(`Unknown region ${this.region}, using fallback AZs`);
    return [`${this.region}a`, `${this.region}b`];
  }

  /**
   * Create public and private subnets across multiple AZs
   */
  private createSubnets(): void {
    const availableAzs = this.getAvailabilityZones();
    const numAzsToUse = Math.min(2, availableAzs.length);
    const base = this.isPrimary ? 0 : 1;
    const publicBase = 100;
    const privateBase = 120;

    console.log(`Creating subnets in ${numAzsToUse} AZs for ${this.region}`);

    for (let i = 0; i < numAzsToUse; i++) {
      const azName = availableAzs[i];
      const publicCidr = `10.${base}.${publicBase + i}.0/24`;
      const privateCidr = `10.${base}.${privateBase + i}.0/24`;

      console.log(`Creating subnets in AZ: ${azName}`);

      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${this.regionSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: publicCidr,
          availabilityZone: azName,
          mapPublicIpOnLaunch: true,
          tags: { ...this.tags, Name: `nova-public-${i}-${this.regionSuffix}` },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );
      this.publicSubnets.push(publicSubnet);

      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${this.regionSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: privateCidr,
          availabilityZone: azName,
          tags: {
            ...this.tags,
            Name: `nova-private-${i}-${this.regionSuffix}`,
          },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );
      this.privateSubnets.push(privateSubnet);
    }

    console.log(
      ` Created ${this.publicSubnets.length} public and ${this.privateSubnets.length} private subnets`
    );
  }

  /**
   * Create Internet Gateway for public internet access
   */
  private createInternetGateway(): aws.ec2.InternetGateway {
    return new aws.ec2.InternetGateway(
      `igw-${this.regionSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `nova-igw-${this.regionSuffix}` },
      },
      { parent: this, provider: this.provider }
    );
  }

  /**
   * Create NAT Gateways for private subnet internet access
   */
  private createNatGateways(): void {
    console.log(`Creating ${this.publicSubnets.length} NAT Gateways...`);

    // Create one NAT Gateway per public subnet
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const publicSubnet = this.publicSubnets[i];

      const eip = new aws.ec2.Eip(
        `nat-eip-${i}-${this.regionSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...this.tags,
            Name: `nova-nat-eip-${i}-${this.regionSuffix}`,
          },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );

      const natGw = new aws.ec2.NatGateway(
        `nat-gw-${i}-${this.regionSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: { ...this.tags, Name: `nova-nat-gw-${i}-${this.regionSuffix}` },
        },
        {
          parent: this,
          provider: this.provider,
          deleteBeforeReplace: true,
        }
      );
      this.natGateways.push(natGw);
    }

    console.log(` Created ${this.natGateways.length} NAT Gateways`);
  }

  /**
   * Create and configure route tables
   */
  private createRouteTablesAndAssociations(): aws.ec2.RouteTable {
    console.log('Creating route tables and associations...');

    const publicRt = new aws.ec2.RouteTable(
      `public-rt-${this.regionSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.igw.id,
          },
        ],
        tags: { ...this.tags, Name: `nova-public-rt-${this.regionSuffix}` },
      },
      { parent: this, provider: this.provider }
    );

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      const subnet = this.publicSubnets[i];
      new aws.ec2.RouteTableAssociation(
        `public-rt-assoc-${i}-${this.regionSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRt.id,
        },
        { parent: this, provider: this.provider }
      );
    }

    // Create private route tables and associations
    for (
      let i = 0;
      i < this.privateSubnets.length && i < this.natGateways.length;
      i++
    ) {
      const subnet = this.privateSubnets[i];
      const natGw = this.natGateways[i];

      const privateRt = new aws.ec2.RouteTable(
        `private-rt-${i}-${this.regionSuffix}`,
        {
          vpcId: this.vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              natGatewayId: natGw.id,
            },
          ],
          tags: {
            ...this.tags,
            Name: `nova-private-rt-${i}-${this.regionSuffix}`,
          },
        },
        { parent: this }
      );
      this.privateRts.push(privateRt);

      new aws.ec2.RouteTableAssociation(
        `private-rt-assoc-${i}-${this.regionSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRt.id,
        },
        { parent: this }
      );
    }

    console.log(
      ` Created public route table and ${this.privateRts.length} private route tables`
    );
    return publicRt;
  }

  /**
   * Create security group for Application Load Balancer
   */
  private createAlbSecurityGroup(): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(
      `alb-sg-${this.regionSuffix}`,
      {
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...this.tags, Name: `nova-alb-sg-${this.regionSuffix}` },
      },
      { parent: this }
    );
  }

  /**
   * Create security group for Elastic Beanstalk instances
   */
  private createEbSecurityGroup(): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(
      `eb-sg-${this.regionSuffix}`,
      {
        description: 'Security group for Elastic Beanstalk instances',
        vpcId: this.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [this.albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: [this.vpcCidr],
            description: 'SSH from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...this.tags, Name: `nova-eb-sg-${this.regionSuffix}` },
      },
      { parent: this }
    );
  }

  // Property getters for easy access
  public get vpcId(): pulumi.Output<string> {
    return this.vpc.id;
  }

  public get publicSubnetIds(): pulumi.Output<string>[] {
    return this.publicSubnets.map(subnet => subnet.id);
  }

  public get privateSubnetIds(): pulumi.Output<string>[] {
    return this.privateSubnets.map(subnet => subnet.id);
  }

  public get albSecurityGroupId(): pulumi.Output<string> {
    return this.albSecurityGroup.id;
  }

  public get ebSecurityGroupId(): pulumi.Output<string> {
    return this.ebSecurityGroup.id;
  }
}
