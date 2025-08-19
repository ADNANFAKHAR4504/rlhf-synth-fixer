import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class LoadBalancerStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const { vpc, albSecurityGroup, targetGroup } = props;

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, `WebAppALB${environmentSuffix}`, {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      loadBalancerName: `WebAppALB${environmentSuffix}`,
      deletionProtection: false, // Set to true for production
    });

    // Use the target group passed from AutoScaling stack
    this.targetGroup = targetGroup;

    // HTTP Listener with redirect to HTTPS (301 permanent redirect as required)
    this.httpListener = this.alb.addListener(`HTTPListener${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true, // 301 permanent redirect as required
      }),
    });

    // Create a self-signed certificate for demo purposes
    // In production, use ACM-managed certificates or import existing ones
    const certificate = new certificatemanager.Certificate(this, `WebAppCertificate${environmentSuffix}`, {
      domainName: `webapp-${environmentSuffix}.example.com`, // Replace with your domain
      validation: certificatemanager.CertificateValidation.fromDns(),
      certificateName: `WebAppCertificate${environmentSuffix}`,
    });

    // HTTPS Listener with certificate
    this.httpsListener = this.alb.addListener(`HTTPSListener${environmentSuffix}`, {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      defaultTargetGroups: [this.targetGroup],
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.TLS12_EXT, // Modern TLS policy
    });

    // Apply environment tags
    cdk.Tags.of(this.alb).add('Environment', environmentSuffix);
    cdk.Tags.of(this.alb).add('Service', 'WebApp');
    cdk.Tags.of(certificate).add('Environment', environmentSuffix);

    // Outputs
    new cdk.CfnOutput(this, `LoadBalancerDNS${environmentSuffix}`, {
      value: this.alb.loadBalancerDnsName,
      exportName: `WebAppLoadBalancerDNS${environmentSuffix}`,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, `LoadBalancerArn${environmentSuffix}`, {
      value: this.alb.loadBalancerArn,
      exportName: `WebAppLoadBalancerArn${environmentSuffix}`,
      description: 'Application Load Balancer ARN',
    });

    // Target Group ARN output is now in AutoScaling stack

    new cdk.CfnOutput(this, `LoadBalancerHostedZoneId${environmentSuffix}`, {
      value: this.alb.loadBalancerCanonicalHostedZoneId,
      exportName: `WebAppLoadBalancerHostedZoneId${environmentSuffix}`,
      description: 'Load Balancer Canonical Hosted Zone ID',
    });

    new cdk.CfnOutput(this, `CertificateArn${environmentSuffix}`, {
      value: certificate.certificateArn,
      exportName: `WebAppCertificateArn${environmentSuffix}`,
      description: 'SSL Certificate ARN',
    });
  }
}