import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface EventBridgeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
}

export class EventBridgeStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const { environmentSuffix, region, isPrimary } = props;

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

    // Global endpoint configuration (only in primary region)
    if (isPrimary) {
      const secondaryRegion =
        region === 'us-east-1' ? 'us-east-2' : 'us-east-1';

      // Create global endpoint
      const globalEndpoint = new events.CfnEndpoint(this, 'GlobalEndpoint', {
        name: `TapStack${environmentSuffix}GlobalEndpoint`,
        eventBuses: [
          {
            eventBusArn: this.eventBus.eventBusArn,
          },
          {
            eventBusArn: `arn:aws:events:${secondaryRegion}:${this.account}:event-bus/TapStack${environmentSuffix}EventBus${secondaryRegion}`,
          },
        ],
        routingConfig: {
          failoverConfig: {
            primary: {
              healthCheck: 'arn:aws:route53:::healthcheck/placeholder',
            },
            secondary: {
              route: secondaryRegion,
            },
          },
        },
        replicationConfig: {
          state: 'ENABLED',
        },
      });

      new cdk.CfnOutput(this, 'GlobalEndpointId', {
        value: globalEndpoint.attrEndpointId,
        description: 'EventBridge Global Endpoint ID',
        exportName: `TapStack${environmentSuffix}GlobalEndpointId`,
      });

      new cdk.CfnOutput(this, 'GlobalEndpointArn', {
        value: globalEndpoint.attrArn,
        description: 'EventBridge Global Endpoint ARN',
        exportName: `TapStack${environmentSuffix}GlobalEndpointArn`,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge Bus Name',
      exportName: `TapStack${environmentSuffix}EventBusName${region}`,
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'EventBridge Bus ARN',
      exportName: `TapStack${environmentSuffix}EventBusArn${region}`,
    });

    new cdk.CfnOutput(this, 'TargetQueueUrl', {
      value: targetQueue.queueUrl,
      description: 'Event Target Queue URL',
      exportName: `TapStack${environmentSuffix}EventQueueUrl${region}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Event DLQ URL',
      exportName: `TapStack${environmentSuffix}EventDLQUrl${region}`,
    });
  }
}
