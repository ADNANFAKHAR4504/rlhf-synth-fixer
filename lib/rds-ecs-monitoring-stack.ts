import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface RdsEcsMonitoringStackProps extends cdk.StackProps {
  readonly dbIdentifier?: string;
  readonly ecsServiceName?: string;
  readonly clusterName?: string;
  readonly environmentSuffix?: string;
  readonly projectName?: string;
}

export class RdsEcsMonitoringStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: RdsEcsMonitoringStackProps
  ) {
    super(scope, id, {
      ...props,
      terminationProtection: false,
    });

    const dbId = props?.dbIdentifier ?? 'payment-db';
    const ecsService = props?.ecsServiceName ?? 'payment-service';
    const cluster = props?.clusterName ?? 'payment-cluster';

    // Get environment suffix for unique resource naming
    let envSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
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
      this.node.tryGetContext('uniqueResourceSuffix') || 'default';

    const stackName = `tapstack-${envSuffix}-${uniqueResourceSuffix}`;

    const cpuUtilization = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      dimensionsMap: { ServiceName: ecsService, ClusterName: cluster },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const memoryUtilization = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'MemoryUtilization',
      dimensionsMap: { ServiceName: ecsService, ClusterName: cluster },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const dbConnections = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: { DBInstanceIdentifier: dbId },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const dbCpu = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensionsMap: { DBInstanceIdentifier: dbId },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const dashboard = new cloudwatch.Dashboard(this, 'RdsEcsDashboard', {
      dashboardName: `${dbId}-rds-ecs-dashboard-${stackName}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU Utilization',
        left: [cpuUtilization],
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Memory Utilization',
        left: [memoryUtilization],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Connections',
        left: [dbConnections],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [dbCpu],
      })
    );

    new cloudwatch.Alarm(this, 'HighEcsCpuAlarm', {
      alarmName: `ecs-cpu-utilization-high-${stackName}`,
      metric: cpuUtilization,
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'ECS CPU utilization > 80%',
    });

    new cloudwatch.Alarm(this, 'HighDbConnectionsAlarm', {
      alarmName: `rds-db-connections-high-${stackName}`,
      metric: dbConnections,
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'RDS DB connections high (>100)',
    });
  }
}
