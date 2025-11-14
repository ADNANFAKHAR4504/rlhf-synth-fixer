import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class VpcStack extends BaseStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create VPC with environment-specific configuration
    this.vpc = new ec2.Vpc(this, 'TradingVpc', {
      vpcName: this.getResourceName('trading-vpc'),
      ipAddresses: ec2.IpAddresses.cidr(this.environmentConfig.vpcConfig.cidr),
      maxAzs: this.environmentConfig.vpcConfig.maxAzs,
      natGateways: this.environmentConfig.vpcConfig.natGateways,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Export VPC ID to Parameter Store
    this.exportToParameterStore('vpc-id', this.vpc.vpcId);

    // Export subnet IDs
    this.vpc.privateSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(
        `private-subnet-${index + 1}-id`,
        subnet.subnetId
      );
    });

    this.vpc.publicSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(
        `public-subnet-${index + 1}-id`,
        subnet.subnetId
      );
    });
  }
}
