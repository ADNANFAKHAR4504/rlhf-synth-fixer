import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface SQSStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class SQSStack extends Construct {
  public readonly deadLetterQueue: sqs.Queue;
  public readonly queueName: string;

  constructor(scope: Construct, id: string, props: SQSStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Create SQS queue for dead letter queue
    this.queueName = `serverless-dlq-${environment}-${region}`;

    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: this.queueName,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      dataKeyReuse: cdk.Duration.days(1),
    });

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.deadLetterQueue).add('Environment', environment);
    cdk.Tags.of(this.deadLetterQueue).add('Service', 'DeadLetterQueue');
    cdk.Tags.of(this.deadLetterQueue).add('Region', region);
    cdk.Tags.of(this.deadLetterQueue).add('IsPrimary', isPrimary.toString());

    // Create queue policy for additional security
    const queuePolicy = new sqs.QueuePolicy(this, 'DeadLetterQueuePolicy', {
      queues: [this.deadLetterQueue],
    });

    queuePolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['sqs:*'],
        resources: [this.deadLetterQueue.queueArn],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Output the queue name and ARN
    new cdk.CfnOutput(this, 'DeadLetterQueueName', {
      value: this.deadLetterQueue.queueName,
      description: 'Name of the dead letter queue',
      exportName: `serverless-dlq-name-${region}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: this.deadLetterQueue.queueArn,
      description: 'ARN of the dead letter queue',
      exportName: `serverless-dlq-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: this.deadLetterQueue.queueUrl,
      description: 'URL of the dead letter queue',
      exportName: `serverless-dlq-url-${region}`,
    });
  }
}
