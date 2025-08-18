import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface SimpleRoute53StackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SimpleRoute53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SimpleRoute53StackProps) {
    super(scope, id, props);

    const domainName = `webapp-${props.environmentSuffix}.example.com`;

    // Create hosted zone for the domain
    const hostedZone = new route53.HostedZone(this, 'WebAppHostedZone', {
      zoneName: domainName,
      comment: `Hosted zone for multi-region web application - ${props.environmentSuffix}`,
    });

    // Create CNAME records that can be manually updated with actual ALB DNS names
    new route53.CnameRecord(this, 'PrimaryRegionRecord', {
      zone: hostedZone,
      recordName: `primary.${domainName}`,
      domainName: 'primary-alb-placeholder.us-east-1.elb.amazonaws.com',
      ttl: cdk.Duration.minutes(5),
      comment:
        'Points to primary region ALB - update with actual ALB DNS name after deployment',
    });

    new route53.CnameRecord(this, 'SecondaryRegionRecord', {
      zone: hostedZone,
      recordName: `secondary.${domainName}`,
      domainName: 'secondary-alb-placeholder.us-west-2.elb.amazonaws.com',
      ttl: cdk.Duration.minutes(5),
      comment:
        'Points to secondary region ALB - update with actual ALB DNS name after deployment',
    });

    // Create a simple A record that points to the primary region by default
    new route53.ARecord(this, 'DefaultRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromValues('1.2.3.4'), // Placeholder IP - replace with actual
      ttl: cdk.Duration.minutes(1),
      comment:
        'Default record - update with weighted routing after ALBs are deployed',
    });

    // Output the hosted zone information
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      exportName: `HostedZone-${props.environmentSuffix}`,
      description: 'Route53 Hosted Zone ID for the web application domain',
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: domainName,
      exportName: `DomainName-${props.environmentSuffix}`,
      description: 'Domain name for the web application',
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: hostedZone.hostedZoneNameServers?.join(', ') || 'undefined',
      exportName: `NameServers-${props.environmentSuffix}`,
      description:
        'Name servers for the hosted zone - configure these with your domain registrar',
    });

    new cdk.CfnOutput(this, 'PrimaryRegionUrl', {
      value: `https://primary.${domainName}`,
      description: 'URL for primary region endpoint',
    });

    new cdk.CfnOutput(this, 'SecondaryRegionUrl', {
      value: `https://secondary.${domainName}`,
      description: 'URL for secondary region endpoint',
    });

    new cdk.CfnOutput(this, 'PostDeploymentInstructions', {
      value:
        'After ALBs are deployed, update CNAME records with actual ALB DNS names and configure weighted/failover routing',
      description: 'Instructions for completing the DNS setup',
    });
  }
}
