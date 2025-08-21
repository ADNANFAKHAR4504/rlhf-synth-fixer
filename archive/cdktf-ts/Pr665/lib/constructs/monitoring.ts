import { Construct } from 'constructs';
import {
  cloudwatchMetricAlarm,
  cloudwatchDashboard,
  snsTopicPolicy,
  snsTopic,
  snsTopicSubscription,
  budgetsBudget,
  dataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface MonitoringProps {
  config: AppConfig;
  albArn: string;
  asgName: string;
  rdsInstanceId: string;
  cloudfrontDistributionId: string;
}

export class MonitoringConstruct extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly dashboard: cloudwatchDashboard.CloudwatchDashboard;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    const { config, albArn, asgName, rdsInstanceId, cloudfrontDistributionId } =
      props;

    this.snsTopic = new snsTopic.SnsTopic(this, 'alerts-topic', {
      name: `${config.projectName}-${config.environment}-alerts`,
      displayName: `${config.projectName} Alerts`,
      tags: config.tags,
    });

    new snsTopicPolicy.SnsTopicPolicy(this, 'alerts-topic-policy', {
      arn: this.snsTopic.arn,
      policy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'sns-topic-policy-doc',
        {
          statement: [
            {
              sid: 'AllowCloudWatchToPublish',
              effect: 'Allow',
              principals: [
                {
                  type: 'Service',
                  identifiers: ['cloudwatch.amazonaws.com'],
                },
              ],
              actions: ['SNS:Publish'],
              resources: [this.snsTopic.arn],
            },
            {
              sid: 'AllowBudgetsToPublish',
              effect: 'Allow',
              principals: [
                {
                  type: 'Service',
                  identifiers: ['budgets.amazonaws.com'],
                },
              ],
              actions: ['SNS:Publish'],
              resources: [this.snsTopic.arn],
            },
          ],
        }
      ).json,
    });

    new snsTopicSubscription.SnsTopicSubscription(this, 'email-alerts', {
      topicArn: this.snsTopic.arn,
      protocol: 'email',
      endpoint: 'admin@example.com',
    });

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'alb-response-time-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-alb-high-response-time`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'This metric monitors ALB response time',
        dimensions: {
          LoadBalancer: albArn.split(':loadbalancer/')[1] || albArn,
        },
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        tags: config.tags,
      }
    );

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'alb-http-5xx-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-alb-5xx-errors`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_ELB_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'This metric monitors ALB 5xx errors',
        dimensions: {
          LoadBalancer: albArn.split(':loadbalancer/')[1] || albArn,
        },
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        tags: config.tags,
      }
    );

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `${config.projectName}-${config.environment}-rds-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors RDS CPU utilization',
      dimensions: {
        DBInstanceIdentifier: rdsInstanceId,
      },
      alarmActions: [this.snsTopic.arn],
      okActions: [this.snsTopic.arn],
      tags: config.tags,
    });

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-connection-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-rds-high-connections`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 50,
        alarmDescription: 'This metric monitors RDS connection count',
        dimensions: {
          DBInstanceIdentifier: rdsInstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        tags: config.tags,
      }
    );

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-free-storage-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-rds-low-free-storage`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 2000000000,
        alarmDescription:
          'This metric monitors RDS free storage space (2GB threshold)',
        dimensions: {
          DBInstanceIdentifier: rdsInstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        tags: config.tags,
      }
    );

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'cloudfront-4xx-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-cloudfront-4xx-errors`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '4xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 5,
        alarmDescription: 'This metric monitors CloudFront 4xx error rate',
        dimensions: {
          DistributionId: cloudfrontDistributionId,
        },
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        tags: config.tags,
      }
    );

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'cloudfront-5xx-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-cloudfront-5xx-errors`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'This metric monitors CloudFront 5xx error rate',
        dimensions: {
          DistributionId: cloudfrontDistributionId,
        },
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        tags: config.tags,
      }
    );

    this.dashboard = new cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: `${config.projectName}-${config.environment}-dashboard`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/EC2',
                    'CPUUtilization',
                    'AutoScalingGroupName',
                    asgName,
                  ],
                  [
                    'AWS/ApplicationELB',
                    'TargetResponseTime',
                    'LoadBalancer',
                    `${albArn.split(':loadbalancer/')[1] || albArn}`,
                  ],
                  [
                    'AWS/RDS',
                    'CPUUtilization',
                    'DBInstanceIdentifier',
                    rdsInstanceId,
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: config.region,
                title: 'System Performance Overview',
                yAxis: {
                  left: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
            {
              type: 'metric',
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/ApplicationELB',
                    'RequestCount',
                    'LoadBalancer',
                    `${albArn.split(':loadbalancer/')[1] || albArn}`,
                  ],
                  ['.', 'HTTPCode_Target_2XX_Count', '.', '.'],
                  ['.', 'HTTPCode_ELB_5XX_Count', '.', '.'],
                  [
                    'AWS/CloudFront',
                    'Requests',
                    'DistributionId',
                    cloudfrontDistributionId,
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: config.region,
                title: 'Request Metrics',
              },
            },
            {
              type: 'metric',
              x: 0,
              y: 12,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/RDS',
                    'DatabaseConnections',
                    'DBInstanceIdentifier',
                    rdsInstanceId,
                  ],
                  ['.', 'FreeStorageSpace', '.', '.'],
                  ['.', 'ReadLatency', '.', '.'],
                  ['.', 'WriteLatency', '.', '.'],
                ],
                period: 300,
                stat: 'Average',
                region: config.region,
                title: 'Database Metrics',
              },
            },
          ],
        }),
      }
    );

    new budgetsBudget.BudgetsBudget(this, 'monthly-budget', {
      name: `${config.projectName}-${config.environment}-monthly-budget`,
      budgetType: 'COST',
      limitAmount: '100',
      limitUnit: 'USD',
      timeUnit: 'MONTHLY',
      timePeriodStart: '2025-01-01_00:00',

      costFilter: [
        {
          name: 'Service',
          values: ['Amazon Elastic Compute Cloud - Compute'],
        },
      ],

      notification: [
        {
          comparisonOperator: 'GREATER_THAN',
          threshold: 80,
          thresholdType: 'PERCENTAGE',
          notificationType: 'ACTUAL',
          subscriberEmailAddresses: ['admin@example.com'],
          subscriberSnsTopicArns: [this.snsTopic.arn],
        },
        {
          comparisonOperator: 'GREATER_THAN',
          threshold: 100,
          thresholdType: 'PERCENTAGE',
          notificationType: 'FORECASTED',
          subscriberEmailAddresses: ['admin@example.com'],
          subscriberSnsTopicArns: [this.snsTopic.arn],
        },
      ],

      tags: config.tags,
    });
  }
}
