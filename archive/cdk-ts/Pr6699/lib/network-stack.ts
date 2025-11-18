import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly hostedZone: route53.PrivateHostedZone;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // VPC with 3 AZs, public and private subnets
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: `trading-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1, // Using 1 NAT Gateway for cost optimization in synthetic environment
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Private hosted zone for internal service discovery
    this.hostedZone = new route53.PrivateHostedZone(this, 'PrivateZone', {
      zoneName: `internal.${props.environmentSuffix}.local`,
      vpc: this.vpc,
    });

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${props.environmentSuffix}`,
    });

    // Output Private Hosted Zone ID
    new cdk.CfnOutput(this, 'PrivateHostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Private Hosted Zone ID',
      exportName: `PrivateHostedZoneId-${props.environmentSuffix}`,
    });
  }
}
