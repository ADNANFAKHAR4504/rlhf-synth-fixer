import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface Route53StackProps extends cdk.StackProps {
  domainName: string;
  environmentSuffix: string;
  devLoadBalancer?: elbv2.IApplicationLoadBalancer;
  stagingLoadBalancer?: elbv2.IApplicationLoadBalancer;
  prodLoadBalancer?: elbv2.IApplicationLoadBalancer;
  migrationPhase: 'preparation' | 'migration' | 'cutover' | 'complete';
}

export class Route53Stack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const { domainName, environmentSuffix, migrationPhase } = props;

    // Create or reference hosted zone
    this.hostedZone = new route53.PublicHostedZone(
      this,
      `HostedZone-${environmentSuffix}`,
      {
        zoneName: domainName,
      }
    );

    // Weighted routing for gradual traffic shifting during migration
    if (props.devLoadBalancer) {
      new route53.ARecord(this, `DevRecord-${environmentSuffix}`, {
        zone: this.hostedZone,
        recordName: `dev.${domainName}`,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.devLoadBalancer)
        ),
      });
    }

    if (props.stagingLoadBalancer) {
      new route53.ARecord(this, `StagingRecord-${environmentSuffix}`, {
        zone: this.hostedZone,
        recordName: `staging.${domainName}`,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.stagingLoadBalancer)
        ),
      });
    }

    if (props.prodLoadBalancer) {
      // Production with weighted routing for blue-green deployment
      const weight = this.getWeightBasedOnPhase(migrationPhase);

      new route53.ARecord(this, `ProdRecord-${environmentSuffix}`, {
        zone: this.hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.prodLoadBalancer)
        ),
        weight: weight,
        setIdentifier: `prod-${environmentSuffix}`,
      });
    }

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `HostedZoneId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(',', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route53 Name Servers',
    });
  }

  private getWeightBasedOnPhase(phase: string): number {
    switch (phase) {
      case 'preparation':
        return 0; // No traffic to new environment
      case 'migration':
        return 25; // 25% traffic to new environment
      case 'cutover':
        return 75; // 75% traffic to new environment
      case 'complete':
        return 100; // All traffic to new environment
      default:
        return 0;
    }
  }
}
