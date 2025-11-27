// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EC2Client,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetApiKeyCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Initialize AWS clients
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region: AWS_REGION });
const dynamodbClient = new DynamoDBClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const apiGatewayClient = new APIGatewayClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs - handle case where file doesn't exist
let outputs: Record<string, string> = {};
let outputsLoaded = false;

const loadOutputs = () => {
  try {
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      outputsLoaded = true;
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } else {
      console.warn('Outputs file not found, skipping integration tests');
    }
  } catch (error) {
    console.warn('Failed to load outputs:', error);
  }
};

beforeAll(() => {
  loadOutputs();
});

describe('Secure Data Processing Pipeline Integration Tests', () => {
  describe('Deployment Outputs', () => {
    test('outputs file exists', () => {
      expect(outputsLoaded).toBe(true);
    });

    test('contains required output keys', () => {
      if (!outputsLoaded) return;

      const requiredOutputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'VPCId',
        'DataBucketName',
        'TransactionTableName',
        'DataProcessorFunctionArn',
        'ApiEndpoint',
        'ApiKeyId',
        'DatabaseSecretArn',
      ];

      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
      });
    });
  });

  describe('KMS Key', () => {
    test('KMS key exists and is enabled', async () => {
      if (!outputsLoaded || !outputs.KMSKeyId) return;

      const result = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.KMSKeyId })
      );

      expect(result.KeyMetadata).toBeDefined();
      expect(result.KeyMetadata?.KeyState).toBe('Enabled');
    }, 30000);

    test('KMS key has rotation enabled', async () => {
      if (!outputsLoaded || !outputs.KMSKeyId) return;

      const result = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.KMSKeyId })
      );

      expect(result.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('VPC Resources', () => {
    test('private subnets exist', async () => {
      if (!outputsLoaded || !outputs.VPCId) return;

      const result = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
        })
      );

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets?.length).toBeGreaterThanOrEqual(3);

      // Verify subnets don't have public IP auto-assign
      result.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, 30000);

    test('VPC endpoints exist', async () => {
      if (!outputsLoaded || !outputs.VPCId) return;

      const result = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
        })
      );

      expect(result.VpcEndpoints).toBeDefined();
      expect(result.VpcEndpoints?.length).toBeGreaterThanOrEqual(2);

      // Verify S3 and DynamoDB endpoints exist
      const serviceNames = result.VpcEndpoints?.map(ep => ep.ServiceName) || [];
      expect(serviceNames.some(name => name?.includes('s3'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('dynamodb'))).toBe(true);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('bucket exists and has versioning enabled', async () => {
      if (!outputsLoaded || !outputs.DataBucketName) return;

      const result = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.DataBucketName })
      );

      expect(result.Status).toBe('Enabled');
    }, 30000);

    test('bucket has KMS encryption', async () => {
      if (!outputsLoaded || !outputs.DataBucketName) return;

      const result = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.DataBucketName })
      );

      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = result.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    test('bucket blocks public access', async () => {
      if (!outputsLoaded || !outputs.DataBucketName) return;

      const result = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.DataBucketName })
      );

      expect(result.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(result.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(result.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(result.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('bucket has lifecycle rules', async () => {
      if (!outputsLoaded || !outputs.DataBucketName) return;

      const result = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: outputs.DataBucketName })
      );

      expect(result.Rules).toBeDefined();
      expect(result.Rules?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('DynamoDB Table', () => {
    test('table exists with correct configuration', async () => {
      if (!outputsLoaded || !outputs.TransactionTableName) return;

      const result = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: outputs.TransactionTableName })
      );

      expect(result.Table).toBeDefined();
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    test('table has KMS encryption', async () => {
      if (!outputsLoaded || !outputs.TransactionTableName) return;

      const result = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: outputs.TransactionTableName })
      );

      expect(result.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(result.Table?.SSEDescription?.SSEType).toBe('KMS');
    }, 30000);

    test('table has point-in-time recovery enabled', async () => {
      if (!outputsLoaded || !outputs.TransactionTableName) return;

      const result = await dynamodbClient.send(
        new DescribeContinuousBackupsCommand({ TableName: outputs.TransactionTableName })
      );

      expect(
        result.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    }, 30000);

    test('table has correct key schema', async () => {
      if (!outputsLoaded || !outputs.TransactionTableName) return;

      const result = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: outputs.TransactionTableName })
      );

      const keySchema = result.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const hashKey = keySchema?.find(k => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find(k => k.KeyType === 'RANGE');
      expect(hashKey?.AttributeName).toBe('transactionId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('data processor function exists and is active', async () => {
      if (!outputsLoaded || !outputs.DataProcessorFunctionArn) return;

      const result = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.DataProcessorFunctionArn })
      );

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.State).toBe('Active');
    }, 30000);

    test('data processor uses Python 3.11 runtime', async () => {
      if (!outputsLoaded || !outputs.DataProcessorFunctionArn) return;

      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.DataProcessorFunctionArn })
      );

      expect(result.Runtime).toBe('python3.11');
    }, 30000);

    test('data processor is configured in VPC', async () => {
      if (!outputsLoaded || !outputs.DataProcessorFunctionArn) return;

      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.DataProcessorFunctionArn })
      );

      expect(result.VpcConfig).toBeDefined();
      expect(result.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      expect(result.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);
    }, 30000);

    test('data processor has KMS encryption for environment variables', async () => {
      if (!outputsLoaded || !outputs.DataProcessorFunctionArn) return;

      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.DataProcessorFunctionArn })
      );

      expect(result.KMSKeyArn).toBeDefined();
    }, 30000);

    test('data processor has required environment variables', async () => {
      if (!outputsLoaded || !outputs.DataProcessorFunctionArn) return;

      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.DataProcessorFunctionArn })
      );

      expect(result.Environment?.Variables?.TABLE_NAME).toBeDefined();
      expect(result.Environment?.Variables?.BUCKET_NAME).toBeDefined();
      expect(result.Environment?.Variables?.KMS_KEY_ID).toBeDefined();
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('database secret exists', async () => {
      if (!outputsLoaded || !outputs.DatabaseSecretArn) return;

      const result = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: outputs.DatabaseSecretArn })
      );

      expect(result.Name).toBeDefined();
      expect(result.ARN).toBe(outputs.DatabaseSecretArn);
    }, 30000);

    test('database secret uses KMS encryption', async () => {
      if (!outputsLoaded || !outputs.DatabaseSecretArn) return;

      const result = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: outputs.DatabaseSecretArn })
      );

      expect(result.KmsKeyId).toBeDefined();
    }, 30000);

    test('database secret has rotation configured', async () => {
      if (!outputsLoaded || !outputs.DatabaseSecretArn) return;

      const result = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: outputs.DatabaseSecretArn })
      );

      expect(result.RotationEnabled).toBe(true);
      expect(result.RotationLambdaARN).toBeDefined();
    }, 30000);
  });

  describe('API Gateway', () => {
    test('REST API exists', async () => {
      if (!outputsLoaded || !outputs.ApiEndpoint) return;

      // Extract API ID from endpoint URL
      const apiIdMatch = outputs.ApiEndpoint.match(/https:\/\/([^.]+)\./);
      if (!apiIdMatch) return;

      const apiId = apiIdMatch[1];
      const result = await apiGatewayClient.send(
        new GetRestApiCommand({ restApiId: apiId })
      );

      expect(result.name).toBeDefined();
      expect(result.apiKeySource).toBe('HEADER');
    }, 30000);

    test('API key exists and is enabled', async () => {
      if (!outputsLoaded || !outputs.ApiKeyId) return;

      const result = await apiGatewayClient.send(
        new GetApiKeyCommand({ apiKey: outputs.ApiKeyId })
      );

      expect(result.enabled).toBe(true);
    }, 30000);
  });

  describe('CloudWatch Log Groups', () => {
    test('data processor log group exists', async () => {
      if (!outputsLoaded) return;

      const logGroupName = `/aws/lambda/data-processor-${environmentSuffix}`;
      const result = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    }, 30000);

    test('log groups have KMS encryption', async () => {
      if (!outputsLoaded) return;

      const logGroupName = `/aws/lambda/data-processor-${environmentSuffix}`;
      const result = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);

    test('log groups have retention configured', async () => {
      if (!outputsLoaded) return;

      const logGroupName = `/aws/lambda/data-processor-${environmentSuffix}`;
      const result = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security Best Practices Validation', () => {
    test('all resources use environment suffix in naming', () => {
      if (!outputsLoaded) return;

      // Verify output values contain environment suffix pattern
      if (outputs.DataBucketName) {
        expect(outputs.DataBucketName).toContain(environmentSuffix);
      }
      if (outputs.TransactionTableName) {
        expect(outputs.TransactionTableName).toContain(environmentSuffix);
      }
    });
  });
});
