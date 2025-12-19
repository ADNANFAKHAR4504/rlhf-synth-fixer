import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Define the arguments for the NetworkingInfrastructure component
interface NetworkingInfrastructureArgs {
  environment: pulumi.Input<string>;
  region: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkingInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly igw: aws.ec2.InternetGateway;
  public readonly publicSubnet1: aws.ec2.Subnet;
  public readonly publicSubnet2: aws.ec2.Subnet;
  public readonly privateSubnet1: aws.ec2.Subnet;
  public readonly privateSubnet2: aws.ec2.Subnet;
  public readonly eip: aws.ec2.Eip;
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTable: aws.ec2.RouteTable;
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: NetworkingInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:NetworkingInfrastructure', name, args, opts);

    // Use a default CIDR block for the VPC
    const vpcCidrBlock = '10.0.0.0/16';
    const privateSubnet1Cidr = '10.0.1.0/24';
    const privateSubnet2Cidr = '10.0.2.0/24';
    const publicSubnet1Cidr = '10.0.101.0/24';
    const publicSubnet2Cidr = '10.0.102.0/24';

    // Create the VPC
    const vpcTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-vpc` }));
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: vpcCidrBlock,
        enableDnsHostnames: true,
        tags: vpcTags,
      },
      { parent: this }
    );

    // Create an Internet Gateway for the VPC
    const igwTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-igw` }));
    this.igw = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: igwTags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    // Create public subnets
    const publicSubnet1Tags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-public-subnet-1` }));
    this.publicSubnet1 = new aws.ec2.Subnet(
      `${name}-public-subnet-1`,
      {
        vpcId: this.vpc.id,
        cidrBlock: publicSubnet1Cidr,
        mapPublicIpOnLaunch: true,
        availabilityZone: pulumi.interpolate`${args.region}a`,
        tags: publicSubnet1Tags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    const publicSubnet2Tags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-public-subnet-2` }));
    this.publicSubnet2 = new aws.ec2.Subnet(
      `${name}-public-subnet-2`,
      {
        vpcId: this.vpc.id,
        cidrBlock: publicSubnet2Cidr,
        mapPublicIpOnLaunch: true,
        availabilityZone: pulumi.interpolate`${args.region}b`,
        tags: publicSubnet2Tags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    // Create private subnets
    const privateSubnet1Tags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-private-subnet-1` }));
    this.privateSubnet1 = new aws.ec2.Subnet(
      `${name}-private-subnet-1`,
      {
        vpcId: this.vpc.id,
        cidrBlock: privateSubnet1Cidr,
        availabilityZone: pulumi.interpolate`${args.region}a`,
        tags: privateSubnet1Tags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    const privateSubnet2Tags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-private-subnet-2` }));
    this.privateSubnet2 = new aws.ec2.Subnet(
      `${name}-private-subnet-2`,
      {
        vpcId: this.vpc.id,
        cidrBlock: privateSubnet2Cidr,
        availabilityZone: pulumi.interpolate`${args.region}b`,
        tags: privateSubnet2Tags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    // Create a NAT Gateway and EIP for private subnet internet access
    const eipTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-nat-eip` }));
    this.eip = new aws.ec2.Eip(
      `${name}-nat-eip`,
      {
        domain: 'vpc',
        tags: eipTags,
      },
      { parent: this, dependsOn: [this.igw] }
    );

    const natGatewayTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-nat-gateway` }));
    this.natGateway = new aws.ec2.NatGateway(
      `${name}-nat-gateway`,
      {
        subnetId: this.publicSubnet1.id,
        allocationId: this.eip.id,
        tags: natGatewayTags,
      },
      { parent: this, dependsOn: [this.eip, this.publicSubnet1] }
    );

    // Create a public route table
    const publicRtTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-public-rt` }));
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: publicRtTags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    // Create a private route table
    const privateRtTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-private-rt` }));
    this.privateRouteTable = new aws.ec2.RouteTable(
      `${name}-private-rt`,
      {
        vpcId: this.vpc.id,
        tags: privateRtTags,
      },
      { parent: this, dependsOn: [this.vpc] }
    );

    // Create a default route for the public route table
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.igw.id,
      },
      { parent: this.publicRouteTable }
    );

    // Create a default route for the private route table
    new aws.ec2.Route(
      `${name}-private-route`,
      {
        routeTableId: this.privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { parent: this.privateRouteTable }
    );

    // Associate subnets with route tables
    new aws.ec2.RouteTableAssociation(
      `${name}-public-rt-assoc-1`,
      {
        subnetId: this.publicSubnet1.id,
        routeTableId: this.publicRouteTable.id,
      },
      { parent: this.publicRouteTable }
    );

    new aws.ec2.RouteTableAssociation(
      `${name}-public-rt-assoc-2`,
      {
        subnetId: this.publicSubnet2.id,
        routeTableId: this.publicRouteTable.id,
      },
      { parent: this.publicRouteTable }
    );

    new aws.ec2.RouteTableAssociation(
      `${name}-private-rt-assoc-1`,
      {
        subnetId: this.privateSubnet1.id,
        routeTableId: this.privateRouteTable.id,
      },
      { parent: this.privateRouteTable }
    );

    new aws.ec2.RouteTableAssociation(
      `${name}-private-rt-assoc-2`,
      {
        subnetId: this.privateSubnet2.id,
        routeTableId: this.privateRouteTable.id,
      },
      { parent: this.privateRouteTable }
    );

    // Export key outputs to be used by other components
    this.vpcId = this.vpc.id;
    this.privateSubnetIds = pulumi.output([
      this.privateSubnet1.id,
      this.privateSubnet2.id,
    ]);

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
