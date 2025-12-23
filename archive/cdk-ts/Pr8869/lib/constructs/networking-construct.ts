import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingConstructProps {
  environmentSuffix: string;
  region: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnet: ec2.PublicSubnet;
  public readonly privateSubnet: ec2.PrivateSubnet;
  public readonly internetGateway: ec2.CfnInternetGateway;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Define CIDR blocks for different regions
    const cidrBlocks = {
      'us-east-1': '10.0.0.0/16',
      'us-west-1': '10.1.0.0/16',
    };

    const vpcCidr =
      cidrBlocks[region as keyof typeof cidrBlocks] || '10.0.0.0/16';

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // Disable NAT gateways to avoid EIP issues
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Get references to the created subnets
    this.publicSubnet = this.vpc.publicSubnets[0] as ec2.PublicSubnet;
    this.privateSubnet = this.vpc.isolatedSubnets[0] as ec2.PrivateSubnet;

    // Tag all networking resources
    cdk.Tags.of(this.vpc).add('Name', `vpc-${environmentSuffix}-${region}`);
    cdk.Tags.of(this.vpc).add('Purpose', 'MultiRegionDevEnvironment');
    cdk.Tags.of(this.vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(this.vpc).add('Region', region);

    // Tag subnets if they exist
    if (this.publicSubnet) {
      cdk.Tags.of(this.publicSubnet).add(
        'Name',
        `public-subnet-${environmentSuffix}-${region}`
      );
      cdk.Tags.of(this.publicSubnet).add('Type', 'Public');
    }

    if (this.privateSubnet) {
      cdk.Tags.of(this.privateSubnet).add(
        'Name',
        `private-subnet-${environmentSuffix}-${region}`
      );
      cdk.Tags.of(this.privateSubnet).add('Type', 'Private');
    }
  }
}
