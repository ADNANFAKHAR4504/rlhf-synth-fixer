/**
 * Integration tests for TapStack
 *
 * These tests verify the stack is deployed and resources are created correctly.
 * Run with: npm run test:integration
 */
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let eventBridgeClient: EventBridgeClient;
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
    eventBridgeClient = new EventBridgeClient({ region });
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

  it('should have created EventBridge rule with 6-hour schedule', async () => {
    // Extract environment suffix from Lambda ARN
    const envSuffix = outputs.lambdaFunctionArn.match(/checker-([^-]+)/)?.[1];
    const rulePrefix = `compliance-schedule-${envSuffix}`;

    // List all rules and find the one matching our prefix (Pulumi adds random suffix)
    const listCommand = new ListRulesCommand({});
    const listResponse = await eventBridgeClient.send(listCommand);

    const matchingRule = listResponse.Rules?.find((rule: any) =>
      rule.Name?.startsWith(rulePrefix)
    );

    expect(matchingRule).toBeDefined();
    const ruleName = matchingRule!.Name!;

    const command = new DescribeRuleCommand({
      Name: ruleName,
    });

    const response = await eventBridgeClient.send(command);

    // Verify schedule expression
    expect(response.ScheduleExpression).toBe('rate(6 hours)');
    expect(response.State).toBe('ENABLED');

    // Verify rule targets Lambda
    const targetsCommand = new ListTargetsByRuleCommand({
      Rule: ruleName,
    });

    const targetsResponse = await eventBridgeClient.send(targetsCommand);
    expect(targetsResponse.Targets).toBeDefined();
    expect(targetsResponse.Targets!.length).toBeGreaterThan(0);
    expect(targetsResponse.Targets![0].Arn).toBe(outputs.lambdaFunctionArn);
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
});
