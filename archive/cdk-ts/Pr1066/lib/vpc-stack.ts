import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnet: ec2.ISubnet;
  public readonly privateSubnet: ec2.ISubnet;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with IPv6 support
    this.vpc = new ec2.Vpc(this, 'vpcBasic', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'subnetPublic',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'subnetPrivate',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Get subnet references
    this.publicSubnet = this.vpc.publicSubnets[0];
    this.privateSubnet = this.vpc.privateSubnets[0];

    // Add tags to VPC and subnets
    cdk.Tags.of(this.vpc).add('Environment', 'Development');
    cdk.Tags.of(this.vpc).add('Name', `vpcBasic${environmentSuffix}`);

    cdk.Tags.of(this.publicSubnet).add('Environment', 'Development');
    cdk.Tags.of(this.publicSubnet).add(
      'Name',
      `subnetPublic${environmentSuffix}`
    );

    cdk.Tags.of(this.privateSubnet).add('Environment', 'Development');
    cdk.Tags.of(this.privateSubnet).add(
      'Name',
      `subnetPrivate${environmentSuffix}`
    );
  }
}
