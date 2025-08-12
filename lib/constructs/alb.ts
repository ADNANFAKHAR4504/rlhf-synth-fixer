import {
  aws_certificatemanager as acm,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebAlbProps {
  vpc: ec2.IVpc;
  albSecurityGroup: ec2.ISecurityGroup;
  appAsg: import('aws-cdk-lib').aws_autoscaling.AutoScalingGroup;
  stage: string;
  certificateArn?: string; // now optional
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

    // Always create HTTP (80)
    this.httpListener = this.alb.addListener('Http', { port: 80, open: false });
    this.httpListener.addTargets('HttpTargets', {
      port: 80,
      targets: [props.appAsg],
      healthCheck: { path: '/', healthyHttpCodes: '200' },
    });

    // Create HTTPS (443) only if a cert is supplied
    if (props.certificateArn) {
      const cert = acm.Certificate.fromCertificateArn(
        this,
        'HttpsCert',
        props.certificateArn
      );
      this.httpsListener = this.alb.addListener('Https', {
        port: 443,
        certificates: [cert],
        sslPolicy: elbv2.SslPolicy.TLS12_EXT,
        open: false,
      });
      this.httpsListener.addTargets('HttpsTargets', {
        port: 80, // TLS terminated at ALB
        targets: [props.appAsg],
        healthCheck: { path: '/', healthyHttpCodes: '200' },
      });

      // Optional: 80 → 443 redirect (only when HTTPS exists)
      this.httpListener.addAction('RedirectToHttps', {
        action: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
        }),
      });
    }
  }
}
