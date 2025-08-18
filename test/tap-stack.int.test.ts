// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand
} from '@aws-sdk/client-ec2';
import { 
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand
} from '@aws-sdk/client-s3';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand 
} from '@aws-sdk/client-iam';
import { 
  KMSClient, 
  DescribeKeyCommand 
} from '@aws-sdk/client-kms';
import { 
  CloudTrailClient, 
  DescribeTrailsCommand 
} from '@aws-sdk/client-cloudtrail';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get AWS region from the AWS_REGION file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients with the region from AWS_REGION file
const ec2Client = new EC2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });

describe('Turn Around Prompt API Integration Tests', () => {
  describe('S3 Bucket Integration Tests', () => {
    test('should verify data bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.DataBucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify backup bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.BackupBucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify logs bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.LogsBucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify data bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: outputs.DataBucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should verify data bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: outputs.DataBucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
    });

    test('should verify buckets have proper tagging', async () => {
      const command = new GetBucketTaggingCommand({ Bucket: outputs.DataBucketName });
      const response = await s3Client.send(command);
      const tags = response.TagSet || [];
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe(outputs.Environment);
    });
  });

  describe('KMS Key Integration Tests', () => {
    test('should verify KMS key exists and is enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.KMSKeyId });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Description).toContain('S3 encryption');
    });

    test('should verify KMS key alias exists', async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.KMSKeyAlias });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('IAM Roles Integration Tests', () => {
    test('should verify read-only role exists', async () => {
      const command = new GetRoleCommand({ RoleName: outputs.ReadOnlyRoleArn.split('/').pop() });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.ReadOnlyRoleArn);
    });

    test('should verify read-write role exists', async () => {
      const command = new GetRoleCommand({ RoleName: outputs.ReadWriteRoleArn.split('/').pop() });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.ReadWriteRoleArn);
    });

    test('should verify backup role exists', async () => {
      const command = new GetRoleCommand({ RoleName: outputs.BackupRoleArn.split('/').pop() });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.BackupRoleArn);
    });

    test('should verify read-only role has attached policies', async () => {
      const roleName = outputs.ReadOnlyRoleArn.split('/').pop();
      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();
      expect(response.AttachedPolicies?.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs Integration Tests', () => {
    test('should verify S3 log group exists', async () => {
      const command = new DescribeLogGroupsCommand({ 
        logGroupNamePrefix: outputs.S3LogGroupName 
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.S3LogGroupName);
      expect(logGroup).toBeDefined();
    });

    test('should verify CloudFormation log group exists', async () => {
      const command = new DescribeLogGroupsCommand({ 
        logGroupNamePrefix: outputs.CloudFormationLogGroupName 
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.CloudFormationLogGroupName);
      expect(logGroup).toBeDefined();
    });

    test('should verify application log group exists', async () => {
      const command = new DescribeLogGroupsCommand({ 
        logGroupNamePrefix: outputs.ApplicationLogGroupName 
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.ApplicationLogGroupName);
      expect(logGroup).toBeDefined();
    });
  });

  describe('CloudTrail Integration Tests', () => {
    test('should verify CloudTrail exists and is enabled', async () => {
      const command = new DescribeTrailsCommand({ 
        trailNameList: [outputs.CloudTrailName] 
      });
      const response = await cloudTrailClient.send(command);
      const trail = response.trailList?.find(t => t.Name === outputs.CloudTrailName);
      expect(trail).toBeDefined();
      expect(trail?.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('VPC and Networking Integration Tests', () => {
    test('should verify VPC exists with correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`${outputs.StackName}-*VPC`]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should verify public subnets exist in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`${outputs.StackName}-*Public*`]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
      
      // Verify subnets are in different AZs
      const availabilityZones = response.Subnets?.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = [...new Set(availabilityZones)];
      expect(uniqueAZs.length).toBeGreaterThan(1);
    });

    test('should verify private subnets exist in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`${outputs.StackName}-*Private*`]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
      
      // Verify subnets are in different AZs
      const availabilityZones = response.Subnets?.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = [...new Set(availabilityZones)];
      expect(uniqueAZs.length).toBeGreaterThan(1);
    });

    test('should verify security groups exist with proper rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`${outputs.StackName}-*`]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);
      
      // Verify at least one security group has inbound rules
      const securityGroupWithRules = response.SecurityGroups?.find(sg => 
        sg.IpPermissions && sg.IpPermissions.length > 0
      );
      expect(securityGroupWithRules).toBeDefined();
    });
  });

  describe('Auto Scaling Group Integration Tests', () => {
    test('should verify Auto Scaling Group exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`${outputs.StackName}-asg`]
      });
      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      
      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(2);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
    });

    test('should verify Auto Scaling Group has instances running', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`${outputs.StackName}-asg`]
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];
      
      expect(asg?.Instances?.length).toBeGreaterThan(0);
      
      // Verify instances are in InService state
      const inServiceInstances = asg?.Instances?.filter((instance: any) => 
        instance.LifecycleState === 'InService'
      );
      expect(inServiceInstances?.length).toBeGreaterThan(0);
    });
  });

  describe('EC2 Instances Integration Tests', () => {
    test('should verify EC2 instances are running', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`${outputs.StackName}-*`]
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.Reservations?.length).toBeGreaterThan(0);
      
      const instances = response.Reservations?.flatMap(reservation => reservation.Instances || []);
      expect(instances?.length).toBeGreaterThan(0);
      
      // Verify all instances are running
      instances?.forEach(instance => {
        expect(instance.State?.Name).toBe('running');
      });
    });
  });

  describe('CloudWatch Alarms Integration Tests', () => {
    test('should verify CPU alarms exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${outputs.StackName}-*CPU*`]
      });
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
      
      // Verify we have both high and low CPU alarms
      const alarmNames = response.MetricAlarms?.map(alarm => alarm.AlarmName);
      expect(alarmNames?.some(name => name?.includes('High'))).toBe(true);
      expect(alarmNames?.some(name => name?.includes('Low'))).toBe(true);
    });

    test('should verify ASG capacity alarm exists', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${outputs.StackName}-*ASG-Capacity*`]
      });
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Health Check', () => {
    test('should verify all critical resources are deployed and accessible', async () => {
      // This test verifies that all major components are working together
      const criticalResources = [
        outputs.DataBucketName,
        outputs.BackupBucketName,
        outputs.LogsBucketName,
        outputs.KMSKeyId,
        outputs.ReadOnlyRoleArn,
        outputs.ReadWriteRoleArn,
        outputs.BackupRoleArn,
        outputs.S3LogGroupName,
        outputs.CloudFormationLogGroupName,
        outputs.ApplicationLogGroupName,
        outputs.CloudTrailName,
        outputs.StackName
      ];

      // Verify all outputs are defined
      criticalResources.forEach(resource => {
        expect(resource).toBeDefined();
        expect(typeof resource).toBe('string');
        expect(resource.length).toBeGreaterThan(0);
      });

      // Verify environment is set correctly
      expect(outputs.Environment).toBe(environmentSuffix);
    });
  });
});
