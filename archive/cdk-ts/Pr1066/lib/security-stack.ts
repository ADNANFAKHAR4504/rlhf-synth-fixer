import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityStackProps {
  vpc: ec2.Vpc;
  environmentSuffix?: string;
}

export class SecurityStack extends Construct {
  public readonly securityGroupPublic: ec2.SecurityGroup;
  public readonly securityGroupPrivate: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Security group for public subnet instances
    this.securityGroupPublic = new ec2.SecurityGroup(
      this,
      'securityGroupPublic',
      {
        vpc: props.vpc,
        description: 'Security group for public subnet EC2 instances',
        allowAllOutbound: true,
        securityGroupName: `securityGroupPublic${environmentSuffix}`,
      }
    );

    // Allow SSH access only from specified IP range
    this.securityGroupPublic.addIngressRule(
      ec2.Peer.ipv4('198.51.100.0/24'),
      ec2.Port.tcp(22),
      'SSH access from authorized IP range'
    );

    // Security group for private subnet instances
    this.securityGroupPrivate = new ec2.SecurityGroup(
      this,
      'securityGroupPrivate',
      {
        vpc: props.vpc,
        description: 'Security group for private subnet EC2 instances',
        allowAllOutbound: true,
        securityGroupName: `securityGroupPrivate${environmentSuffix}`,
      }
    );

    // Allow SSH access from public security group
    this.securityGroupPrivate.addIngressRule(
      this.securityGroupPublic,
      ec2.Port.tcp(22),
      'SSH access from public subnet'
    );

    // Allow communication between private instances
    this.securityGroupPrivate.addIngressRule(
      this.securityGroupPrivate,
      ec2.Port.allTraffic(),
      'Internal communication within private subnet'
    );

    // Add tags
    cdk.Tags.of(this.securityGroupPublic).add('Environment', 'Development');
    cdk.Tags.of(this.securityGroupPublic).add(
      'Name',
      `securityGroupPublic${environmentSuffix}`
    );

    cdk.Tags.of(this.securityGroupPrivate).add('Environment', 'Development');
    cdk.Tags.of(this.securityGroupPrivate).add(
      'Name',
      `securityGroupPrivate${environmentSuffix}`
    );
  }
}
