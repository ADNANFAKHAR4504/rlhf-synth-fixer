import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { ChaosTestingSystem } from './constructs/chaos-testing';
import { FailoverOrchestrator } from './constructs/failover-orchestrator';
import { GlobalDatabase } from './constructs/global-database';
import { HealthCheckSystem } from './constructs/health-check';
import { RegionalApi } from './constructs/regional-api';
import { PRIMARY_REGION, REGIONS, SECONDARY_REGIONS } from './utils/constants';

export interface TapStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
  alertEmail: string;
  environmentSuffix?: string;
  useGlobalAccelerator?: boolean; // Use Global Accelerator instead of Route53
}

export class TapStack extends cdk.Stack {
  private globalDatabase: GlobalDatabase;
  private regionalApis: Map<string, RegionalApi> = new Map();
  private healthCheckSystem: HealthCheckSystem;
  private hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create global monitoring topic
    const globalAlertTopic = new sns.Topic(this, 'GlobalAlertTopic', {
      topicName: `financial-app-global-alerts-${environmentSuffix}`,
      displayName: `Financial Application Global Alerts - ${environmentSuffix}`
    });

    globalAlertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.alertEmail)
    );

    // Lookup hosted zone (commented out for LocalStack testing)
    // this.hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
    //   domainName: props.domainName,
    // });

    // Deploy global database
    this.globalDatabase = new GlobalDatabase(this, 'GlobalDatabase', {
      primaryRegion: PRIMARY_REGION,
      secondaryRegions: SECONDARY_REGIONS,
      databaseName: 'financial_transactions',
      backupRetentionDays: 30,
      enableBacktrack: true,
      environmentSuffix: environmentSuffix,
    });

    // Deploy regional APIs
    this.deployRegionalInfrastructure(props);

    // Setup health check system
    this.healthCheckSystem = new HealthCheckSystem(this, 'HealthCheckSystem', {
      regions: REGIONS,
      regionalApis: this.regionalApis,
      globalDatabase: this.globalDatabase,
      alertTopic: globalAlertTopic,
      environmentSuffix: environmentSuffix,
    });

    // Setup failover orchestration
    const failoverOrchestrator = new FailoverOrchestrator(this, 'FailoverOrchestrator', {
      regions: REGIONS,
      regionalApis: this.regionalApis,
      globalDatabase: this.globalDatabase,
      healthCheckSystem: this.healthCheckSystem,
      alertTopic: globalAlertTopic,
      environmentSuffix: environmentSuffix,
    });

    // Setup global routing (only if domain is provided, otherwise outputs will show IP addresses)
    if (props.domainName && props.certificateArn) {
      this.setupGlobalRouting(props.domainName);
    } else {
      // For non-prod environments, output API endpoints as IPs
      this.outputApiEndpoints();
    }

    // Create global dashboard
    this.createGlobalDashboard();

    // Setup chaos testing system
    if (this.node.tryGetContext('enableChaosTests')) {
      new ChaosTestingSystem(this, 'ChaosTestingSystem', {
        regions: REGIONS,
        regionalApis: this.regionalApis,
        failoverOrchestrator: failoverOrchestrator,
        environmentSuffix: environmentSuffix,
      });
    }
  }

  private deployRegionalInfrastructure(props: TapStackProps) {
    for (const region of REGIONS) {
      const regionalApi = new RegionalApi(this, `RegionalApi-${region}`, {
        region: region,
        isPrimary: region === PRIMARY_REGION,
        certificateArn: props.certificateArn,
        globalDatabase: this.globalDatabase,
        domainName: `${region}.${props.domainName}`,
      });

      this.regionalApis.set(region, regionalApi);
    }
  }

  private setupGlobalRouting(domainName: string) {
    // Only setup Route53 if hosted zone is available (production environments)
    if (this.hostedZone) {
      const primaryDomain = this.regionalApis.get(PRIMARY_REGION)!.apiGatewayDomainName;

      if (primaryDomain) {
        // Create Route53 record set with latency routing
        new route53.RecordSet(this, 'GlobalLatencyRouting', {
          recordType: route53.RecordType.A,
          recordName: `api.${domainName}`,
          zone: this.hostedZone,
          target: route53.RecordTarget.fromAlias(
            new route53Targets.ApiGatewayDomain(primaryDomain)
          ),
          setIdentifier: PRIMARY_REGION,
          region: PRIMARY_REGION,
        });

        // Add secondary regions
        for (const region of SECONDARY_REGIONS) {
          const regionalDomain = this.regionalApis.get(region)!.apiGatewayDomainName;

          if (regionalDomain) {
            new route53.RecordSet(this, `LatencyRouting-${region}`, {
              recordType: route53.RecordType.A,
              recordName: `api.${domainName}`,
              zone: this.hostedZone,
              target: route53.RecordTarget.fromAlias(
                new route53Targets.ApiGatewayDomain(regionalDomain)
              ),
              setIdentifier: region,
              region: region,
            });
          }
        }
      }
    }
  }

  private outputApiEndpoints() {
    // Output API endpoints for each region (for non-prod environments without custom domains)
    for (const region of REGIONS) {
      const api = this.regionalApis.get(region)!;
      new cdk.CfnOutput(this, `${region}-ApiEndpoint`, {
        value: api.api.url,
        description: `API Gateway endpoint for ${region}`,
        exportName: `${this.stackName}-${region}-api-endpoint`,
      });
    }
  }

  private createGlobalDashboard() {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    const dashboard = new cloudwatch.Dashboard(this, 'GlobalDashboard', {
      dashboardName: `financial-app-global-dr-${environmentSuffix}`,
    });

    // Add widgets for each region
    const widgets: cloudwatch.IWidget[] = [];

    for (const region of REGIONS) {
      const api = this.regionalApis.get(region)!;

      widgets.push(
        new cloudwatch.GraphWidget({
          title: `${region} - API Performance`,
          left: [api.latencyMetric, api.errorMetric],
          right: [api.requestCountMetric],
          leftYAxis: { label: 'Latency (ms)' },
          rightYAxis: { label: 'Count' },
          period: cdk.Duration.minutes(1),
          statistic: 'Average',
        })
      );

      // Only add replication lag widget for secondary regions
      if (region !== PRIMARY_REGION) {
        const metric = this.globalDatabase.getReplicationLagMetric(region);
        if (metric) {
          widgets.push(
            new cloudwatch.SingleValueWidget({
              title: `${region} - Database Replication Lag`,
              metrics: [metric],
              period: cdk.Duration.minutes(1),
            })
          );
        }
      }
    }

    dashboard.addWidgets(...widgets);
  }
}
