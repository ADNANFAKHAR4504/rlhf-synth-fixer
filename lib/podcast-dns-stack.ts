import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

interface PodcastDnsStackProps {
  environmentSuffix: string;
  distribution: cloudfront.IDistribution;
}

export class PodcastDnsStack extends Construct {
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props: PodcastDnsStackProps) {
    super(scope, id);

    // Create Route 53 hosted zone
    this.hostedZone = new route53.HostedZone(this, 'PodcastHostedZone', {
      zoneName: `podcast-${props.environmentSuffix}.example.com`,
      comment: `Hosted zone for podcast platform ${props.environmentSuffix}`,
    });

    // Create A record pointing to CloudFront distribution
    new route53.ARecord(this, 'PodcastARecord', {
      zone: this.hostedZone,
      recordName: 'cdn',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });

    // Create AAAA record for IPv6
    new route53.AaaaRecord(this, 'PodcastAAAARecord', {
      zone: this.hostedZone,
      recordName: 'cdn',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 hosted zone ID',
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route 53 name servers',
    });
  }
}
