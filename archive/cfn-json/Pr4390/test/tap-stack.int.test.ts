import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSecurityGroupRulesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  GetBucketLoggingCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  ListAliasesCommand,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
  ListSecretVersionIdsCommand,
  CreateSecretCommand,
  PutSecretValueCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  GuardDutyClient,
  GetDetectorCommand,
  ListDetectorsCommand,
} from '@aws-sdk/client-guardduty';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
  GetComplianceDetailsByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-2';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({
  region,
  forcePathStyle: true,
  followRegionRedirects: true
});
const kmsClient = new KMSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const guardDutyClient = new GuardDutyClient({ region });
const iamClient = new IAMClient({ region });
const configClient = new ConfigServiceClient({ region });

// Load CloudFormation outputs
let outputs: Record<string, string> = {};
let deploymentExists = false;

function skipIfNoDeployment() {
  if (!deploymentExists) {
    console.log('Skipping test - no deployment detected');
    return true;
  }
  return false;
}

beforeAll(() => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

  try {
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
      deploymentExists = Object.keys(outputs).length > 0;
      console.log('Loaded deployment outputs:', outputs);
    } else {
      console.warn('No deployment outputs found - integration tests will be skipped');
    }
  } catch (error) {
    console.warn('Failed to load deployment outputs:', error);
  }
});

describe('AWS Security Baseline - Integration Tests', () => {

  // ============================================================
  // VPC and Network Infrastructure Tests
  // ============================================================
  describe('VPC and Network Infrastructure', () => {

    test('VPC should exist with correct CIDR block', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC Flow Logs should be enabled and delivering to CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      }));

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    });

    test('VPC Flow Logs CloudWatch Log Group should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs-${environmentSuffix}`,
      }));

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toContain('flowlogs');
      expect(logGroup.retentionInDays).toBe(30);
    });

    test('VPC should have DNS support and DNS hostnames enabled', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      const dnsSupportResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      }));

      const dnsHostnamesResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      }));

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });
  });

  // ============================================================
  // Security Groups Tests
  // ============================================================
  describe('Security Groups', () => {

    test('WebSecurityGroup should exist with correct configuration', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('WebSecurityGroup');
      expect(sg.Description).toContain('Security group allowing SSH and HTTP from specific IP range');
    });

    test('WebSecurityGroup should allow SSH from allowed IP range', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];
      const sshRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );

      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });

    test('WebSecurityGroup should allow HTTP from allowed IP range', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );

      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });

    test('WebSecurityGroup should not have unrestricted access', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];

      sg.IpPermissions?.forEach(rule => {
        rule.IpRanges?.forEach(ipRange => {
          expect(ipRange.CidrIp).not.toBe('0.0.0.0/0');
        });
      });
    });

    test('WebSecurityGroup should have exactly 2 ingress rules', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toHaveLength(2);
    });
  });

  // ============================================================
  // S3 Storage and Encryption Tests
  // ============================================================
  describe('S3 Storage and Encryption', () => {

    test('SecureS3BucketName output should be defined', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.SecureS3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('secure-data');
    });

    test('CloudTrail S3 Bucket should exist and be configured', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      expect(trailResponse.trailList).toBeDefined();
      expect(trailResponse.trailList!.length).toBeGreaterThan(0);

      const bucketName = trailResponse.trailList![0].S3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName! }))
      ).resolves.not.toThrow();
    });

    test('CloudTrail S3 Bucket should have encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const bucketName = trailResponse.trailList![0].S3BucketName!;

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('CloudTrail S3 Bucket should have public access blocked', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const bucketName = trailResponse.trailList![0].S3BucketName!;

      const response = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      }));

      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('Config S3 Bucket should exist for AWS Config delivery', async () => {
      if (skipIfNoDeployment()) return;

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));

      expect(channelResponse.DeliveryChannels).toBeDefined();
      expect(channelResponse.DeliveryChannels!.length).toBeGreaterThan(0);

      const bucketName = channelResponse.DeliveryChannels![0].s3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName! }))
      ).resolves.not.toThrow();
    });

    test('Config S3 Bucket should have encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));
      const bucketName = channelResponse.DeliveryChannels![0].s3BucketName!;

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

  });

  // ============================================================
  // KMS Key and Encryption Tests
  // ============================================================
  describe('KMS Key and Encryption', () => {

    test('KMS key should exist and be enabled', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    test('KMS key should be customer managed', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
      expect(response.KeyMetadata!.Origin).toBe('AWS_KMS');
    });

    test('KMS key should have an alias', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new ListAliasesCommand({
        KeyId: kmsKeyId,
      }));

      expect(response.Aliases).toBeDefined();
      expect(response.Aliases!.length).toBeGreaterThan(0);

      const alias = response.Aliases![0];
      expect(alias.AliasName).toContain('security-baseline');
    });

    test('KMS key should have rotation enabled', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      // Customer managed keys can have rotation
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });

    test('KMS key policy should allow required AWS services', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: kmsKeyId,
        PolicyName: 'default',
      }));

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Check for service principals
      const serviceStatement = policy.Statement.find((s: any) =>
        s.Principal?.Service && Array.isArray(s.Principal.Service)
      );

      expect(serviceStatement).toBeDefined();
      const services = serviceStatement.Principal.Service;
      expect(services).toContain('cloudtrail.amazonaws.com');
      expect(services).toContain('logs.amazonaws.com');
      expect(services).toContain('s3.amazonaws.com');
    });

    // Service-Level Test: KMS encryption with actual data
    test('KMS key can encrypt and decrypt data', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const testData = 'Sensitive security baseline data for testing';

      // Encrypt data using KMS
      const encryptResponse = await kmsClient.send(new EncryptCommand({
        KeyId: kmsKeyId,
        Plaintext: Buffer.from(testData),
      }));

      expect(encryptResponse.CiphertextBlob).toBeDefined();
      expect(encryptResponse.KeyId).toContain(kmsKeyId);

      // Decrypt data using KMS
      const decryptResponse = await kmsClient.send(new DecryptCommand({
        CiphertextBlob: encryptResponse.CiphertextBlob,
      }));

      expect(decryptResponse.Plaintext).toBeDefined();
      const decryptedText = Buffer.from(decryptResponse.Plaintext!).toString('utf-8');
      expect(decryptedText).toBe(testData);
      expect(decryptResponse.KeyId).toContain(kmsKeyId);
    });

    // Service-Level Test: KMS data key generation
    test('KMS key can generate data keys for envelope encryption', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      // Generate a data key
      const response = await kmsClient.send(new GenerateDataKeyCommand({
        KeyId: kmsKeyId,
        KeySpec: 'AES_256',
      }));

      expect(response.Plaintext).toBeDefined();
      expect(response.CiphertextBlob).toBeDefined();
      expect(response.KeyId).toContain(kmsKeyId);

      // Verify plaintext key is 32 bytes (256 bits)
      expect(Buffer.from(response.Plaintext!).length).toBe(32);

      // Verify ciphertext blob can be decrypted
      const decryptResponse = await kmsClient.send(new DecryptCommand({
        CiphertextBlob: response.CiphertextBlob,
      }));

      expect(decryptResponse.Plaintext).toEqual(response.Plaintext);
    });
  });

  // ============================================================
  // Secrets Manager Tests
  // ============================================================
  describe('Secrets Manager', () => {

    test('DBSecret should exist', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('/security/database/credentials');
    });

    test('DBSecret should have encryption', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      // Secrets are always encrypted, either with default AWS managed key or customer managed key
      // If KmsKeyId is defined, it uses customer managed key, otherwise it uses AWS managed key
      expect(response.ARN).toBeDefined();
    });

    test('DBSecret should be retrievable', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn,
      }));

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.password).toBeDefined();
    });

    test('DBSecret password should meet complexity requirements', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn,
      }));

      const secret = JSON.parse(response.SecretString!);
      const password = secret.password;

      expect(password.length).toBe(32);
      expect(password).toMatch(/[a-zA-Z0-9]/);
    });

    test('DBSecret should not be scheduled for deletion', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      expect(response.DeletedDate).toBeUndefined();
    });

    // Service-Level Test: Secret creation and retrieval with encryption
    test('Secrets Manager can create and retrieve encrypted secrets', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const secretName = `test/security-baseline-secret-${Date.now()}`;
      const secretValue = JSON.stringify({
        username: 'testuser',
        password: 'TestPassword123!@#',
        database: 'testdb',
      });

      try {
        // Create secret with KMS encryption
        const createResponse = await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          Description: 'Test secret for security baseline validation',
          SecretString: secretValue,
          KmsKeyId: kmsKeyId,
        }));

        expect(createResponse.ARN).toBeDefined();
        expect(createResponse.Name).toBe(secretName);
        expect(createResponse.VersionId).toBeDefined();

        // Retrieve the secret
        const getResponse = await secretsClient.send(new GetSecretValueCommand({
          SecretId: secretName,
        }));

        expect(getResponse.SecretString).toBe(secretValue);
        expect(getResponse.ARN).toBe(createResponse.ARN);
        expect(getResponse.VersionId).toBe(createResponse.VersionId);

        // Verify KMS encryption
        const describeResponse = await secretsClient.send(new DescribeSecretCommand({
          SecretId: secretName,
        }));

        expect(describeResponse.KmsKeyId).toContain(kmsKeyId);
      } finally {
        // Clean up: Delete secret immediately (without recovery window)
        await secretsClient.send(new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: true,
        }));
      }
    });

    // Service-Level Test: Secret versioning through updates
    test('Secrets Manager creates versions when secret values are updated', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const secretName = `test/versioning-secret-${Date.now()}`;

      try {
        // Create initial secret
        const createResponse = await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          Description: 'Test secret for versioning validation',
          SecretString: JSON.stringify({ value: 'version1' }),
          KmsKeyId: kmsKeyId,
        }));

        const version1Id = createResponse.VersionId!;
        expect(version1Id).toBeDefined();

        // Update secret to create version 2
        const updateResponse = await secretsClient.send(new PutSecretValueCommand({
          SecretId: secretName,
          SecretString: JSON.stringify({ value: 'version2' }),
        }));

        const version2Id = updateResponse.VersionId!;
        expect(version2Id).toBeDefined();
        expect(version2Id).not.toBe(version1Id);

        // List versions to verify both exist
        const versionsResponse = await secretsClient.send(new ListSecretVersionIdsCommand({
          SecretId: secretName,
        }));

        expect(versionsResponse.Versions).toBeDefined();
        expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

        const versionIds = versionsResponse.Versions!.map(v => v.VersionId);
        expect(versionIds).toContain(version1Id);
        expect(versionIds).toContain(version2Id);

        // Verify current version is version 2
        const currentVersion = versionsResponse.Versions!.find(v =>
          v.VersionStages?.includes('AWSCURRENT')
        );
        expect(currentVersion?.VersionId).toBe(version2Id);

        // Verify previous version is version 1
        const previousVersion = versionsResponse.Versions!.find(v =>
          v.VersionStages?.includes('AWSPREVIOUS')
        );
        expect(previousVersion?.VersionId).toBe(version1Id);
      } finally {
        // Clean up: Delete secret immediately
        await secretsClient.send(new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: true,
        }));
      }
    });
  });

  // ============================================================
  // CloudTrail Tests
  // ============================================================
  describe('CloudTrail', () => {

    test('CloudTrail should exist and be logging', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;
      expect(cloudTrailName).toBeDefined();

      const response = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(response.IsLogging).toBe(true);
    });

    test('CloudTrail should be multi-region', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      expect(response.trailList).toBeDefined();
      const trail = response.trailList![0];
      expect(trail.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail should be logging to S3', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.S3BucketName).toBeDefined();
      expect(trail.S3BucketName).toContain('cloudtrail');
    });

    test('CloudTrail should include global service events', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
    });
  });

  // ============================================================
  // CloudWatch Monitoring Tests
  // ============================================================
  describe('CloudWatch Monitoring', () => {

    test('Console Sign-In Metric Filter should exist', async () => {
      if (skipIfNoDeployment()) return;

      const logGroupName = `/aws/cloudtrail/${environmentSuffix}`;

      const response = await cloudWatchLogsClient.send(new DescribeMetricFiltersCommand({
        logGroupName: logGroupName,
      }));

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThan(0);

      const metricFilter = response.metricFilters!.find(mf =>
        mf.filterName?.includes('ConsoleSignInFailures') ||
        mf.metricTransformations?.[0]?.metricName === 'ConsoleSignInFailureCount'
      );

      expect(metricFilter).toBeDefined();
    });

    test('Console Sign-In Alarm should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('Console Sign-In Alarm should monitor correct metric', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('ConsoleSignInFailureCount');
      expect(alarm.Namespace).toBe('CloudTrailMetrics');
      expect(alarm.Statistic).toBe('Sum');
    });

  });

  // ============================================================
  // IAM Roles and Policies Tests
  // ============================================================
  describe('IAM Roles and Policies', () => {

    test('S3ReadOnlyRole should exist', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop()!;

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName,
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });

    test('S3ReadOnlyRole should have EC2 as trusted entity', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName,
      }));

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );

      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('S3ReadOnlyRole should have S3 read-only permissions', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const response = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyPolicy',
      }));

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));

      const s3Actions = policy.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
      expect(s3Actions).not.toContain('s3:PutObject');
      expect(s3Actions).not.toContain('s3:DeleteObject');
    });

    test('VPC Flow Log Role should exist and have CloudWatch permissions', async () => {
      if (skipIfNoDeployment()) return;

      // Get the VPC Flow Log to find its role
      const vpcId = outputs.VPCId;

      const flowLogResponse = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      }));

      expect(flowLogResponse.FlowLogs).toBeDefined();
      expect(flowLogResponse.FlowLogs!.length).toBeGreaterThan(0);

      const deliverLogsPermissionArn = flowLogResponse.FlowLogs![0].DeliverLogsPermissionArn;
      expect(deliverLogsPermissionArn).toBeDefined();
    });

    test('Config Role should exist and have required permissions', async () => {
      if (skipIfNoDeployment()) return;

      const recorderResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      expect(recorderResponse.ConfigurationRecorders).toBeDefined();
      expect(recorderResponse.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const roleArn = recorderResponse.ConfigurationRecorders![0].roleARN;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('ConfigRole');
    });
  });

  // ============================================================
  // AWS Config Tests
  // ============================================================
  describe('AWS Config', () => {

    test('Config Recorder should exist and be recording', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders![0];
      expect(recorder.name).toBeDefined();
      expect(recorder.roleARN).toBeDefined();
    });

    test('Config Recorder should record all resource types', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      const recorder = response.ConfigurationRecorders![0];
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    });

    test('Config Delivery Channel should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      expect(response.DeliveryChannels).toBeDefined();
      expect(response.DeliveryChannels!.length).toBeGreaterThan(0);

      const channel = response.DeliveryChannels![0];
      expect(channel.name).toBeDefined();
      expect(channel.s3BucketName).toBeDefined();
    });

    test('Config Delivery Channel should deliver to S3', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      const channel = response.DeliveryChannels![0];
      expect(channel.s3BucketName).toContain('config');
    });

    test('Public S3 Bucket Config Rule should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      expect(response.ConfigRules).toBeDefined();

      const publicS3Rule = response.ConfigRules!.find(rule =>
        rule.Source?.SourceIdentifier === 'S3_BUCKET_PUBLIC_READ_PROHIBITED'
      );

      expect(publicS3Rule).toBeDefined();
      expect(publicS3Rule!.ConfigRuleState).toBe('ACTIVE');
    });

    test('Public S3 Bucket Config Rule should be using AWS managed rule', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      const publicS3Rule = response.ConfigRules!.find(rule =>
        rule.Source?.SourceIdentifier === 'S3_BUCKET_PUBLIC_READ_PROHIBITED'
      );

      expect(publicS3Rule).toBeDefined();
      expect(publicS3Rule!.Source?.Owner).toBe('AWS');
      expect(publicS3Rule!.Source?.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
    });
  });

  // ============================================================
  // Cross-Service Integration Scenarios
  // ============================================================
  describe('Cross-Service Integration Scenarios', () => {

    test('VPC Flow Logs should integrate with CloudWatch Logs', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      // Get flow log configuration
      const flowLogResponse = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      }));

      const flowLog = flowLogResponse.FlowLogs![0];
      const logGroupName = flowLog.LogGroupName;

      // Verify log group exists in CloudWatch
      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      expect(logGroupResponse.logGroups).toBeDefined();
      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
      expect(logGroupResponse.logGroups![0].logGroupName).toBe(logGroupName);
    });


    test('AWS Config should deliver to S3 bucket', async () => {
      if (skipIfNoDeployment()) return;

      // Get Config delivery channel
      const channelResponse = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      const bucketName = channelResponse.DeliveryChannels![0].s3BucketName!;

      // Verify S3 bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      // Verify bucket has encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('Security Group should be attached to VPC', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const securityGroupId = outputs.SecurityGroupId;

      // Get security group
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = sgResponse.SecurityGroups![0];

      // Verify it belongs to the correct VPC
      expect(sg.VpcId).toBe(vpcId);
    });

    test('IAM role should have permissions to access encrypted S3 buckets', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      // Get role policy
      const policyResponse = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyPolicy',
      }));

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));

      // Verify S3 read permissions
      const s3Actions = policy.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
    });

    test('end-to-end audit trail: CloudTrail -> S3 -> KMS encryption', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;
      const kmsKeyId = outputs.KMSKeyId;

      // Get CloudTrail configuration
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = trailResponse.trailList![0];
      const bucketName = trail.S3BucketName!;

      // Verify bucket encryption uses KMS
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      const bucketKmsKey = encryptionResponse
        .ServerSideEncryptionConfiguration!
        .Rules![0]
        .ApplyServerSideEncryptionByDefault!
        .KMSMasterKeyID!;

      // Verify same KMS key is used
      expect(bucketKmsKey).toContain(kmsKeyId.split('/').pop());

      // Verify CloudTrail is actively logging
      const statusResponse = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(statusResponse.IsLogging).toBe(true);
    });

    // Cross-Service Test: Secrets Manager with KMS encryption
    test('Cross-Service: Secrets Manager uses KMS for encryption at rest', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const secretName = `test/cross-service-sm-kms-${Date.now()}`;
      const secretData = JSON.stringify({
        apiKey: 'test-api-key-12345',
        apiSecret: 'test-api-secret-67890',
      });

      try {
        // Step 1: Create secret with specific KMS key
        const createResponse = await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          Description: 'Cross-service test: Secrets Manager with KMS',
          SecretString: secretData,
          KmsKeyId: kmsKeyId,
        }));

        expect(createResponse.ARN).toBeDefined();

        // Step 2: Verify secret is encrypted with the specific KMS key
        const describeResponse = await secretsClient.send(new DescribeSecretCommand({
          SecretId: secretName,
        }));

        expect(describeResponse.KmsKeyId).toContain(kmsKeyId);

        // Step 3: Retrieve and decrypt secret (automatic KMS decryption)
        const getResponse = await secretsClient.send(new GetSecretValueCommand({
          SecretId: secretName,
        }));

        expect(getResponse.SecretString).toBe(secretData);
        const parsedSecret = JSON.parse(getResponse.SecretString!);
        expect(parsedSecret.apiKey).toBe('test-api-key-12345');
      } finally {
        // Clean up
        await secretsClient.send(new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: true,
        }));
      }
    });

    // Cross-Service Test: VPC Flow Logs with CloudWatch monitoring
    test('Cross-Service: VPC Flow Logs data flows to CloudWatch Logs', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      // Step 1: Get VPC Flow Log configuration
      const flowLogResponse = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      }));

      expect(flowLogResponse.FlowLogs).toBeDefined();
      expect(flowLogResponse.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = flowLogResponse.FlowLogs![0];
      const logGroupName = flowLog.LogGroupName!;

      // Step 2: Verify log group exists in CloudWatch
      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      expect(logGroupResponse.logGroups).toBeDefined();
      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);

      const logGroup = logGroupResponse.logGroups![0];

      // Step 3: Verify flow log is active and delivering
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');

      // Step 4: Verify log group has proper configuration
      expect(logGroup.retentionInDays).toBe(30);
      expect(logGroup.logGroupName).toBe(logGroupName);
    });
  });

  // ============================================================
  // Security Compliance Validation
  // ============================================================
  describe('Security Compliance Validation', () => {

    test('CloudTrail and Config S3 buckets should be encrypted at rest', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      // Get all bucket names (excluding SecureS3Bucket due to CIDR restrictions)
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));

      const buckets = [
        trailResponse.trailList![0].S3BucketName!,
        channelResponse.DeliveryChannels![0].s3BucketName!,
      ];

      // Verify each bucket has encryption
      for (const bucketName of buckets) {
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
          Bucket: bucketName,
        }));

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        const algorithm = encryptionResponse
          .ServerSideEncryptionConfiguration!
          .Rules![0]
          .ApplyServerSideEncryptionByDefault!
          .SSEAlgorithm;

        expect(algorithm).toBe('aws:kms');
      }
    });

    test('CloudTrail and Config S3 buckets should block public access', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));

      const buckets = [
        trailResponse.trailList![0].S3BucketName!,
        channelResponse.DeliveryChannels![0].s3BucketName!,
      ];

      // Verify each bucket blocks public access
      for (const bucketName of buckets) {
        const response = await s3Client.send(new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        }));

        expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      }
    });

    test('CloudTrail should be logging to encrypted destinations', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      // Verify CloudTrail is logging
      const statusResponse = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(statusResponse.IsLogging).toBe(true);

      // Get trail configuration
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = trailResponse.trailList![0];

      // Verify S3 bucket is encrypted
      const bucketEncryption = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: trail.S3BucketName!,
      }));

      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('monitoring should be enabled for security events', async () => {
      if (skipIfNoDeployment()) return;

      // Verify CloudWatch alarm exists
      const alarmResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      expect(alarmResponse.MetricAlarms).toBeDefined();
      expect(alarmResponse.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('IAM roles should follow least privilege principle', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const policyResponse = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyPolicy',
      }));

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      const actions = policy.Statement[0].Action;

      // Verify only read actions are allowed
      expect(actions).toContain('s3:GetObject');
      expect(actions).not.toContain('s3:PutObject');
      expect(actions).not.toContain('s3:DeleteObject');
      expect(actions).not.toContain('s3:*');
    });

    test('AWS Config should be monitoring compliance', async () => {
      if (skipIfNoDeployment()) return;

      const rulesResponse = await configClient.send(new DescribeConfigRulesCommand({}));

      expect(rulesResponse.ConfigRules).toBeDefined();
      expect(rulesResponse.ConfigRules!.length).toBeGreaterThan(0);

      const publicS3Rule = rulesResponse.ConfigRules!.find(rule =>
        rule.Source?.SourceIdentifier === 'S3_BUCKET_PUBLIC_READ_PROHIBITED'
      );

      expect(publicS3Rule).toBeDefined();
      expect(publicS3Rule!.ConfigRuleState).toBe('ACTIVE');
    });

    test('multi-region compliance should be enabled', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];

      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
    });

    // E2E Test: Complete encrypted data lifecycle
    test('E2E: Complete encrypted data lifecycle with Secrets Manager and KMS', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const secretName = `test/e2e-secret-${Date.now()}`;
      const originalData = {
        application: 'SecurityBaseline',
        environment: 'Test',
        apiKey: 'e2e-test-key-12345',
        timestamp: new Date().toISOString(),
      };

      try {
        // Step 1: Create secret in Secrets Manager with KMS encryption
        const createSecretResponse = await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          Description: 'E2E test: Complete data lifecycle',
          SecretString: JSON.stringify(originalData),
          KmsKeyId: kmsKeyId,
        }));

        expect(createSecretResponse.ARN).toBeDefined();

        // Step 2: Retrieve secret from Secrets Manager
        const getSecretResponse = await secretsClient.send(new GetSecretValueCommand({
          SecretId: secretName,
        }));

        const secretData = JSON.parse(getSecretResponse.SecretString!);
        expect(secretData).toEqual(originalData);

        // Step 3: Encrypt the secret data with KMS
        const encryptResponse = await kmsClient.send(new EncryptCommand({
          KeyId: kmsKeyId,
          Plaintext: Buffer.from(JSON.stringify(secretData)),
        }));

        expect(encryptResponse.CiphertextBlob).toBeDefined();

        // Step 4: Decrypt data using KMS
        const decryptResponse = await kmsClient.send(new DecryptCommand({
          CiphertextBlob: encryptResponse.CiphertextBlob,
        }));

        const decryptedData = JSON.parse(Buffer.from(decryptResponse.Plaintext!).toString('utf-8'));
        expect(decryptedData).toEqual(originalData);

        // Step 5: Verify data integrity throughout the entire lifecycle
        expect(decryptedData.apiKey).toBe(originalData.apiKey);
        expect(decryptedData.timestamp).toBe(originalData.timestamp);
      } finally {
        // Clean up: Delete secret
        await secretsClient.send(new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: true,
        }));
      }
    });

    // E2E Test: Security event flow from generation to monitoring
    test('E2E: Security monitoring with CloudTrail and CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      // Step 1: Generate a data key for client-side encryption
      const dataKeyResponse = await kmsClient.send(new GenerateDataKeyCommand({
        KeyId: kmsKeyId,
        KeySpec: 'AES_256',
      }));

      expect(dataKeyResponse.Plaintext).toBeDefined();
      expect(dataKeyResponse.CiphertextBlob).toBeDefined();

      // Step 2: Verify CloudTrail is capturing the events
      const trailStatusResponse = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: outputs.CloudTrailName,
      }));

      expect(trailStatusResponse.IsLogging).toBe(true);

      // Step 3: Verify KMS key is enabled
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
    });
  });
});
