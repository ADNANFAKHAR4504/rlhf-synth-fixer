import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface Route53StackProps extends cdk.StackProps {
  domainName: string;
  applicationName: string;
  environment: 'production' | 'development';
  loadBalancers: { [region: string]: elbv2.IApplicationLoadBalancer };
  primaryRegion: string;
}

export class Route53Stack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const {
      domainName,
      applicationName,
      environment,
      loadBalancers,
      primaryRegion,
    } = props;

    // Create or import hosted zone
    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: domainName,
    });

    // Create health checks and failover records
    Object.entries(loadBalancers).forEach(([region, loadBalancer]) => {
      const isPrimary = region === primaryRegion;

      // Create A record with weighted routing (failover not directly supported)
      new route53.ARecord(this, `ARecord${region}`, {
        zone: this.hostedZone,
        recordName: `${environment}.${domainName}`,
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(loadBalancer)
        ),
        weight: isPrimary ? 100 : 50,
        setIdentifier: region,
      });

      // Create health check for each region
      new route53.CfnHealthCheck(this, `HealthCheck${region}`, {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/',
          fullyQualifiedDomainName: loadBalancer.loadBalancerDnsName,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `${applicationName}-${environment}-${region}-healthcheck`,
          },
          {
            key: 'Environment',
            value: environment,
          },
          {
            key: 'Region',
            value: region,
          },
        ],
      });
    });

    // Store hosted zone ID in Parameter Store
    new ssm.StringParameter(this, 'HostedZoneIdParameter', {
      parameterName: `/${applicationName}/${environment}/route53/hosted-zone-id`,
      stringValue: this.hostedZone.hostedZoneId,
      description: `Route53 Hosted Zone ID for ${applicationName} ${environment}`,
    });

    // Tags
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Application', applicationName);

    // Output
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${id}-HostedZoneId`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(',', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route53 Name Servers',
      exportName: `${id}-NameServers`,
    });
  }
}
