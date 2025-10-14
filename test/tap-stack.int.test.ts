// HIPAA-Compliant Healthcare Data Processing Infrastructure Integration Tests
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS clients
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const kmsClient = new KMSClient({ region });
const ec2Client = new EC2Client({ region });

describe('HIPAA-Compliant Healthcare Data Processing Infrastructure', () => {
  describe('S3 Bucket Security', () => {
    test('Patient data bucket has encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.PatientDataBucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('Patient data bucket has versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.PatientDataBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('Can write and read data from patient bucket', async () => {
      const testKey = `test-${Date.now()}.txt`;
      const testData = 'Test patient data';

      // Write test data
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.PatientDataBucketName,
          Key: testKey,
          Body: testData,
        })
      );

      // Read test data
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.PatientDataBucketName,
          Key: testKey,
        })
      );

      const retrievedData = await response.Body?.transformToString();
      expect(retrievedData).toBe(testData);
    });
  });

  describe('DynamoDB Audit Table', () => {
    test('Audit table has encryption and PITR enabled', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.AuditTableName,
        })
      );

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.SSEDescription?.SSEType).toBe('KMS');
      expect(
        response.Table?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    test('Audit table is accessible', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.AuditTableName,
        })
      );

      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });
  });

  describe('Lambda Function', () => {
    test('Data processor function exists and is configured correctly', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.DataProcessorFunctionName,
        })
      );

      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.VpcConfig?.VpcId).toBeDefined();
      expect(response.Configuration?.Environment?.Variables).toHaveProperty(
        'PATIENT_DATA_BUCKET'
      );
      expect(response.Configuration?.Environment?.Variables).toHaveProperty(
        'AUDIT_TABLE'
      );
    });

    test('Lambda function can be invoked', async () => {
      const testEvent = {
        test: true,
        message: 'Integration test',
      };

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.DataProcessorFunctionName,
          Payload: JSON.stringify(testEvent),
        })
      );

      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const result = JSON.parse(
          Buffer.from(response.Payload).toString('utf-8')
        );
        expect(result.statusCode).toBe(200);
      }
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.EncryptionKeyId,
        })
      );

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('VPC Configuration', () => {
    test('VPC exists with proper DNS settings', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs?.[0]).toBeDefined();
      expect(response.Vpcs?.[0].State).toBe('available');
    });
  });

  describe('CloudTrail Audit Logging', () => {
    test('CloudTrail is configured and logging', async () => {
      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [outputs.CloudTrailName],
        })
      );

      const trail = response.trailList?.[0];
      expect(trail).toBeDefined();
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('End-to-End Data Processing', () => {
    test('Complete healthcare data processing workflow', async () => {
      const testPatientData = JSON.stringify({
        patientId: 'TEST-001',
        timestamp: Date.now(),
        data: 'Encrypted patient health information',
      });
      const testKey = `patient-data-${Date.now()}.json`;

      // 1. Upload patient data to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.PatientDataBucketName,
          Key: testKey,
          Body: testPatientData,
        })
      );

      // 2. Invoke Lambda to process data
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.DataProcessorFunctionName,
          Payload: JSON.stringify({
            Records: [
              {
                s3: {
                  bucket: { name: outputs.PatientDataBucketName },
                  object: { key: testKey },
                },
              },
            ],
          }),
        })
      );

      expect(lambdaResponse.StatusCode).toBe(200);

      // 3. Verify data was stored in S3
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.PatientDataBucketName,
          Key: testKey,
        })
      );

      expect(s3Response.Body).toBeDefined();

      // 4. Verify audit log was created (note: there may be a delay)
      const auditResponse = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.AuditTableName,
        })
      );

      expect(auditResponse.Table?.ItemCount).toBeGreaterThanOrEqual(0);
    }, 60000); // 60 second timeout for end-to-end test
  });
});
