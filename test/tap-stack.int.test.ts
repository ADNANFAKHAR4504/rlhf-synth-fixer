// Integration tests for the secure infrastructure CloudFormation stack
import fs from 'fs';
import AWS from 'aws-sdk';

// Initialize AWS SDK clients
const cloudFormation = new AWS.CloudFormation();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const iam = new AWS.IAM();
const cloudTrail = new AWS.CloudTrail();

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = process.env.STACK_NAME || `TapStack-${environmentSuffix}`;

// Read outputs from deployment (if exists)
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.log('No outputs file found. Will fetch from CloudFormation.');
}

// Helper function to get stack outputs
async function getStackOutputs(): Promise<any> {
  try {
    const response = await cloudFormation.describeStacks({
      StackName: stackName
    }).promise();
    
    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }
    
    const outputsMap: any = {};
    stack.Outputs?.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputsMap[output.OutputKey] = output.OutputValue;
      }
    });
    
    return outputsMap;
  } catch (error) {
    console.error('Error fetching stack outputs:', error);
    return outputs; // Fall back to file outputs
  }
}

describe('Secure Infrastructure Integration Tests', () => {
  let stackOutputs: any;

  beforeAll(async () => {
    // Get stack outputs
    stackOutputs = await getStackOutputs();
  }, 30000); // 30 second timeout for AWS API calls

  describe('Stack Deployment Validation', () => {
    test('stack should be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const response = await cloudFormation.describeStacks({
        StackName: stackName
      }).promise();
      
      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack!.StackStatus);
    });

    test('all expected outputs should be present', () => {
      const expectedOutputs = [
        'DataEncryptionKeyId',
        'DataEncryptionKeyArn',
        'SensitiveDataBucketName',
        'SensitiveDataBucketArn',
        'CloudTrailBucketName',
        'AuditTrailName',
        'DataAdministratorsGroupName',
        'ReadOnlyAccessRoleArn'
      ];
      
      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
      });
    });
  });

  describe('KMS Key Validation', () => {
    test('KMS key should exist and be enabled', async () => {
      if (!stackOutputs.DataEncryptionKeyId) {
        console.log('Skipping test - no KMS key ID in outputs');
        return;
      }

      const response = await kms.describeKey({
        KeyId: stackOutputs.DataEncryptionKeyId
      }).promise();
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      if (!stackOutputs.DataEncryptionKeyId) {
        console.log('Skipping test - no KMS key ID in outputs');
        return;
      }

      const response = await kms.getKeyRotationStatus({
        KeyId: stackOutputs.DataEncryptionKeyId
      }).promise();
      
      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket Validation', () => {
    test('sensitive data bucket should exist with encryption', async () => {
      if (!stackOutputs.SensitiveDataBucketName) {
        console.log('Skipping test - no bucket name in outputs');
        return;
      }

      // Check bucket exists
      await s3.headBucket({
        Bucket: stackOutputs.SensitiveDataBucketName
      }).promise();

      // Check encryption
      const encryption = await s3.getBucketEncryption({
        Bucket: stackOutputs.SensitiveDataBucketName
      }).promise();
      
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = encryption.ServerSideEncryptionConfiguration?.Rules[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('buckets should block public access', async () => {
      if (!stackOutputs.SensitiveDataBucketName) {
        console.log('Skipping test - no bucket name in outputs');
        return;
      }

      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: stackOutputs.SensitiveDataBucketName
      }).promise();
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('bucket should have versioning enabled', async () => {
      if (!stackOutputs.SensitiveDataBucketName) {
        console.log('Skipping test - no bucket name in outputs');
        return;
      }

      const versioning = await s3.getBucketVersioning({
        Bucket: stackOutputs.SensitiveDataBucketName
      }).promise();
      
      expect(versioning.Status).toBe('Enabled');
    });

    test('bucket should have lifecycle policies', async () => {
      if (!stackOutputs.SensitiveDataBucketName) {
        console.log('Skipping test - no bucket name in outputs');
        return;
      }

      const lifecycle = await s3.getBucketLifecycleConfiguration({
        Bucket: stackOutputs.SensitiveDataBucketName
      }).promise();
      
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules?.length).toBeGreaterThan(0);
      
      const glacierRule = lifecycle.Rules?.find(r => r.ID === 'TransitionToGlacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Status).toBe('Enabled');
    });
  });

  describe('IAM Resources Validation', () => {
    test('DataAdministratorsGroup should exist', async () => {
      if (!stackOutputs.DataAdministratorsGroupName) {
        console.log('Skipping test - no group name in outputs');
        return;
      }

      const response = await iam.getGroup({
        GroupName: stackOutputs.DataAdministratorsGroupName
      }).promise();
      
      expect(response.Group).toBeDefined();
      expect(response.Group.GroupName).toBe(stackOutputs.DataAdministratorsGroupName);
    });

    test('ReadOnlyAccessRole should exist', async () => {
      if (!stackOutputs.ReadOnlyAccessRoleArn) {
        console.log('Skipping test - no role ARN in outputs');
        return;
      }

      const roleName = stackOutputs.ReadOnlyAccessRoleArn.split('/').pop();
      const response = await iam.getRole({
        RoleName: roleName
      }).promise();
      
      expect(response.Role).toBeDefined();
    });
  });

  describe('CloudTrail Validation', () => {
    test('CloudTrail should be active and logging', async () => {
      if (!stackOutputs.AuditTrailName) {
        console.log('Skipping test - no trail name in outputs');
        return;
      }

      const response = await cloudTrail.getTrailStatus({
        Name: stackOutputs.AuditTrailName
      }).promise();
      
      expect(response.IsLogging).toBe(true);
    });

    test('CloudTrail should log S3 data events', async () => {
      if (!stackOutputs.AuditTrailName) {
        console.log('Skipping test - no trail name in outputs');
        return;
      }

      const response = await cloudTrail.getEventSelectors({
        TrailName: stackOutputs.AuditTrailName
      }).promise();
      
      expect(response.EventSelectors).toBeDefined();
      expect(response.EventSelectors?.length).toBeGreaterThan(0);
      
      const s3DataResource = response.EventSelectors?.[0]?.DataResources?.find(
        dr => dr.Type === 'AWS::S3::Object'
      );
      expect(s3DataResource).toBeDefined();
    });
  });

  describe('End-to-End Encryption Test', () => {
    test('should encrypt and decrypt data with KMS', async () => {
      if (!stackOutputs.DataEncryptionKeyId) {
        console.log('Skipping test - no KMS key ID in outputs');
        return;
      }

      const testData = 'Sensitive test data';
      
      // Encrypt
      const encryptResponse = await kms.encrypt({
        KeyId: stackOutputs.DataEncryptionKeyId,
        Plaintext: testData
      }).promise();
      
      expect(encryptResponse.CiphertextBlob).toBeDefined();
      
      // Decrypt
      const decryptResponse = await kms.decrypt({
        CiphertextBlob: encryptResponse.CiphertextBlob!
      }).promise();
      
      expect(decryptResponse.Plaintext?.toString()).toBe(testData);
    });

    test('should store encrypted object in S3', async () => {
      if (!stackOutputs.SensitiveDataBucketName || !stackOutputs.DataEncryptionKeyId) {
        console.log('Skipping test - missing bucket or KMS key');
        return;
      }

      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test sensitive content';
      
      try {
        // Put object
        await s3.putObject({
          Bucket: stackOutputs.SensitiveDataBucketName,
          Key: testKey,
          Body: testContent,
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: stackOutputs.DataEncryptionKeyId
        }).promise();
        
        // Get object
        const getResponse = await s3.getObject({
          Bucket: stackOutputs.SensitiveDataBucketName,
          Key: testKey
        }).promise();
        
        expect(getResponse.Body?.toString()).toBe(testContent);
        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        
        // Cleanup
        await s3.deleteObject({
          Bucket: stackOutputs.SensitiveDataBucketName,
          Key: testKey
        }).promise();
      } catch (error) {
        console.error('S3 operation failed:', error);
        throw error;
      }
    });
  });
});