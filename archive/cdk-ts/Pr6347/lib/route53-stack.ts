import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface Route53StackProps {
  environmentSuffix: string;
  primaryLoadBalancer: elbv2.IApplicationLoadBalancer;
  primaryRegion: string;
}

export class Route53Stack extends Construct {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id);

    const { environmentSuffix, primaryLoadBalancer, primaryRegion } = props;

    // Create a public hosted zone for the application
    const zoneName = `tapstack${environmentSuffix.toLowerCase()}.internal`;

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName,
      comment: `DNS zone for TapStack${environmentSuffix}`,
    });

    // Health check for ALB
    const healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      healthCheckConfig: {
        type: 'HTTP',
        resourcePath: '/',
        fullyQualifiedDomainName: primaryLoadBalancer.loadBalancerDnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: `TapStack${environmentSuffix}HealthCheck`,
        },
        {
          key: 'Region',
          value: primaryRegion,
        },
      ],
    });

    // Simple A record (no failover for single region)
    new route53.CfnRecordSet(this, 'AppRecord', {
      hostedZoneId: this.hostedZone.hostedZoneId,
      name: `app.${zoneName}`,
      type: 'A',
      aliasTarget: {
        hostedZoneId: primaryLoadBalancer.loadBalancerCanonicalHostedZoneId,
        dnsName: primaryLoadBalancer.loadBalancerDnsName,
        evaluateTargetHealth: true,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'DNSName', {
      value: `app.${zoneName}`,
      description: 'Application DNS Name',
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      description: 'Health Check ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: primaryLoadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });
  }
}
