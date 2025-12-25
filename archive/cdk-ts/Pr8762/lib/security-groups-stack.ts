import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityGroupsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  environmentSuffix: string;
}

export class SecurityGroupsStack extends cdk.Stack {
  public readonly webServerSg: ec2.SecurityGroup;
  public readonly databaseSg: ec2.SecurityGroup;
  public readonly albSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsStackProps) {
    super(scope, id, props);

    // Application Load Balancer Security Group
    this.albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    this.albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    this.albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Web Server Security Group
    this.webServerSg = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    this.webServerSg.addIngressRule(
      this.albSg,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    this.webServerSg.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH from within VPC'
    );

    // Database Security Group
    this.databaseSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.databaseSg.addIngressRule(
      this.webServerSg,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );
  }
}
