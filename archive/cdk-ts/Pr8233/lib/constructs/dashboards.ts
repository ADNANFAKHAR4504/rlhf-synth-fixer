// lib/constructs/dashboards.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface DashboardsConstructProps {
  alarms: Map<string, cloudwatch.Alarm>;
}

export class DashboardsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DashboardsConstructProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    let envSuffix =
      stack.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Sanitize envSuffix to handle bash syntax and invalid characters, then convert to lowercase
    // Handle bash variable syntax ${VAR:-default} by extracting the default value
    envSuffix = envSuffix
      .replace(/\$\{[^:]+:-(.+?)\}/g, '$1') // Extract default value from ${VAR:-default}
      .replace(/\$\{[^}]+\}/g, '') // Remove any remaining ${VAR} patterns without defaults
      .replace(/:/g, '') // Remove colons
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove other invalid chars, keep hyphens
      .toLowerCase();

    // Ensure we have a valid suffix
    if (!envSuffix || envSuffix.trim() === '') {
      envSuffix = 'dev';
    }

    // Get unique resource suffix to prevent conflicts
    const uniqueResourceSuffix =
      stack.node.tryGetContext('uniqueResourceSuffix') || 'default';

    const stackName = `tapstack-${envSuffix}-${uniqueResourceSuffix}`;

    // Keep a relative start window ("last 3 hours"); do NOT also set defaultInterval.
    const dashboard = new cloudwatch.Dashboard(
      this,
      'PaymentPlatformDashboard',
      {
        dashboardName: `payment-platform-monitoring-${stackName}`,
        start: '-PT3H', // Last 3 hours default view
        periodOverride: cloudwatch.PeriodOverride.AUTO,
      }
    );

    // Payment Transaction Metrics
    const paymentMetrics = new cloudwatch.GraphWidget({
      title: 'Payment Transaction Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentAttempts',
          statistic: 'Sum',
          label: 'Total Attempts',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentSuccess',
          statistic: 'Sum',
          label: 'Successful Payments',
        }),
      ],
      right: [
        new cloudwatch.MathExpression({
          expression: '(m2/m1)*100',
          usingMetrics: {
            m1: new cloudwatch.Metric({
              namespace: 'PaymentPlatform',
              metricName: 'PaymentAttempts',
              statistic: 'Sum',
            }),
            m2: new cloudwatch.Metric({
              namespace: 'PaymentPlatform',
              metricName: 'PaymentSuccess',
              statistic: 'Sum',
            }),
          },
          label: 'Success Rate %',
          color: cloudwatch.Color.GREEN,
        }),
      ],
      width: 12,
      height: 6,
    });

    // API Latency Percentiles
    const apiLatency = new cloudwatch.GraphWidget({
      title: 'API Latency Percentiles',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: 'PaymentAPI' },
          statistic: 'p50',
          label: 'p50',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: 'PaymentAPI' },
          statistic: 'p95',
          label: 'p95',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: 'PaymentAPI' },
          statistic: 'p99',
          label: 'p99',
          color: cloudwatch.Color.RED,
        }),
      ],
      width: 12,
      height: 6,
      leftAnnotations: [
        { value: 500, label: 'SLA Threshold', color: cloudwatch.Color.ORANGE },
      ],
    });

    // Error Rates by Payment Method
    const errorRates = new cloudwatch.GraphWidget({
      title: 'Error Rates by Payment Method',
      left: [
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentErrors',
          dimensionsMap: { PaymentMethod: 'CreditCard' },
          statistic: 'Average',
          label: 'Credit Card',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentErrors',
          dimensionsMap: { PaymentMethod: 'DebitCard' },
          statistic: 'Average',
          label: 'Debit Card',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentErrors',
          dimensionsMap: { PaymentMethod: 'BankTransfer' },
          statistic: 'Average',
          label: 'Bank Transfer',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Database Metrics
    const databaseMetrics = new cloudwatch.GraphWidget({
      title: 'Database Performance',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: { DBClusterIdentifier: 'payment-db-cluster' },
          statistic: 'Average',
          label: 'Active Connections',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: { DBClusterIdentifier: 'payment-db-cluster' },
          statistic: 'Average',
          label: 'CPU %',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadLatency',
          dimensionsMap: { DBClusterIdentifier: 'payment-db-cluster' },
          statistic: 'Average',
          label: 'Read Latency (ms)',
          color: cloudwatch.Color.PURPLE,
        }),
      ],
      width: 12,
      height: 6,
    });

    // ECS Service Metrics
    const ecsMetrics = new cloudwatch.GraphWidget({
      title: 'ECS Service Health',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            ServiceName: 'payment-service',
            ClusterName: 'payment-cluster',
          },
          statistic: 'Average',
          label: 'CPU Utilization',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'MemoryUtilization',
          dimensionsMap: {
            ServiceName: 'payment-service',
            ClusterName: 'payment-cluster',
          },
          statistic: 'Average',
          label: 'Memory Utilization',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Alarm Status
    const alarmStatus = new cloudwatch.AlarmStatusWidget({
      title: 'Alarm Status',
      alarms: Array.from(props.alarms.values()),
      width: 12,
      height: 4,
    });

    // Business KPIs
    const businessMetrics = new cloudwatch.GraphWidget({
      title: 'Business KPIs by Merchant',
      left: [
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform/Business',
          metricName: 'MerchantTransactionVolume',
          dimensionsMap: { MerchantTier: 'Premium' },
          statistic: 'Sum',
          label: 'Premium Merchants',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform/Business',
          metricName: 'MerchantTransactionVolume',
          dimensionsMap: { MerchantTier: 'Standard' },
          statistic: 'Sum',
          label: 'Standard Merchants',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(paymentMetrics, apiLatency);
    dashboard.addWidgets(errorRates, databaseMetrics);
    dashboard.addWidgets(ecsMetrics, businessMetrics);
    dashboard.addWidgets(alarmStatus);

    // ───────────────────────────────────────────────
    // Contributor Insights Rules (fixed rule bodies)
    // ───────────────────────────────────────────────
    const apiAccessLogGroup = '/aws/apigateway/payment-api';

    new cloudwatch.CfnInsightRule(this, 'TopAPICallers', {
      ruleName: `PaymentAPI-TopCallers-${stackName}`,
      ruleState: 'ENABLED',
      ruleBody: JSON.stringify({
        Schema: { Name: 'CloudWatchLogRule', Version: 1 },
        LogFormat: 'JSON',
        LogGroupNames: [apiAccessLogGroup],
        Contribution: {
          Keys: ['$.clientIp'],
          // Only include events that have a clientIp
          Filters: [{ Match: '$.clientIp', IsPresent: true }],
        },
        AggregateOn: 'Count',
      }),
    });

    new cloudwatch.CfnInsightRule(this, 'TopErrorEndpoints', {
      ruleName: `PaymentAPI-TopErrorEndpoints-${stackName}`,
      ruleState: 'ENABLED',
      ruleBody: JSON.stringify({
        Schema: { Name: 'CloudWatchLogRule', Version: 1 },
        LogFormat: 'JSON',
        LogGroupNames: [apiAccessLogGroup],
        Contribution: {
          Keys: ['$.path'],
          // Only 4xx/5xx responses
          Filters: [{ Match: '$.statusCode', GreaterThan: 399 }],
        },
        AggregateOn: 'Count',
      }),
    });
  }
}
