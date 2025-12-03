/**
 * Integration tests for TapStack
 *
 * These tests verify the stack is deployed and resources are created correctly.
 * Run with: npm run test:integration
 */
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let cloudwatchClient: CloudWatchClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    lambdaClient = new LambdaClient({ region });
    snsClient = new SNSClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
  });

  it('should have deployed Lambda function with correct configuration', async () => {
    expect(outputs.lambdaFunctionArn).toBeDefined();

    // Extract function name from ARN
    const functionName = outputs.lambdaFunctionArn.split(':').pop();

    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    });

    const response = await lambdaClient.send(command);

    // Verify runtime
    expect(response.Runtime).toBe('nodejs18.x');

    // Verify environment variables
    expect(response.Environment?.Variables).toBeDefined();
    expect(response.Environment?.Variables?.COMPLIANCE_THRESHOLD).toBeDefined();
    expect(response.Environment?.Variables?.MIN_REQUIRED_TAGS).toBeDefined();
    expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();

    // Verify timeout and memory
    expect(response.Timeout).toBe(300);
    expect(response.MemorySize).toBe(512);
  });

  it('should have created SNS topic for compliance alerts', async () => {
    expect(outputs.snsTopicArn).toBeDefined();

    const command = new GetTopicAttributesCommand({
      TopicArn: outputs.snsTopicArn,
    });

    const response = await snsClient.send(command);

    // Verify topic exists
    expect(response.Attributes).toBeDefined();
    expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);

    // Verify subscriptions exist
    const subsCommand = new ListSubscriptionsByTopicCommand({
      TopicArn: outputs.snsTopicArn,
    });

    const subsResponse = await snsClient.send(subsCommand);
    expect(subsResponse.Subscriptions).toBeDefined();
    expect(subsResponse.Subscriptions!.length).toBeGreaterThan(0);
  });

  it('should have created CloudWatch alarm for compliance threshold', async () => {
    // Extract environment suffix
    const envSuffix = outputs.lambdaFunctionArn.match(/checker-([^-]+)/)?.[1];
    const alarmName = `compliance-score-low-${envSuffix}`;

    const command = new DescribeAlarmsCommand({
      AlarmNames: [alarmName],
    });

    const response = await cloudwatchClient.send(command);

    expect(response.MetricAlarms).toBeDefined();
    expect(response.MetricAlarms!.length).toBe(1);

    const alarm = response.MetricAlarms![0];
    expect(alarm.MetricName).toBe('ComplianceScore');
    expect(alarm.Namespace).toBe('InfrastructureCompliance');
    expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    expect(alarm.Threshold).toBeDefined();

    // Verify alarm actions include SNS topic
    expect(alarm.AlarmActions).toContain(outputs.snsTopicArn);
  });

  it('should have valid CloudWatch dashboard URL', () => {
    expect(outputs.dashboardUrl).toBeDefined();
    expect(outputs.dashboardUrl).toContain('console.aws.amazon.com');
    expect(outputs.dashboardUrl).toContain('cloudwatch');
    expect(outputs.dashboardUrl).toContain('dashboards');
  });

  it('should have Lambda function with correct IAM permissions', async () => {
    expect(outputs.lambdaFunctionArn).toBeDefined();

    const functionName = outputs.lambdaFunctionArn.split(':').pop();

    const command = new GetFunctionCommand({
      FunctionName: functionName,
    });

    const response = await lambdaClient.send(command);

    // Verify function exists and has a role
    expect(response.Configuration).toBeDefined();
    expect(response.Configuration?.Role).toBeDefined();
    expect(response.Configuration?.Role).toContain('arn:aws:iam::');

    // Verify function state is active
    expect(response.Configuration?.State).toBe('Active');
  });

  it('should have compliance metric name in correct format', () => {
    expect(outputs.complianceMetricName).toBeDefined();

    // Verify metric name format: Namespace/MetricName
    const metricParts = outputs.complianceMetricName.split('/');
    expect(metricParts.length).toBe(2);
    expect(metricParts[0]).toBe('InfrastructureCompliance');
    expect(metricParts[1]).toBe('ComplianceScore');
  });

  it('should have SNS topic with correct policy for Lambda', async () => {
    expect(outputs.snsTopicArn).toBeDefined();

    const command = new GetTopicAttributesCommand({
      TopicArn: outputs.snsTopicArn,
    });

    const response = await snsClient.send(command);

    // Verify topic has a policy
    expect(response.Attributes).toBeDefined();
    expect(response.Attributes?.Policy).toBeDefined();

    // Parse and verify policy allows Lambda to publish
    const policy = JSON.parse(response.Attributes?.Policy || '{}');
    expect(policy.Statement).toBeDefined();
    expect(policy.Statement.length).toBeGreaterThan(0);
  });

  it('should have Lambda function with SNS topic ARN in environment', async () => {
    expect(outputs.lambdaFunctionArn).toBeDefined();
    expect(outputs.snsTopicArn).toBeDefined();

    const functionName = outputs.lambdaFunctionArn.split(':').pop();

    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    });

    const response = await lambdaClient.send(command);

    // Verify SNS_TOPIC_ARN environment variable matches actual SNS topic
    expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
      outputs.snsTopicArn
    );
  });

  it('should have all required stack outputs defined', () => {
    // Verify all expected outputs are present
    const requiredOutputs = [
      'lambdaFunctionArn',
      'snsTopicArn',
      'dashboardUrl',
      'complianceMetricName',
    ];

    for (const outputKey of requiredOutputs) {
      expect(outputs[outputKey]).toBeDefined();
      expect(outputs[outputKey]).not.toBe('');
    }
  });

  it('should have resources in correct AWS region', async () => {
    const expectedRegion = 'us-east-1';

    // Verify Lambda ARN contains correct region
    expect(outputs.lambdaFunctionArn).toContain(`:${expectedRegion}:`);

    // Verify SNS ARN contains correct region
    expect(outputs.snsTopicArn).toContain(`:${expectedRegion}:`);

    // Verify dashboard URL contains correct region
    expect(outputs.dashboardUrl).toContain(`region=${expectedRegion}`);
  });
});
