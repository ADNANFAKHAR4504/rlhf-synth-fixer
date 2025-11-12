import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetResourcesCommand,
} from '@aws-sdk/client-api-gateway';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

const REGION = 'ap-southeast-1';
const OUTPUTS_FILE = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(`Outputs file not found: ${OUTPUTS_FILE}`);
    }
    outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf-8'));
  });

  describe('Stack Outputs', () => {
    test('should have all required output keys', () => {
      expect(outputs).toHaveProperty('apiUrl');
      expect(outputs).toHaveProperty('auditBucketName');
      expect(outputs).toHaveProperty('dynamoTableName');
      expect(outputs).toHaveProperty('dashboardUrl');
    });

    test('should have valid output values', () => {
      expect(outputs.apiUrl).toContain('execute-api');
      expect(outputs.apiUrl).toContain('amazonaws.com');
      expect(outputs.auditBucketName).toContain('payment-audit-logs');
      expect(outputs.dynamoTableName).toContain('transactions');
      expect(outputs.dashboardUrl).toContain('cloudwatch');
    });
  });

  describe('DynamoDB Table', () => {
    const dynamoClient = new DynamoDBClient({ region: REGION });

    test('should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(outputs.dynamoTableName);
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.SSEDescription?.SSEType).toBe('KMS');
    });

    test('should have billing mode PAY_PER_REQUEST', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema || [];
      const hashKey = keySchema.find(k => k.KeyType === 'HASH');
      const rangeKey = keySchema.find(k => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('transactionId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });
  });

  describe('S3 Bucket', () => {
    const s3Client = new S3Client({ region: REGION });

    test('should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.auditBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.auditBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const algorithm = response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      // Accept both KMS and AES256 encryption
      expect(['aws:kms', 'AES256']).toContain(algorithm);
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.auditBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Lambda Functions', () => {
    const lambdaClient = new LambdaClient({ region: REGION });
    let environmentSuffix: string;
    let functionNames: string[];

    beforeAll(() => {
      environmentSuffix = outputs.dynamoTableName.replace('transactions-', '');
      functionNames = [
        `payment-validator-${environmentSuffix}`,
        `payment-processor-${environmentSuffix}`,
        `payment-notifier-${environmentSuffix}`,
      ];
    });

    test('validator function should exist', async () => {
      const functionName = `payment-validator-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('processor function should exist', async () => {
      const functionName = `payment-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('notifier function should exist', async () => {
      const functionName = `payment-notifier-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('validator function should be in VPC', async () => {
      const functionName = `payment-validator-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.VpcConfig?.VpcId).toBeDefined();
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    });

    test('processor function should be in VPC', async () => {
      const functionName = `payment-processor-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.VpcConfig?.VpcId).toBeDefined();
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    });

    test('notifier function should be in VPC', async () => {
      const functionName = `payment-notifier-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.VpcConfig?.VpcId).toBeDefined();
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway', () => {
    const apiGatewayClient = new APIGatewayClient({ region: REGION });
    let restApiId: string;

    beforeAll(() => {
      const urlParts = outputs.apiUrl.split('/');
      restApiId = urlParts[2].split('.')[0];
    });

    test('should exist', async () => {
      const command = new GetRestApiCommand({ restApiId });
      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(restApiId);
      expect(response.name).toContain('payment-api');
    });

    test('should have payment resource', async () => {
      const command = new GetResourcesCommand({ restApiId });
      const response = await apiGatewayClient.send(command);
      const paymentResource = response.items?.find(item =>
        item.path === '/payments'
      );
      expect(paymentResource).toBeDefined();
    });

    test('should have POST method', async () => {
      const command = new GetResourcesCommand({ restApiId });
      const response = await apiGatewayClient.send(command);
      const paymentResource = response.items?.find(item =>
        item.path === '/payments'
      );
      expect(paymentResource?.resourceMethods).toHaveProperty('POST');
    });
  });

  describe('VPC and Network', () => {
    const ec2Client = new EC2Client({ region: REGION });
    let environmentSuffix: string;
    let vpcNameTag: string;

    beforeAll(() => {
      environmentSuffix = outputs.dynamoTableName.replace('transactions-', '');
      vpcNameTag = `payment-vpc-${environmentSuffix}`;
    });

    test('should have VPC', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [vpcNameTag],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have public subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`payment-public-subnet-*-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(3);
    });

    test('should have private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`payment-private-subnet-*-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(3);
    });

    test('should have NAT gateways', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'tag:Name',
            Values: [`payment-nat-*-${environmentSuffix}`],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(2);
    });

    test('should have VPC endpoints', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [
              `payment-s3-endpoint-${environmentSuffix}`,
              `payment-dynamodb-endpoint-${environmentSuffix}`,
            ],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('KMS Key', () => {
    const kmsClient = new KMSClient({ region: REGION });
    let environmentSuffix: string;
    let aliasName: string;

    beforeAll(() => {
      environmentSuffix = outputs.dynamoTableName.replace('transactions-', '');
      aliasName = `alias/payment-db-${environmentSuffix}`;
    });

    test('should have KMS alias', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);
      const alias = response.Aliases?.find(a => a.AliasName === aliasName);
      expect(alias).toBeDefined();
    });

    test('should have key enabled', async () => {
      const listCommand = new ListAliasesCommand({});
      const listResponse = await kmsClient.send(listCommand);
      const alias = listResponse.Aliases?.find(a => a.AliasName === aliasName);

      if (alias?.TargetKeyId) {
        const describeCommand = new DescribeKeyCommand({
          KeyId: alias.TargetKeyId,
        });
        const describeResponse = await kmsClient.send(describeCommand);
        expect(describeResponse.KeyMetadata?.Enabled).toBe(true);
        expect(describeResponse.KeyMetadata?.KeyState).toBe('Enabled');
      }
    });
  });

  describe('SNS Topic', () => {
    const snsClient = new SNSClient({ region: REGION });
    let environmentSuffix: string;

    beforeAll(() => {
      environmentSuffix = outputs.dynamoTableName.replace('transactions-', '');
    });

    test('should have SNS topic', async () => {
      const topicName = `payment-notifications-${environmentSuffix}`;
      const accountId = await getAccountId();
      const topicArn = `arn:aws:sns:${REGION}:${accountId}:${topicName}`;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes?.TopicArn).toContain(topicName);
    });
  });

  describe('CloudWatch Dashboard', () => {
    const cloudWatchClient = new CloudWatchClient({ region: REGION });
    let environmentSuffix: string;
    let dashboardName: string;

    beforeAll(() => {
      environmentSuffix = outputs.dynamoTableName.replace('transactions-', '');
      dashboardName = `payment-monitoring-${environmentSuffix}`;
    });

    test('should exist', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudWatchClient.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    });

    test('should have widgets for Lambda and DynamoDB', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudWatchClient.send(command);
      const dashboardBody = JSON.parse(response.DashboardBody || '{}');
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);

      const dashboardStr = JSON.stringify(dashboardBody);
      expect(dashboardStr).toContain('AWS/Lambda');
      expect(dashboardStr).toContain('AWS/DynamoDB');
    });
  });
});

async function getAccountId(): Promise<string> {
  const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
  const stsClient = new STSClient({ region: REGION });
  const command = new GetCallerIdentityCommand({});
  const response = await stsClient.send(command);
  return response.Account || '';
}
