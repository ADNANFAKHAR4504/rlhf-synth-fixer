import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { RdsStack } from './rds';
import { AutoScalingStack } from './auto-scaling';
import { LoadBalancerStack } from './load-balancer';

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly snsTopicName: pulumi.Output<string>;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      rdsStack: RdsStack;
      autoScalingStack: AutoScalingStack;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // SNS Topic for alerts
    const snsTopic = new aws.sns.Topic(
      `${args.environment}-alerts-topic`,
      {
        name: `${args.environment}-infrastructure-alerts`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-Alerts`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.snsTopicArn = snsTopic.arn;
    this.snsTopicName = snsTopic.name;

    // RDS CPU Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-rds-cpu-alarm`,
      {
        name: `${args.environment}-rds-high-cpu`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        alarmActions: [snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsStack.primaryRdsInstance.identifier,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    // RDS Database Connections Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-rds-connections-alarm`,
      {
        name: `${args.environment}-rds-high-connections`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 50,
        alarmDescription: 'RDS database connections are too high',
        alarmActions: [snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsStack.primaryRdsInstance.identifier,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Target Health Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-alb-unhealthy-targets`,
      {
        name: `${args.environment}-alb-unhealthy-targets`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'ALB has unhealthy targets',
        alarmActions: [snsTopic.arn],
        dimensions: {
          TargetGroup: args.loadBalancerStack.targetGroup.arnSuffix,
          LoadBalancer:
            args.loadBalancerStack.applicationLoadBalancer.arnSuffix,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Response Time Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-alb-response-time`,
      {
        name: `${args.environment}-alb-high-response-time`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 5,
        alarmDescription: 'ALB response time is too high',
        alarmActions: [snsTopic.arn],
        dimensions: {
          LoadBalancer:
            args.loadBalancerStack.applicationLoadBalancer.arnSuffix,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
      snsTopicName: this.snsTopicName,
    });
  }
}
