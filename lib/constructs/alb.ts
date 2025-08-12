import {
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebAlbProps {
  vpc: ec2.IVpc;
  albSecurityGroup: ec2.ISecurityGroup;
  appAsg: import('aws-cdk-lib').aws_autoscaling.AutoScalingGroup;
  stage: string;
}

export class WebAlb extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly httpListener: elbv2.ApplicationListener;
  public readonly httpsListener?: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: WebAlbProps) {
    super(scope, id);

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      loadBalancerName: `${props.stage}-${scope.node.tryGetContext('aws:region') || 'region'}-alb`,
    });

    // Only create HTTP (80)
    this.httpListener = this.alb.addListener('Http', { port: 80, open: false });
    this.httpListener.addTargets('HttpTargets', {
      port: 80,
      targets: [props.appAsg],
      healthCheck: { path: '/', healthyHttpCodes: '200' },
    });
  }
}
