import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityGroupStackProps {
  vpc: ec2.IVpc;
  environmentSuffix?: string;
}

export class SecurityGroupStack extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly sshSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Security Group for Web servers (HTTP traffic)
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup-${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for web servers allowing HTTP traffic',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for SSH access
    this.sshSecurityGroup = new ec2.SecurityGroup(
      this,
      `SshSecurityGroup-${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for SSH access',
        allowAllOutbound: true,
      }
    );

    // Allow SSH traffic from anywhere (in production, restrict to specific IPs)
    this.sshSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH traffic'
    );

    // Security Group for internal communication
    const internalSecurityGroup = new ec2.SecurityGroup(
      this,
      `InternalSecurityGroup-${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for internal VPC communication',
        allowAllOutbound: true,
      }
    );

    // Allow all traffic from VPC CIDR
    internalSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.allTraffic(),
      'Allow internal VPC traffic'
    );
  }
}
