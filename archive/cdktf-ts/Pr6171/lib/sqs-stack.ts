import { Construct } from 'constructs';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';

export interface SqsStackProps {
  environmentSuffix: string;
}

export class SqsStack extends Construct {
  public readonly transactionQueue: SqsQueue;
  public readonly transactionDlq: SqsQueue;

  constructor(scope: Construct, id: string, props: SqsStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create Dead Letter Queue for failed messages
    this.transactionDlq = new SqsQueue(this, 'transaction_dlq', {
      name: `transaction-dlq-${environmentSuffix}.fifo`,
      fifoQueue: true,
      contentBasedDeduplication: true,
      messageRetentionSeconds: 1209600, // 14 days - same as main queue
      tags: {
        Name: `transaction-dlq-${environmentSuffix}`,
      },
    });

    // Create SQS FIFO queue for transaction processing with DLQ
    this.transactionQueue = new SqsQueue(this, 'transaction_queue', {
      name: `transaction-queue-${environmentSuffix}.fifo`,
      fifoQueue: true,
      contentBasedDeduplication: true,
      messageRetentionSeconds: 1209600, // 14 days
      visibilityTimeoutSeconds: 300,
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: this.transactionDlq.arn,
        maxReceiveCount: 3, // Move to DLQ after 3 failed attempts
      }),
      tags: {
        Name: `transaction-queue-${environmentSuffix}`,
      },
    });
  }
}
