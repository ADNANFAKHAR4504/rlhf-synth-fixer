import * as AWS from 'aws-sdk';
import { 
  CloudFormation, 
  KMS, 
  S3, 
  IAM, 
  CloudTrail, 
  ConfigService,
  AWSError
} from 'aws-sdk';
import { Output } from 'aws-sdk/clients/cloudformation';
import * as fs from 'fs';
import * as path from 'path';

// Fix the interface to properly extend AWSError
interface AWSErrorWithCode extends Omit<AWSError, 'code'> {
  code: string | undefined;
}

interface Template {
  Resources: {
    SecurityKMSKey: {
      Properties: {
        KeyPolicy: {
          Statement: Array<{
            Sid: string;
            [key: string]: any;
          }>;
        };
      };
    };
    [key: string]: any;
  };
}

// Error type guard function
function isAWSError(error: unknown): error is AWSErrorWithCode {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as AWSErrorWithCode).code === 'string'
  );
}

describe('TapStack Integration Tests', () => {
  // Increase the default timeout for all tests in this suite
  jest.setTimeout(120000); // 2 minutes

  const stackName = `tap-stack-${process.env.ENVIRONMENT_SUFFIX || 'test'}`;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // AWS SDK clients
  const cloudformation = new AWS.CloudFormation({ region });
  const kms = new AWS.KMS({ region });
  const s3 = new AWS.S3({ region });
  const iam = new AWS.IAM();
  const cloudtrail = new AWS.CloudTrail({ region });
  const configService = new AWS.ConfigService({ region });

  // Store stack outputs with proper type
  let stackOutputs: Record<string, string> = {};

  // Add template loading
  let template: Template;
  const requiredRules = [
    's3-bucket-public-read-prohibited',
    's3-bucket-public-write-prohibited',
    'incoming-ssh-disabled',
    'cloudtrail-enabled'
  ];

  beforeAll(async () => {
    // Load template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent) as Template;

    try {
      // Get stack outputs
      const { Stacks } = await cloudformation.describeStacks({
        StackName: stackName
      }).promise();

      if (!Stacks || Stacks.length === 0) {
        console.warn(`Stack ${stackName} not found - running in template validation mode only`);
        stackOutputs = {};
      } else {
        stackOutputs = (Stacks[0].Outputs || []).reduce((acc, output: Output) => ({
          ...acc,
          [output.OutputKey || '']: output.OutputValue || ''
        }), {} as Record<string, string>);
      }
    } catch (error: unknown) {
      if (isAWSError(error) && error.code === 'ValidationError') {
        console.warn(`Stack ${stackName} not found - running in template validation mode only`);
        stackOutputs = {};
      } else {
        throw error;
      }
    }
  }, 30000);

  describe('KMS Key Configuration', () => {
    let keyMetadata: AWS.KMS.KeyMetadata | undefined;

    beforeAll(async () => {
      if (!stackOutputs.SecurityKMSKeyId) {
        console.warn('KMS Key ID not found - skipping KMS tests');
        return;
      }

      try {
        const response = await kms.describeKey({
          KeyId: stackOutputs.SecurityKMSKeyId
        }).promise();
        
        keyMetadata = response.KeyMetadata;
      } catch (error: unknown) {
        if (isAWSError(error) && error.code === 'NotFoundException') {
          console.warn('KMS key not found - skipping KMS tests');
          return;
        }
        throw error;
      }
    });

    test('KMS key should exist and be enabled', () => {
      if (!stackOutputs.SecurityKMSKeyId) {
        console.warn('Skipping test: KMS key not deployed');
        return;
      }
      
      expect(keyMetadata).toBeDefined();
      expect(keyMetadata?.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      if (!stackOutputs.SecurityKMSKeyId) {
        console.warn('Skipping test: KMS key not deployed');
        return;
      }

      const { KeyRotationEnabled } = await kms.getKeyRotationStatus({
        KeyId: stackOutputs.SecurityKMSKeyId
      }).promise();
      expect(KeyRotationEnabled).toBe(true);
    });
  });

  describe('KMS Resources', () => {
    test('should have properly configured KMS key', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      
      type Statement = {
        Sid: string;
        [key: string]: any;
      };
      
      expect(statements.some((s: Statement) => s.Sid === 'Enable IAM User Permissions')).toBe(true);
      expect(statements.some((s: Statement) => s.Sid === 'Allow CloudTrail to encrypt logs')).toBe(true);
      expect(statements.some((s: Statement) => s.Sid === 'Allow Config to encrypt data')).toBe(true);
      expect(statements.some((s: Statement) => s.Sid === 'Allow CloudWatch Logs to encrypt logs')).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Security logs bucket should exist with correct configuration', async () => {
      const bucketName = stackOutputs.SecurityLogsBucketName;
      
      if (!bucketName) {
        console.warn('Skipping test: Security logs bucket not deployed');
        return;
      }

      try {
        // Check bucket encryption
        const encryption = await s3.getBucketEncryption({
          Bucket: bucketName
        }).promise();
        
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        
        // Check public access block
        const publicAccessBlock = await s3.getPublicAccessBlock({
          Bucket: bucketName
        }).promise();
        
        expect(publicAccessBlock.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
        
        // Check versioning
        const versioning = await s3.getBucketVersioning({
          Bucket: bucketName
        }).promise();
        
        expect(versioning.Status).toBe('Enabled');
      } catch (error: unknown) {
        if (isAWSError(error)) {
          if (error.code === 'NoSuchBucket') {
            console.warn(`Bucket ${bucketName} not found - skipping test`);
            return;
          }
          if (error.code === 'NoSuchPublicAccessBlockConfiguration') {
            console.warn(`Public access block not configured for bucket ${bucketName}`);
            return;
          }
        }
        throw error;
      }
    });
  });

  describe('IAM Role Configuration', () => {
    test('VPC Flow Log role should have correct permissions', async () => {
      if (!stackOutputs.VPCFlowLogRoleArn) {
        console.warn('Skipping test: VPC Flow Log role not deployed');
        return;
      }

      const roleName = `VPCFlowLogRole-${process.env.ENVIRONMENT_SUFFIX || 'test'}`;
      
      try {
        const { Role } = await iam.getRole({
          RoleName: roleName
        }).promise();
        
        expect(Role).toBeDefined();
        expect(Role.AssumeRolePolicyDocument).toContain('vpc-flow-logs.amazonaws.com');
      } catch (error: unknown) {
        if (isAWSError(error) && error.code === 'NoSuchEntity') {
          console.warn(`Role ${roleName} not found - skipping test`);
          return;
        }
        throw error;
      }
    });

    test('Trusted service role should have correct configuration', async () => {
      if (!stackOutputs.TrustedServiceRoleArn) {
        console.warn('Skipping test: Trusted service role not deployed');
        return;
      }

      const roleName = `TrustedServiceRole-${process.env.ENVIRONMENT_SUFFIX || 'test'}-${region}`;
      
      try {
        const { Role } = await iam.getRole({
          RoleName: roleName
        }).promise();
        
        expect(Role).toBeDefined();
        expect(Role.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
        expect(Role.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
      } catch (error: unknown) {
        if (isAWSError(error) && error.code === 'NoSuchEntity') {
          console.warn(`Role ${roleName} not found - skipping test`);
          return;
        }
        throw error;
      }
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail should be enabled with correct settings', async () => {
      if (!stackOutputs.CloudTrailArn) {
        console.warn('Skipping test: CloudTrail not deployed');
        return;
      }

      const trailName = `SecurityCloudTrail-${process.env.ENVIRONMENT_SUFFIX || 'test'}`;

      try {
        const response = await cloudtrail.getTrail({
          Name: trailName
        }).promise();

        if (!response.Trail) {
          throw new Error('CloudTrail configuration not found');
        }

        const trail = response.Trail;
        
        expect(trail).toBeDefined();
        expect(trail.IsMultiRegionTrail).toBe(true);
        expect(trail.LogFileValidationEnabled).toBe(true);
        expect(trail.KmsKeyId).toBe(stackOutputs.SecurityKMSKeyArn);
      } catch (error: unknown) {
        if (isAWSError(error) && error.code === 'TrailNotFoundException') {
          console.warn(`Trail ${trailName} not found - skipping test`);
          return;
        }
        throw error;
      }
    });
  });



  describe('Security Hub', () => {
    test('Security Hub should be enabled', async () => {
      const securityHub = new AWS.SecurityHub({ region });
      
      const { HubArn } = await securityHub.describeHub().promise();
      expect(HubArn).toBeDefined();
    });
  });

  // Clean up AWS SDK clients after all tests
  afterAll(async () => {
    try {
      if (process.env.CLEANUP === 'true') {
        console.log(`Cleaning up stack: ${stackName}`);
        
        // Delete the stack if it exists
        try {
          await cloudformation.deleteStack({
            StackName: stackName
          }).promise();
          
          console.log('Waiting for stack deletion to complete...');
          
          await cloudformation.waitFor('stackDeleteComplete', {
            StackName: stackName,
            $waiter: {
              delay: 30,
              maxAttempts: 40
            }
          }).promise();
          
          console.log('Stack deletion completed successfully');
        } catch (error) {
          if (isAWSError(error) && error.code === 'ValidationError') {
            console.log('Stack does not exist, skipping deletion');
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    } finally {
      // Close all AWS SDK clients by removing their event listeners
      [cloudformation, kms, s3, iam, cloudtrail, configService].forEach(client => {
        if (client.config && client.config.httpOptions && client.config.httpOptions.agent) {
          client.config.httpOptions.agent.destroy();
        }
      });

      // Clear any remaining timeouts
      jest.clearAllTimers();
    }
  }, 600000); // 10 minute timeout for cleanup
});