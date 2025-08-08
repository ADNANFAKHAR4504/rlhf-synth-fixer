import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, `${props.environmentSuffix}-vpc`, {
      vpcName: `${props.environmentSuffix}-vpc`,
      maxAzs: 3,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security group for ALB
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.environmentSuffix}-alb-sg`,
      {
        vpc: this.vpc,
        securityGroupName: `${props.environmentSuffix}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security group for EC2 instances - restrictive SSH access
    this.ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.environmentSuffix}-ec2-sg`,
      {
        vpc: this.vpc,
        securityGroupName: `${props.environmentSuffix}-ec2-sg`,
        description:
          'Security group for EC2 instances with restricted SSH access',
        allowAllOutbound: true,
      }
    );

    // Only allow SSH from specific IP ranges (replace with your actual IPs)
    const allowedSshIps = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

    allowedSshIps.forEach(ipRange => {
      this.ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(22),
        `Allow SSH from ${ipRange}`
      );
    });

    // Allow HTTP traffic from ALB
    this.ec2SecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Security group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.environmentSuffix}-rds-sg`,
      {
        vpc: this.vpc,
        securityGroupName: `${props.environmentSuffix}-rds-sg`,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2'
    );
  }
}
