import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface DnsStackProps extends cdk.StackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  standbyAlb: elbv2.ApplicationLoadBalancer;
  domainName?: string;
}

export class DnsStack extends cdk.Stack {
  public readonly primaryHealthCheck?: route53.CfnHealthCheck;
  public readonly standbyHealthCheck?: route53.CfnHealthCheck;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    // Always create health checks for ALB monitoring (useful even without custom domain)
    this.primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: props.primaryAlb.loadBalancerDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: 'Primary ALB Health Check',
          },
        ],
      }
    );

    this.standbyHealthCheck = new route53.CfnHealthCheck(
      this,
      'StandbyHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: props.standbyAlb.loadBalancerDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: 'Standby ALB Health Check',
          },
        ],
      }
    );

    // Output health check IDs for testing
    new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
      value: this.primaryHealthCheck.attrHealthCheckId,
      description: 'Primary ALB Health Check ID',
    });

    new cdk.CfnOutput(this, 'StandbyHealthCheckId', {
      value: this.standbyHealthCheck.attrHealthCheckId,
      description: 'Standby ALB Health Check ID',
    });

    // Only create hosted zone and DNS records if a real domain is provided
    if (props.domainName && props.domainName !== 'example.com') {
      const domainName = props.domainName;

      // Create or import the hosted zone
      const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
        zoneName: domainName,
      });

      // Create failover record set for the application using CfnRecordSet
      new route53.CfnRecordSet(this, 'PrimaryFailoverRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `app.${domainName}`,
        type: 'A',
        aliasTarget: {
          dnsName: props.primaryAlb.loadBalancerDnsName,
          evaluateTargetHealth: true,
          hostedZoneId: props.primaryAlb.loadBalancerCanonicalHostedZoneId,
        },
        failover: 'PRIMARY',
        healthCheckId: this.primaryHealthCheck.attrHealthCheckId,
        setIdentifier: 'Primary',
      });

      new route53.CfnRecordSet(this, 'StandbyFailoverRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `app.${domainName}`,
        type: 'A',
        aliasTarget: {
          dnsName: props.standbyAlb.loadBalancerDnsName,
          evaluateTargetHealth: true,
          hostedZoneId: props.standbyAlb.loadBalancerCanonicalHostedZoneId,
        },
        failover: 'SECONDARY',
        healthCheckId: this.standbyHealthCheck.attrHealthCheckId,
        setIdentifier: 'Standby',
      });

      // Output the application URL
      new cdk.CfnOutput(this, 'ApplicationUrl', {
        value: `http://app.${domainName}`,
        description: 'The URL of the application with Route53 failover',
      });
    } else {
      // For testing without a real domain, output the ALB DNS names
      new cdk.CfnOutput(this, 'PrimaryAlbUrl', {
        value: `http://${props.primaryAlb.loadBalancerDnsName}`,
        description: 'Primary ALB DNS name',
      });

      new cdk.CfnOutput(this, 'StandbyAlbUrl', {
        value: `http://${props.standbyAlb.loadBalancerDnsName}`,
        description: 'Standby ALB DNS name',
      });
    }
  }
}
