import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class SqsStack extends BaseStack {
  public readonly orderProcessingQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create Dead Letter Queue
    this.deadLetterQueue = new sqs.Queue(this, 'OrderProcessingDlq', {
      queueName: this.getResourceName('order-processing-dlq'),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Create main processing queue with environment-specific configuration
    this.orderProcessingQueue = new sqs.Queue(this, 'OrderProcessingQueue', {
      queueName: this.getResourceName('order-processing'),
      visibilityTimeout: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.visibilityTimeoutSeconds
      ),
      retentionPeriod: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.messageRetentionSeconds
      ),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: this.environmentConfig.sqsConfig.maxReceiveCount,
      },
    });

    // Export queue URLs and ARNs
    this.exportToParameterStore(
      'order-processing-queue-url',
      this.orderProcessingQueue.queueUrl
    );
    this.exportToParameterStore(
      'order-processing-queue-arn',
      this.orderProcessingQueue.queueArn
    );
    this.exportToParameterStore(
      'order-processing-dlq-url',
      this.deadLetterQueue.queueUrl
    );
    this.exportToParameterStore(
      'order-processing-dlq-arn',
      this.deadLetterQueue.queueArn
    );
  }
}
