/**
 * monitoring-stack.ts
 *
 * CloudWatch alarms for database lag monitoring and EventBridge cross-region replication.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  globalClusterId: pulumi.Output<string>;
  primaryClusterId: pulumi.Output<string>;
  secondaryClusterId: pulumi.Output<string>;
  healthCheckId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(
      `monitoring-primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `monitoring-secondary-provider-${environmentSuffix}`,
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    // SNS Topic for Alarms
    const snsTopic = new aws.sns.Topic(
      `dr-alarms-topic-${environmentSuffix}`,
      {
        name: `dr-alarms-topic-${environmentSuffix}`,
        tags: {
          ...tags,
          Name: `dr-alarms-topic-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // ...existing code...

    // CloudWatch Alarm for Health Check
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _healthCheckAlarm = new aws.cloudwatch.MetricAlarm(
      `health-check-alarm-${environmentSuffix}`,
      {
        name: `health-check-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Alert when primary health check fails',
        alarmActions: [snsTopic.arn],
        dimensions: {
          HealthCheckId: args.healthCheckId,
        },
        tags: {
          ...tags,
          Name: `health-check-alarm-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge Event Bus
    const eventBus = new aws.cloudwatch.EventBus(
      `dr-event-bus-${environmentSuffix}`,
      {
        name: `dr-event-bus-${environmentSuffix}`,
        tags: {
          ...tags,
          Name: `dr-event-bus-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // DLQ for EventBridge
    const dlqQueue = new aws.sqs.Queue(
      `dr-dlq-${environmentSuffix}`,
      {
        name: `dr-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...tags,
          Name: `dr-dlq-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Target Event Bus in Secondary Region
    const secondaryEventBus = new aws.cloudwatch.EventBus(
      `dr-secondary-event-bus-${environmentSuffix}`,
      {
        name: `dr-secondary-event-bus-${environmentSuffix}`,
        tags: {
          ...tags,
          Name: `dr-secondary-event-bus-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // IAM Role for EventBridge
    const eventBridgeRole = new aws.iam.Role(
      `eventbridge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `eventbridge-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge Role Policy
    const eventBridgePolicy = new aws.iam.RolePolicy(
      `eventbridge-policy-${environmentSuffix}`,
      {
        role: eventBridgeRole.id,
        policy: pulumi
          .all([secondaryEventBus.arn, dlqQueue.arn])
          .apply(([busArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 'events:PutEvents',
                  Resource: busArn,
                },
                {
                  Effect: 'Allow',
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                },
              ],
            })
          ),
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge Rule for Cross-Region Replication
    const eventRule = new aws.cloudwatch.EventRule(
      `dr-event-rule-${environmentSuffix}`,
      {
        name: `dr-event-rule-${environmentSuffix}`,
        eventBusName: eventBus.name,
        description: 'Replicate critical events to secondary region',
        eventPattern: JSON.stringify({
          source: ['custom.transactions'],
          'detail-type': ['Transaction Processed', 'Transaction Failed'],
        }),
        tags: {
          ...tags,
          Name: `dr-event-rule-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge Target
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _eventTarget = new aws.cloudwatch.EventTarget(
      `dr-event-target-${environmentSuffix}`,
      {
        rule: eventRule.name,
        eventBusName: eventBus.name,
        arn: secondaryEventBus.arn,
        roleArn: eventBridgeRole.arn,
        // Note: Retry policy is not supported for Event bus targets
        deadLetterConfig: {
          arn: dlqQueue.arn,
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [eventBridgePolicy],
      }
    );

    // Outputs
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
