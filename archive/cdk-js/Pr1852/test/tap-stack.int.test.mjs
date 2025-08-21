// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// Load deployment outputs
let outputs = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Warning: Could not load outputs file. Some tests may be skipped.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr176';

describe('Multi-Account Infrastructure Integration Tests', () => {
  describe('Shared Infrastructure Stack', () => {
    const s3 = new AWS.S3();
    const sns = new AWS.SNS();
    const kms = new AWS.KMS();
    const ssm = new AWS.SSM();

    test('S3 bucket exists and is accessible', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const response = await s3.headBucket({
        Bucket: outputs.SharedBucketName
      }).promise();

      expect(response).toBeDefined();
    });

    test('S3 bucket has versioning enabled', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const response = await s3.getBucketVersioning({
        Bucket: outputs.SharedBucketName
      }).promise();

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption configured', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const response = await s3.getBucketEncryption({
        Bucket: outputs.SharedBucketName
      }).promise();

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket has lifecycle rules configured', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const response = await s3.getBucketLifecycleConfiguration({
        Bucket: outputs.SharedBucketName
      }).promise();

      expect(response.Rules).toBeDefined();
      expect(response.Rules.length).toBeGreaterThan(0);
    });

    test('SNS topic exists and is accessible', async () => {
      if (!outputs.NotificationTopicArn) {
        console.log('Skipping test - NotificationTopicArn not found in outputs');
        return;
      }

      const response = await sns.getTopicAttributes({
        TopicArn: outputs.NotificationTopicArn
      }).promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(outputs.NotificationTopicArn);
    });

    test('KMS key exists and is enabled', async () => {
      if (!outputs.SharedKmsKeyId) {
        console.log('Skipping test - SharedKmsKeyId not found in outputs');
        return;
      }

      const response = await kms.describeKey({
        KeyId: outputs.SharedKmsKeyId
      }).promise();

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key has rotation enabled', async () => {
      if (!outputs.SharedKmsKeyId) {
        console.log('Skipping test - SharedKmsKeyId not found in outputs');
        return;
      }

      const response = await kms.getKeyRotationStatus({
        KeyId: outputs.SharedKmsKeyId
      }).promise();

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('SSM parameters are created and accessible', async () => {
      const parameters = [
        `/shared-infra/${environmentSuffix}/bucket-name`,
        `/shared-infra/${environmentSuffix}/kms-key-id`,
        `/shared-infra/${environmentSuffix}/notif-topic-arn`
      ];

      for (const paramName of parameters) {
        const response = await ssm.getParameter({
          Name: paramName
        }).promise();

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter.Name).toBe(paramName);
        expect(response.Parameter.Value).toBeTruthy();
      }
    });

    test('CloudWatch dashboard exists', async () => {
      const cloudwatch = new AWS.CloudWatch();
      const dashboardName = `SharedInfra-${environmentSuffix}`;

      const response = await cloudwatch.getDashboard({
        DashboardName: dashboardName
      }).promise();

      expect(response.DashboardBody).toBeDefined();
      expect(response.DashboardName).toBe(dashboardName);
    });

    test('SQS queues are created', async () => {
      const sqs = new AWS.SQS();
      
      // Check processing queue
      const processingQueueUrl = await sqs.getQueueUrl({
        QueueName: `shared-proc-${environmentSuffix}`
      }).promise();
      
      expect(processingQueueUrl.QueueUrl).toBeDefined();

      // Check dead letter queue
      const dlqUrl = await sqs.getQueueUrl({
        QueueName: `shared-dlq-${environmentSuffix}`
      }).promise();
      
      expect(dlqUrl.QueueUrl).toBeDefined();
    });

    test('CloudWatch log group exists', async () => {
      const logs = new AWS.CloudWatchLogs();
      
      const response = await logs.describeLogGroups({
        logGroupNamePrefix: `/shared-infra/${environmentSuffix}`
      }).promise();

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups[0].logGroupName).toBe(`/shared-infra/${environmentSuffix}`);
      expect(response.logGroups[0].retentionInDays).toBe(30);
    });
  });

  describe('Cross-Account Integration', () => {
    test('Can write to S3 bucket', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const s3 = new AWS.S3();
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload test file
      await s3.putObject({
        Bucket: outputs.SharedBucketName,
        Key: testKey,
        Body: testContent
      }).promise();

      // Verify file exists
      const headResponse = await s3.headObject({
        Bucket: outputs.SharedBucketName,
        Key: testKey
      }).promise();

      expect(headResponse).toBeDefined();

      // Clean up
      await s3.deleteObject({
        Bucket: outputs.SharedBucketName,
        Key: testKey
      }).promise();
    });

    test('Can publish to SNS topic', async () => {
      if (!outputs.NotificationTopicArn) {
        console.log('Skipping test - NotificationTopicArn not found in outputs');
        return;
      }

      const sns = new AWS.SNS();

      const response = await sns.publish({
        TopicArn: outputs.NotificationTopicArn,
        Message: 'Integration test message',
        Subject: 'Integration Test'
      }).promise();

      expect(response.MessageId).toBeDefined();
    });

    test('Can encrypt and decrypt with KMS key', async () => {
      if (!outputs.SharedKmsKeyId) {
        console.log('Skipping test - SharedKmsKeyId not found in outputs');
        return;
      }

      const kms = new AWS.KMS();
      const plaintext = 'Integration test secret';

      // Encrypt
      const encryptResponse = await kms.encrypt({
        KeyId: outputs.SharedKmsKeyId,
        Plaintext: plaintext
      }).promise();

      expect(encryptResponse.CiphertextBlob).toBeDefined();

      // Decrypt
      const decryptResponse = await kms.decrypt({
        CiphertextBlob: encryptResponse.CiphertextBlob
      }).promise();

      const decryptedText = decryptResponse.Plaintext.toString();
      expect(decryptedText).toBe(plaintext);
    });
  });

  describe('Governance and Compliance', () => {
    test('Resources have required tags', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const s3 = new AWS.S3();
      
      const response = await s3.getBucketTagging({
        Bucket: outputs.SharedBucketName
      }).promise();

      const tags = response.TagSet;
      const tagMap = tags.reduce((acc, tag) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});

      // Verify standard tags exist
      expect(tagMap).toHaveProperty('Department');
      expect(tagMap).toHaveProperty('Project');
      expect(tagMap).toHaveProperty('Environment');
      expect(tagMap).toHaveProperty('ManagedBy', 'CDK');
    });

    test('S3 bucket has public access blocked', async () => {
      if (!outputs.SharedBucketName) {
        console.log('Skipping test - SharedBucketName not found in outputs');
        return;
      }

      const s3 = new AWS.S3();
      
      const response = await s3.getPublicAccessBlock({
        Bucket: outputs.SharedBucketName
      }).promise();

      expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Multi-Account Pipeline Features', () => {
    test('SSM parameters are accessible for cross-stack references', async () => {
      const ssm = new AWS.SSM();
      
      const bucketParam = await ssm.getParameter({
        Name: `/shared-infra/${environmentSuffix}/bucket-name`
      }).promise();

      expect(bucketParam.Parameter.Value).toBe(outputs.SharedBucketName);

      const kmsParam = await ssm.getParameter({
        Name: `/shared-infra/${environmentSuffix}/kms-key-id`
      }).promise();

      expect(kmsParam.Parameter.Value).toBe(outputs.SharedKmsKeyId);

      const topicParam = await ssm.getParameter({
        Name: `/shared-infra/${environmentSuffix}/notif-topic-arn`
      }).promise();

      expect(topicParam.Parameter.Value).toBe(outputs.NotificationTopicArn);
    });

    test('SQS queues have proper dead letter queue configuration', async () => {
      const sqs = new AWS.SQS();
      
      const processingQueueUrl = await sqs.getQueueUrl({
        QueueName: `shared-proc-${environmentSuffix}`
      }).promise();

      const attributes = await sqs.getQueueAttributes({
        QueueUrl: processingQueueUrl.QueueUrl,
        AttributeNames: ['All']
      }).promise();

      expect(attributes.Attributes.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(attributes.Attributes.RedrivePolicy);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('shared-dlq-');
    });
  });
});