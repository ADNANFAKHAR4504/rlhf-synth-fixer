import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EventBridgeStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EventBridgeStack extends pulumi.ComponentResource {
  public readonly customEventBus: aws.cloudwatch.EventBus;
  public readonly s3ProcessingRule: aws.cloudwatch.EventRule;
  public readonly monitoringLogGroup: aws.cloudwatch.LogGroup;
  // public readonly eventRuleTarget: aws.cloudwatch.EventTarget;
  public readonly customEventBusArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: EventBridgeStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:eventbridge:EventBridgeStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create custom EventBridge event bus
    this.customEventBus = new aws.cloudwatch.EventBus(
      `tap-event-bus-${environmentSuffix}`,
      {
        name: `tap-application-events-${environmentSuffix}`,
        // Custom event bus for application events
        tags: {
          Name: `tap-event-bus-${environmentSuffix}`,
          Component: 'EventBridge',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Create CloudWatch log group for event monitoring
    this.monitoringLogGroup = new aws.cloudwatch.LogGroup(
      `tap-events-logs-${environmentSuffix}`,
      {
        name: `/aws/events/tap-application-${environmentSuffix}`,
        retentionInDays: 14,
        tags: {
          Name: `tap-events-logs-${environmentSuffix}`,
          Component: 'Monitoring',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Create EventBridge rule for S3 processing events
    // 2024 feature: Advanced event pattern matching
    this.s3ProcessingRule = new aws.cloudwatch.EventRule(
      `tap-s3-processing-rule-${environmentSuffix}`,
      {
        name: `tap-s3-processing-${environmentSuffix}`,
        description: 'Rule to capture S3 object processing events from Lambda',
        eventBusName: this.customEventBus.name,
        eventPattern: JSON.stringify({
          source: [`tap.application.${environmentSuffix}`],
          'detail-type': ['S3 Object Processed'],
          detail: {
            status: ['success', 'error'],
          },
        }),
        state: 'ENABLED',
        tags: {
          Name: `tap-s3-processing-rule-${environmentSuffix}`,
          Component: 'EventBridge',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Note: CloudWatch Logs groups as targets don't support roleArn
    // EventBridge has built-in permissions to send events to CloudWatch Logs
    // For now, we'll comment out the target creation due to AWS limitations
    // In production, you'd typically send to Lambda, SNS, or SQS as targets

    // this.eventRuleTarget = new aws.cloudwatch.EventTarget(
    //   `tap-events-target-${environmentSuffix}`,
    //   {
    //     rule: this.s3ProcessingRule.name,
    //     eventBusName: this.customEventBus.name,
    //     targetId: `tap-events-target-${environmentSuffix}`,
    //     arn: this.monitoringLogGroup.arn,
    //   },
    //   { parent: this }
    // );

    this.customEventBusArn = this.customEventBus.arn;

    this.registerOutputs({
      customEventBusName: this.customEventBus.name,
      customEventBusArn: this.customEventBusArn,
      s3ProcessingRuleName: this.s3ProcessingRule.name,
      monitoringLogGroupName: this.monitoringLogGroup.name,
    });
  }

  // Note: Method commented out as CloudWatch Logs targets don't need explicit IAM roles
  // private createEventBridgeRole(
  //   environmentSuffix: string,
  //   tags: pulumi.Input<{ [key: string]: string }> | undefined
  // ): pulumi.Output<string> {
  //   // Implementation removed - not needed for CloudWatch Logs targets
  // }
}
