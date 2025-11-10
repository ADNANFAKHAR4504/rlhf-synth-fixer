import { Construct } from 'constructs';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';

export interface SqsStackProps {
  environmentSuffix: string;
}

export class SqsStack extends Construct {
  public readonly transactionQueue: SqsQueue;

  constructor(scope: Construct, id: string, props: SqsStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create SQS FIFO queue for transaction processing
    this.transactionQueue = new SqsQueue(this, 'transaction_queue', {
      name: `transaction-queue-${environmentSuffix}.fifo`,
      fifoQueue: true,
      contentBasedDeduplication: true,
      messageRetentionSeconds: 1209600, // 14 days
      visibilityTimeoutSeconds: 300,
      tags: {
        Name: `transaction-queue-${environmentSuffix}`,
      },
    });
  }
}
