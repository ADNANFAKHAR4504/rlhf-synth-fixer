import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // VPC with high availability across 2 AZs
    this.vpc = new ec2.Vpc(this, `WebAppVPC${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2, // High availability with NAT gateway in each AZ
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Apply environment suffix tag
    cdk.Tags.of(this.vpc).add('Name', `WebAppVPC${environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Environment', environmentSuffix);

    // Outputs for other stacks to reference
    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: this.vpc.vpcId,
      exportName: `WebAppVpcId${environmentSuffix}`,
      description: 'VPC ID for the web application',
    });

    new cdk.CfnOutput(this, `PublicSubnetIds${environmentSuffix}`, {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      exportName: `WebAppPublicSubnetIds${environmentSuffix}`,
      description: 'Public subnet IDs for the web application',
    });

    new cdk.CfnOutput(this, `PrivateSubnetIds${environmentSuffix}`, {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      exportName: `WebAppPrivateSubnetIds${environmentSuffix}`,
      description: 'Private subnet IDs for the web application',
    });

    new cdk.CfnOutput(this, `VpcCidr${environmentSuffix}`, {
      value: this.vpc.vpcCidrBlock,
      exportName: `WebAppVpcCidr${environmentSuffix}`,
      description: 'VPC CIDR block for the web application',
    });
  }
}