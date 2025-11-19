import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { KinesisClient, DescribeStreamCommand, PutRecordCommand, ListShardsCommand } from '@aws-sdk/client-kinesis';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeVpcEndpointsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import fs from 'fs';
import path from 'path';

describe('TapStack Integration Tests - Secure Transaction Processing Pipeline', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912418';
  const stackName = `TapStack${environmentSuffix}`;

  let outputs: Record<string, string>;
  let cfnClient: CloudFormationClient;
  let dynamoClient: DynamoDBClient;
  let kinesisClient: KinesisClient;
  let lambdaClient: LambdaClient;
  let kmsClient: KMSClient;
  let logsClient: CloudWatchLogsClient;
  let ec2Client: EC2Client;
  let cwClient: CloudWatchClient;

  beforeAll(async () => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    dynamoClient = new DynamoDBClient({ region });
    kinesisClient = new KinesisClient({ region });
    lambdaClient = new LambdaClient({ region });
    kmsClient = new KMSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    ec2Client = new EC2Client({ region });
    cwClient = new CloudWatchClient({ region });
  });

  afterAll(async () => {
    // Cleanup clients
    cfnClient.destroy();
    dynamoClient.destroy();
    kinesisClient.destroy();
    lambdaClient.destroy();
    kmsClient.destroy();
    logsClient.destroy();
    ec2Client.destroy();
    cwClient.destroy();
  });

  describe('CloudFormation Stack', () => {
    test('stack should exist and be in CREATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('stack should have all required outputs', async () => {
      const requiredOutputs = [
        'VPCId',
        'KMSKeyId',
        'DynamoDBTableName',
        'KinesisStreamName',
        'LambdaFunctionName',
        'CloudWatchLogGroupName',
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
    });

    test('should have three private subnets across different AZs', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      expect(subnetIds.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      // Verify subnets are in different AZs
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = new Set(azs);
      expect(uniqueAZs.size).toBe(3);

      // Verify subnet CIDR blocks
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('VPC endpoints should exist for all required services', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(5);

      const serviceNames = response.VpcEndpoints!.map(endpoint => endpoint.ServiceName);
      expect(serviceNames.some(name => name?.includes('dynamodb'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('kinesis'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('kms'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('logs'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('lambda'))).toBe(true);
    });

    test('security groups should have correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.LambdaSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCId);

      // Verify egress rule for HTTPS to VPC CIDR
      const httpsEgress = sg.IpPermissionsEgress?.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsEgress).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist with rotation enabled', async () => {
      const describeCommand = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });
      const describeResponse = await kmsClient.send(describeCommand);

      expect(describeResponse.KeyMetadata).toBeDefined();
      expect(describeResponse.KeyMetadata!.KeyState).toBe('Enabled');

      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: outputs.KMSKeyId,
      });
      const rotationResponse = await kmsClient.send(rotationCommand);

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table should exist with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have KMS encryption', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
      expect(response.Table!.SSEDescription!.SSEType).toBe('KMS');
      expect(response.Table!.SSEDescription!.KMSMasterKeyArn).toContain(outputs.KMSKeyId);
    });

    test('should be able to write and read items from DynamoDB', async () => {
      const testTransactionId = `test-txn-${Date.now()}`;
      const timestamp = Date.now();

      // Write item
      const putCommand = new PutItemCommand({
        TableName: outputs.DynamoDBTableName,
        Item: {
          transactionId: { S: testTransactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '100.50' },
          customerId: { S: 'test-customer' },
          status: { S: 'test' },
        },
      });
      await dynamoClient.send(putCommand);

      // Read item
      const getCommand = new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: testTransactionId },
          timestamp: { N: timestamp.toString() },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.transactionId.S).toBe(testTransactionId);
      expect(getResponse.Item!.amount.N).toBe('100.50');
    }, 30000);
  });

  describe('Kinesis Stream', () => {
    test('Kinesis stream should exist with correct configuration', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName,
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription!.RetentionPeriodHours).toBe(24);
    });

    test('Kinesis stream should have KMS encryption', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName,
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription!.EncryptionType).toBe('KMS');
      expect(response.StreamDescription!.KeyId).toContain(outputs.KMSKeyId);
    });

    test('should be able to write records to Kinesis', async () => {
      const testData = JSON.stringify({
        transactionId: `test-txn-${Date.now()}`,
        amount: 99.99,
        customerId: 'test-customer',
      });

      const command = new PutRecordCommand({
        StreamName: outputs.KinesisStreamName,
        Data: Buffer.from(testData),
        PartitionKey: 'test-customer',
      });

      const response = await kinesisClient.send(command);

      expect(response.ShardId).toBeDefined();
      expect(response.SequenceNumber).toBeDefined();
    }, 30000);
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist with correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.MemorySize).toBe(1024);
      expect(response.Configuration!.Timeout).toBe(60);
    });

    test('Lambda should be configured with VPC', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.VpcConfig).toBeDefined();
      expect(response.Configuration!.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(response.Configuration!.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.Configuration!.VpcConfig!.SubnetIds!.length).toBe(3);
    });

    test('Lambda should have environment variables configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.Environment).toBeDefined();
      expect(response.Configuration!.Environment!.Variables).toBeDefined();
      expect(response.Configuration!.Environment!.Variables!.DYNAMODB_TABLE_NAME).toBe(outputs.DynamoDBTableName);
      expect(response.Configuration!.Environment!.Variables!.KINESIS_STREAM_NAME).toBe(outputs.KinesisStreamName);
      expect(response.Configuration!.Environment!.Variables!.KMS_KEY_ID).toBe(outputs.KMSKeyId);
    });

    test('Lambda should process transactions successfully', async () => {
      const testPayload = {
        transactionId: `integration-test-${Date.now()}`,
        amount: 250.75,
        customerId: 'integration-test-customer',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(testPayload)),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      // Parse response
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toContain('processed successfully');
      expect(body.transactionId).toBeDefined();
    }, 60000);
  });

  describe('CloudWatch Logs', () => {
    test('CloudWatch log group should exist with correct configuration', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.CloudWatchLogGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.CloudWatchLogGroupName);
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toContain(outputs.KMSKeyId);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Lambda error alarm should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.LambdaErrorAlarmName],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(1);
    });

    test('DynamoDB throttle alarm should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.DynamoDBThrottleAlarmName],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('UserErrors');
      expect(alarm.Namespace).toBe('AWS/DynamoDB');
      expect(alarm.Threshold).toBe(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment suffix', () => {
      expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
      expect(outputs.KinesisStreamName).toContain(environmentSuffix);
      expect(outputs.LambdaFunctionName).toContain(environmentSuffix);
      expect(outputs.CloudWatchLogGroupName).toContain(environmentSuffix);
    });
  });

  describe('Security Validations', () => {
    test('all encryption should use customer-managed KMS key', () => {
      expect(outputs.KMSKeyArn).toContain('kms');
      expect(outputs.KMSKeyArn).toContain(outputs.KMSKeyId);
    });

    test('Lambda should be in VPC (private)', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.VpcConfig).toBeDefined();
      expect(response.Configuration!.VpcConfig!.VpcId).toBe(outputs.VPCId);
    });
  });
});
