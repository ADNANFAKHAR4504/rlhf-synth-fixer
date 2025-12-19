/**
 * messaging-stack.ts
 *
 * Message queuing and event streaming infrastructure
 * Features: SQS FIFO queues, Kinesis Data Streams, Kinesis Firehose, EventBridge
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MessagingStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  regions: {
    primary: string;
    replicas: string[];
  };
  kmsKeyId: pulumi.Input<string>;
  enableFifoQueues: boolean;
  enableCrossRegionEvents: boolean;
}

export class MessagingStack extends pulumi.ComponentResource {
  public readonly transactionQueueUrl: pulumi.Output<string>;
  public readonly transactionQueueArn: pulumi.Output<string>;
  public readonly transactionDlqUrl: pulumi.Output<string>;
  public readonly kinesisStreamArn: pulumi.Output<string>;
  public readonly kinesisStreamName: pulumi.Output<string>;
  public readonly eventBusArn: pulumi.Output<string>;
  public readonly fraudDetectionQueueArn: pulumi.Output<string>;
  public readonly fraudDetectionQueueUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: MessagingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:messaging:MessagingStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      regions,
      kmsKeyId,
      enableFifoQueues,
      enableCrossRegionEvents,
    } = args;

    // Dead Letter Queue for Transaction Processing
    const transactionDlq = new aws.sqs.Queue(
      `${name}-transaction-dlq`,
      {
        name: enableFifoQueues
          ? `banking-transaction-dlq-${environmentSuffix}.fifo`
          : `banking-transaction-dlq-${environmentSuffix}`,
        fifoQueue: enableFifoQueues,
        contentBasedDeduplication: enableFifoQueues,
        messageRetentionSeconds: 1209600, // 14 days
        kmsMasterKeyId: kmsKeyId,
        kmsDataKeyReusePeriodSeconds: 300,
        tags: tags,
      },
      { parent: this }
    );

    //  SQS FIFO Queue for Transaction Processing
    const transactionQueue = new aws.sqs.Queue(
      `${name}-transaction-queue`,
      {
        name: enableFifoQueues
          ? `banking-transaction-queue-${environmentSuffix}.fifo`
          : `banking-transaction-queue-${environmentSuffix}`,
        fifoQueue: enableFifoQueues,
        contentBasedDeduplication: enableFifoQueues,
        deduplicationScope: enableFifoQueues ? 'messageGroup' : undefined,
        fifoThroughputLimit: enableFifoQueues ? 'perMessageGroupId' : undefined,
        messageRetentionSeconds: 345600, // 4 days
        visibilityTimeoutSeconds: 300, // 5 minutes
        receiveWaitTimeSeconds: 20,
        kmsMasterKeyId: kmsKeyId,
        kmsDataKeyReusePeriodSeconds: 300,
        redrivePolicy: transactionDlq.arn.apply(dlqArn =>
          JSON.stringify({
            deadLetterTargetArn: dlqArn,
            maxReceiveCount: 3,
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'queue:type': 'transaction-processing',
          'queue:fifo': enableFifoQueues.toString(),
        })),
      },
      { parent: this }
    );

    // SQS Queue for Fraud Detection
    const fraudDetectionDlq = new aws.sqs.Queue(
      `${name}-fraud-detection-dlq`,
      {
        name: enableFifoQueues
          ? `banking-fraud-detection-dlq-${environmentSuffix}.fifo`
          : `banking-fraud-detection-dlq-${environmentSuffix}`,
        fifoQueue: enableFifoQueues,
        contentBasedDeduplication: enableFifoQueues,
        messageRetentionSeconds: 1209600,
        kmsMasterKeyId: kmsKeyId,
        tags: tags,
      },
      { parent: this }
    );

    const fraudDetectionQueue = new aws.sqs.Queue(
      `${name}-fraud-detection-queue`,
      {
        name: enableFifoQueues
          ? `banking-fraud-detection-${environmentSuffix}.fifo`
          : `banking-fraud-detection-${environmentSuffix}`,
        fifoQueue: enableFifoQueues,
        contentBasedDeduplication: enableFifoQueues,
        deduplicationScope: enableFifoQueues ? 'messageGroup' : undefined,
        fifoThroughputLimit: enableFifoQueues ? 'perMessageGroupId' : undefined,
        messageRetentionSeconds: 345600,
        visibilityTimeoutSeconds: 60, // Fraud detection should be faster
        receiveWaitTimeSeconds: 20,
        kmsMasterKeyId: kmsKeyId,
        redrivePolicy: fraudDetectionDlq.arn.apply(dlqArn =>
          JSON.stringify({
            deadLetterTargetArn: dlqArn,
            maxReceiveCount: 2, // Fewer retries for fraud detection
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'queue:type': 'fraud-detection',
        })),
      },
      { parent: this }
    );

    //  SQS Queue for Notifications
    const notificationDlq = new aws.sqs.Queue(
      `${name}-notification-dlq`,
      {
        name: `banking-notification-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        kmsMasterKeyId: kmsKeyId,
        tags: tags,
      },
      { parent: this }
    );

    const notificationQueue = new aws.sqs.Queue(
      `${name}-notification-queue`,
      {
        name: `banking-notification-queue-${environmentSuffix}`,
        messageRetentionSeconds: 345600,
        visibilityTimeoutSeconds: 30,
        receiveWaitTimeSeconds: 20,
        kmsMasterKeyId: kmsKeyId,
        redrivePolicy: notificationDlq.arn.apply(dlqArn =>
          JSON.stringify({
            deadLetterTargetArn: dlqArn,
            maxReceiveCount: 5,
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'queue:type': 'notifications',
        })),
      },
      { parent: this }
    );

    //  Kinesis Data Stream for Transaction Logs
    const transactionStream = new aws.kinesis.Stream(
      `${name}-transaction-stream`,
      {
        name: `banking-transactions-${environmentSuffix}`,
        shardCount: 4,
        retentionPeriod: 168, // 7 days
        shardLevelMetrics: [
          'IncomingBytes',
          'IncomingRecords',
          'OutgoingBytes',
          'OutgoingRecords',
          'WriteProvisionedThroughputExceeded',
          'ReadProvisionedThroughputExceeded',
          'IteratorAgeMilliseconds',
        ],
        streamModeDetails: {
          streamMode: 'PROVISIONED',
        },
        encryptionType: 'KMS',
        kmsKeyId: kmsKeyId,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'stream:type': 'transaction-log',
          'stream:retention': '7-days',
        })),
      },
      { parent: this }
    );

    //  Kinesis Data Stream for Audit Events
    const auditStream = new aws.kinesis.Stream(
      `${name}-audit-stream`,
      {
        name: `banking-audit-events-${environmentSuffix}`,
        shardCount: 2,
        retentionPeriod: 168,
        shardLevelMetrics: [
          'IncomingBytes',
          'IncomingRecords',
          'OutgoingBytes',
          'OutgoingRecords',
        ],
        streamModeDetails: {
          streamMode: 'PROVISIONED',
        },
        encryptionType: 'KMS',
        kmsKeyId: kmsKeyId,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'stream:type': 'audit-events',
        })),
      },
      { parent: this }
    );

    // EventBridge Event Bus
    const eventBus = new aws.cloudwatch.EventBus(
      `${name}-event-bus`,
      {
        name: `banking-events-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge Archive for Event Replay
    new aws.cloudwatch.EventArchive(
      `${name}-event-archive`,
      {
        name: `banking-event-archive-${environmentSuffix}`,
        eventSourceArn: eventBus.arn,
        retentionDays: 90,
        description: 'Archive banking events for replay and audit',
      },
      { parent: this }
    );

    // EventBridge Rules

    // Rule for Transaction Completed Events
    const transactionCompletedRule = new aws.cloudwatch.EventRule(
      `${name}-transaction-completed-rule`,
      {
        name: `transaction-completed-${environmentSuffix}`,
        description: 'Route completed transactions to processing queue',
        eventBusName: eventBus.name,
        eventPattern: JSON.stringify({
          source: ['banking.transactions'],
          'detail-type': ['Transaction Completed'],
          detail: {
            status: ['COMPLETED'],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `${name}-transaction-completed-target`,
      {
        rule: transactionCompletedRule.name,
        eventBusName: eventBus.name,
        arn: transactionQueue.arn,
        sqsTarget: enableFifoQueues
          ? {
              messageGroupId: 'transaction-processing',
            }
          : undefined,
      },
      { parent: this }
    );

    // Rule for Fraud Detection Events
    const fraudDetectionRule = new aws.cloudwatch.EventRule(
      `${name}-fraud-detection-rule`,
      {
        name: `fraud-detection-${environmentSuffix}`,
        description: 'Route high-risk transactions to fraud detection',
        eventBusName: eventBus.name,
        eventPattern: JSON.stringify({
          source: ['banking.transactions'],
          'detail-type': ['Transaction Created'],
          detail: {
            riskScore: [{ numeric: ['>', 75] }],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `${name}-fraud-detection-target`,
      {
        rule: fraudDetectionRule.name,
        eventBusName: eventBus.name,
        arn: fraudDetectionQueue.arn,
        sqsTarget: enableFifoQueues
          ? {
              messageGroupId: 'fraud-detection',
            }
          : undefined,
      },
      { parent: this }
    );

    // Rule for Customer Notifications
    const notificationRule = new aws.cloudwatch.EventRule(
      `${name}-notification-rule`,
      {
        name: `customer-notifications-${environmentSuffix}`,
        description: 'Route events requiring customer notification',
        eventBusName: eventBus.name,
        eventPattern: JSON.stringify({
          source: ['banking.transactions', 'banking.accounts'],
          'detail-type': [
            'Transaction Completed',
            'Large Transaction Alert',
            'Account Alert',
            'Fraud Detected',
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `${name}-notification-target`,
      {
        rule: notificationRule.name,
        eventBusName: eventBus.name,
        arn: notificationQueue.arn,
      },
      { parent: this }
    );

    // Rule for Audit Logging
    const auditLoggingRule = new aws.cloudwatch.EventRule(
      `${name}-audit-logging-rule`,
      {
        name: `audit-logging-${environmentSuffix}`,
        description: 'Route all events to audit stream',
        eventBusName: eventBus.name,
        eventPattern: JSON.stringify({
          source: ['banking.transactions', 'banking.accounts', 'banking.auth'],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `${name}-audit-logging-target`,
      {
        rule: auditLoggingRule.name,
        eventBusName: eventBus.name,
        arn: auditStream.arn,
        roleArn: pulumi.output(
          this.createEventBridgeKinesisRole(name, auditStream.arn, tags).arn
        ),
        kinesisTarget: {
          partitionKeyPath: '$.detail.userId',
        },
      },
      { parent: this }
    );

    // Cross-Region Event Replication
    if (enableCrossRegionEvents && regions.replicas.length > 0) {
      regions.replicas.forEach(replicaRegion => {
        // Shorten region name: ap-southeast-1 - southeast1, eu-west-1 - west1
        const shortRegion = replicaRegion.replace(
          /[a-z]+-([a-z]+)-(\d+)/,
          '$1$2'
        );

        // Create replica event bus
        const replicaEventBus = new aws.cloudwatch.EventBus(
          `${name}-event-bus-${replicaRegion}`,
          {
            name: `banking-events-${environmentSuffix}`,
            tags: tags,
          },
          {
            parent: this,
            provider: new aws.Provider(`provider-${replicaRegion}`, {
              region: replicaRegion,
            }),
          }
        );

        // Cross-region event rule
        const crossRegionRule = new aws.cloudwatch.EventRule(
          `${name}-xreg-rule-${shortRegion}`,
          {
            name: `xreg-repl-${environmentSuffix}-${shortRegion}`,
            description: `Replicate events to ${replicaRegion}`,
            eventBusName: eventBus.name,
            eventPattern: JSON.stringify({
              source: ['banking.transactions', 'banking.accounts'],
            }),
            tags: tags,
          },
          { parent: this }
        );

        new aws.cloudwatch.EventTarget(
          `${name}-xreg-tgt-${shortRegion}`,
          {
            targetId: `xreg-${shortRegion}`,
            rule: crossRegionRule.name,
            eventBusName: eventBus.name,
            arn: replicaEventBus.arn,
            roleArn: pulumi.output(
              this.createCrossRegionEventRole(
                name,
                replicaEventBus.arn,
                tags,
                replicaRegion
              ).arn
            ),
          },
          { parent: this }
        );
      });
    }

    // SQS Queue Policies
    new aws.sqs.QueuePolicy(
      `${name}-transaction-queue-policy`,
      {
        queueUrl: transactionQueue.url,
        policy: pulumi
          .all([transactionQueue.arn, eventBus.arn])
          .apply(([queueArn, busArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'events.amazonaws.com',
                  },
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                  Condition: {
                    ArnEquals: {
                      'aws:SourceArn': busArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    new aws.sqs.QueuePolicy(
      `${name}-fraud-queue-policy`,
      {
        queueUrl: fraudDetectionQueue.url,
        policy: pulumi
          .all([fraudDetectionQueue.arn, eventBus.arn])
          .apply(([queueArn, busArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'events.amazonaws.com',
                  },
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                  Condition: {
                    ArnEquals: {
                      'aws:SourceArn': busArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    new aws.sqs.QueuePolicy(
      `${name}-notification-queue-policy`,
      {
        queueUrl: notificationQueue.url,
        policy: pulumi
          .all([notificationQueue.arn, eventBus.arn])
          .apply(([queueArn, busArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'events.amazonaws.com',
                  },
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                  Condition: {
                    ArnEquals: {
                      'aws:SourceArn': busArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Outputs
    this.transactionQueueUrl = transactionQueue.url;
    this.transactionQueueArn = transactionQueue.arn;
    this.transactionDlqUrl = transactionDlq.url;
    this.kinesisStreamArn = transactionStream.arn;
    this.kinesisStreamName = transactionStream.name;
    this.eventBusArn = eventBus.arn;
    this.fraudDetectionQueueArn = fraudDetectionQueue.arn;
    this.fraudDetectionQueueUrl = fraudDetectionQueue.url;

    this.registerOutputs({
      transactionQueueUrl: this.transactionQueueUrl,
      transactionQueueArn: this.transactionQueueArn,
      transactionDlqUrl: this.transactionDlqUrl,
      kinesisStreamArn: this.kinesisStreamArn,
      kinesisStreamName: this.kinesisStreamName,
      eventBusArn: this.eventBusArn,
      fraudDetectionQueueArn: this.fraudDetectionQueueArn,
      fraudDetectionQueueUrl: this.fraudDetectionQueueUrl,
    });
  }

  // Helper method to create IAM role for EventBridge to Kinesis
  private createEventBridgeKinesisRole(
    name: string,
    streamArn: pulumi.Output<string>,
    tags: pulumi.Input<{ [key: string]: string }>
  ): aws.iam.Role {
    const role = new aws.iam.Role(
      `${name}-eventbridge-kinesis-role`,
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
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-eventbridge-kinesis-policy`,
      {
        role: role.id,
        policy: streamArn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['kinesis:PutRecord', 'kinesis:PutRecords'],
                Resource: [arn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    return role;
  }

  // Helper method to create IAM role for cross-region EventBridge
  private createCrossRegionEventRole(
    name: string,
    targetBusArn: pulumi.Output<string>,
    tags: pulumi.Input<{ [key: string]: string }>,
    region: string
  ): aws.iam.Role {
    // Shorten region name: ap-southeast-1 -> southeast1, eu-west-1 -> west1
    const shortRegion = region.replace(/[a-z]+-([a-z]+)-(\d+)/, '$1$2');

    const role = new aws.iam.Role(
      `${name}-xregion-role-${shortRegion}`,
      {
        name: `msg-xregion-${shortRegion}`,
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
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-xregion-policy-${shortRegion}`,
      {
        role: role.id,
        policy: targetBusArn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['events:PutEvents'],
                Resource: [arn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    return role;
  }
}
