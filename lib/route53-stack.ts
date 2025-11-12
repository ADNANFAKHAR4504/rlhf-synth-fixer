import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface Route53StackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryLoadBalancer: elbv2.IApplicationLoadBalancer;
  secondaryLoadBalancer: elbv2.IApplicationLoadBalancer;
  primaryRegion: string;
  secondaryRegion: string;
}

export class Route53Stack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const { environmentSuffix, primaryLoadBalancer, secondaryLoadBalancer } =
      props;

    // Create a public hosted zone for the application
    const zoneName = `tapstack${environmentSuffix.toLowerCase()}.internal`;

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName,
      comment: `DNS zone for TapStack${environmentSuffix}`,
    });

    // Health check for primary ALB
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTPS_STR_MATCH',
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
            value: `TapStack${environmentSuffix}PrimaryHealthCheck`,
          },
        ],
      }
    );

    // Health check for secondary ALB
    const secondaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'SecondaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTPS_STR_MATCH',
          resourcePath: '/',
          fullyQualifiedDomainName: secondaryLoadBalancer.loadBalancerDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
          measureLatency: true,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `TapStack${environmentSuffix}SecondaryHealthCheck`,
          },
        ],
      }
    );

    // Primary failover record
    new route53.CfnRecordSet(this, 'PrimaryRecord', {
      hostedZoneId: this.hostedZone.hostedZoneId,
      name: `app.${zoneName}`,
      type: 'A',
      setIdentifier: 'Primary',
      failover: 'PRIMARY',
      healthCheckId: primaryHealthCheck.attrHealthCheckId,
      aliasTarget: {
        hostedZoneId: primaryLoadBalancer.loadBalancerCanonicalHostedZoneId,
        dnsName: primaryLoadBalancer.loadBalancerDnsName,
        evaluateTargetHealth: true,
      },
    });

    // Secondary failover record
    new route53.CfnRecordSet(this, 'SecondaryRecord', {
      hostedZoneId: this.hostedZone.hostedZoneId,
      name: `app.${zoneName}`,
      type: 'A',
      setIdentifier: 'Secondary',
      failover: 'SECONDARY',
      healthCheckId: secondaryHealthCheck.attrHealthCheckId,
      aliasTarget: {
        hostedZoneId: secondaryLoadBalancer.loadBalancerCanonicalHostedZoneId,
        dnsName: secondaryLoadBalancer.loadBalancerDnsName,
        evaluateTargetHealth: true,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `TapStack${environmentSuffix}HostedZoneId`,
    });

    new cdk.CfnOutput(this, 'DNSName', {
      value: `app.${zoneName}`,
      description: 'Application DNS Name',
      exportName: `TapStack${environmentSuffix}DNSName`,
    });

    new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
      value: primaryHealthCheck.attrHealthCheckId,
      description: 'Primary Health Check ID',
      exportName: `TapStack${environmentSuffix}PrimaryHealthCheckId`,
    });

    new cdk.CfnOutput(this, 'SecondaryHealthCheckId', {
      value: secondaryHealthCheck.attrHealthCheckId,
      description: 'Secondary Health Check ID',
      exportName: `TapStack${environmentSuffix}SecondaryHealthCheckId`,
    });
  }
}
