/**
 * Monitoring Stack - Creates CloudWatch alarms for ECS tasks
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, EcsOutputs } from './types';

export interface MonitoringStackArgs {
  config: EnvironmentConfig;
  ecsOutputs: EcsOutputs;
  clusterName: string;
  serviceName: string;
}

export class MonitoringStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    const { config, clusterName, serviceName } = args;

    if (!config.enableMonitoring) {
      this.registerOutputs({});
      return;
    }

    // Create SNS topic for alarms (optional, can be configured per environment)
    const alarmTopic = new aws.sns.Topic(
      `${config.environment}-alarm-topic-${config.environmentSuffix}`,
      {
        name: `${config.environment}-ecs-alarms-${config.environmentSuffix}`,
        tags: {
          ...config.tags,
          Name: `${config.environment}-alarm-topic-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CPU Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `${config.environment}-cpu-alarm-${config.environmentSuffix}`,
      {
        name: `${config.environment}-ecs-high-cpu-${config.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: `High CPU utilization on ${config.environment} ECS service`,
        dimensions: {
          ClusterName: clusterName,
          ServiceName: serviceName,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...config.tags,
          Name: `${config.environment}-cpu-alarm-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Memory Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `${config.environment}-memory-alarm-${config.environmentSuffix}`,
      {
        name: `${config.environment}-ecs-high-memory-${config.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: `High memory utilization on ${config.environment} ECS service`,
        dimensions: {
          ClusterName: clusterName,
          ServiceName: serviceName,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...config.tags,
          Name: `${config.environment}-memory-alarm-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Task Count Alarm (running tasks)
    new aws.cloudwatch.MetricAlarm(
      `${config.environment}-task-count-alarm-${config.environmentSuffix}`,
      {
        name: `${config.environment}-ecs-low-task-count-${config.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'RunningTaskCount',
        namespace: 'ECS/ContainerInsights',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: `Low running task count on ${config.environment} ECS service`,
        dimensions: {
          ClusterName: clusterName,
          ServiceName: serviceName,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...config.tags,
          Name: `${config.environment}-task-count-alarm-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      alarmTopicArn: alarmTopic.arn,
    });
  }
}
