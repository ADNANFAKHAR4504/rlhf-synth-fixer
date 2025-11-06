import { Construct } from 'constructs';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { EnvironmentConfig } from './environment-config';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  tableName: string;
}

export class MonitoringConstruct extends Construct {
  public readonly snsTopic: SnsTopic;
  public readonly snsTopicArn: string;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { environmentSuffix, config, tableName } = props;

    // Create SNS topic for alerts
    this.snsTopic = new SnsTopic(this, 'AlertTopic', {
      name: `infrastructure-alerts-${environmentSuffix}`,
      displayName: `Infrastructure Alerts - ${config.environment}`,
      tags: {
        Name: `infrastructure-alerts-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    this.snsTopicArn = this.snsTopic.arn;

    // Subscribe email to SNS topic
    new SnsTopicSubscription(this, 'AlertEmailSubscription', {
      topicArn: this.snsTopic.arn,
      protocol: 'email',
      endpoint: config.snsEmail,
    });

    // Base thresholds (will be multiplied by environment-specific multiplier)
    const baseReadThreshold = 100;
    const baseWriteThreshold = 100;

    // Create CloudWatch alarms for DynamoDB read capacity
    new CloudwatchMetricAlarm(this, 'ReadCapacityAlarm', {
      alarmName: `dynamodb-read-capacity-${environmentSuffix}`,
      alarmDescription: `DynamoDB read capacity alarm for ${config.environment} environment`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ConsumedReadCapacityUnits',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: baseReadThreshold * config.alarmThresholdMultiplier,
      treatMissingData: 'notBreaching',
      dimensions: {
        TableName: tableName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `dynamodb-read-capacity-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    // Create CloudWatch alarms for DynamoDB write capacity
    new CloudwatchMetricAlarm(this, 'WriteCapacityAlarm', {
      alarmName: `dynamodb-write-capacity-${environmentSuffix}`,
      alarmDescription: `DynamoDB write capacity alarm for ${config.environment} environment`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ConsumedWriteCapacityUnits',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: baseWriteThreshold * config.alarmThresholdMultiplier,
      treatMissingData: 'notBreaching',
      dimensions: {
        TableName: tableName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `dynamodb-write-capacity-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    // Create CloudWatch alarm for DynamoDB throttled requests
    new CloudwatchMetricAlarm(this, 'ThrottledRequestsAlarm', {
      alarmName: `dynamodb-throttled-requests-${environmentSuffix}`,
      alarmDescription: `DynamoDB throttled requests alarm for ${config.environment} environment`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'UserErrors',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      treatMissingData: 'notBreaching',
      dimensions: {
        TableName: tableName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `dynamodb-throttled-requests-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });
  }
}
