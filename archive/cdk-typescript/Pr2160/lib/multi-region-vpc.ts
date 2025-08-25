import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MultiRegionVpcProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
}

export class MultiRegionVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: MultiRegionVpcProps) {
    super(scope, id, props);

    // Create VPC with specified CIDR
    this.vpc = new ec2.Vpc(this, `Vpc${props.environmentSuffix}`, {
      vpcName: `vpc-${props.environmentSuffix}-${props.region}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use 2 AZs for high availability
      natGateways: 1, // One NAT Gateway for cost optimization
      subnetConfiguration: [
        {
          name: `Public-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `Private-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Apply removal policy to ensure clean destruction
    this.vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Store subnet references for cross-stack usage
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Add tags for resource identification
    cdk.Tags.of(this.vpc).add(
      'Name',
      `vpc-${props.environmentSuffix}-${props.region}`
    );
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.vpc).add('Region', props.region);

    // Output VPC ID for cross-stack references
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${props.region}`,
      exportName: `VpcId-${props.environmentSuffix}-${props.region}`,
    });

    // Output subnet IDs for cross-stack references
    this.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID for ${props.region}`,
        exportName: `PublicSubnet${index + 1}Id-${props.environmentSuffix}-${props.region}`,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID for ${props.region}`,
        exportName: `PrivateSubnet${index + 1}Id-${props.environmentSuffix}-${props.region}`,
      });
    });
  }
}
