import * as AWS from 'aws-sdk';
import { CloudFormation, KMS, S3, IAM, CloudTrail, ConfigService } from 'aws-sdk';

describe('TapStack Integration Tests', () => {
  const stackName = `tap-stack-${process.env.ENVIRONMENT_SUFFIX || 'test'}`;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // AWS SDK clients
  const cloudformation = new AWS.CloudFormation({ region });
  const kms = new AWS.KMS({ region });
  const s3 = new AWS.S3({ region });
  const iam = new AWS.IAM();
  const cloudtrail = new AWS.CloudTrail({ region });
  const configService = new AWS.ConfigService({ region });

  // Store stack outputs
  let stackOutputs: { [key: string]: string } = {};

  beforeAll(async () => {
    // Get stack outputs
    const { Stacks } = await cloudformation.describeStacks({
      StackName: stackName
    }).promise();

    if (!Stacks || Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found`);
    }

    // Convert stack outputs to key-value pairs
    stackOutputs = (Stacks[0].Outputs || []).reduce((acc, output) => ({
      ...acc,
      [output.OutputKey as string]: output.OutputValue
    }), {});
  }, 30000);

  describe('KMS Key Configuration', () => {
    let keyMetadata: KMS.KeyMetadata;

    beforeAll(async () => {
      const { KeyMetadata } = await kms.describeKey({
        KeyId: stackOutputs.SecurityKMSKeyId
      }).promise();
      keyMetadata = KeyMetadata;
    });

    test('KMS key should exist and be enabled', () => {
      expect(keyMetadata).toBeDefined();
      expect(keyMetadata.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      const { KeyRotationEnabled } = await kms.getKeyRotationStatus({
        KeyId: stackOutputs.SecurityKMSKeyId
      }).promise();
      expect(KeyRotationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Security logs bucket should exist with correct configuration', async () => {
      const bucketName = stackOutputs.SecurityLogsBucketName;
      
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
    });
  });

  describe('IAM Role Configuration', () => {
    test('VPC Flow Log role should have correct permissions', async () => {
      const roleName = stackOutputs.VPCFlowLogRoleArn.split('/').pop();
      
      const { Role } = await iam.getRole({
        RoleName: roleName
      }).promise();
      
      expect(Role).toBeDefined();
      expect(Role.AssumeRolePolicyDocument).toContain('vpc-flow-logs.amazonaws.com');
    });

    test('Trusted service role should have correct configuration', async () => {
      const roleName = stackOutputs.TrustedServiceRoleArn.split('/').pop();
      
      const { Role } = await iam.getRole({
        RoleName: roleName
      }).promise();
      
      expect(Role).toBeDefined();
      expect(Role.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
      expect(Role.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail should be enabled with correct settings', async () => {
      const { trail } = await cloudtrail.getTrail({
        Name: stackOutputs.CloudTrailArn.split('/').pop()
      }).promise();
      
      expect(trail).toBeDefined();
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.KmsKeyId).toBe(stackOutputs.SecurityKMSKeyArn);
    });
  });

  describe('AWS Config Rules', () => {
    test('Required config rules should be active', async () => {
      const { ConfigRules } = await configService.describeConfigRules().promise();
      
      const requiredRules = [
        's3-bucket-public-read-prohibited',
        's3-bucket-public-write-prohibited',
        'incoming-ssh-disabled',
        'cloudtrail-enabled'
      ];
      
      const ruleNames = ConfigRules?.map(rule => rule.ConfigRuleName);
      
      requiredRules.forEach(ruleName => {
        expect(ruleNames).toContain(ruleName);
      });
      
      // Check rules are compliant
      for (const rule of requiredRules) {
        const { ComplianceByConfigRules } = await configService.describeComplianceByConfigRule({
          ConfigRuleNames: [rule]
        }).promise();
        
        expect(ComplianceByConfigRules?.[0].Compliance.ComplianceType)
          .toBe('COMPLIANT');
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

  // Cleanup (if needed)
  afterAll(async () => {
    if (process.env.CLEANUP === 'true') {
      await cloudformation.deleteStack({
        StackName: stackName
      }).promise();
      
      // Wait for stack deletion
      await cloudformation.waitFor('stackDeleteComplete', {
        StackName: stackName
      }).promise();
    }
  });
});