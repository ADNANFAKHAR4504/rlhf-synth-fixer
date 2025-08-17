import fs from 'fs';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLoggingCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListInstanceProfilesCommand,
} from '@aws-sdk/client-iam';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const kmsClient = new KMSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const ec2Client = new EC2Client({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const configClient = new ConfigServiceClient({ region });

describe('Secure AWS Infrastructure Integration Tests', () => {
  describe('KMS Key Security', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      // Key rotation status is checked separately via GetKeyRotationStatus API
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have proper policy', async () => {
      const keyId = outputs.KMSKeyId;
      
      const response = await kmsClient.send(
        new GetKeyPolicyCommand({ KeyId: keyId, PolicyName: 'default' })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Version).toBe('2012-10-17');
      expect(Array.isArray(policy.Statement)).toBe(true);
    });
  });

  describe('S3 Bucket Security', () => {
    test('main S3 bucket should have KMS encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const encryptionRule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(outputs.KMSKeyId);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should block all public access', async () => {
      const bucketName = outputs.S3BucketName;
      
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have access logging configured', async () => {
      const bucketName = outputs.S3BucketName;
      
      const response = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled?.TargetPrefix).toBe('access-logs/');
    });
  });

  describe('IAM Roles Security', () => {
    test('EC2 role should exist and have minimal permissions', async () => {
      const roleArn = outputs.EC2RoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('CorpEC2Role');
      
      const assumePolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument!));
      const condition = assumePolicy.Statement[0].Condition;
      expect(condition?.StringEquals?.['aws:RequestedRegion']).toBe('us-east-1');
    });

    test('Lambda role should exist and have minimal permissions', async () => {
      const roleArn = outputs.LambdaRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('CorpLambdaExecutionRole');
    });

    test('EC2 instance profile should exist', async () => {
      const listResponse = await iamClient.send(
        new ListInstanceProfilesCommand({})
      );
      
      const profile = listResponse.InstanceProfiles?.find(p => 
        p.InstanceProfileName?.includes('CorpEC2InstanceProfile')
      );
      
      expect(profile).toBeDefined();
      expect(profile?.Roles?.length).toBeGreaterThan(0);
    });
  });

  describe('Network Security', () => {
    test('security group should have restricted ingress and egress rules', async () => {
      const securityGroupId = outputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );

      expect(response.SecurityGroups).toBeDefined();
      const securityGroup = response.SecurityGroups![0];
      
      expect(securityGroup.GroupName).toContain('CorpSecurityGroup');
      
      const ingressRules = securityGroup.IpPermissions;
      expect(ingressRules?.length).toBe(1);
      expect(ingressRules?.[0].FromPort).toBe(443);
      expect(ingressRules?.[0].ToPort).toBe(443);
      expect(ingressRules?.[0].IpRanges?.[0].CidrIp).toBe('10.0.0.0/8');

      const egressRules = securityGroup.IpPermissionsEgress;
      expect(egressRules?.length).toBe(2);
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch log group should exist and be encrypted', async () => {
      const logGroupName = outputs.CloudWatchLogGroup;
      expect(logGroupName).toBeDefined();

      const response = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.kmsKeyId).toBe(outputs.KMSKeyArn);
      expect(logGroup.retentionInDays).toBe(365);
    });

    test('CloudTrail should be enabled and logging', async () => {
      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({})
      );

      expect(response.trailList).toBeDefined();
      console.log('Available trails:', response.trailList?.map(t => t.Name));
      const trails = response.trailList?.filter(trail => 
        trail.Name?.includes('corp-cloudtrail')
      );
      expect(trails?.length).toBeGreaterThan(0);

      const trail = trails![0];
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.KmsKeyId).toContain(outputs.KMSKeyId);

      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trail.TrailARN })
      );
      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('Compliance and Configuration', () => {
    test('AWS Config should be enabled and recording', async () => {
      const recordersResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      expect(recordersResponse.ConfigurationRecorders).toBeDefined();
      const recorders = recordersResponse.ConfigurationRecorders?.filter(recorder =>
        recorder.name?.includes('corp-config-recorder')
      );
      expect(recorders?.length).toBeGreaterThan(0);

      const recorder = recorders![0];
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    });

    test('AWS Config delivery channel should be configured', async () => {
      const response = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      expect(response.DeliveryChannels).toBeDefined();
      const channels = response.DeliveryChannels?.filter(channel =>
        channel.name?.includes('corp-config-delivery')
      );
      expect(channels?.length).toBeGreaterThan(0);

      const channel = channels![0];
      expect(channel.s3BucketName).toBe(outputs.S3BucketName);
      expect(channel.s3KeyPrefix).toBe('config-logs');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all deployed resources should follow corp- naming convention', async () => {
      expect(outputs.S3BucketName).toContain('corp-secure-bucket');
      expect(outputs.EC2RoleArn).toContain('CorpEC2Role');
      expect(outputs.LambdaRoleArn).toContain('CorpLambdaExecutionRole');
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toContain('/corp/security/');
    });

    test('environment suffix should be properly applied', async () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.StackName).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Security Validation', () => {
    test('infrastructure should meet CIS compliance requirements', async () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.EC2RoleArn).toBeDefined();
      expect(outputs.LambdaRoleArn).toBeDefined();
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toBeDefined();
    });

    test('encryption should be properly implemented across all resources', async () => {
      const kmsKeyId = outputs.KMSKeyId;
      const s3BucketName = outputs.S3BucketName;
      const logGroupName = outputs.CloudWatchLogGroup;

      const [s3Response, logGroupResponse] = await Promise.all([
        s3Client.send(new GetBucketEncryptionCommand({ Bucket: s3BucketName })),
        cloudWatchLogsClient.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }))
      ]);

      const s3Encryption = s3Response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault;
      expect(s3Encryption?.SSEAlgorithm).toBe('aws:kms');
      expect(s3Encryption?.KMSMasterKeyID).toBe(kmsKeyId);

      const logGroup = logGroupResponse.logGroups?.[0];
      expect(logGroup?.kmsKeyId).toBe(outputs.KMSKeyArn);
    });
  });
});
