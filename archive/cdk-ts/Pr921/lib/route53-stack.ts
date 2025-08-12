import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface Route53StackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryLoadBalancerDnsName: string;
  primaryLoadBalancerHostedZoneId: string;
  secondaryLoadBalancerDnsName: string;
  secondaryLoadBalancerHostedZoneId: string;
}

export class Route53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const domainName = `webapp-${props.environmentSuffix}.example.com`;

    // Create hosted zone
    const hostedZone = new route53.HostedZone(this, 'WebAppHostedZone', {
      zoneName: domainName,
    });

    // Create primary region record with weighted routing (70% traffic)
    new route53.ARecord(this, 'PrimaryRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromValues(props.primaryLoadBalancerDnsName),
      setIdentifier: 'primary',
      weight: 70,
      ttl: cdk.Duration.seconds(60),
    });

    // Create secondary region record with weighted routing (30% traffic)
    new route53.ARecord(this, 'SecondaryRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromValues(
        props.secondaryLoadBalancerDnsName
      ),
      setIdentifier: 'secondary',
      weight: 30,
      ttl: cdk.Duration.seconds(60),
    });

    // Output the hosted zone information
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      exportName: `HostedZone-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: domainName,
      exportName: `DomainName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: hostedZone.hostedZoneNameServers?.join(',') || 'undefined',
      exportName: `NameServers-${props.environmentSuffix}`,
    });
  }
}
