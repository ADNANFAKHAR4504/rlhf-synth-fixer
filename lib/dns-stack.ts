import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';

interface DnsStackProps extends cdk.StackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  standbyAlb: elbv2.ApplicationLoadBalancer;
  domainName?: string;
}

export class DnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    // Only create hosted zone, health checks, and DNS records if a real domain is provided
    if (props.domainName && props.domainName !== 'example.com') {
      const domainName = props.domainName;

      // Create or import the hosted zone
      const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
        zoneName: domainName,
      });

      // Create health checks for the primary and standby ALBs
      const primaryHealthCheck = new route53.CfnHealthCheck(
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

      const standbyHealthCheck = new route53.CfnHealthCheck(
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
        healthCheckId: primaryHealthCheck.attrHealthCheckId,
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
        healthCheckId: standbyHealthCheck.attrHealthCheckId,
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
