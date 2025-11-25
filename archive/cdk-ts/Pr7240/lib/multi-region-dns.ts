import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface MultiRegionDnsProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion?: string;
  domainName: string;
  applicationSubdomain?: string;
  primaryAlb: elbv2.ApplicationLoadBalancer;
  secondaryAlb?: elbv2.ApplicationLoadBalancer;
  createHostedZone?: boolean;
}

export class MultiRegionDns extends Construct {
  public readonly hostedZone?: route53.IHostedZone;
  public readonly healthCheck?: route53.CfnHealthCheck;

  constructor(scope: Construct, id: string, props: MultiRegionDnsProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const isPrimaryRegion = region === props.primaryRegion;
    const applicationDomain = props.applicationSubdomain
      ? `${props.applicationSubdomain}.${props.domainName}`
      : props.domainName;

    // Add iac-rlhf-amazon tag
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Only create hosted zone if requested and in primary region
    if (props.createHostedZone && isPrimaryRegion) {
      this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
        zoneName: props.domainName,
        comment: `Hosted zone for ${props.domainName} - Environment: ${props.environmentSuffix}`,
      });
    } else if (!props.createHostedZone) {
      // Try to lookup existing hosted zone
      try {
        this.hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
          domainName: props.domainName,
        });
      } catch (error) {
        // If lookup fails, create a placeholder output with instructions
        new cdk.CfnOutput(
          this,
          `Route53SetupInstructions${props.environmentSuffix}`,
          {
            value: `Please create a hosted zone for ${props.domainName} manually or set createHostedZone=true`,
            description: 'Route53 setup instructions',
          }
        );
        return;
      }
    }

    if (!this.hostedZone) {
      return;
    }

    // Create health check for the ALB
    this.healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: props.primaryAlb.loadBalancerDnsName,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    // Add tags separately as they might not be supported in the constructor
    cdk.Tags.of(this.healthCheck).add(
      'Name',
      `prod-healthcheck-${region}-${props.environmentSuffix}`
    );
    cdk.Tags.of(this.healthCheck).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.healthCheck).add('Environment', props.environmentSuffix);

    // Create DNS record with failover routing
    const dnsRecord = new route53.ARecord(this, 'DnsRecord', {
      zone: this.hostedZone,
      recordName: applicationDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(props.primaryAlb)
      ),
      ttl: cdk.Duration.seconds(60), // Low TTL for faster failover
      comment: `Failover record for ${applicationDomain} in ${region}`,
    });

    // Configure failover routing policy
    const cfnRecordSet = dnsRecord.node.defaultChild as route53.CfnRecordSet;
    cfnRecordSet.setIdentifier = `failover-${region}-${props.environmentSuffix}`;
    cfnRecordSet.failover = isPrimaryRegion ? 'PRIMARY' : 'SECONDARY';
    cfnRecordSet.healthCheckId = this.healthCheck.attrHealthCheckId;

    // Outputs
    const stack = cdk.Stack.of(this);

    new cdk.CfnOutput(stack, `HostedZoneId${props.environmentSuffix}`, {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `TapStack${props.environmentSuffix}-hosted-zone-id`,
    });

    new cdk.CfnOutput(stack, `HealthCheckId${props.environmentSuffix}`, {
      value: this.healthCheck.attrHealthCheckId,
      description: 'Route53 Health Check ID',
      exportName: `TapStack${props.environmentSuffix}-health-check-id`,
    });

    new cdk.CfnOutput(stack, `ApplicationDomain${props.environmentSuffix}`, {
      value: applicationDomain,
      description: 'Application domain name',
      exportName: `TapStack${props.environmentSuffix}-application-domain`,
    });

    new cdk.CfnOutput(stack, `DnsRecordFqdn${props.environmentSuffix}`, {
      value: dnsRecord.domainName,
      description: 'DNS record FQDN',
      exportName: `TapStack${props.environmentSuffix}-dns-record-fqdn`,
    });
  }
}
