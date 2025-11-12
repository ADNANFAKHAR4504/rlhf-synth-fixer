import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface EventBridgeStackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
}

export class EventBridgeStack extends Construct {
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Custom Event Bus
    this.eventBus = new events.EventBus(this, 'CustomEventBus', {
      eventBusName: `TapStack${environmentSuffix}EventBus${region}`,
    });

    // Dead Letter Queue for failed events
    const dlq = new sqs.Queue(this, 'EventDLQ', {
      queueName: `TapStack${environmentSuffix}EventDLQ${region}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Target Queue for events
    const targetQueue = new sqs.Queue(this, 'EventTargetQueue', {
      queueName: `TapStack${environmentSuffix}EventQueue${region}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: cdk.Duration.seconds(300),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Archive for event replay
    new events.Archive(this, 'EventArchive', {
      archiveName: `TapStack${environmentSuffix}EventArchive${region}`,
      sourceEventBus: this.eventBus,
      description: 'Archive for event replay capability',
      eventPattern: {
        account: [cdk.Stack.of(this).account],
      },
      retention: cdk.Duration.days(7),
    });

    // Rule for application events
    new events.Rule(this, 'ApplicationEventRule', {
      ruleName: `TapStack${environmentSuffix}AppEvents${region}`,
      eventBus: this.eventBus,
      description: 'Route application events to SQS',
      eventPattern: {
        source: ['tap.application'],
        detailType: ['Application Event'],
      },
      targets: [
        new targets.SqsQueue(targetQueue, {
          deadLetterQueue: dlq,
          maxEventAge: cdk.Duration.hours(2),
          retryAttempts: 3,
        }),
      ],
    });

    // Single region EventBridge (no global endpoint needed)

    // Outputs
    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge Bus Name',
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'EventBridge Bus ARN',
    });

    new cdk.CfnOutput(this, 'TargetQueueUrl', {
      value: targetQueue.queueUrl,
      description: 'Event Target Queue URL',
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Event DLQ URL',
    });
  }
}
