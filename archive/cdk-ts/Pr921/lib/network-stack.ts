import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly webAppSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with multi-AZ setup
    this.vpc = new ec2.Vpc(this, `WebAppVPC-${props.regionName}`, {
      vpcName: `vpc-${props.regionName.substring(0, 3)}-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3, // Use 3 AZs for better resilience
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Add VPC Flow Logs for monitoring
    new ec2.FlowLog(this, `VPCFlowLog-${props.regionName}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create security group for web application
    this.webAppSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebAppSG-${props.regionName}`,
      {
        vpc: this.vpc,
        description: 'Security group for web application instances',
        allowAllOutbound: true,
      }
    );

    this.webAppSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.webAppSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Export security group for use in other stacks
    new cdk.CfnOutput(this, `WebAppSecurityGroupId-${props.regionName}`, {
      value: this.webAppSecurityGroup.securityGroupId,
      exportName: `WebAppSG-${props.regionName}-${props.environmentSuffix}`,
    });

    // Export VPC details
    new cdk.CfnOutput(this, `VPCId-${props.regionName}`, {
      value: this.vpc.vpcId,
      exportName: `VPC-${props.regionName}-${props.environmentSuffix}`,
    });
  }
}
