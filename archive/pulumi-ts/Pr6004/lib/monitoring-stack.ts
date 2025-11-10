/**
 * monitoring-stack.ts
 *
 * CloudWatch monitoring, alarms, SNS notifications, and Route 53 health checks.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  albArn: pulumi.Output<string>;
  albTargetGroupArn: pulumi.Output<string>;
  asgName: pulumi.Output<string>;
  instanceIds: pulumi.Output<string[]>;
  clusterIdentifier: pulumi.Output<string>;
  maintenanceBucketWebsiteEndpoint: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      albArn,
      albTargetGroupArn,
      asgName,
      clusterIdentifier,
      tags,
    } = args;

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(
      `alerts-topic-${environmentSuffix}`,
      {
        name: `alerts-topic-${environmentSuffix}`,
        displayName: 'Infrastructure Alerts',
        tags: {
          Name: `alerts-topic-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // SNS Topic Subscription
    new aws.sns.TopicSubscription(
      `alerts-email-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: 'ops@company.com',
      },
      { parent: this }
    );

    // Extract ALB name from ARN
    const albName = albArn.apply(arn => {
      const parts = arn.split(':');
      const resourcePart = parts[parts.length - 1];
      return resourcePart.split('/').slice(1).join('/');
    });

    const targetGroupName = albTargetGroupArn.apply(arn => {
      const parts = arn.split(':');
      const resourcePart = parts[parts.length - 1];
      return resourcePart;
    });

    // CloudWatch Alarm - ALB Unhealthy Hosts
    new aws.cloudwatch.MetricAlarm(
      `alb-unhealthy-hosts-${environmentSuffix}`,
      {
        name: `alb-unhealthy-hosts-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        dimensions: {
          LoadBalancer: albName,
          TargetGroup: targetGroupName,
        },
        alarmDescription: 'Alert when unhealthy hosts detected',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `alb-unhealthy-hosts-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - ALB Target Response Time
    new aws.cloudwatch.MetricAlarm(
      `alb-response-time-${environmentSuffix}`,
      {
        name: `alb-response-time-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        dimensions: {
          LoadBalancer: albName,
        },
        alarmDescription: 'Alert when response time exceeds 1 second',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `alb-response-time-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - ASG Instance Termination
    new aws.cloudwatch.MetricAlarm(
      `asg-termination-${environmentSuffix}`,
      {
        name: `asg-termination-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'GroupTerminatingInstances',
        namespace: 'AWS/AutoScaling',
        period: 60,
        statistic: 'Sum',
        threshold: 0,
        dimensions: {
          AutoScalingGroupName: asgName,
        },
        alarmDescription: 'Alert when instances are terminating',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `asg-termination-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - RDS CPU Utilization
    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-${environmentSuffix}`,
      {
        name: `rds-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBClusterIdentifier: clusterIdentifier,
        },
        alarmDescription: 'Alert when RDS CPU exceeds 80%',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `rds-cpu-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - RDS Database Connections
    new aws.cloudwatch.MetricAlarm(
      `rds-connections-${environmentSuffix}`,
      {
        name: `rds-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBClusterIdentifier: clusterIdentifier,
        },
        alarmDescription: 'Alert when database connections exceed threshold',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `rds-connections-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - RDS Replica Lag
    new aws.cloudwatch.MetricAlarm(
      `rds-replica-lag-${environmentSuffix}`,
      {
        name: `rds-replica-lag-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'AuroraReplicaLag',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Maximum',
        threshold: 1000,
        dimensions: {
          DBClusterIdentifier: clusterIdentifier,
        },
        alarmDescription: 'Alert when replica lag exceeds 1 second',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `rds-replica-lag-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Export values
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
