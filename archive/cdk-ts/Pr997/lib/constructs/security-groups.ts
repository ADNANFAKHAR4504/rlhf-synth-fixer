import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebSecurityGroupsProps {
  vpc: ec2.IVpc;
  stage: string;
}

export class WebSecurityGroups extends Construct {
  public readonly albSg: ec2.SecurityGroup;
  public readonly appSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: WebSecurityGroupsProps) {
    super(scope, id);

    this.albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: props.vpc,
      description: 'ALB SG allowing inbound 80/443 only',
      allowAllOutbound: true,
    });
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    this.albSg.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'HTTP v6');
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');
    this.albSg.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(443),
      'HTTPS v6'
    );

    this.appSg = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: props.vpc,
      description: 'App SG allowing inbound 80/443 from ALB only',
      allowAllOutbound: true,
    });
    this.appSg.addIngressRule(this.albSg, ec2.Port.tcp(80), 'HTTP from ALB');
    this.appSg.addIngressRule(this.albSg, ec2.Port.tcp(443), 'HTTPS from ALB');
  }
}
