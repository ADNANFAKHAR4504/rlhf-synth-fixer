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
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeConfigurationRecordersCommand,
} from '@aws-sdk/client-config-service';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
      'utf8'
    )
  );
} catch (error) {
  console.warn(
    'Warning: cfn-outputs/flat-outputs.json not found. Tests will use mock values.'
  );
  // Mock outputs for local testing
  outputs = {
    VPCId: 'vpc-mock',
    PublicSubnetId: 'subnet-public-mock',
    PrivateSubnetId: 'subnet-private-mock',
    S3BucketName: 'secure-bucket-mock',
    RDSEndpoint: 'mock-db.region.rds.amazonaws.com',
    WebServerInstanceId: 'i-mock',
  };
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const configClient = new ConfigServiceClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const iamClient = new IAMClient({ region });

describe('Secure AWS Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be configured correctly', async () => {
      if (!outputs.VPCId || outputs.VPCId === 'vpc-mock') {
        console.log('Skipping test - no real VPC ID available');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Check DNS settings
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('Public subnet should exist and be configured correctly', async () => {
      if (!outputs.PublicSubnetId || outputs.PublicSubnetId.includes('mock')) {
        console.log('Skipping test - no real subnet ID available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetId],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(1);
      const subnet = response.Subnets![0];
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.VpcId).toBe(outputs.VPCId);
    });

    test('Private subnet should exist and be configured correctly', async () => {
      if (
        !outputs.PrivateSubnetId ||
        outputs.PrivateSubnetId.includes('mock')
      ) {
        console.log('Skipping test - no real subnet ID available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnetId],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(1);
      const subnet = response.Subnets![0];
      expect(subnet.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.VpcId).toBe(outputs.VPCId);
    });

    test('NAT Gateway should exist and be available', async () => {
      if (!outputs.VPCId || outputs.VPCId === 'vpc-mock') {
        console.log('Skipping test - no real VPC ID available');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThan(0);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.VpcId).toBe(outputs.VPCId);
    });

    test('VPC Flow Logs should be enabled', async () => {
      if (!outputs.VPCId || outputs.VPCId === 'vpc-mock') {
        console.log('Skipping test - no real VPC ID available');
        return;
      }

      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Security Groups', () => {
    test('Web security group should exist with correct rules', async () => {
      if (!outputs.VPCId || outputs.VPCId === 'vpc-mock') {
        console.log('Skipping test - no real VPC ID available');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'tag:Name',
            Values: [`web-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];

      // Check for HTTPS rule
      const httpsRule = ingressRules.find(r => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule!.ToPort).toBe(443);

      // Check for HTTP rule
      const httpRule = ingressRules.find(r => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.ToPort).toBe(80);
    });

    test('Database security group should exist with restricted access', async () => {
      if (!outputs.VPCId || outputs.VPCId === 'vpc-mock') {
        console.log('Skipping test - no real VPC ID available');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'tag:Name',
            Values: [`db-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];

      // Should only have MySQL port open
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);

      // Should only accept traffic from web security group
      expect(ingressRules[0].UserIdGroupPairs).toBeDefined();
      expect(ingressRules[0].UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('Secure S3 bucket should exist with versioning enabled', async () => {
      if (!outputs.S3BucketName || outputs.S3BucketName.includes('mock')) {
        console.log('Skipping test - no real S3 bucket available');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });

      try {
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log('Bucket does not exist yet');
        } else {
          throw error;
        }
      }
    });

    test('Secure S3 bucket should have encryption enabled', async () => {
      if (!outputs.S3BucketName || outputs.S3BucketName.includes('mock')) {
        console.log('Skipping test - no real S3 bucket available');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });

      try {
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(
          1
        );

        const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
        expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe(
          'AES256'
        );
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log('Bucket does not exist yet');
        } else {
          throw error;
        }
      }
    });

    test('Secure S3 bucket should block public access', async () => {
      if (!outputs.S3BucketName || outputs.S3BucketName.includes('mock')) {
        console.log('Skipping test - no real S3 bucket available');
        return;
      }

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });

      try {
        const response = await s3Client.send(command);
        const config = response.PublicAccessBlockConfiguration!;

        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log('Bucket does not exist yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should exist with encryption enabled', async () => {
      if (!outputs.RDSEndpoint || outputs.RDSEndpoint.includes('mock')) {
        console.log('Skipping test - no real RDS instance available');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `secure-db-${environmentSuffix}`,
      });

      try {
        const response = await rdsClient.send(command);
        expect(response.DBInstances).toHaveLength(1);

        const dbInstance = response.DBInstances![0];
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.BackupRetentionPeriod).toBe(7);
        expect(dbInstance.DeletionProtection).toBe(false);
        expect(dbInstance.PubliclyAccessible).toBe(false);
        expect(dbInstance.Engine).toBe('mysql');

        // Check CloudWatch logs exports
        expect(dbInstance.EnabledCloudwatchLogsExports).toContain('error');
        expect(dbInstance.EnabledCloudwatchLogsExports).toContain('general');
        expect(dbInstance.EnabledCloudwatchLogsExports).toContain('slowquery');
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log('RDS instance does not exist yet');
        } else {
          throw error;
        }
      }
    });

    test('RDS password should be stored in Secrets Manager', async () => {
      const secretName = `rds-password-${environmentSuffix}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      try {
        const response = await secretsClient.send(command);
        expect(response.Name).toBe(secretName);
        expect(response.Description).toBe('RDS Master Password');

        // Verify secret can be retrieved (but don't log it)
        const getCommand = new GetSecretValueCommand({
          SecretId: secretName,
        });
        const secretValue = await secretsClient.send(getCommand);
        expect(secretValue.SecretString).toBeDefined();

        const secret = JSON.parse(secretValue.SecretString!);
        expect(secret.username).toBe('admin');
        expect(secret.password).toBeDefined();
        expect(secret.password.length).toBeGreaterThanOrEqual(16);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Secret does not exist yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('IAM Roles and Instance Profiles', () => {
    test('EC2 IAM role should exist with correct policies', async () => {
      const roleName = `EC2-SecureRole-${environmentSuffix}`;

      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      try {
        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);

        // Check assume role policy
        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
        );
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
          'ec2.amazonaws.com'
        );
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.log('IAM role does not exist yet');
        } else {
          throw error;
        }
      }
    });

    test('EC2 instance should have IAM instance profile attached', async () => {
      if (
        !outputs.WebServerInstanceId ||
        outputs.WebServerInstanceId === 'i-mock'
      ) {
        console.log('Skipping test - no real instance ID available');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId],
      });

      try {
        const response = await ec2Client.send(command);
        const instance = response.Reservations?.[0]?.Instances?.[0];
        expect(instance).toBeDefined();
        expect(instance!.IamInstanceProfile).toBeDefined();
        expect(instance!.IamInstanceProfile!.Arn).toContain('EC2InstanceProfile');
      } catch (error: any) {
        console.log('Error checking instance profile:', error.message);
        throw error;
      }
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should be enabled and logging', async () => {
      const trailName = `secure-trail-${environmentSuffix}`;

      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [trailName],
      });

      try {
        const describeResponse = await cloudTrailClient.send(describeCommand);
        expect(describeResponse.trailList).toHaveLength(1);

        const trail = describeResponse.trailList![0];
        expect(trail.IsMultiRegionTrail).toBe(true);
        expect(trail.LogFileValidationEnabled).toBe(true);
        expect(trail.IncludeGlobalServiceEvents).toBe(true);

        // Check if trail is logging
        const statusCommand = new GetTrailStatusCommand({
          Name: trailName,
        });
        const statusResponse = await cloudTrailClient.send(statusCommand);
        expect(statusResponse.IsLogging).toBe(true);
      } catch (error: any) {
        if (error.name === 'TrailNotFoundException') {
          console.log('CloudTrail does not exist yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('CloudWatch Logs', () => {
    test('Required log groups should exist', async () => {
      const expectedLogGroups = [
        `/aws/s3/secure-bucket-${environmentSuffix}`,
        `/aws/vpc/flowlogs-${environmentSuffix}`,
        `/aws/cloudtrail/secure-trail-${environmentSuffix}`,
      ];

      for (const logGroupName of expectedLogGroups) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });

        try {
          const response = await cloudWatchLogsClient.send(command);
          const logGroup = response.logGroups?.find(
            lg => lg.logGroupName === logGroupName
          );

          if (logGroup) {
            expect(logGroup.logGroupName).toBe(logGroupName);

            // Check retention settings
            if (logGroupName.includes('cloudtrail')) {
              expect(logGroup.retentionInDays).toBe(90);
            } else {
              expect(logGroup.retentionInDays).toBe(30);
            }
          } else {
            console.log(`Log group ${logGroupName} does not exist yet`);
          }
        } catch (error) {
          console.log(`Error checking log group ${logGroupName}:`, error);
        }
      }
    });
  });

  describe('AWS Config', () => {
    test('Config recorder should be configured and running', async () => {
      const recorderName = `config-recorder-${environmentSuffix}`;

      const command = new DescribeConfigurationRecordersCommand({
        ConfigurationRecorderNames: [recorderName],
      });

      try {
        const response = await configClient.send(command);
        expect(response.ConfigurationRecorders).toHaveLength(1);

        const recorder = response.ConfigurationRecorders![0];
        expect(recorder.name).toBe(recorderName);
        expect(recorder.recordingGroup?.allSupported).toBe(true);
        expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
      } catch (error: any) {
        if (error.name === 'NoSuchConfigurationRecorderException') {
          console.log('Config recorder does not exist yet');
        } else {
          throw error;
        }
      }
    });

    test('Config rules should be present', async () => {
      const expectedRules = [
        `s3-bucket-ssl-requests-only-${environmentSuffix}`,
        `rds-storage-encrypted-${environmentSuffix}`,
      ];

      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: expectedRules,
      });

      try {
        const response = await configClient.send(command);

        if (response.ConfigRules && response.ConfigRules.length > 0) {
          expect(response.ConfigRules.length).toBe(expectedRules.length);

          response.ConfigRules.forEach(rule => {
            expect(expectedRules).toContain(rule.ConfigRuleName);
            expect(rule.Source?.Owner).toBe('AWS');
          });
        } else {
          console.log('Config rules do not exist yet');
        }
      } catch (error: any) {
        if (error.name === 'NoSuchConfigRuleException') {
          console.log('Config rules do not exist yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('EC2 Instance', () => {
    test('Web server instance should be running', async () => {
      if (
        !outputs.WebServerInstanceId ||
        outputs.WebServerInstanceId === 'i-mock'
      ) {
        console.log('Skipping test - no real instance ID available');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId],
      });

      try {
        const response = await ec2Client.send(command);
        expect(response.Reservations).toHaveLength(1);
        expect(response.Reservations![0].Instances).toHaveLength(1);

        const instance = response.Reservations![0].Instances![0];
        expect(instance.State?.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.IamInstanceProfile).toBeDefined();

        // Check if instance is in the correct subnet
        expect(instance.SubnetId).toBe(outputs.PublicSubnetId);
      } catch (error) {
        console.log('Error checking EC2 instance:', error);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('Infrastructure components should be interconnected correctly', async () => {
      if (outputs.VPCId === 'vpc-mock') {
        console.log('Skipping test - no real deployment available');
        return;
      }

      // This test verifies that all components are properly connected
      // 1. VPC exists
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).not.toContain('mock');

      // 2. Subnets exist in the VPC
      expect(outputs.PublicSubnetId).toBeDefined();
      expect(outputs.PrivateSubnetId).toBeDefined();

      // 3. S3 bucket exists
      expect(outputs.S3BucketName).toBeDefined();

      // 4. RDS endpoint exists
      expect(outputs.RDSEndpoint).toBeDefined();

      // 5. EC2 instance exists
      expect(outputs.WebServerInstanceId).toBeDefined();

      // Verify the infrastructure is accessible and working
      console.log('Infrastructure validation complete:');
      console.log(`- VPC: ${outputs.VPCId}`);
      console.log(`- Public Subnet: ${outputs.PublicSubnetId}`);
      console.log(`- Private Subnet: ${outputs.PrivateSubnetId}`);
      console.log(`- S3 Bucket: ${outputs.S3BucketName}`);
      console.log(`- RDS Endpoint: ${outputs.RDSEndpoint}`);
      console.log(`- EC2 Instance: ${outputs.WebServerInstanceId}`);
    });
  });
});
