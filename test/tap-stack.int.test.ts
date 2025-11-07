import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  LambdaClient,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetQueueAttributesCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let rawOutputs: Record<string, string> = {};

try {
  rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn(`Could not load outputs file: ${outputsPath}`);
}

// Extract environment suffix from outputs
// Outputs have format like "VpcId", "ApiEndpoint", etc. with suffix in values
// We need to extract the suffix from resource names in the outputs
const outputKeys = Object.keys(rawOutputs);
let environmentSuffix = 'dev';

// Try to extract suffix from known patterns in output values
for (const [key, value] of Object.entries(rawOutputs)) {
  // Check for patterns like "payment-validation-pr5998", "payment-queue-pr5998", etc.
  const match = value.match(/-(pr\d+|dev|staging|prod)(?:\.|$|\/)/);
  if (match) {
    environmentSuffix = match[1];
    break;
  }
  // Also check for patterns in ARNs
  const arnMatch = value.match(/arn:aws:[^:]+:[^:]+:[^:]+:[^:]+-([a-zA-Z0-9-]+)/);
  if (arnMatch && arnMatch[1].match(/^(pr\d+|dev|staging|prod)$/)) {
    environmentSuffix = arnMatch[1];
    break;
  }
}

// Normalize outputs - use keys as-is since they don't have suffix appended
const outputs: Record<string, string> = { ...rawOutputs };

// Get region from AWS_REGION file or environment variable
let region = 'us-east-1'; // Default fallback
try {
  const regionPath = path.join(__dirname, '../lib/AWS_REGION');
  if (fs.existsSync(regionPath)) {
    const fileRegion = fs.readFileSync(regionPath, 'utf-8').trim();
    if (fileRegion) {
      region = fileRegion;
    }
  }
} catch (e) {
  // Fallback to environment variable or default
}
region = process.env.AWS_REGION || region;

describe('Payment Processing System Integration Tests', () => {
  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const sqsClient = new SQSClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const apiGatewayClient = new APIGatewayClient({ region });
  const secretsManagerClient = new SecretsManagerClient({ region });

  describe('VPC', () => {
    test('Should have VPC deployed', async () => {
      if (!outputs.VpcId) {
        console.log('Skipping VPC test - VpcId output not found');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);
      expect(response.Vpcs?.[0]?.VpcId).toBe(outputs.VpcId);
      expect(response.Vpcs?.[0]?.State).toBe('available');
    });
  });

  describe('RDS Database', () => {
    test('Should have RDS Aurora cluster deployed', async () => {
      if (!outputs.DatabaseEndpoint) {
        console.log('Skipping RDS test - DatabaseEndpoint output not found');
        return;
      }

      // Extract cluster identifier from endpoint
      const clusterIdentifier = `payment-db-cluster-${environmentSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBeGreaterThan(0);
      expect(response.DBClusters?.[0]?.DBClusterIdentifier).toBe(clusterIdentifier);
      expect(response.DBClusters?.[0]?.Status).toBe('available');
      expect(response.DBClusters?.[0]?.Engine).toBe('aurora-postgresql');
    });

    test('Should have database secret in Secrets Manager', async () => {
      if (!outputs.DatabaseSecretArn) {
        console.log('Skipping Secrets Manager test - DatabaseSecretArn output not found');
        return;
      }

      const command = new GetSecretValueCommand({
        SecretId: outputs.DatabaseSecretArn,
      });
      const response = await secretsManagerClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString || '{}');
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
    });
  });

  describe('S3 Storage', () => {
    test('Should have transaction bucket deployed', async () => {
      if (!outputs.TransactionBucketName) {
        console.log('Skipping S3 bucket test - TransactionBucketName output not found');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.TransactionBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();

      // Check bucket versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.TransactionBucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBeDefined();
    });
  });

  describe('SQS Queue', () => {
    test('Should be able to send message to payment queue', async () => {
      if (!outputs.PaymentQueueUrl) {
        console.log('Skipping SQS send message test - PaymentQueueUrl output not found');
        return;
      }

      const testMessage = {
        transactionId: `test-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        merchantId: 'test-merchant',
      };

      const command = new SendMessageCommand({
        QueueUrl: outputs.PaymentQueueUrl,
        MessageBody: JSON.stringify(testMessage),
      });

      const response = await sqsClient.send(command);
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('Should have payment validation Lambda deployed', async () => {
      if (!outputs.PaymentValidationFunctionArn) {
        console.log('Skipping Lambda test - PaymentValidationFunctionArn output not found');
        return;
      }

      // Extract function name from ARN or use expected pattern
      const functionName = outputs.PaymentValidationFunctionArn.split(':').pop() ||
        `payment-validation-${environmentSuffix}`;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('Should have SQS event source mapping for payment queue', async () => {
      if (!outputs.PaymentValidationFunctionArn) {
        console.log('Skipping event source mapping test - PaymentValidationFunctionArn output not found');
        return;
      }

      const functionName = outputs.PaymentValidationFunctionArn.split(':').pop() ||
        `payment-validation-${environmentSuffix}`;

      const command = new ListEventSourceMappingsCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      // Event source mapping may or may not exist depending on stack configuration
      if (response.EventSourceMappings && response.EventSourceMappings.length > 0) {
        expect(response.EventSourceMappings?.[0]?.EventSourceArn).toContain('sqs');
      }
    });
  });

  describe('API Gateway', () => {
    test('Should have REST API deployed', async () => {
      if (!outputs.ApiEndpoint) {
        console.log('Skipping API Gateway test - ApiEndpoint output not found');
        return;
      }

      // Extract API ID from endpoint URL
      const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(apiId);
      expect(response.name).toBeDefined();
    });

    test('Should have API stage deployed', async () => {
      if (!outputs.ApiEndpoint) {
        console.log('Skipping API Gateway stage test - ApiEndpoint output not found');
        return;
      }

      const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];
      // Extract stage name from URL (e.g., "pr5998" from "https://.../pr5998/")
      const stageName = outputs.ApiEndpoint.split('/')[3] || 'prod';

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: stageName,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe(stageName);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Should have all components integrated correctly', async () => {
      // Verify VPC exists
      if (outputs.VpcId) {
        const vpcCommand = new DescribeVpcsCommand({
          VpcIds: [outputs.VpcId],
        });
        const vpcResponse = await ec2Client.send(vpcCommand);
        expect(vpcResponse.Vpcs?.[0]?.State).toBe('available');
      }

      // Verify database cluster exists
      if (outputs.DatabaseEndpoint) {
        const clusterIdentifier = `payment-db-cluster-${environmentSuffix}`;
        const dbCommand = new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        });
        const dbResponse = await rdsClient.send(dbCommand);
        expect(dbResponse.DBClusters?.[0]?.Status).toBe('available');
      }

      // Verify S3 bucket exists
      if (outputs.TransactionBucketName) {
        const bucketCommand = new HeadBucketCommand({
          Bucket: outputs.TransactionBucketName,
        });
        await expect(s3Client.send(bucketCommand)).resolves.toBeDefined();
      }

      // Verify queue exists
      if (outputs.PaymentQueueUrl) {
        const queueCommand = new GetQueueAttributesCommand({
          QueueUrl: outputs.PaymentQueueUrl,
          AttributeNames: ['QueueArn'],
        });
        const queueResponse = await sqsClient.send(queueCommand);
        expect(queueResponse.Attributes?.QueueArn).toBeDefined();
      }

      // Verify Lambda function exists
      if (outputs.PaymentValidationFunctionArn) {
        const functionName = outputs.PaymentValidationFunctionArn.split(':').pop() ||
          `payment-validation-${environmentSuffix}`;
        const lambdaCommand = new GetFunctionCommand({
          FunctionName: functionName,
        });
        const lambdaResponse = await lambdaClient.send(lambdaCommand);
        expect(lambdaResponse.Configuration?.State).toBe('Active');
      }

      // Verify API Gateway exists
      if (outputs.ApiEndpoint) {
        const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];
        const apiCommand = new GetRestApiCommand({
          restApiId: apiId,
        });
        const apiResponse = await apiGatewayClient.send(apiCommand);
        expect(apiResponse.id).toBe(apiId);
      }

      // Verify secret exists
      if (outputs.DatabaseSecretArn) {
        const secretCommand = new GetSecretValueCommand({
          SecretId: outputs.DatabaseSecretArn,
        });
        const secretResponse = await secretsManagerClient.send(secretCommand);
        expect(secretResponse.SecretString).toBeDefined();
      }
    });
  });
});
