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
import { PRIMARY_REGION, SECONDARY_REGIONS } from './utils/constants';

export interface TapStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
  alertEmail: string;
  environmentSuffix?: string;
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

    // Create global monitoring topic (region-specific)
    const globalAlertTopic = new sns.Topic(this, 'GlobalAlertTopic', {
      topicName: `financial-app-alerts-${this.region}-${environmentSuffix}`,
      displayName: `Financial Application Alerts - ${this.region} - ${environmentSuffix}`,
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
      enableBacktrack: false, // Backtrack not supported for Global Databases
      environmentSuffix: environmentSuffix,
      currentRegion: this.region, // Pass the current stack's region
    });

    // Deploy regional APIs
    this.deployRegionalInfrastructure(props);

    // Setup health check system (only for this stack's region)
    this.healthCheckSystem = new HealthCheckSystem(this, 'HealthCheckSystem', {
      regions: [this.region],
      regionalApis: this.regionalApis,
      globalDatabase: this.globalDatabase,
      alertTopic: globalAlertTopic,
      environmentSuffix: environmentSuffix,
    });

    // Setup failover orchestration (only for this stack's region)
    const failoverOrchestrator = new FailoverOrchestrator(
      this,
      'FailoverOrchestrator',
      {
        regions: [this.region],
        regionalApis: this.regionalApis,
        globalDatabase: this.globalDatabase,
        healthCheckSystem: this.healthCheckSystem,
        alertTopic: globalAlertTopic,
        environmentSuffix: environmentSuffix,
      }
    );

    // Setup global routing (only if domain is provided, otherwise outputs will show IP addresses)
    if (props.domainName && props.certificateArn) {
      this.setupGlobalRouting(props.domainName);
    } else {
      // For non-prod environments, output API endpoints as IPs
      this.outputApiEndpoints();
    }

    // Create global dashboard
    this.createGlobalDashboard();

    // Setup chaos testing system (only for this stack's region)
    if (this.node.tryGetContext('enableChaosTests')) {
      new ChaosTestingSystem(this, 'ChaosTestingSystem', {
        regions: [this.region],
        regionalApis: this.regionalApis,
        failoverOrchestrator: failoverOrchestrator,
        environmentSuffix: environmentSuffix,
      });
    }
  }

  private deployRegionalInfrastructure(props: TapStackProps) {
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Deploy resources for THIS stack's region only
    const regionalApi = new RegionalApi(this, `RegionalApi-${this.region}`, {
      region: this.region,
      isPrimary: this.region === PRIMARY_REGION,
      certificateArn: props.certificateArn,
      globalDatabase: this.globalDatabase,
      domainName: props.domainName
        ? `${this.region}.${props.domainName}`
        : undefined,
      environmentSuffix: environmentSuffix,
    });

    this.regionalApis.set(this.region, regionalApi);
  }

  private setupGlobalRouting(domainName: string) {
    // Only setup Route53 if hosted zone is available (production environments)
    if (this.hostedZone) {
      const primaryDomain =
        this.regionalApis.get(PRIMARY_REGION)!.apiGatewayDomainName;

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
          const regionalDomain =
            this.regionalApis.get(region)!.apiGatewayDomainName;

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
    // Output comprehensive information for testing
    for (const region of Array.from(this.regionalApis.keys())) {
      const api = this.regionalApis.get(region)!;

      // API Gateway URL
      new cdk.CfnOutput(this, `${region}-ApiEndpoint`, {
        value: api.api.url,
        description: `API Gateway endpoint for ${region}`,
        exportName: `${this.stackName}-${region}-api-endpoint`,
      });

      // API Gateway ID
      new cdk.CfnOutput(this, `${region}-ApiId`, {
        value: api.api.restApiId,
        description: `API Gateway ID for ${region}`,
        exportName: `${this.stackName}-${region}-api-id`,
      });

      // DynamoDB Table Name
      new cdk.CfnOutput(this, `${region}-SessionTableName`, {
        value: api.sessionTable.tableName,
        description: `DynamoDB session table for ${region}`,
        exportName: `${this.stackName}-${region}-session-table`,
      });

      // Transaction Processor Lambda ARN
      new cdk.CfnOutput(this, `${region}-TransactionProcessorArn`, {
        value: api.transactionProcessor.functionArn,
        description: `Transaction processor Lambda ARN for ${region}`,
        exportName: `${this.stackName}-${region}-txn-processor-arn`,
      });

      // Transaction Processor Lambda Name
      new cdk.CfnOutput(this, `${region}-TransactionProcessorName`, {
        value: api.transactionProcessor.functionName,
        description: `Transaction processor Lambda name for ${region}`,
      });
    }

    // Database outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.globalDatabase.primaryCluster.clusterEndpoint.hostname,
      description: `Database cluster endpoint for ${this.region}`,
      exportName: `${this.stackName}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.globalDatabase.primaryCluster.clusterEndpoint.port.toString(),
      description: 'Database cluster port',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.globalDatabase.credentials.secretArn,
      description: 'Database credentials secret ARN',
      exportName: `${this.stackName}-db-secret-arn`,
    });

    // Dashboard URL
    const dashboardUrl = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=financial-app-dr-${this.region}-${this.node.tryGetContext('environmentSuffix') || 'dev'}`;
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: dashboardUrl,
      description: 'CloudWatch dashboard URL',
    });

    // Health check Lambda ARN
    new cdk.CfnOutput(this, 'HealthCheckLambdaArn', {
      value: this.healthCheckSystem.getHealthCheckId(this.region) || 'N/A',
      description: 'Health check system identifier',
    });

    // Region info
    new cdk.CfnOutput(this, 'DeployedRegion', {
      value: this.region,
      description: 'AWS region where this stack is deployed',
    });

    new cdk.CfnOutput(this, 'IsPrimaryRegion', {
      value: (this.region === PRIMARY_REGION).toString(),
      description: 'Whether this is the primary region',
    });
  }

  private createGlobalDashboard() {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    const dashboard = new cloudwatch.Dashboard(this, 'GlobalDashboard', {
      dashboardName: `financial-app-dr-${this.region}-${environmentSuffix}`,
    });

    // Add widgets for this stack's region
    const widgets: cloudwatch.IWidget[] = [];

    for (const region of Array.from(this.regionalApis.keys())) {
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
