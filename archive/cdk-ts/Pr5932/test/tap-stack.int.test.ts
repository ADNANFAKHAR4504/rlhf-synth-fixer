import fs from 'fs';
import path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  Route53Client,
  GetHostedZoneCommand,
} from '@aws-sdk/client-route-53';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';
const prefix = `tap-${environmentSuffix}`;
const stackName = `TapStack${environmentSuffix}`;

const dynamodbClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const route53Client = new Route53Client({ region });
const ssmClient = new SSMClient({ region });
const iamClient = new IAMClient({ region });
const cfnClient = new CloudFormationClient({ region });

describe('TapStack Integration Tests - Live AWS Resources', () => {
  describe('CloudFormation Stack Tests', () => {
    test('should verify stack exists and is in CREATE_COMPLETE state', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBe(1);
      // Stack can be in CREATE_COMPLETE or UPDATE_COMPLETE state
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        response.Stacks?.[0].StackStatus
      );
    }, 30000);

    test('should verify stack has required outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const stack = response.Stacks?.[0];
      expect(stack?.Outputs).toBeDefined();
      expect(stack?.Outputs?.length).toBeGreaterThan(0);

      const outputKeys = stack?.Outputs?.map(o => o.OutputKey) || [];
      expect(outputKeys).toContain('VPCId');
      expect(outputKeys).toContain('TransitGatewayId');
      expect(outputKeys).toContain('HostedZoneId');
      expect(outputKeys).toContain('OrdersTableName');
      expect(outputKeys).toContain('HealthCheckLambdaArn');
    }, 30000);

    test('should verify VPC ID from stack outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const vpcIdOutput = response.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'VPCId'
      );
      expect(vpcIdOutput?.OutputValue).toBe(outputs.VPCId);
    }, 30000);

    test('should verify Transit Gateway ID from stack outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const tgwIdOutput = response.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'TransitGatewayId'
      );
      expect(tgwIdOutput?.OutputValue).toBe(outputs.TransitGatewayId);
    }, 30000);

    test('should verify stack has proper tags', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const tags = response.Stacks?.[0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tags.find(t => t.Key === 'Environment')?.Value).toBe(environmentSuffix);
    }, 30000);
  });

  describe('S3 Buckets Configuration Tests', () => {
    test('should verify all 3 S3 buckets exist', async () => {
      const flowLogsBucketName = outputs.FlowLogsBucketArn.split(':::')[1];
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];
      const backupBucketName = outputs.BackupBucketArn.split(':::')[1];

      const flowLogsResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: flowLogsBucketName })
      );
      expect(flowLogsResponse.$metadata.httpStatusCode).toBe(200);

      const tradingDataResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: tradingDataBucketName })
      );
      expect(tradingDataResponse.$metadata.httpStatusCode).toBe(200);

      const backupResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: backupBucketName })
      );
      expect(backupResponse.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should verify S3 buckets have versioning enabled', async () => {
      const flowLogsBucketName = outputs.FlowLogsBucketArn.split(':::')[1];

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: flowLogsBucketName })
      );

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should verify S3 buckets have encryption enabled', async () => {
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: tradingDataBucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    }, 30000);

    test('should verify S3 buckets have public access blocked', async () => {
      const backupBucketName = outputs.BackupBucketArn.split(':::')[1];

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: backupBucketName })
      );

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('should be able to write and read objects from trading data bucket', async () => {
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];
      const testKey = `integration-test-${Date.now()}.txt`;
      const testData = 'Integration test data';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: tradingDataBucketName,
          Key: testKey,
          Body: testData,
        })
      );

      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: tradingDataBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.Body).toBeDefined();

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: tradingDataBucketName,
          Key: testKey,
        })
      );
    }, 30000);

    test('should verify bucket names include region codes', async () => {
      const flowLogsBucketName = outputs.FlowLogsBucketArn.split(':::')[1];
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];
      const backupBucketName = outputs.BackupBucketArn.split(':::')[1];

      expect(flowLogsBucketName).toContain(region);
      expect(tradingDataBucketName).toContain(region);
      expect(backupBucketName).toContain(region);
    }, 30000);
  });

  describe('DynamoDB Tables Configuration Tests', () => {
    test('should verify all 3 DynamoDB tables exist and are active', async () => {
      const ordersTableResponse = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );
      expect(ordersTableResponse.Table?.TableStatus).toBe('ACTIVE');

      const marketDataTableResponse = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.MarketDataTableName,
        })
      );
      expect(marketDataTableResponse.Table?.TableStatus).toBe('ACTIVE');

      const accountsTableName = `${prefix}-UserAccounts`;
      const accountsTableResponse = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: accountsTableName,
        })
      );
      expect(accountsTableResponse.Table?.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('should verify DynamoDB tables have on-demand billing', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    test('should verify DynamoDB tables have encryption enabled', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    test('should verify Orders table has DynamoDB stream enabled', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    }, 30000);

    test('should verify Orders table has Global Secondary Index', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);

      const userOrdersIndex = response.Table?.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === 'UserOrdersIndex'
      );
      expect(userOrdersIndex).toBeDefined();
    }, 30000);

    test('should be able to write and read items from Orders table using GetItem', async () => {
      const orderId = `test-order-${Date.now()}`;
      const timestamp = Date.now();

      // Write item
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: outputs.OrdersTableName,
          Item: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
            userId: { S: 'test-user' },
            symbol: { S: 'AAPL' },
            quantity: { N: '100' },
            price: { N: '150.50' },
            orderType: { S: 'BUY' },
            status: { S: 'PENDING' },
          },
        })
      );

      // Read item back using GetItem (strongly consistent read)
      const getResponse = await dynamodbClient.send(
        new GetItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
          ConsistentRead: true,
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.orderId.S).toBe(orderId);
      expect(getResponse.Item?.symbol.S).toBe('AAPL');
      expect(getResponse.Item?.status.S).toBe('PENDING');

      // Clean up
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );
    }, 30000);

    test('should verify table names include environment suffix', async () => {
      expect(outputs.OrdersTableName).toContain(prefix);
      expect(outputs.MarketDataTableName).toContain(prefix);
    }, 30000);
  });

  describe('Lambda Functions Configuration Tests', () => {
    test('should verify Health Check Lambda exists and is active', async () => {
      const functionName = outputs.HealthCheckLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(512);
    }, 30000);

    test('should verify Order Processing Lambda exists and is active', async () => {
      const functionName = outputs.OrderProcessingLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(2048);
    }, 30000);

    test('should verify Lambda functions are deployed in VPC', async () => {
      const functionName = outputs.HealthCheckLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBe(outputs.VPCId);
    }, 30000);

    test('should verify DynamoDB stream event source mapping exists', async () => {
      const functionName = outputs.OrderProcessingLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new ListEventSourceMappingsCommand({
          FunctionName: functionName,
        })
      );

      expect(response.EventSourceMappings).toBeDefined();
      expect(response.EventSourceMappings?.length).toBeGreaterThan(0);
      expect(response.EventSourceMappings?.[0].State).toBe('Enabled');
      expect(response.EventSourceMappings?.[0].BatchSize).toBe(10);
    }, 30000);

    test('should invoke Health Check Lambda successfully', async () => {
      const functionName = outputs.HealthCheckLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBeDefined();
        expect(payload.body).toBeDefined();

        const body = JSON.parse(payload.body);
        expect(body.checks).toBeDefined();
        expect(body.checks.length).toBeGreaterThan(0);
      }
    }, 60000);

    test('should verify Lambda functions use Graviton2 ARM64 architecture', async () => {
      const healthCheckName = outputs.HealthCheckLambdaArn.split(':').pop();
      const orderProcessorName = outputs.OrderProcessingLambdaArn.split(':').pop();

      const healthCheckResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: healthCheckName })
      );
      expect(healthCheckResponse.Configuration?.Architectures).toEqual(['arm64']);

      const orderProcessorResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: orderProcessorName })
      );
      expect(orderProcessorResponse.Configuration?.Architectures).toEqual(['arm64']);
    }, 30000);
  });

  describe('Route 53 Configuration Tests', () => {
    test('should verify private hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.HostedZoneId,
        })
      );

      expect(response.HostedZone?.Config?.PrivateZone).toBe(true);
      expect(response.HostedZone?.Name).toContain('trading-platform.internal');
    }, 30000);

    test('should verify hosted zone is associated with VPC', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.HostedZoneId,
        })
      );

      expect(response.VPCs).toBeDefined();
      expect(response.VPCs?.length).toBeGreaterThan(0);
      expect(response.VPCs?.[0].VPCId).toBe(outputs.VPCId);
    }, 30000);
  });

  describe('SSM Parameter Store Configuration Tests', () => {
    test('should verify alert thresholds parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/alert-thresholds`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Value).toBeDefined();

      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.latencyThresholdMs).toBeDefined();
      expect(config.errorRateThreshold).toBeDefined();
      expect(config.orderVolumeThreshold).toBeDefined();
    }, 30000);

    test('should verify database configuration parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/database-config`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.readCapacity).toBe('ON_DEMAND');
      expect(config.pointInTimeRecovery).toBe(true);
    }, 30000);

    test('should verify network configuration parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/network-config`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.vpcCidr).toBe('10.0.0.0/16');
      expect(config.transitGatewayAsn).toBe(64512);
      expect(config.natGateways).toBe(3);
      expect(config.availabilityZones).toBe(3);
    }, 30000);

    test('should verify Transit Gateway attachments parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/tgw-attachments`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.productionAttachment).toBe(outputs.TransitGatewayAttachmentProdId);
      expect(config.developmentAttachment).toBe(outputs.TransitGatewayAttachmentDevId);
    }, 30000);

    test('should verify S3 bucket configuration parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/s3-config`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.versioning).toBe(true);
      expect(config.encryption).toBe('S3_MANAGED');
    }, 30000);
  });

  describe('IAM Roles and Permissions Tests', () => {
    test('should verify Lambda execution role exists', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `${prefix}-lambda-execution-role`,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
    }, 30000);

    test('should verify Lambda role has VPC access policy', async () => {
      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: `${prefix}-lambda-execution-role`,
        })
      );

      expect(response.AttachedPolicies).toBeDefined();
      const vpcPolicy = response.AttachedPolicies?.find(policy =>
        policy.PolicyName?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(vpcPolicy).toBeDefined();
    }, 30000);
  });

  describe('Infrastructure Validation Tests', () => {
    test('should verify VPC CIDR from outputs', async () => {
      expect(outputs.VPCCidr).toBe('10.0.0.0/16');
    }, 30000);

    test('should verify Transit Gateway ID exists in outputs', async () => {
      expect(outputs.TransitGatewayId).toBeDefined();
      expect(outputs.TransitGatewayId).toMatch(/^tgw-/);
    }, 30000);

    test('should verify Transit Gateway attachments exist in outputs', async () => {
      expect(outputs.TransitGatewayAttachmentProdId).toBeDefined();
      expect(outputs.TransitGatewayAttachmentProdId).toMatch(/^tgw-attach-/);

      expect(outputs.TransitGatewayAttachmentDevId).toBeDefined();
      expect(outputs.TransitGatewayAttachmentDevId).toMatch(/^tgw-attach-/);
    }, 30000);
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete end-to-end order processing workflow', async () => {
      const orderId = `e2e-test-${Date.now()}`;
      const timestamp = Date.now();

      // Create order
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: outputs.OrdersTableName,
          Item: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
            userId: { S: 'e2e-test-user' },
            symbol: { S: 'TSLA' },
            quantity: { N: '50' },
            price: { N: '200.00' },
            orderType: { S: 'BUY' },
            status: { S: 'PENDING' },
          },
        })
      );

      // Verify order was created using GetItem (strongly consistent)
      const getResponse = await dynamodbClient.send(
        new GetItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
          ConsistentRead: true,
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.orderId.S).toBe(orderId);

      // Clean up
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );
    }, 30000);
  });
});
