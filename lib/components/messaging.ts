/**
 * Messaging Component (SQS + EventBridge)
 * Implements async payment processing and event-driven architecture
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MessagingComponentArgs {
  environmentSuffix: string;
  environment: 'dev' | 'staging' | 'prod';
  kmsKeyId: pulumi.Input<string>;
  lambdaFunctionArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class MessagingComponent extends pulumi.ComponentResource {
  public readonly paymentQueueUrl: pulumi.Output<string>;
  public readonly paymentQueueArn: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly dlqArn: pulumi.Output<string>;
  public readonly eventBusArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MessagingComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:messaging:MessagingComponent', name, {}, opts);

    const { environmentSuffix, environment, kmsKeyId, tags } = args;

    const dlq = new aws.sqs.Queue(
      `payment-dlq-${environmentSuffix}`,
      {
        name: `payment-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        kmsMasterKeyId: kmsKeyId,
        kmsDataKeyReusePeriodSeconds: 300,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-dlq-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const paymentQueue = new aws.sqs.Queue(
      `payment-queue-${environmentSuffix}`,
      {
        name: `payment-queue-${environmentSuffix}`,
        visibilityTimeoutSeconds: environment === 'prod' ? 300 : 180,
        messageRetentionSeconds: 345600,
        receiveWaitTimeSeconds: 20,
        kmsMasterKeyId: kmsKeyId,
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: dlq.arn,
          maxReceiveCount: 3,
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-queue-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const eventBus = new aws.cloudwatch.EventBus(
      `payment-events-${environmentSuffix}`,
      {
        name: `payment-events-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-events-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.paymentQueueUrl = paymentQueue.url;
    this.paymentQueueArn = paymentQueue.arn;
    this.dlqUrl = dlq.url;
    this.dlqArn = dlq.arn;
    this.eventBusArn = eventBus.arn;

    this.registerOutputs({
      paymentQueueUrl: this.paymentQueueUrl,
      paymentQueueArn: this.paymentQueueArn,
      dlqUrl: this.dlqUrl,
      dlqArn: this.dlqArn,
      eventBusArn: this.eventBusArn,
    });
  }
}
