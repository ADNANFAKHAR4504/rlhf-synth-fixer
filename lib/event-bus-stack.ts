import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface EventBusStackProps extends cdk.StackProps {
  processingLambda: lambda.IFunction;
  environmentSuffix: string;
}

export class EventBusStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly dlq: sqs.Queue;
  public readonly rule: events.Rule;

  constructor(scope: Construct, id: string, props: EventBusStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create a custom EventBridge event bus
    this.eventBus = new events.EventBus(this, 'TradingEventBus', {
      eventBusName: `trading-event-bus-${suffix}`,
    });

    // Create a Dead Letter Queue (DLQ) for failed event processing
    this.dlq = new sqs.Queue(this, 'EventProcessingDLQ', {
      queueName: `trading-event-processing-dlq-${suffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create an EventBridge rule to forward events to the processing Lambda
    this.rule = new events.Rule(this, 'ProcessingRule', {
      eventBus: this.eventBus,
      ruleName: `trading-event-processing-rule-${suffix}`,
      description: 'Forward trading events to processing lambda',
      eventPattern: {
        source: ['trading-system'],
      },
    });

    // Add the Lambda function as a target with retry policy and DLQ
    this.rule.addTarget(
      new targets.LambdaFunction(props.processingLambda, {
        deadLetterQueue: this.dlq,
        maxEventAge: cdk.Duration.hours(24),
        retryAttempts: 3,
      })
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'ARN of the Trading Event Bus',
      exportName: `trading-event-bus-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'Name of the Trading Event Bus',
      exportName: `trading-event-bus-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'RuleArn', {
      value: this.rule.ruleArn,
      description: 'ARN of the EventBridge processing rule',
      exportName: `trading-rule-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'RuleName', {
      value: this.rule.ruleName,
      description: 'Name of the EventBridge processing rule',
      exportName: `trading-rule-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'EventSource', {
      value: 'trading-system',
      description: 'Event source pattern for the rule',
      exportName: `trading-event-source-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQArn', {
      value: this.dlq.queueArn,
      description: 'ARN of the DLQ',
      exportName: `trading-dlq-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: this.dlq.queueUrl,
      description: 'URL of the DLQ',
      exportName: `trading-dlq-url-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQName', {
      value: this.dlq.queueName,
      description: 'Name of the DLQ',
      exportName: `trading-dlq-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQRetentionPeriod', {
      value: '14',
      description: 'DLQ message retention period in days',
      exportName: `trading-dlq-retention-${suffix}`,
    });

    new cdk.CfnOutput(this, 'MaxEventAge', {
      value: '24',
      description: 'Maximum event age in hours',
      exportName: `trading-max-event-age-${suffix}`,
    });

    new cdk.CfnOutput(this, 'RetryAttempts', {
      value: '3',
      description: 'Number of retry attempts for failed events',
      exportName: `trading-retry-attempts-${suffix}`,
    });

    new cdk.CfnOutput(this, 'TargetLambdaArn', {
      value: props.processingLambda.functionArn,
      description: 'ARN of the target Lambda function',
      exportName: `trading-target-lambda-${suffix}`,
    });
  }
}
