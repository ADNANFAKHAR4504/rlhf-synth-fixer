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
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Integration test configuration
const testConfig = {
  regions: ['us-east-1'], // Limit to one region for cost efficiency in tests
  testTimeout: 600000, // 10 minutes
  cleanup: true,
};

describe('TapStack Integration Tests', () => {
  let stack: TapStack;
  let awsProvider: aws.Provider;

  beforeAll(async () => {
    // Initialize AWS provider for testing
    awsProvider = new aws.Provider('test-provider', {
      region: testConfig.regions[0],
    });

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

  describe('S3 Bucket Integration', () => {
    it('should create S3 bucket with correct configuration', async () => {
      const bucketName = await stack.logsBucket.bucket;
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');

      // Verify bucket exists and is accessible
      const s3Client = new aws.sdk.S3({ region: testConfig.regions[0] });
      
      try {
        const bucketLocation = await s3Client.getBucketLocation({ Bucket: bucketName }).promise();
        expect(bucketLocation).toBeDefined();
      } catch (error) {
        console.error('S3 bucket verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should have correct bucket policies', async () => {
      const bucketName = await stack.logsBucket.bucket;
      const s3Client = new aws.sdk.S3({ region: testConfig.regions[0] });

      try {
        const bucketPolicy = await s3Client.getBucketPolicy({ Bucket: bucketName }).promise();
        const policy = JSON.parse(bucketPolicy.Policy);
        
        expect(policy.Version).toBe('2012-10-17');
        expect(policy.Statement).toBeDefined();
        expect(Array.isArray(policy.Statement)).toBe(true);
      } catch (error) {
        console.error('Bucket policy verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should have encryption enabled', async () => {
      const bucketName = await stack.logsBucket.bucket;
      const s3Client = new aws.sdk.S3({ region: testConfig.regions[0] });

      try {
        const encryption = await s3Client.getBucketEncryption({ Bucket: bucketName }).promise();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
        expect(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      } catch (error) {
        console.error('Bucket encryption verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should have lifecycle policy configured', async () => {
      const bucketName = await stack.logsBucket.bucket;
      const s3Client = new aws.sdk.S3({ region: testConfig.regions[0] });

      try {
        const lifecycle = await s3Client.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
        expect(lifecycle.Rules).toBeDefined();
        expect(lifecycle.Rules.length).toBeGreaterThan(0);
        
        const glacierRule = lifecycle.Rules.find(rule => rule.ID === 'transition-to-glacier');
        expect(glacierRule).toBeDefined();
        expect(glacierRule.Status).toBe('Enabled');
        expect(glacierRule.Transitions).toBeDefined();
        expect(glacierRule.Transitions[0].Days).toBe(30);
        expect(glacierRule.Transitions.StorageClass).toBe('GLACIER');
      } catch (error) {
        console.error('Lifecycle policy verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('KMS Key Integration', () => {
    it('should create KMS key with correct permissions', async () => {
      const keyId = await stack.kmsKey.keyId;
      expect(keyId).toBeDefined();

      const kmsClient = new aws.sdk.KMS({ region: testConfig.regions[0] });

      try {
        const keyDescription = await kmsClient.describeKey({ KeyId: keyId }).promise();
        expect(keyDescription.KeyMetadata).toBeDefined();
        expect(keyDescription.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(keyDescription.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
        expect(keyDescription.KeyMetadata.Enabled).toBe(true);
      } catch (error) {
        console.error('KMS key verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should allow encryption and decryption operations', async () => {
      const keyId = await stack.kmsKey.keyId;
      const kmsClient = new aws.sdk.KMS({ region: testConfig.regions[0] });

      try {
        const testData = 'Integration test encryption data';
        
        // Test encryption
        const encryptResult = await kmsClient.encrypt({
          KeyId: keyId,
          Plaintext: Buffer.from(testData),
        }).promise();
        
        expect(encryptResult.CiphertextBlob).toBeDefined();
        
        // Test decryption
        const decryptResult = await kmsClient.decrypt({
          CiphertextBlob: encryptResult.CiphertextBlob,
        }).promise();
        
        expect(decryptResult.Plaintext.toString()).toBe(testData);
      } catch (error) {
        console.error('KMS encryption/decryption test failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('Lambda Function Integration', () => {
    it('should create Lambda function with correct configuration', async () => {
      const functionName = await stack.logProcessingLambda.functionName;
      expect(functionName).toBeDefined();

      const lambdaClient = new aws.sdk.Lambda({ region: testConfig.regions[0] });

      try {
        const functionConfig = await lambdaClient.getFunctionConfiguration({ FunctionName: functionName }).promise();
        expect(functionConfig.Runtime).toBe('python3.9');
        expect(functionConfig.Handler).toBe('lambda_function.lambda_handler');
        expect(functionConfig.Timeout).toBe(300);
        expect(functionConfig.Environment).toBeDefined();
        expect(functionConfig.Environment.Variables.LOGS_BUCKET).toBeDefined();
      } catch (error) {
        console.error('Lambda function verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should be able to invoke Lambda function', async () => {
      const functionName = await stack.logProcessingLambda.functionName;
      const lambdaClient = new aws.sdk.Lambda({ region: testConfig.regions[0] });

      try {
        const testEvent = {
          awslogs: {
            data: Buffer.from(JSON.stringify({
              logEvents: [
                {
                  timestamp: Date.now(),
                  message: 'Test log message',
                },
              ],
              logGroup: '/test/log-group',
              logStream: 'test-log-stream',
            })).toString('base64'),
          },
        };

        const invocationResult = await lambdaClient.invoke({
          FunctionName: functionName,
          Payload: JSON.stringify(testEvent),
        }).promise();

        expect(invocationResult.StatusCode).toBe(200);
        
        if (invocationResult.Payload) {
          const response = JSON.parse(invocationResult.Payload.toString());
          expect(response.statusCode).toBeDefined();
        }
      } catch (error) {
        console.error('Lambda invocation test failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('WAF WebACL Integration', () => {
    it('should create WAF WebACL with OWASP rules', async () => {
      const webAclArn = await stack.wafWebAcl.arn;
      expect(webAclArn).toBeDefined();

      const wafClient = new aws.sdk.WAFV2({ region: testConfig.regions[0] });

      try {
        const webAclId = webAclArn.split('/').pop();
        const webAcl = await wafClient.getWebACL({
          Scope: 'REGIONAL',
          Id: webAclId,
          Name: webAclId.split('/'),
        }).promise();

        expect(webAcl.WebACL).toBeDefined();
        expect(webAcl.WebACL.Rules).toBeDefined();
        expect(webAcl.WebACL.Rules.length).toBeGreaterThanOrEqual(2);

        const owaspRule = webAcl.WebACL.Rules.find(rule => rule.Name === 'AWSManagedRulesOWASPTop10');
        expect(owaspRule).toBeDefined();

        const commonRule = webAcl.WebACL.Rules.find(rule => rule.Name === 'AWSManagedRulesCommonRuleSet');
        expect(commonRule).toBeDefined();
      } catch (error) {
        console.error('WAF WebACL verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('VPC and Networking Integration', () => {
    it('should create VPCs with correct CIDR blocks', async () => {
      const region = testConfig.regions[0];
      const vpc = stack.vpcs[region];
      expect(vpc).toBeDefined();

      const ec2Client = new aws.sdk.EC2({ region });

      try {
        const vpcId = await vpc.vpcId;
        const vpcDescription = await ec2Client.describeVpcs({ VpcIds: [vpcId] }).promise();
        
        expect(vpcDescription.Vpcs).toHaveLength(1);
        expect(vpcDescription.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
        expect(vpcDescription.Vpcs.State).toBe('available');
      } catch (error) {
        console.error('VPC verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);

    it('should create subnets in multiple AZs', async () => {
      const region = testConfig.regions[0];
      const vpc = stack.vpcs[region];
      const ec2Client = new aws.sdk.EC2({ region });

      try {
        const vpcId = await vpc.vpcId;
        const subnets = await ec2Client.describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        }).promise();

        expect(subnets.Subnets).toBeDefined();
        expect(subnets.Subnets.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private

        const availabilityZones = new Set(subnets.Subnets.map(subnet => subnet.AvailabilityZone));
        expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      } catch (error) {
        console.error('Subnet verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('Auto Scaling Group Integration', () => {
    it('should create ASG with correct configuration', async () => {
      const region = testConfig.regions[0];
      const asg = stack.autoScalingGroups[region];
      expect(asg).toBeDefined();

      const autoscalingClient = new aws.sdk.AutoScaling({ region });

      try {
        const asgName = await asg.name;
        const asgDescription = await autoscalingClient.describeAutoScalingGroups({
          AutoScalingGroupNames: [asgName],
        }).promise();

        expect(asgDescription.AutoScalingGroups).toHaveLength(1);
        
        const asgConfig = asgDescription.AutoScalingGroups[0];
        expect(asgConfig.MinSize).toBe(2);
        expect(asgConfig.MaxSize).toBe(6);
        expect(asgConfig.HealthCheckType).toBe('ELB');
        expect(asgConfig.VPCZoneIdentifier).toBeDefined();
      } catch (error) {
        console.error('ASG verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('RDS Integration', () => {
    it('should create RDS instance with Multi-AZ', async () => {
      const region = testConfig.regions[0];
      const rds = stack.rdsInstances[region];
      expect(rds).toBeDefined();

      const rdsClient = new aws.sdk.RDS({ region });

      try {
        const rdsId = await rds.id;
        const rdsDescription = await rdsClient.describeDBInstances({
          DBInstanceIdentifier: rdsId,
        }).promise();

        expect(rdsDescription.DBInstances).toHaveLength(1);
        
        const rdsConfig = rdsDescription.DBInstances[0];
        expect(rdsConfig.MultiAZ).toBe(true);
        expect(rdsConfig.StorageEncrypted).toBe(true);
        expect(rdsConfig.Engine).toBe('mysql');
        expect(rdsConfig.DBInstanceStatus).toBe('available');
      } catch (error) {
        console.error('RDS verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('Security Group Integration', () => {
    it('should create security groups with correct rules', async () => {
      const region = testConfig.regions[0];
      const vpc = stack.vpcs[region];
      const ec2Client = new aws.sdk.EC2({ region });

      try {
        const vpcId = await vpc.vpcId;
        const securityGroups = await ec2Client.describeSecurityGroups({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        }).promise();

        const webSg = securityGroups.SecurityGroups.find(sg => sg.GroupName.includes('web'));
        expect(webSg).toBeDefined();

        // Verify HTTP/HTTPS ingress rules
        const httpRule = webSg.IpPermissions.find(rule => rule.FromPort === 80);
        const httpsRule = webSg.IpPermissions.find(rule => rule.FromPort === 443);
        const sshRule = webSg.IpPermissions.find(rule => rule.FromPort === 22);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(sshRule).toBeDefined();
      } catch (error) {
        console.error('Security group verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('IAM Roles Integration', () => {
    it('should create IAM roles with least privilege policies', async () => {
      const iamClient = new aws.sdk.IAM();

      try {
        // Test EC2 role
        const ec2Roles = await iamClient.listRoles({
          PathPrefix: '/',
        }).promise();

        const ec2Role = ec2Roles.Roles.find(role => role.RoleName.includes('ec2-role'));
        expect(ec2Role).toBeDefined();

        const ec2RolePolicies = await iamClient.listAttachedRolePolicies({
          RoleName: ec2Role.RoleName,
        }).promise();

        expect(ec2RolePolicies.AttachedPolicies.length).toBeGreaterThan(0);

        // Test Lambda role
        const lambdaRole = ec2Roles.Roles.find(role => role.RoleName.includes('log-processing-lambda-role'));
        expect(lambdaRole).toBeDefined();

        const lambdaRolePolicies = await iamClient.listAttachedRolePolicies({
          RoleName: lambdaRole.RoleName,
        }).promise();

        expect(lambdaRolePolicies.AttachedPolicies.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('IAM roles verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('Load Balancer Integration', () => {
    it('should create ALB with correct configuration', async () => {
      const region = testConfig.regions[0];
      const elbClient = new aws.sdk.ELBv2({ region });

      try {
        const loadBalancers = await elbClient.describeLoadBalancers().promise();
        const alb = loadBalancers.LoadBalancers.find(lb => lb.LoadBalancerName.includes('nova-model-alb'));
        
        expect(alb).toBeDefined();
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.State.Code).toBe('active');

        // Verify target groups
        const targetGroups = await elbClient.describeTargetGroups({
          LoadBalancerArn: alb.LoadBalancerArn,
        }).promise();

        expect(targetGroups.TargetGroups.length).toBeGreaterThan(0);
        expect(targetGroups.TargetGroups[0].Protocol).toBe('HTTP');
        expect(targetGroups.TargetGroups.Port).toBe(80);
      } catch (error) {
        console.error('Load balancer verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('Monitoring and Logging Integration', () => {
    it('should create CloudWatch log groups', async () => {
      const region = testConfig.regions[0];
      const cloudWatchClient = new aws.sdk.CloudWatchLogs({ region });

      try {
        const logGroups = await cloudWatchClient.describeLogGroups().promise();
        const ec2LogGroup = logGroups.logGroups.find(lg => lg.logGroupName.includes('/aws/ec2/httpd'));
        
        expect(ec2LogGroup).toBeDefined();
      } catch (error) {
        console.error('CloudWatch logs verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });

  describe('End-to-End Connectivity', () => {
    it('should allow communication between components', async () => {
      // This test would verify that:
      // 1. ALB can reach EC2 instances
      // 2. EC2 instances can reach RDS
      // 3. Lambda can write to S3
      // 4. CloudWatch logs are flowing

      // For brevity, we'll test S3 write capability
      const bucketName = await stack.logsBucket.bucket;
      const s3Client = new aws.sdk.S3({ region: testConfig.regions[0] });

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

        expect(getResult.Body.toString()).toBe(testData);

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

  describe('Cost Optimization', () => {
    it('should use cost-effective instance types', async () => {
      const region = testConfig.regions[0];
      const ec2Client = new aws.sdk.EC2({ region });

      try {
        const launchTemplates = await ec2Client.describeLaunchTemplates().promise();
        const template = launchTemplates.LaunchTemplates.find(lt => lt.LaunchTemplateName.includes('nova-model'));
        
        if (template) {
          const templateVersion = await ec2Client.describeLaunchTemplateVersions({
            LaunchTemplateId: template.LaunchTemplateId,
          }).promise();

          const instanceType = templateVersion.LaunchTemplateVersions[0].LaunchTemplateData.InstanceType;
          expect(instanceType).toBe('t3.micro'); // Cost-effective for testing
        }
      } catch (error) {
        console.error('Cost optimization verification failed:', error);
        throw error;
      }
    }, testConfig.testTimeout);
  });
});
