import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { GlobalDatabase } from './global-database';
import { RegionalApi } from './regional-api';

export interface HealthCheckSystemProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  globalDatabase: GlobalDatabase;
  alertTopic: sns.ITopic;
  environmentSuffix?: string;
}

export class HealthCheckSystem extends Construct {
  private healthChecks: Map<string, route53.CfnHealthCheck> = new Map();
  private healthMetrics: Map<string, cloudwatch.Metric> = new Map();

  constructor(scope: Construct, id: string, props: HealthCheckSystemProps) {
    super(scope, id);

    // Create comprehensive health check Lambda
    const envSuffix = props.environmentSuffix || 'dev';
    const stackRegion = cdk.Stack.of(this).region;

    const healthCheckerLogGroup = new logs.LogGroup(
      this,
      'HealthCheckerLogGroup',
      {
        logGroupName: `/aws/lambda/financial-app-health-checker-${stackRegion}-${envSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const healthChecker = new lambda.Function(this, 'HealthChecker', {
      functionName: `financial-app-health-checker-${stackRegion}-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/health-checker'),
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      environment: {
        ALERT_TOPIC_ARN: props.alertTopic.topicArn,
      },
      logGroup: healthCheckerLogGroup,
    });

    props.alertTopic.grantPublish(healthChecker);

    // Create health checks for each region
    for (const region of props.regions) {
      const api = props.regionalApis.get(region)!;

      // Route53 health check (only if custom domain is configured)
      if (api.apiGatewayDomainName) {
        const healthCheck = new route53.CfnHealthCheck(
          this,
          `HealthCheck-${region}`,
          {
            healthCheckConfig: {
              port: 443,
              type: 'HTTPS',
              resourcePath: '/health',
              fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
              requestInterval: 30,
              failureThreshold: 2,
              measureLatency: true,
            },
          }
        );

        this.healthChecks.set(region, healthCheck);
      }

      // Create custom health metric
      const healthMetric = new cloudwatch.Metric({
        namespace: 'FinancialApp/Health',
        metricName: 'RegionHealth',
        dimensionsMap: {
          Region: region,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      });

      this.healthMetrics.set(region, healthMetric);

      // Schedule comprehensive health checks
      const apiEndpoint = api.apiGatewayDomainName
        ? `https://${api.apiGatewayDomainName.domainName}`
        : api.api.url;

      new events.Rule(this, `HealthCheckRule-${region}`, {
        schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
        targets: [
          new targets.LambdaFunction(healthChecker, {
            event: events.RuleTargetInput.fromObject({
              region: region,
              apiEndpoint: apiEndpoint,
              dbConnectionString:
                props.globalDatabase.getConnectionString(region),
              checks: [
                'api_latency',
                'database_connection',
                'database_replication_lag',
                'transaction_processing',
                'session_consistency',
              ],
            }),
          }),
        ],
      });
    }

    // Create composite health dashboard
    this.createHealthDashboard(props.regions);
  }

  private createHealthDashboard(regions: string[]) {
    const envSuffix =
      cdk.Stack.of(this).node.tryGetContext('environmentSuffix') || 'dev';
    const stackRegion = cdk.Stack.of(this).region;
    const dashboard = new cloudwatch.Dashboard(this, 'HealthDashboard', {
      dashboardName: `financial-app-health-${stackRegion}-${envSuffix}`,
    });

    const widgets = regions.map(
      region =>
        new cloudwatch.GraphWidget({
          title: `${region} Health Score`,
          left: [this.healthMetrics.get(region)!],
          leftYAxis: {
            min: 0,
            max: 100,
          },
          period: cdk.Duration.minutes(1),
        })
    );

    dashboard.addWidgets(...widgets);
  }

  public getHealthCheckId(region: string): string | undefined {
    const healthCheck = this.healthChecks.get(region);
    return healthCheck?.attrHealthCheckId;
  }
}
