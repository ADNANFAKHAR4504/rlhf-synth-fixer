import { Testing, TerraformStack } from 'cdktf';
import { CloudwatchStack } from '../lib/cloudwatch-stack';

describe('CloudwatchStack', () => {
  let stack: TerraformStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CloudwatchStack instantiates with all required props', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStack');

    const cloudwatchStack = new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'test',
      transactionProcessorName: 'transaction-processor-test',
      statusCheckerName: 'status-checker-test',
      dynamodbTableName: 'transactions-test',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    expect(cloudwatchStack).toBeDefined();
  });

  test('CloudwatchStack uses dynamic region detection', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackDefaultRegion');

    const cloudwatchStack = new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'default-region',
      transactionProcessorName: 'transaction-processor-default',
      statusCheckerName: 'status-checker-default',
      dynamodbTableName: 'transactions-default',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    expect(cloudwatchStack).toBeDefined();
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('aws_region');
  });

  test('CloudwatchStack creates dashboard', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackDashboard');

    new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'prod',
      transactionProcessorName: 'transaction-processor-prod',
      statusCheckerName: 'status-checker-prod',
      dynamodbTableName: 'transactions-prod',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('aws_cloudwatch_dashboard');
    expect(synthesized).toContain('payment-dashboard-prod');
  });

  test('CloudwatchStack creates Lambda invocation metrics', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackMetrics');

    new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'staging',
      transactionProcessorName: 'transaction-processor-staging',
      statusCheckerName: 'status-checker-staging',
      dynamodbTableName: 'transactions-staging',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('AWS/Lambda');
    expect(synthesized).toContain('Invocations');
  });

  test('CloudwatchStack creates Lambda error metrics', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackErrors');

    new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'dev',
      transactionProcessorName: 'transaction-processor-dev',
      statusCheckerName: 'status-checker-dev',
      dynamodbTableName: 'transactions-dev',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('Errors');
  });

  test('CloudwatchStack creates DynamoDB capacity metrics', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackDynamoDB');

    new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'capacity-test',
      transactionProcessorName: 'transaction-processor-capacity',
      statusCheckerName: 'status-checker-capacity',
      dynamodbTableName: 'transactions-capacity',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('AWS/DynamoDB');
    expect(synthesized).toContain('ConsumedReadCapacityUnits');
    expect(synthesized).toContain('ConsumedWriteCapacityUnits');
  });

  test('CloudwatchStack creates transaction processor alarm', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackAlarm1');

    new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'alarm-test',
      transactionProcessorName: 'transaction-processor-alarm',
      statusCheckerName: 'status-checker-alarm',
      dynamodbTableName: 'transactions-alarm',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
    expect(synthesized).toContain('transaction-processor-errors');
  });

  test('CloudwatchStack creates status checker alarm', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackAlarm2');

    new CloudwatchStack(stack, 'CloudwatchStack', {
      environmentSuffix: 'status-alarm',
      transactionProcessorName: 'transaction-processor-status',
      statusCheckerName: 'status-checker-status',
      dynamodbTableName: 'transactions-status',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('status-checker-errors');
  });
});

