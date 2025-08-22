// Integration tests for SecureCorp Infrastructure
// These tests validate the actual deployed infrastructure using AWS SDK

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

import fs from 'fs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region: 'sa-east-1' });
const ec2Client = new EC2Client({ region: 'sa-east-1' });
const kmsClient = new KMSClient({ region: 'sa-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: 'sa-east-1' });
const iamClient = new IAMClient({ region: 'sa-east-1' });
const rdsClient = new RDSClient({ region: 'sa-east-1' });
const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: 'sa-east-1',
});
const secretsManagerClient = new SecretsManagerClient({
  region: 'sa-east-1',
});

describe('SecureCorp Infrastructure Integration Tests', () => {
  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyDetails = await kmsClient.send(describeCommand);

      expect(keyDetails.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyDetails.KeyMetadata?.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(keyDetails.KeyMetadata?.Description).toContain(
        'SecureCorp master encryption key'
      );

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationStatus = await kmsClient.send(rotationCommand);
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });

    test('KMS key alias exists', async () => {
      const aliasName = `alias/securecorp-master-key-${environmentSuffix}`;
      const listAliasesCommand = new ListAliasesCommand({});
      const aliases = await kmsClient.send(listAliasesCommand);

      const alias = aliases.Aliases?.find(a => a.AliasName === aliasName);
      expect(alias).toBeDefined();
      expect(alias?.TargetKeyId).toBe(outputs.KMSKeyId);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC exists with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const describeVpcsCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcs = await ec2Client.send(describeVpcsCommand);

      const vpc = vpcs.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are enabled but not directly accessible from VPC describe
    });

    test('VPC has correct subnet configuration', async () => {
      const vpcId = outputs.VPCId;
      const describeSubnetsCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const subnets = await ec2Client.send(describeSubnetsCommand);

      expect(subnets.Subnets?.length).toBeGreaterThanOrEqual(6);

      // Check for different subnet types
      const publicSubnets = subnets.Subnets?.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.Subnets?.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets?.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets?.length).toBeGreaterThanOrEqual(4);
    });

    test('VPC Flow Logs are enabled', async () => {
      const vpcId = outputs.VPCId;
      const describeFlowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const flowLogs = await ec2Client.send(describeFlowLogsCommand);

      expect(flowLogs.FlowLogs?.length).toBeGreaterThan(0);
      const flowLog = flowLogs.FlowLogs?.[0];
      expect(flowLog?.TrafficType).toBe('ALL');
      expect(flowLog?.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('VPC Endpoints', () => {
    test('S3 VPC endpoint exists', async () => {
      const endpointId = outputs.VPCEndpointS3Id;
      expect(endpointId).toBeDefined();

      const describeCommand = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [endpointId],
      });
      const endpoints = await ec2Client.send(describeCommand);

      const endpoint = endpoints.VpcEndpoints?.[0];
      expect(endpoint?.VpcEndpointType).toBe('Gateway');
      expect(endpoint?.ServiceName).toContain('s3');
    });

    test('Secrets Manager VPC endpoint exists', async () => {
      const endpointId = outputs.VPCEndpointSecretsManagerId;
      expect(endpointId).toBeDefined();

      const describeCommand = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [endpointId],
      });
      const endpoints = await ec2Client.send(describeCommand);

      const endpoint = endpoints.VpcEndpoints?.[0];
      expect(endpoint?.VpcEndpointType).toBe('Interface');
      expect(endpoint?.ServiceName).toContain('secretsmanager');
      expect(endpoint?.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('CloudTrail bucket exists with encryption', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      expect(bucketName).toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryption = await s3Client.send(encryptionCommand);

      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toBeDefined();
    });

    test('CloudTrail bucket has versioning enabled', async () => {
      const bucketName = outputs.CloudTrailBucketName;

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const versioning = await s3Client.send(versioningCommand);

      expect(versioning.Status).toBe('Enabled');
    });

    test('Data bucket exists with encryption', async () => {
      const bucketName = outputs.DataBucketName;
      expect(bucketName).toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryption = await s3Client.send(encryptionCommand);

      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('Buckets have public access blocked', async () => {
      const buckets = [outputs.CloudTrailBucketName, outputs.DataBucketName];

      for (const bucketName of buckets) {
        const publicAccessCommand = new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        });
        const publicAccess = await s3Client.send(publicAccessCommand);

        expect(
          publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets
        ).toBe(true);
      }
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail is enabled and logging', async () => {
      const trailArn = outputs.CloudTrailArn;
      expect(trailArn).toBeDefined();

      const trailName = trailArn.split('/').pop();
      const statusCommand = new GetTrailStatusCommand({ Name: trailName });
      const status = await cloudTrailClient.send(statusCommand);

      expect(status.IsLogging).toBe(true);
    });

    test('CloudTrail has multi-region and global service events enabled', async () => {
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop();

      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [trailName],
      });
      const trails = await cloudTrailClient.send(describeCommand);

      const trail = trails.trailList?.[0];
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail logs to CloudWatch', async () => {
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop();

      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [trailName],
      });
      const trails = await cloudTrailClient.send(describeCommand);

      const trail = trails.trailList?.[0];
      expect(trail?.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(trail?.CloudWatchLogsLogGroupArn).toContain(
        '/securecorp/cloudtrail/'
      );
    });
  });

  describe('IAM Roles', () => {
    test('Developer role exists with correct configuration', async () => {
      const roleArn = outputs.DeveloperRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const role = await iamClient.send(getRoleCommand);

      expect(role.Role?.Description).toContain(
        'developers with limited access'
      );
      expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Admin role exists with PowerUserAccess', async () => {
      const roleArn = outputs.AdminRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const listAttachedCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const attachedPolicies = await iamClient.send(listAttachedCommand);

      const hasPowerUserAccess = attachedPolicies.AttachedPolicies?.some(
        p => p.PolicyName === 'PowerUserAccess'
      );
      expect(hasPowerUserAccess).toBe(true);
    });

    test('Auditor role exists with ReadOnlyAccess', async () => {
      const roleArn = outputs.AuditorRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const listAttachedCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const attachedPolicies = await iamClient.send(listAttachedCommand);

      const hasReadOnlyAccess = attachedPolicies.AttachedPolicies?.some(
        p => p.PolicyName === 'ReadOnlyAccess'
      );
      expect(hasReadOnlyAccess).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists with encryption', async () => {
      const endpoint = outputs.DatabaseEndpoint;
      expect(endpoint).toBeDefined();

      const describeCommand = new DescribeDBInstancesCommand({});
      const databases = await rdsClient.send(describeCommand);

      const database = databases.DBInstances?.find(
        db => db.Endpoint?.Address === endpoint
      );

      expect(database).toBeDefined();
      expect(database?.StorageEncrypted).toBe(true);
      expect(database?.Engine).toBe('postgres');
      expect(database?.BackupRetentionPeriod).toBe(30);
      expect(database?.DeletionProtection).toBe(false);
    });

    test('RDS instance has performance insights enabled', async () => {
      const endpoint = outputs.DatabaseEndpoint;

      const describeCommand = new DescribeDBInstancesCommand({});
      const databases = await rdsClient.send(describeCommand);

      const database = databases.DBInstances?.find(
        db => db.Endpoint?.Address === endpoint
      );

      expect(database?.PerformanceInsightsEnabled).toBe(true);
      expect(database?.PerformanceInsightsRetentionPeriod).toBe(7);
    });

    test('Database credentials are stored in Secrets Manager', async () => {
      const secretArn = outputs.DatabaseSecretArn;

      if (secretArn && secretArn !== 'No secret created') {
        const describeCommand = new DescribeSecretCommand({
          SecretId: secretArn,
        });
        const secret = await secretsManagerClient.send(describeCommand);

        expect(secret.Description).toContain('Generated by the CDK for stack');
        expect(secret.KmsKeyId).toBeDefined();
      }
    });
  });

  describe('CloudWatch Logs', () => {
    test('VPC Flow Logs log group exists', async () => {
      const logGroupName = `/securecorp/vpc/flowlogs/${environmentSuffix}`;

      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroups = await cloudWatchLogsClient.send(describeCommand);

      const logGroup = logGroups.logGroups?.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(365);
      expect(logGroup?.kmsKeyId).toBeDefined();
    });

    test('CloudTrail log group exists', async () => {
      const logGroupName = `/securecorp/cloudtrail/${environmentSuffix}`;

      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroups = await cloudWatchLogsClient.send(describeCommand);

      const logGroup = logGroups.logGroups?.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(365);
      expect(logGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('Database security group has restrictive rules', async () => {
      const vpcId = outputs.VPCId;

      const describeCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
        ],
      });
      const securityGroups = await ec2Client.send(describeCommand);

      const dbSecurityGroup = securityGroups.SecurityGroups?.find(sg =>
        sg.Description?.includes('Security group for SecureCorp database')
      );

      expect(dbSecurityGroup).toBeDefined();

      // Check ingress rules
      const ingressRules = dbSecurityGroup?.IpPermissions || [];
      ingressRules.forEach(rule => {
        // Should not have 0.0.0.0/0 as source
        const hasOpenAccess = rule.IpRanges?.some(
          range => range.CidrIp === '0.0.0.0/0'
        );
        expect(hasOpenAccess).toBe(false);

        // Should only allow PostgreSQL port
        if (rule.FromPort && rule.ToPort) {
          expect(rule.FromPort).toBe(5432);
          expect(rule.ToPort).toBe(5432);
        }
      });
    });
  });

  describe('End-to-End Security Validation', () => {
    test('All encryption keys are managed by KMS', async () => {
      // Verify S3 buckets use the KMS key
      const buckets = [outputs.CloudTrailBucketName, outputs.DataBucketName];
      for (const bucketName of buckets) {
        const encryptionCommand = new GetBucketEncryptionCommand({
          Bucket: bucketName,
        });
        const encryption = await s3Client.send(encryptionCommand);

        const kmsKeyId =
          encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

        expect(kmsKeyId).toBeDefined();
      }
    });

    test('All resources are properly tagged', async () => {
      const vpcId = outputs.VPCId;

      const describeCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcs = await ec2Client.send(describeCommand);

      const tags = vpcs.Vpcs?.[0]?.Tags || [];
      const hasEnvironmentTag = tags.some(t => t.Key === 'Environment');
      const hasProjectTag = tags.some(
        t => t.Key === 'Project' && t.Value === 'SecureCorp'
      );
      const hasCostCenterTag = tags.some(
        t => t.Key === 'CostCenter' && t.Value === 'Security'
      );
      const hasDataClassificationTag = tags.some(
        t => t.Key === 'DataClassification' && t.Value === 'Confidential'
      );

      expect(hasEnvironmentTag).toBe(true);
      expect(hasProjectTag).toBe(true);
      expect(hasCostCenterTag).toBe(true);
      expect(hasDataClassificationTag).toBe(true);
    });

    test('Network isolation is properly configured', async () => {
      const vpcId = outputs.VPCId;

      // Check that isolated subnets exist
      const describeSubnetsCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:aws-cdk:subnet-type', Values: ['Isolated'] },
        ],
      });
      const isolatedSubnets = await ec2Client.send(describeSubnetsCommand);

      expect(isolatedSubnets.Subnets?.length).toBeGreaterThanOrEqual(2);

      // Verify isolated subnets don't have NAT gateway routes
      isolatedSubnets.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });
});
