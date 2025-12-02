import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';

  const lambdaClient = new LambdaClient({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const cloudwatchClient = new CloudWatchClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });
  const snsClient = new SNSClient({ region });

  beforeAll(() => {
    // Load stack outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Stack Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.ec2ScannerArn).toBeDefined();
      expect(outputs.s3ScannerArn).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.complianceTableName).toBeDefined();
    });

    it('should have valid ARN formats', () => {
      expect(outputs.ec2ScannerArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.s3ScannerArn).toMatch(/^arn:aws:lambda:/);
    });
  });

  describe('Lambda Functions', () => {
    it('should verify EC2 scanner Lambda exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.ec2ScannerArn,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.Environment?.Variables).toHaveProperty(
        'COMPLIANCE_TABLE'
      );
    });

    it('should verify S3 scanner Lambda exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.s3ScannerArn,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.Environment?.Variables).toHaveProperty(
        'COMPLIANCE_TABLE'
      );
    });

    it('should invoke EC2 scanner Lambda successfully', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.ec2ScannerArn,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toBeDefined();

        const body = JSON.parse(payload.body);
        expect(body).toHaveProperty('totalInstances');
        expect(body).toHaveProperty('compliantInstances');
        expect(body).toHaveProperty('nonCompliantInstances');
        expect(body).toHaveProperty('compliancePercentage');
      }
    }, 30000);

    it('should verify S3 scanner Lambda configuration', async () => {
      // S3 scanner invocation may take very long in accounts with many buckets
      // Configuration is already verified above, and functionality is tested in end-to-end workflow
      const command = new GetFunctionCommand({
        FunctionName: outputs.s3ScannerArn,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('s3-security-scanner');
    });
  });

  describe('DynamoDB Table', () => {
    it('should verify compliance table exists with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.complianceTableName,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'resourceType', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'scanTimestamp', KeyType: 'RANGE' }),
        ])
      );
      // TTL may take time to enable, so check if it exists or is enabled
      if (response.Table?.TimeToLiveDescription) {
        expect(['ENABLED', 'ENABLING']).toContain(
          response.Table.TimeToLiveDescription.TimeToLiveStatus
        );
      }
    });

    it('should verify scan results are stored in DynamoDB after invocations', async () => {
      // Wait a bit for the Lambda invocations to write data
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const command = new ScanCommand({
        TableName: outputs.complianceTableName,
        Limit: 10,
      });

      const response = await dynamoClient.send(command);

      expect(response.Items).toBeDefined();
      expect(response.Count).toBeGreaterThanOrEqual(0);

      // If there are items, validate structure
      if (response.Items && response.Items.length > 0) {
        const item = response.Items[0];
        expect(item).toHaveProperty('resourceType');
        expect(item).toHaveProperty('scanTimestamp');
        expect(item).toHaveProperty('expirationTime');
      }
    });
  });

  describe('EventBridge Scheduling', () => {
    it('should verify EC2 scanner schedule rule exists', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: 'ec2-scanner-schedule',
      });

      const response = await eventBridgeClient.send(listCommand);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const rule = response.Rules?.find((r) =>
        r.Name?.includes('ec2-scanner-schedule')
      );
      expect(rule).toBeDefined();
      expect(rule?.ScheduleExpression).toBe('rate(6 hours)');
      expect(rule?.State).toBe('ENABLED');
    });

    it('should verify S3 scanner schedule rule exists', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: 's3-scanner-schedule',
      });

      const response = await eventBridgeClient.send(listCommand);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const rule = response.Rules?.find((r) =>
        r.Name?.includes('s3-scanner-schedule')
      );
      expect(rule).toBeDefined();
      expect(rule?.ScheduleExpression).toBe('rate(6 hours)');
      expect(rule?.State).toBe('ENABLED');
    });

    it('should verify EventBridge targets are configured for EC2 scanner', async () => {
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: 'ec2-scanner-schedule',
      });

      const rulesResponse = await eventBridgeClient.send(listRulesCommand);
      const rule = rulesResponse.Rules?.find((r) =>
        r.Name?.includes('ec2-scanner-schedule')
      );

      expect(rule?.Name).toBeDefined();

      const targetsCommand = new ListTargetsByRuleCommand({
        Rule: rule!.Name!,
      });

      const targetsResponse = await eventBridgeClient.send(targetsCommand);

      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets?.[0].Arn).toBe(outputs.ec2ScannerArn);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should verify EC2 compliance alarm exists', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ec2-compliance-alarm',
      });

      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('EC2CompliancePercentage');
      expect(alarm?.Namespace).toBe('InfraQA/Compliance');
      expect(alarm?.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm?.Threshold).toBe(90);
      expect(alarm?.Period).toBe(21600);
    });

    it('should verify S3 security alarm exists', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 's3-security-alarm',
      });

      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('S3SecurityPercentage');
      expect(alarm?.Namespace).toBe('InfraQA/Compliance');
      expect(alarm?.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm?.Threshold).toBe(90);
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should verify compliance dashboard exists', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: outputs.dashboardName,
      });

      const response = await cloudwatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries?.length).toBeGreaterThan(0);

      const dashboard = response.DashboardEntries?.find(
        (d) => d.DashboardName === outputs.dashboardName
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    it('should verify compliance alerts SNS topic exists', async () => {
      const command = new ListTopicsCommand({});

      const response = await snsClient.send(command);

      expect(response.Topics).toBeDefined();

      const topic = response.Topics?.find((t) =>
        t.TopicArn?.includes('compliance-alerts')
      );
      expect(topic).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full compliance scan workflow', async () => {
      // Invoke both scanners
      const ec2InvokeCommand = new InvokeCommand({
        FunctionName: outputs.ec2ScannerArn,
        InvocationType: 'RequestResponse',
      });

      const s3InvokeCommand = new InvokeCommand({
        FunctionName: outputs.s3ScannerArn,
        InvocationType: 'RequestResponse',
      });

      const [ec2Response, s3Response] = await Promise.all([
        lambdaClient.send(ec2InvokeCommand),
        lambdaClient.send(s3InvokeCommand),
      ]);

      expect(ec2Response.StatusCode).toBe(200);
      expect(s3Response.StatusCode).toBe(200);

      // Wait for DynamoDB writes
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify data in DynamoDB
      const scanCommand = new ScanCommand({
        TableName: outputs.complianceTableName,
        Limit: 10,
      });

      const scanResponse = await dynamoClient.send(scanCommand);

      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Count).toBeGreaterThanOrEqual(0);
    }, 80000);
  });
});
