import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface CdkVpcStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class CdkVpcStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: CdkVpcStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, `cdk-vpc-${props.environmentSuffix}`, {
      vpcName: `cdk-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: `cdk-public-subnet-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `cdk-private-subnet-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add tags
    cdk.Tags.of(this.vpc).add('Name', `cdk-vpc-${props.environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);

    // Output VPC ID for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `cdk-vpc-id-${props.environmentSuffix}`,
    });

    // Output private subnet IDs
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `cdk-private-subnet-ids-${props.environmentSuffix}`,
    });

    // Output public subnet IDs
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `cdk-public-subnet-ids-${props.environmentSuffix}`,
    });
  }
}
