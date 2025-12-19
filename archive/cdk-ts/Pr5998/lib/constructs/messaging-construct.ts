import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface MessagingConstructProps {
  environmentSuffix: string;
  visibilityTimeout: number;
  messageRetentionPeriod: number;
}

export class MessagingConstruct extends Construct {
  public readonly paymentQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: MessagingConstructProps) {
    super(scope, id);

    const { environmentSuffix, visibilityTimeout, messageRetentionPeriod } =
      props;

    // Create dead-letter queue
    this.deadLetterQueue = new sqs.Queue(this, 'PaymentDLQ', {
      queueName: `payment-dlq-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create main payment processing queue
    this.paymentQueue = new sqs.Queue(this, 'PaymentQueue', {
      queueName: `payment-queue-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: cdk.Duration.seconds(visibilityTimeout),
      retentionPeriod: cdk.Duration.seconds(messageRetentionPeriod),
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    // Tags
    cdk.Tags.of(this.paymentQueue).add(
      'Name',
      `payment-queue-${environmentSuffix}`
    );
    cdk.Tags.of(this.paymentQueue).add('Environment', environmentSuffix);
    cdk.Tags.of(this.deadLetterQueue).add(
      'Name',
      `payment-dlq-${environmentSuffix}`
    );
    cdk.Tags.of(this.deadLetterQueue).add('Environment', environmentSuffix);
  }
}
