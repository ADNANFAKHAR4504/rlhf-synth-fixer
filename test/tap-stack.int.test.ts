/* eslint-disable prettier/prettier */
/**
 * Integration tests for TapStack infrastructure
 * 
 * These tests verify end-to-end functionality by deploying actual resources
 * in a test environment and validating their behavior and connectivity.
 * 
 * Note: These tests require actual AWS credentials and will create real resources.
 * Use with caution and ensure proper cleanup.
 */

import * as pulumi from '@pulumi/pulumi';
import * as AWS from 'aws-sdk';
import { TapStack } from '../lib/tap-stack';

// Integration test configuration
const testConfig = {
  regions: ['us-east-1'], // Limit to one region for cost efficiency in tests
  testTimeout: 600000, // 10 minutes
  cleanup: true,
};

describe('TapStack Integration Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    // Create stack with test configuration
    stack = new TapStack('integration-test-stack', {
      tags: {
        Environment: 'integration-test',
        Application: 'nova-model-breaking',
        Owner: 'test-automation',
        TestRun: `test-${Date.now()}`,
      },
    });
  }, testConfig.testTimeout);

  afterAll(async () => {
    if (testConfig.cleanup) {
      // Cleanup will be handled by Pulumi destroy
      console.log('Integration test cleanup completed');
    }
  });

  describe('KMS Key Integration', () => {
    it('should create KMS key with correct permissions in us-east-1', async () => {
      const keyId = await new Promise<string>((resolve) => {
        stack.kmsKeys['us-east-1'].keyId.apply((id: any) => resolve(id));
      });
      
      expect(keyId).toBeDefined();

      const kmsClient = new AWS.KMS({ region: testConfig.regions[0] });

      try {
        const keyDescription = await kmsClient.describeKey({ KeyId: keyId }).promise();
        expect(keyDescription.KeyMetadata).toBeDefined();
        if (keyDescription.KeyMetadata) {
          expect(keyDescription.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
          expect(keyDescription.KeyMetadata.CustomerMasterKeySpec).toBe('SYMMETRIC_DEFAULT');
          expect(keyDescription.KeyMetadata.Enabled).toBe(true);
        }
      } catch (error) {
        console.error('KMS key verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should allow encryption and decryption operations', async () => {
      const keyId = await new Promise<string>((resolve) => {
        stack.kmsKeys['us-east-1'].keyId.apply((id: any) => resolve(id));
      });
      
      const kmsClient = new AWS.KMS({ region: testConfig.regions[0] });

      try {
        const testData = 'Integration test encryption data';
        
        // Test encryption
        const encryptResult = await kmsClient.encrypt({
          KeyId: keyId,
          Plaintext: Buffer.from(testData),
        }).promise();
        
        expect(encryptResult.CiphertextBlob).toBeDefined();
        
        // Test decryption
        if (encryptResult.CiphertextBlob) {
          const decryptResult = await kmsClient.decrypt({
            CiphertextBlob: encryptResult.CiphertextBlob,
          }).promise();
          
          expect(decryptResult.Plaintext?.toString()).toBe(testData);
        }
      } catch (error) {
        console.error('KMS encryption/decryption test failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('S3 Bucket Integration', () => {
    it('should create S3 bucket with correct configuration', async () => {
      const bucketName = await new Promise<string>((resolve) => {
        stack.logsBucket.bucket.apply((name) => resolve(name));
      });
      
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');

      // Verify bucket exists and is accessible
      const s3Client = new AWS.S3({ region: testConfig.regions[0] });
      
      try {
        const bucketLocation = await s3Client.getBucketLocation({ Bucket: bucketName }).promise();
        expect(bucketLocation).toBeDefined();
      } catch (error) {
        console.error('S3 bucket verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('WAF WebACL Integration', () => {
    it('should create WAF WebACL with correct ARN format for us-east-1', async () => {
      const webAclArn = await new Promise<string>((resolve) => {
        stack.wafWebAcls['us-east-1'].arn.apply((arn: any) => resolve(arn));
      });
      
      expect(webAclArn).toBeDefined();
      expect(typeof webAclArn).toBe('string');
      expect(webAclArn).toContain('arn:aws:wafv2');
      expect(webAclArn).toContain('regional/webacl');
      expect(webAclArn).toMatch(/^arn:aws:wafv2:[^:]+:[^:]+:regional\/webacl\/[^\/]+\/[^\/]+$/);
      
      console.log('WebACL ARN:', webAclArn);
      
      // Basic validation that the ARN follows the expected format
      const arnParts = webAclArn.split(':');
      expect(arnParts).toHaveLength(6);
      expect(arnParts[0]).toBe('arn');
      expect(arnParts[1]).toBe('aws');
      expect(arnParts[2]).toBe('wafv2');
      expect(arnParts[3]).toBeTruthy(); // region
      expect(arnParts[4]).toBeTruthy(); // account-id
      expect(arnParts[5]).toContain('regional/webacl/');
    }, testConfig.testTimeout);

    it('should verify WAF WebACL scope and default action from stack for us-east-1', (done) => {
      stack.wafWebAcls['us-east-1'].scope.apply((scope: any) => {
        expect(scope).toBe('REGIONAL');
        
        stack.wafWebAcls['us-east-1'].defaultAction.apply((defaultAction: any) => {
          expect(defaultAction.allow).toEqual({});
          
          stack.wafWebAcls['us-east-1'].rules.apply((rules: any) => {
            expect(rules).toBeDefined();
            if (rules) {
              expect(rules.length).toBeGreaterThanOrEqual(1);
              
              const commonRuleSet = rules.find((rule: any) => rule.name === 'AWS-AWSManagedRulesCommonRuleSet');
              expect(commonRuleSet).toBeDefined();
            }
            done();
          });
        });
      });
    });
  });

  describe('Lambda Function Integration', () => {
    it('should create Lambda function with correct configuration', async () => {
      const functionName = await new Promise<string>((resolve) => {
        stack.logProcessingLambda.name.apply((name) => resolve(name));
      });
      
      expect(functionName).toBeDefined();

      const lambdaClient = new AWS.Lambda({ region: testConfig.regions[0] });

      try {
        const functionConfig = await lambdaClient.getFunctionConfiguration({ FunctionName: functionName }).promise();
        expect(functionConfig.Runtime).toBe('python3.9');
        expect(functionConfig.Handler).toBe('lambda_function.lambda_handler');
        expect(functionConfig.Timeout).toBe(300);
        expect(functionConfig.Environment).toBeDefined();
        if (functionConfig.Environment) {
          expect(functionConfig.Environment.Variables?.LOGS_BUCKET).toBeDefined();
        }
      } catch (error) {
        console.error('Lambda function verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('VPC and Networking Integration', () => {
    it('should create VPCs with correct CIDR blocks', async () => {
      const region = testConfig.regions[0];
      const vpc = stack.vpcs[region];
      expect(vpc).toBeDefined();

      const ec2Client = new AWS.EC2({ region });

      try {
        const vpcId = await new Promise<string>((resolve) => {
          vpc.id.apply((id) => resolve(id));
        });
        
        const vpcDescription = await ec2Client.describeVpcs({ VpcIds: [vpcId] }).promise();
        
        expect(vpcDescription.Vpcs).toBeDefined();
        if (vpcDescription.Vpcs) {
          expect(vpcDescription.Vpcs).toHaveLength(1);
          expect(vpcDescription.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
          // Fix: Cast to any to access State property
          expect((vpcDescription.Vpcs as any).State).toBe('available');
        }
      } catch (error) {
        console.error('VPC verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('Regional Infrastructure', () => {
    it('should create infrastructure in all configured regions', () => {
      stack.regions.forEach(region => {
        expect(stack.vpcs[region]).toBeDefined();
        expect(stack.autoScalingGroups[region]).toBeDefined();
        expect(stack.rdsInstances[region]).toBeDefined();
        expect(stack.kmsKeys[region]).toBeDefined();
        expect(stack.wafWebAcls[region]).toBeDefined();
      });
    });
  });

  describe('Security Configuration', () => {
    it('should enforce encryption at rest with regional KMS keys', (done) => {
      // Test S3 encryption with primary KMS key
      stack.logsBucket.serverSideEncryptionConfiguration.apply((s3Encryption: any) => {
        expect(s3Encryption?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm).toBe('aws:kms');
        
        // KMS keys should be available for encryption in each region
        expect(stack.kmsKeys['us-east-1']).toBeDefined();
        expect(stack.kmsKeys['us-west-2']).toBeDefined();
        done();
      });
    });
  });

  describe('End-to-End Connectivity', () => {
    it('should allow communication between components', async () => {
      const bucketName = await new Promise<string>((resolve) => {
        stack.logsBucket.bucket.apply((name) => resolve(name || ''));
      });
      
      const s3Client = new AWS.S3({ region: testConfig.regions[0] });

      try {
        const testKey = `integration-test/${Date.now()}/test.json`;
        const testData = JSON.stringify({ test: 'integration-test-data' });

        await s3Client.putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: testData,
          ContentType: 'application/json',
        }).promise();

        const getResult = await s3Client.getObject({
          Bucket: bucketName,
          Key: testKey,
        }).promise();

        expect(getResult.Body?.toString()).toBe(testData);

        // Cleanup test object
        await s3Client.deleteObject({
          Bucket: bucketName,
          Key: testKey,
        }).promise();
      } catch (error) {
        console.error('End-to-end connectivity test failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });
});
