import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface LambdaWithDlqProps {
  readonly functionName: string;
  readonly handler: string;
  readonly code: lambda.Code;
  readonly environment?: { [key: string]: string };
  readonly timeout?: Duration;
  readonly environmentSuffix: string;
  readonly useCase: 'order-processing' | 'cost-monitoring' | 'log-processing';
}

export class LambdaWithDlq extends Construct {
  public readonly function: lambda.Function;
  public readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: LambdaWithDlqProps) {
    super(scope, id);

    // Create Dead Letter Queue as required
    this.dlq = new sqs.Queue(this, 'DLQ', {
      queueName: `${props.functionName}-dlq`,
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create CloudWatch log group with proper retention
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${props.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create Lambda function with DLQ configuration
    this.function = new lambda.Function(this, 'Function', {
      functionName: props.functionName,
      runtime: lambda.Runtime.NODEJS_18_X, // Updated to supported runtime
      handler: props.handler,
      code: props.code,
      environment: props.environment,
      timeout: props.timeout || Duration.seconds(30),
      deadLetterQueue: this.dlq,
      deadLetterQueueEnabled: true,
      maxEventAge: Duration.hours(2),
      retryAttempts: 2,
      logGroup: logGroup,
      memorySize: 256,
      // reservedConcurrentExecutions: 1, // Prevent runaway costs
    });

    // Apply least privilege principle
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
        resources: [this.dlq.queueArn],
      })
    );

    // Add CloudWatch logs permissions (should be automatic but explicit is better)
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [`${logGroup.logGroupArn}:*`],
      })
    );

    // Add tags to all resources
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'Lambda',
      UseCase: props.useCase,
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.function.node.addMetadata('aws:cdk:tagging', { [key]: value });
      this.dlq.node.addMetadata('aws:cdk:tagging', { [key]: value });
      logGroup.node.addMetadata('aws:cdk:tagging', { [key]: value });
    });
  }
}
