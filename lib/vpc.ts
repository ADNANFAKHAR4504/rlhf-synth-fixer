import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  getCommonTags,
  primaryRegion,
  secondaryRegion,
  primaryVpcCidr,
  secondaryVpcCidr,
} from './config';

export class VpcStack extends pulumi.ComponentResource {
  public readonly primaryVpc: aws.ec2.Vpc;
  public readonly primaryInternetGateway: aws.ec2.InternetGateway;
  public readonly primaryPublicSubnet1: aws.ec2.Subnet;
  public readonly primaryPublicSubnet2: aws.ec2.Subnet;
  public readonly primaryPrivateSubnet1: aws.ec2.Subnet;
  public readonly primaryPrivateSubnet2: aws.ec2.Subnet;
  public readonly primaryPublicRouteTable: aws.ec2.RouteTable;
  public readonly secondaryVpc: aws.ec2.Vpc;
  public readonly secondaryInternetGateway: aws.ec2.InternetGateway;
  public readonly secondaryPrivateSubnet1: aws.ec2.Subnet;
  public readonly secondaryPrivateSubnet2: aws.ec2.Subnet;

  constructor(
    name: string,
    args: { environment: string; tags: Record<string, string> },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    // Primary region VPC
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    this.primaryVpc = new aws.ec2.Vpc(
      `${args.environment}-primary-vpc`,
      {
        cidrBlock: primaryVpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-VPC`,
          Region: primaryRegion,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryInternetGateway = new aws.ec2.InternetGateway(
      `${args.environment}-primary-igw`,
      {
        vpcId: this.primaryVpc.id,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Internet-Gateway`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary region subnets
    this.primaryPublicSubnet1 = new aws.ec2.Subnet(
      `${args.environment}-primary-public-subnet-1`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${primaryRegion}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Public-Subnet-1`,
          Type: 'Public',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryPublicSubnet2 = new aws.ec2.Subnet(
      `${args.environment}-primary-public-subnet-2`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${primaryRegion}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Public-Subnet-2`,
          Type: 'Public',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryPrivateSubnet1 = new aws.ec2.Subnet(
      `${args.environment}-primary-private-subnet-1`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: `${primaryRegion}a`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Private-Subnet-1`,
          Type: 'Private',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryPrivateSubnet2 = new aws.ec2.Subnet(
      `${args.environment}-primary-private-subnet-2`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.4.0/24',
        availabilityZone: `${primaryRegion}b`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Private-Subnet-2`,
          Type: 'Private',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary region route table
    this.primaryPublicRouteTable = new aws.ec2.RouteTable(
      `${args.environment}-primary-public-rt`,
      {
        vpcId: this.primaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.primaryInternetGateway.id,
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Public-Route-Table`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Associate public subnets with route table
    new aws.ec2.RouteTableAssociation(
      `${args.environment}-primary-public-rta-1`,
      {
        subnetId: this.primaryPublicSubnet1.id,
        routeTableId: this.primaryPublicRouteTable.id,
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `${args.environment}-primary-public-rta-2`,
      {
        subnetId: this.primaryPublicSubnet2.id,
        routeTableId: this.primaryPublicRouteTable.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region VPC
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    this.secondaryVpc = new aws.ec2.Vpc(
      `${args.environment}-secondary-vpc`,
      {
        cidrBlock: secondaryVpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-VPC`,
          Region: secondaryRegion,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.secondaryInternetGateway = new aws.ec2.InternetGateway(
      `${args.environment}-secondary-igw`,
      {
        vpcId: this.secondaryVpc.id,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-Internet-Gateway`,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Secondary region subnets
    this.secondaryPrivateSubnet1 = new aws.ec2.Subnet(
      `${args.environment}-secondary-private-subnet-1`,
      {
        vpcId: this.secondaryVpc.id,
        cidrBlock: '10.1.1.0/24',
        availabilityZone: `${secondaryRegion}a`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-Private-Subnet-1`,
          Type: 'Private',
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.secondaryPrivateSubnet2 = new aws.ec2.Subnet(
      `${args.environment}-secondary-private-subnet-2`,
      {
        vpcId: this.secondaryVpc.id,
        cidrBlock: '10.1.2.0/24',
        availabilityZone: `${secondaryRegion}b`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-Private-Subnet-2`,
          Type: 'Private',
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.registerOutputs({
      primaryVpcId: this.primaryVpc.id,
      primaryVpcCidr: this.primaryVpc.cidrBlock,
      secondaryVpcId: this.secondaryVpc.id,
      secondaryVpcCidr: this.secondaryVpc.cidrBlock,
    });
  }
}
