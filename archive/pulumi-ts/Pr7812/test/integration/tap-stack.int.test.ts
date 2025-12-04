import * as fs from 'fs';
import * as path from 'path';
import { DynamoDBClient, DescribeTableCommand, DescribeContinuousBackupsCommand } from '@aws-sdk/client-dynamodb';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

const OUTPUTS_FILE = path.join(__dirname, '../../cfn-outputs/flat-outputs.json');

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let dynamoClient: DynamoDBClient;
  let iamClient: IAMClient;
  let cloudwatchClient: CloudWatchClient;
  let tableName: string;

  beforeAll(() => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(`Outputs file not found: ${OUTPUTS_FILE}`);
    }

    outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf-8'));

    // Extract table name from tableArn: arn:aws:dynamodb:region:account:table/table-name
    tableName = outputs.tableArn ? outputs.tableArn.split('/').pop() : undefined;

    const region = process.env.AWS_REGION || 'us-east-1';
    dynamoClient = new DynamoDBClient({ region });
    iamClient = new IAMClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
  });

  describe('DynamoDB Table', () => {
    it('should have table deployed with correct configuration', async () => {
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    it('should have Global Secondary Index configured', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        idx => idx.IndexName === 'CategoryStatusIndex'
      );

      expect(gsi).toBeDefined();
      expect(gsi?.Projection?.ProjectionType).toBe('INCLUDE');
    });

    it('should have server-side encryption enabled', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('IAM Role', () => {
    it('should have Lambda execution role with correct permissions', async () => {
      const roleArn = outputs.lambdaRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
    });

    it('should have DynamoDB read policy attached', async () => {
      const roleArn = outputs.lambdaRoleArn;
      const roleName = roleArn.split('/').pop();

      // Extract env suffix from role name instead of using env var
      const envSuffix = roleName.replace('lambda-dynamodb-reader-', '');
      const policyName = `lambda-dynamodb-read-policy-${envSuffix}`;

      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName,
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument || '{}'));

      const dynamoStatement = policy.Statement.find((s: any) =>
        s.Action.includes('dynamodb:GetItem')
      );
      expect(dynamoStatement).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have read capacity alarm configured', async () => {
      // Extract env suffix from table name
      const envSuffix = tableName.replace('optimized-table-', '');
      const alarmName = `table-read-alarm-${envSuffix}`;

      const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('ConsumedReadCapacityUnits');
    });

    it('should have write capacity alarm configured', async () => {
      // Extract env suffix from table name
      const envSuffix = tableName.replace('optimized-table-', '');
      const alarmName = `table-write-alarm-${envSuffix}`;

      const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('ConsumedWriteCapacityUnits');
    });
  });

  describe('Stack Outputs', () => {
    it('should export table ARN', () => {
      expect(outputs.tableArn).toBeDefined();
      expect(outputs.tableArn).toContain('arn:aws:dynamodb');
    });

    it('should export stream ARN', () => {
      expect(outputs.streamArn).toBeDefined();
      expect(outputs.streamArn).toContain('stream/');
    });

    it('should export Lambda role ARN', () => {
      expect(outputs.lambdaRoleArn).toBeDefined();
      expect(outputs.lambdaRoleArn).toContain('arn:aws:iam');
    });
  });
});
