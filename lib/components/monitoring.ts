// lib/components/monitoring.ts

/**
 * Monitoring Infrastructure Component
 * Creates Amazon SNS Topic and configures CloudWatch Alarms for various services.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringInfrastructureArgs {
  tags: { [key: string]: string };
  emailEndpoint?: string; // Optional email for SNS subscription
}

export class MonitoringInfrastructure extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicSubscription: aws.sns.TopicSubscription;
  private readonly __name: string; // Add the missing __name property

  constructor(
    name: string,
    args: MonitoringInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:Infrastructure', name, {}, opts);

    // Store the name for use in alarm creation
    this.__name = name;

    // SNS Topic for alerts
    this.snsTopic = new aws.sns.Topic(
      `${name}-alerts-topic`,
      {
        name: `${name}-alerts`,
        tags: args.tags,
      },
      { parent: this }
    );

    // SNS Topic Subscription (email)
    this.snsTopicSubscription = new aws.sns.TopicSubscription(
      `${name}-email-subscription`,
      {
        topic: this.snsTopic.arn,
        protocol: 'email',
        endpoint: args.emailEndpoint || 'your-alert-email@example.com',
      },
      {
        parent: this,
        dependsOn: [this.snsTopic],
      }
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      snsTopicName: this.snsTopic.name,
    });
  }

  /**
   * Configures CloudWatch Alarms for various deployed services.
   */
  public setupAlarms(
    lambdaFunctionNames: pulumi.Output<string>[],
    kinesisStreamName: pulumi.Output<string>,
    cloudfrontDistributionId: pulumi.Output<string>,
    opts?: pulumi.ResourceOptions
  ): void {
    const defaultOpts = opts || { parent: this };

    // Lambda Error Alarms
    lambdaFunctionNames.forEach(lambdaNameOutput => {
      lambdaNameOutput.apply(name => {
        const sanitizedName = name.replace(/-/g, '');

        new aws.cloudwatch.MetricAlarm(
          `${this.__name}-${sanitizedName}-errors-alarm`,
          {
            name: `${this.__name}-${name}-errors`,
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            evaluationPeriods: 1,
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            period: 60,
            statistic: 'Sum',
            threshold: 1,
            dimensions: {
              FunctionName: name,
            },
            alarmDescription: `Alarm when Lambda function ${name} reports errors`,
            alarmActions: [this.snsTopic.arn],
            okActions: [this.snsTopic.arn],
          },
          defaultOpts
        );

        return name; // Return the name for the apply chain
      });
    });

    // Kinesis PutRecord.Errors Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.__name}-kinesis-put-errors-alarm`,
      {
        name: pulumi.interpolate`${this.__name}-kinesis-put-record-errors`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        metricName: 'PutRecord.Errors',
        namespace: 'AWS/Kinesis',
        period: 60,
        statistic: 'Sum',
        threshold: 1,
        dimensions: {
          StreamName: kinesisStreamName,
        },
        alarmDescription:
          'Alarm when Kinesis PutRecord operations experience errors',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
      },
      defaultOpts
    );

    // CloudFront Error Rate Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.__name}-cloudfront-error-rate-alarm`,
      {
        name: pulumi.interpolate`${this.__name}-cloudfront-error-rate`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        metricName: '4xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 1.0,
        dimensions: {
          DistributionId: cloudfrontDistributionId,
          Region: 'Global',
        },
        alarmDescription: 'Alarm when CloudFront error rate is high',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
      },
      defaultOpts
    );
  }

  /**
   * Setup additional custom alarms for specific metrics
   */
  public setupCustomAlarms(
    customAlarms: CustomAlarmConfig[],
    opts?: pulumi.ResourceOptions
  ): void {
    const defaultOpts = opts || { parent: this };

    customAlarms.forEach((config, index) => {
      new aws.cloudwatch.MetricAlarm(
        `${this.__name}-custom-alarm-${index}`,
        {
          name: config.name,
          comparisonOperator: config.comparisonOperator,
          evaluationPeriods: config.evaluationPeriods,
          metricName: config.metricName,
          namespace: config.namespace,
          period: config.period,
          statistic: config.statistic,
          threshold: config.threshold,
          dimensions: config.dimensions,
          alarmDescription: config.description,
          alarmActions: [this.snsTopic.arn],
          okActions: [this.snsTopic.arn],
        },
        defaultOpts
      );
    });
  }
}

/**
 * Interface for custom alarm configuration
 */
export interface CustomAlarmConfig {
  name: string;
  comparisonOperator: string;
  evaluationPeriods: number;
  metricName: string;
  namespace: string;
  period: number;
  statistic: string;
  threshold: number;
  dimensions: { [key: string]: pulumi.Input<string> };
  description: string;
}
