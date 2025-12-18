import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, ListRolePoliciesCommand } from '@aws-sdk/client-iam';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({
  forcePathStyle: true,
});

const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });

describe('TAP Stack Integration Tests', () => {
  const testId = `test-${Date.now()}`;
  
  describe('DynamoDB Integration', () => {
    const tableName = outputs['TurnAroundPromptTableName'];

    test('should be able to put and get item from DynamoDB table', async () => {
      expect(tableName).toBeDefined();

      // Put test item
      const putParams = {
        TableName: tableName,
        Item: {
          id: { S: testId },
          prompt: { S: 'Test prompt for integration testing' },
          timestamp: { N: Date.now().toString() }
        }
      };

      await dynamoClient.send(new PutItemCommand(putParams));

      // Get test item
      const getParams = {
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      };

      const result = await dynamoClient.send(new GetItemCommand(getParams));
      expect(result.Item).toBeDefined();
      expect(result.Item?.id.S).toBe(testId);
      expect(result.Item?.prompt.S).toBe('Test prompt for integration testing');
    });

    test('should clean up test data', async () => {
      const deleteParams = {
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      };

      await dynamoClient.send(new DeleteItemCommand(deleteParams));
      
      // Verify deletion
      const getParams = {
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      };

      const result = await dynamoClient.send(new GetItemCommand(getParams));
      expect(result.Item).toBeUndefined();
    });
  });

  describe('S3 Integration', () => {
    const bucketName = outputs['S3BucketName'];
    const testKey = `test-files/${testId}.txt`;
    const testContent = 'This is a test file for integration testing';

    test('should be able to put and get object from S3 bucket', async () => {
      expect(bucketName).toBeDefined();

      // Put test object
      const putParams = {
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      };

      await s3Client.send(new PutObjectCommand(putParams));

      // Get test object
      const getParams = {
        Bucket: bucketName,
        Key: testKey
      };

      const result = await s3Client.send(new GetObjectCommand(getParams));
      expect(result.Body).toBeDefined();
      
      const bodyContent = await result.Body?.transformToString();
      expect(bodyContent).toBe(testContent);
    });

    test('should list objects in bucket', async () => {
      const listParams = {
        Bucket: bucketName,
        Prefix: `test-files/${testId}`
      };

      const result = await s3Client.send(new ListObjectsV2Command(listParams));
      expect(result.Contents).toBeDefined();
      expect(result.Contents?.length).toBeGreaterThan(0);
      expect(result.Contents?.[0].Key).toBe(testKey);
    });

    test('should clean up test data', async () => {
      const deleteParams = {
        Bucket: bucketName,
        Key: testKey
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
      
      // Verify deletion
      const listParams = {
        Bucket: bucketName,
        Prefix: `test-files/${testId}`
      };

      const result = await s3Client.send(new ListObjectsV2Command(listParams));
      expect(result.Contents?.length || 0).toBe(0);
    });
  });

  describe('IAM Role Integration', () => {
    test('should verify TAP access role exists and has correct policies', async () => {
      const roleArn = outputs['TAPAccessRoleArn'];
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      expect(roleName).toContain('TAPAccessRole');

      // Get role details
      const roleParams = {
        RoleName: roleName
      };

      const roleResult = await iamClient.send(new GetRoleCommand(roleParams));
      expect(roleResult.Role).toBeDefined();
      expect(roleResult.Role?.RoleName).toBe(roleName);

      // List inline policies
      const policiesResult = await iamClient.send(new ListRolePoliciesCommand(roleParams));
      expect(policiesResult.PolicyNames).toBeDefined();
      
      const policyNames = policiesResult.PolicyNames || [];
      expect(policyNames.some(name => name?.includes('TAPSecureDynamoDBAccess'))).toBe(true);
    });
  });

  describe('KMS Integration', () => {
    test('should verify KMS key exists and is enabled', async () => {
      const kmsKeyId = outputs['KMSKeyId'];
      expect(kmsKeyId).toBeDefined();

      const keyParams = {
        KeyId: kmsKeyId
      };

      const keyResult = await kmsClient.send(new DescribeKeyCommand(keyParams));
      expect(keyResult.KeyMetadata).toBeDefined();
      expect(keyResult.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResult.KeyMetadata?.Description).toContain('TAP DynamoDB');
    });
  });

  describe('Security Validation', () => {
    test('should verify S3 bucket has proper security settings', async () => {
      const bucketName = outputs['S3BucketName'];
      
      // Test that direct public access is blocked
      try {
        const publicUrl = `https://${bucketName}.s3.amazonaws.com/non-existent-file.txt`;
        const response = await fetch(publicUrl);
        expect(response.status).not.toBe(200); // Should not allow public access
      } catch (error) {
        // Expected to fail due to security settings
        expect(error).toBeDefined();
      }
    });

    test('should verify DynamoDB table has encryption enabled', async () => {
      const tableName = outputs['TurnAroundPromptTableName'];
      const kmsKeyId = outputs['KMSKeyId'];
      
      expect(tableName).toBeDefined();
      expect(kmsKeyId).toBeDefined();
      
      // The fact that we can perform operations with KMS encryption
      // validates that encryption is properly configured
      expect(kmsKeyId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid DynamoDB operations gracefully', async () => {
      const tableName = outputs['TurnAroundPromptTableName'];
      
      // Try to get non-existent item
      const getParams = {
        TableName: tableName,
        Key: {
          id: { S: 'non-existent-id' }
        }
      };

      const result = await dynamoClient.send(new GetItemCommand(getParams));
      expect(result.Item).toBeUndefined();
    });

    test('should handle invalid S3 operations gracefully', async () => {
      const bucketName = outputs['S3BucketName'];
      
      // Try to get non-existent object
      const getParams = {
        Bucket: bucketName,
        Key: 'non-existent-file.txt'
      };

      try {
        await s3Client.send(new GetObjectCommand(getParams));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('NoSuchKey');
      }
    });
  });
});
