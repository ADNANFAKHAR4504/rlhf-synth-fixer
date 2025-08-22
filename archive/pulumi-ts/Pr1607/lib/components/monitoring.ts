/**
 * Monitoring Infrastructure Component
 * Handles CloudWatch dashboards, alarms, and SNS notifications
 */

import * as aws from '@pulumi/aws';
import {
  ComponentResource,
  ComponentResourceOptions,
  Output,
} from '@pulumi/pulumi';

interface MonitoringInfrastructureArgs {
  region: string;
  environment: string;
  tags: Record<string, string>;
}

export class MonitoringInfrastructure extends ComponentResource {
  private readonly region: string;
  private readonly environment: string;
  private readonly tags: Record<string, string>;
  private readonly regionSuffix: string;

  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicPolicy: aws.sns.TopicPolicy;
  public readonly dashboard: aws.cloudwatch.Dashboard;

  constructor(
    name: string,
    args: MonitoringInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:Monitoring', name, {}, opts);

    this.region = args.region;
    this.environment = args.environment;
    this.tags = args.tags;
    this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');

    this.snsTopic = this.createSnsTopic();
    this.snsTopicPolicy = this.createSnsTopicPolicy();
    this.dashboard = this.createDashboard();

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      dashboardName: this.dashboard.dashboardName,
    });
  }

  /**
   * Create SNS Topic for alerts
   */
  private createSnsTopic(): aws.sns.Topic {
    return new aws.sns.Topic(
      `nova-alerts-${this.regionSuffix}`,
      {
        name: `nova-alerts-${this.regionSuffix}`,
        displayName: `Nova Alerts - ${this.region}`,
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create SNS Topic Policy
   */
  private createSnsTopicPolicy(): aws.sns.TopicPolicy {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'cloudwatch.amazonaws.com',
          },
          Action: 'sns:Publish',
          Resource: this.snsTopic.arn,
        },
      ],
    };

    return new aws.sns.TopicPolicy(
      `nova-alerts-policy-${this.regionSuffix}`,
      {
        arn: this.snsTopic.arn,
        policy: JSON.stringify(policyDocument),
      },
      { parent: this }
    );
  }

  /**
   * Create CloudWatch Dashboard
   */
  private createDashboard(): aws.cloudwatch.Dashboard {
    const dashboardBody = JSON.stringify({
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['AWS/ApplicationELB', 'RequestCount'],
              ['AWS/ApplicationELB', 'TargetResponseTime'],
              ['AWS/ApplicationELB', 'HTTPCode_Target_5XX_Count'],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'Nova Application Metrics',
            period: 300,
          },
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [['AWS/ElasticBeanstalk', 'EnvironmentHealth']],
            view: 'timeSeries',
            stacked: false,
            region: this.region,
            title: 'Environment Health',
            period: 300,
          },
        },
      ],
    });

    return new aws.cloudwatch.Dashboard(
      `nova-dashboard-${this.regionSuffix}`,
      {
        dashboardName: `nova-dashboard-${this.regionSuffix}`,
        dashboardBody: dashboardBody,
      },
      { parent: this }
    );
  }

  /**
   * Create CPU High Alarm
   */
  public createCpuAlarm(
    environmentName: Output<string>,
    asgName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-cpu-alarm-${this.regionSuffix}`,
      {
        name: `nova-cpu-high-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          AutoScalingGroupName: asgName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create 5XX Error Alarm
   */
  public createErrorAlarm(
    environmentName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-error-alarm-${this.regionSuffix}`,
      {
        name: `nova-5xx-errors-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'This metric monitors 5XX errors',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: environmentName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create Environment Health Alarm
   */
  public createHealthAlarm(
    environmentName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-health-alarm-${this.regionSuffix}`,
      {
        name: `nova-env-health-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'EnvironmentHealth',
        namespace: 'AWS/ElasticBeanstalk',
        period: 60,
        statistic: 'Average',
        threshold: 15,
        alarmDescription: 'This metric monitors environment health',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          EnvironmentName: environmentName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create Response Time Alarm
   */
  public createResponseTimeAlarm(
    lbFullName: Output<string>
  ): aws.cloudwatch.MetricAlarm {
    return new aws.cloudwatch.MetricAlarm(
      `nova-response-time-alarm-${this.regionSuffix}`,
      {
        name: `nova-response-time-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'This metric monitors response time',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: lbFullName,
        },
        tags: this.tags,
      },
      { parent: this }
    );
  }

  // Property getters for easy access
  public get snsTopicArn(): Output<string> {
    return this.snsTopic.arn;
  }

  public get dashboardName(): Output<string> {
    return this.dashboard.dashboardName;
  }
}
