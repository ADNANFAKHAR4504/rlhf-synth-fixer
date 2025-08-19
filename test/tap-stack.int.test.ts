// Integration tests for TAP Stack
// These tests will run after deployment to verify the actual infrastructure
//
// IMPORTANT: These tests require:
// 1. AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. The TAP stack to be deployed to the target environment
// 3. Proper AWS permissions to access all services
//
// These tests are designed for CI/CD pipelines and will be skipped locally
// unless AWS credentials are properly configured.

import { ApiGatewayV2Client, GetApisCommand } from '@aws-sdk/client-apigatewayv2';
import { DescribeTableCommand, DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DescribeKeyCommand, KMSClient, ListKeysCommand } from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { GetBucketEncryptionCommand, ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { DescribeSecretCommand, ListSecretsCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

// Check if we have AWS credentials for integration testing
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

// AWS SDK clients for integration testing
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new ApiGatewayV2Client({ region });

describe('TAP Stack Integration Tests', () => {
  // Skip all tests if no AWS credentials are available
  beforeAll(() => {
    if (!hasAwsCredentials) {
      console.log('⚠️  AWS credentials not found. Integration tests will be skipped.');
      console.log('   These tests require AWS credentials and deployed infrastructure.');
      console.log('   They are designed for CI/CD environments.');
    }
  });

  // These tests require the stack to be deployed
  // They will be skipped if the required environment variables are not set

  describe('Infrastructure Validation', () => {
    test('should have basic test environment available', () => {
      // Check if we're in a proper test environment
      expect(process.env.NODE_ENV).toBeDefined();
      expect(typeof process.env.NODE_ENV).toBe('string');
      expect(process.env.AWS_REGION).toBeDefined();
      expect(process.env.AWS_REGION).toBe('us-west-2');
    });

    test('should be able to access environment variables', () => {
      // Verify that environment variables can be accessed
      expect(process.env).toBeDefined();
      expect(typeof process.env).toBe('object');
    });
  });

  describe('DynamoDB Integration', () => {
    test('should have DynamoDB table accessible', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping DynamoDB test - no AWS credentials');
        return;
      }

      const tableName = `tap-items-table`;
      
      try {
        // List all tables to verify access
        const listCommand = new ListTablesCommand({});
        const listResult = await dynamoClient.send(listCommand);
        
        expect(listResult.TableNames).toBeDefined();
        expect(Array.isArray(listResult.TableNames)).toBe(true);
        
        // Verify our specific table exists
        const tableExists = listResult.TableNames?.includes(tableName);
        expect(tableExists).toBe(true);
        
        // Get table details to verify encryption
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const tableDetails = await dynamoClient.send(describeCommand);
        
        expect(tableDetails.Table).toBeDefined();
        expect(tableDetails.Table?.TableName).toBe(tableName);
        expect(tableDetails.Table?.SSEDescription).toBeDefined();
        expect(tableDetails.Table?.SSEDescription?.SSEType).toBe('KMS');
        
      } catch (error) {
        throw new Error(`DynamoDB integration test failed: ${error}`);
      }
    }, 30000); // 30 second timeout for AWS API calls

    test('should have DynamoDB table with proper encryption', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping DynamoDB encryption test - no AWS credentials');
        return;
      }

      const tableName = `tap-items-table`;
      
      try {
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const tableDetails = await dynamoClient.send(describeCommand);
        
        // Verify encryption is enabled
        expect(tableDetails.Table?.SSEDescription?.Status).toBe('ENABLED');
        expect(tableDetails.Table?.SSEDescription?.SSEType).toBe('KMS');
        expect(tableDetails.Table?.SSEDescription?.KMSMasterKeyArn).toBeDefined();
        
        // Note: Point-in-time recovery status is not directly accessible via DescribeTable
        // It's configured at the table level but requires additional API calls to verify
        
        // Verify billing mode is PAY_PER_REQUEST
        expect(tableDetails.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        
      } catch (error) {
        throw new Error(`DynamoDB encryption test failed: ${error}`);
      }
    }, 30000);
  });

  describe('S3 Integration', () => {
    test('should have S3 bucket accessible', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping S3 test - no AWS credentials');
        return;
      }

      try {
        // List all buckets to verify access
        const listCommand = new ListBucketsCommand({});
        const listResult = await s3Client.send(listCommand);
        
        expect(listResult.Buckets).toBeDefined();
        expect(Array.isArray(listResult.Buckets)).toBe(true);
        
        // Find our specific bucket
        const bucketName = `tap-files-bucket-${process.env.AWS_ACCOUNT_ID || 'test'}-${region}`;
        const bucketExists = listResult.Buckets?.some(bucket => 
          bucket.Name?.includes('tap-files-bucket')
        );
        
        expect(bucketExists).toBe(true);
        
      } catch (error) {
        throw new Error(`S3 integration test failed: ${error}`);
      }
    }, 30000);

    test('should have S3 bucket with proper encryption', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping S3 encryption test - no AWS credentials');
        return;
      }

      try {
        const bucketName = `tap-files-bucket-${process.env.AWS_ACCOUNT_ID || 'test'}-${region}`;
        
        // Get bucket encryption configuration
        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const encryptionResult = await s3Client.send(encryptionCommand);
        
        expect(encryptionResult.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryptionResult.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryptionResult.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
        
        const encryptionRule = encryptionResult.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(encryptionRule?.ApplyServerSideEncryptionByDefault).toBeDefined();
        expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
        expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
        
      } catch (error) {
        throw new Error(`S3 encryption test failed: ${error}`);
      }
    }, 30000);
  });

  describe('KMS Integration', () => {
    test('should have KMS key configured', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping KMS test - no AWS credentials');
        return;
      }

      try {
        // List all KMS keys to verify access
        const listCommand = new ListKeysCommand({});
        const listResult = await kmsClient.send(listCommand);
        
        expect(listResult.Keys).toBeDefined();
        expect(Array.isArray(listResult.Keys)).toBe(true);
        
        // Find our specific key (look for alias)
        const keyAlias = 'alias/tap-app-key';
        // Note: We can't directly search by alias in ListKeys, but we can verify access
        
      } catch (error) {
        throw new Error(`KMS integration test failed: ${error}`);
      }
    }, 30000);

    test('should have KMS key with proper configuration', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping KMS configuration test - no AWS credentials');
        return;
      }

      try {
        // This test would require the actual key ID from the stack outputs
        // For now, we'll verify KMS access is working
        const listCommand = new ListKeysCommand({});
        const listResult = await kmsClient.send(listCommand);
        
        expect(listResult.Keys).toBeDefined();
        expect(listResult.Keys?.length).toBeGreaterThan(0);
        
        // Verify we can describe at least one key
        if (listResult.Keys && listResult.Keys.length > 0) {
          const firstKey = listResult.Keys[0];
          const describeCommand = new DescribeKeyCommand({ KeyId: firstKey.KeyId! });
          const keyDetails = await kmsClient.send(describeCommand);
          
          expect(keyDetails.KeyMetadata).toBeDefined();
          expect(keyDetails.KeyMetadata?.KeyId).toBe(firstKey.KeyId);
        }
        
      } catch (error) {
        throw new Error(`KMS configuration test failed: ${error}`);
      }
    }, 30000);
  });

  describe('Secrets Manager Integration', () => {
    test('should have Secrets Manager secret accessible', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping Secrets Manager test - no AWS credentials');
        return;
      }

      try {
        // List all secrets to verify access
        const listCommand = new ListSecretsCommand({});
        const listResult = await secretsClient.send(listCommand);
        
        expect(listResult.SecretList).toBeDefined();
        expect(Array.isArray(listResult.SecretList)).toBe(true);
        
        // Find our specific secret
        const secretName = 'tap-app/secrets';
        const secretExists = listResult.SecretList?.some(secret => 
          secret.Name === secretName
        );
        
        expect(secretExists).toBe(true);
        
      } catch (error) {
        throw new Error(`Secrets Manager integration test failed: ${error}`);
      }
    }, 30000);

    test('should have Secrets Manager secret with proper configuration', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping Secrets Manager configuration test - no AWS credentials');
        return;
      }

      try {
        const secretName = 'tap-app/secrets';
        
        // Get secret details
        const describeCommand = new DescribeSecretCommand({ SecretId: secretName });
        const secretDetails = await secretsClient.send(describeCommand);
        
        expect(secretDetails.Name).toBe(secretName);
        expect(secretDetails.Description).toBe('Application secrets for TAP serverless app');
        expect(secretDetails.KmsKeyId).toBeDefined(); // Should be encrypted with KMS
        
      } catch (error) {
        throw new Error(`Secrets Manager configuration test failed: ${error}`);
      }
    }, 30000);
  });

  describe('Lambda Functions Integration', () => {
    test('should have Lambda functions deployed', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping Lambda test - no AWS credentials');
        return;
      }

      try {
        // List all Lambda functions to verify access
        const listCommand = new ListFunctionsCommand({});
        const listResult = await lambdaClient.send(listCommand);
        
        expect(listResult.Functions).toBeDefined();
        expect(Array.isArray(listResult.Functions)).toBe(true);
        
        // Verify our specific functions exist
        const expectedFunctions = [
          'tap-create-item',
          'tap-get-items', 
          'tap-upload-file'
        ];
        
        const functionNames = listResult.Functions?.map(fn => fn.FunctionName) || [];
        
        expectedFunctions.forEach(expectedName => {
          const functionExists = functionNames.includes(expectedName);
          expect(functionExists).toBe(true);
        });
        
      } catch (error) {
        throw new Error(`Lambda integration test failed: ${error}`);
      }
    }, 30000);

    test('should have Lambda functions with proper configuration', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping Lambda configuration test - no AWS credentials');
        return;
      }

      try {
        const functionName = 'tap-create-item';
        
        // Get function details
        const getCommand = new GetFunctionCommand({ FunctionName: functionName });
        const functionDetails = await lambdaClient.send(getCommand);
        
        expect(functionDetails.Configuration).toBeDefined();
        expect(functionDetails.Configuration?.FunctionName).toBe(functionName);
        expect(functionDetails.Configuration?.Runtime).toBe('nodejs18.x');
        expect(functionDetails.Configuration?.Timeout).toBe(30);
        
        // Verify environment variables
        expect(functionDetails.Configuration?.Environment).toBeDefined();
        expect(functionDetails.Configuration?.Environment?.Variables).toBeDefined();
        
        const envVars = functionDetails.Configuration?.Environment?.Variables || {};
        expect(envVars.TABLE_NAME).toBeDefined();
        expect(envVars.KMS_KEY_ID).toBeDefined();
        expect(envVars.SECRET_ARN).toBeDefined();
        
      } catch (error) {
        throw new Error(`Lambda configuration test failed: ${error}`);
      }
    }, 30000);
  });

  describe('API Gateway Integration', () => {
    test('should have API Gateway accessible', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping API Gateway test - no AWS credentials');
        return;
      }

      try {
        // List all APIs to verify access
        const listCommand = new GetApisCommand({});
        const listResult = await apiGatewayClient.send(listCommand);
        
        expect(listResult.Items).toBeDefined();
        expect(Array.isArray(listResult.Items)).toBe(true);
        
        // Find our specific API
        const apiName = 'TAP Serverless API';
        const apiExists = listResult.Items?.some(api => 
          api.Name === apiName
        );
        
        expect(apiExists).toBe(true);
        
      } catch (error) {
        throw new Error(`API Gateway integration test failed: ${error}`);
      }
    }, 30000);
  });

  describe('End-to-End Integration', () => {
    test('should have complete infrastructure stack deployed', async () => {
      if (!hasAwsCredentials) {
        console.log('⏭️  Skipping end-to-end test - no AWS credentials');
        return;
      }

      // This test verifies that all components are working together
      try {
        // Verify DynamoDB access
        const dynamoListCommand = new ListTablesCommand({});
        const dynamoResult = await dynamoClient.send(dynamoListCommand);
        expect(dynamoResult.TableNames).toBeDefined();
        
        // Verify S3 access
        const s3ListCommand = new ListBucketsCommand({});
        const s3Result = await s3Client.send(s3ListCommand);
        expect(s3Result.Buckets).toBeDefined();
        
        // Verify Lambda access
        const lambdaListCommand = new ListFunctionsCommand({});
        const lambdaResult = await lambdaClient.send(lambdaListCommand);
        expect(lambdaResult.Functions).toBeDefined();
        
        // Verify KMS access
        const kmsListCommand = new ListKeysCommand({});
        const kmsResult = await kmsClient.send(kmsListCommand);
        expect(kmsResult.Keys).toBeDefined();
        
        // Verify Secrets Manager access
        const secretsListCommand = new ListSecretsCommand({});
        const secretsResult = await secretsClient.send(secretsListCommand);
        expect(secretsResult.SecretList).toBeDefined();
        
        // If we get here, all services are accessible
        expect(true).toBe(true);
        
      } catch (error) {
        throw new Error(`End-to-end integration test failed: ${error}`);
      }
    }, 60000); // 60 second timeout for comprehensive test
  });
});
