// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeNatGatewaysCommand, DescribeFlowLogsCommand } from '@aws-sdk/client-ec2';
import { S3Client, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketPolicyCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

describe('Security Infrastructure Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    test('should have VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // These are returned as strings from AWS API
      expect(vpc.EnableDnsHostnames || vpc.Tags?.find(t => t.Key === 'EnableDnsHostnames')?.Value).toBeTruthy();
      expect(vpc.EnableDnsSupport || vpc.Tags?.find(t => t.Key === 'EnableDnsSupport')?.Value).toBeTruthy();
    });

    test('should have 4 subnets across 2 availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(4);
      
      // Check for 2 public and 2 private subnets
      const publicSubnets = response.Subnets.filter(subnet => subnet.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets.filter(subnet => !subnet.MapPublicIpOnLaunch);
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
      
      // Check that subnets are in different AZs
      const azs = [...new Set(response.Subnets.map(subnet => subnet.AvailabilityZone))];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    test('should have 2 NAT gateways for high availability', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toHaveLength(2);
      
      // Check that NAT gateways are in different subnets
      const subnetIds = [...new Set(response.NatGateways.map(nat => nat.SubnetId))];
      expect(subnetIds).toHaveLength(2);
    });

    test('should have VPC Flow Logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.FlowLogs).toHaveLength(1);
      const flowLog = response.FlowLogs[0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('EC2 Instances', () => {
    test('should have bastion host with correct configuration', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.BastionHostId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations[0].Instances[0];
      
      expect(instance.State.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.PublicIpAddress).toBeTruthy();
      
      // Check IMDSv2 is enforced
      expect(instance.MetadataOptions.HttpTokens).toBe('required');
      
      // Check that instance has IAM role
      expect(instance.IamInstanceProfile).toBeTruthy();
    });

    test('should have private instance with correct configuration', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstanceId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations[0].Instances[0];
      
      expect(instance.State.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.PublicIpAddress).toBeFalsy(); // Should not have public IP
      expect(instance.PrivateIpAddress).toBeTruthy();
      
      // Check IMDSv2 is enforced
      expect(instance.MetadataOptions.HttpTokens).toBe('required');
      
      // Check that instance has IAM role
      expect(instance.IamInstanceProfile).toBeTruthy();
    });
  });

  describe('Security Groups', () => {
    test('should have properly configured security groups', async () => {
      // Get instance details to find security groups
      const bastionCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.BastionHostId]
      });
      const bastionResponse = await ec2Client.send(bastionCommand);
      const bastionSgIds = bastionResponse.Reservations[0].Instances[0].SecurityGroups.map(sg => sg.GroupId);
      
      const privateCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstanceId]
      });
      const privateResponse = await ec2Client.send(privateCommand);
      const privateSgIds = privateResponse.Reservations[0].Instances[0].SecurityGroups.map(sg => sg.GroupId);
      
      // Get security group details
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [...bastionSgIds, ...privateSgIds]
      });
      const sgResponse = await ec2Client.send(sgCommand);
      
      // Check bastion security group
      const bastionSg = sgResponse.SecurityGroups.find(sg => 
        sg.GroupName && sg.GroupName.includes('BastionSecurityGroup')
      );
      expect(bastionSg).toBeTruthy();
      
      // Bastion should allow SSH inbound
      const sshInbound = bastionSg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshInbound).toBeTruthy();
      
      // Check private security group
      const privateSg = sgResponse.SecurityGroups.find(sg => 
        sg.GroupName && sg.GroupName.includes('PrivateSecurityGroup')
      );
      expect(privateSg).toBeTruthy();
      
      // Private should only allow SSH from bastion security group
      const privateSSHRule = privateSg.IpPermissions.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(privateSSHRule).toBeTruthy();
      expect(privateSSHRule.UserIdGroupPairs).toHaveLength(1);
      expect(privateSSHRule.UserIdGroupPairs[0].GroupId).toBe(bastionSg.GroupId);
    });
  });

  describe('S3 Bucket Security', () => {
    test('should have KMS encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID).toBeTruthy();
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy denying insecure transport', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      const policy = JSON.parse(response.Policy);
      const denyInsecureStatement = policy.Statement.find(stmt => 
        stmt.Sid === 'DenyInsecureConnections' && 
        stmt.Effect === 'Deny'
      );
      
      expect(denyInsecureStatement).toBeTruthy();
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.Rules).toHaveLength(2);
      
      // Check for incomplete multipart upload cleanup
      const multipartRule = response.Rules.find(rule => 
        rule.Id === 'DeleteIncompleteMultipartUploads'
      );
      expect(multipartRule).toBeTruthy();
      expect(multipartRule?.AbortIncompleteMultipartUpload?.DaysAfterInitiation).toBe(1);
      
      // Check for transition to IA storage class
      const transitionRule = response.Rules.find(rule => 
        rule.Id === 'TransitionToIA'
      );
      expect(transitionRule).toBeTruthy();
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(transitionRule.Transitions[0].Days).toBe(30);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNS topic with KMS encryption', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlertsTopicArn
      });
      const response = await snsClient.send(command);
      
      expect(response.Attributes.DisplayName).toBe('Security and Monitoring Alerts');
      expect(response.Attributes.KmsMasterKeyId).toBeTruthy();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPU alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${environmentSuffix}`
      });
      const response = await cloudWatchClient.send(command);
      
      // Filter for CPU alarms
      const cpuAlarms = response.MetricAlarms.filter(alarm => 
        alarm.MetricName === 'CPUUtilization' && 
        alarm.Namespace === 'AWS/EC2' &&
        alarm.AlarmName.includes(environmentSuffix)
      );
      
      expect(cpuAlarms.length).toBeGreaterThanOrEqual(2);
      
      cpuAlarms.forEach(alarm => {
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions).toContain(outputs.AlertsTopicArn);
      });
    });

    test('should have CloudWatch dashboard accessible', async () => {
      // Verify the dashboard URL is properly formatted
      expect(outputs.SecurityDashboardUrl).toMatch(/^https:\/\/.*\.console\.aws\.amazon\.com\/cloudwatch/);
      expect(outputs.SecurityDashboardUrl).toContain('dashboards:name=security-monitoring-');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should have KMS key with rotation enabled', async () => {
      // Get KMS key from S3 bucket encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      const kmsKeyId = encryptionResponse.ServerSideEncryptionConfiguration.Rules[0]
        .ApplyServerSideEncryptionByDefault.KMSMasterKeyID;
      
      // Check key rotation status
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: kmsKeyId
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
      
      // Describe key to verify it exists and is enabled
      const describeCommand = new DescribeKeyCommand({
        KeyId: kmsKeyId
      });
      const describeResponse = await kmsClient.send(describeCommand);
      
      expect(describeResponse.KeyMetadata.KeyState).toBe('Enabled');
      expect(describeResponse.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have VPC Flow Logs log group with encryption', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/vpc/flowlogs-'
      });
      const response = await logsClient.send(command);
      
      const flowLogGroup = response.logGroups.find(lg => 
        lg.logGroupName.includes(environmentSuffix)
      );
      
      expect(flowLogGroup).toBeTruthy();
      expect(flowLogGroup.retentionInDays).toBe(30);
      expect(flowLogGroup.kmsKeyId).toBeTruthy(); // Should be encrypted with KMS
    });
  });

  describe('End-to-End Security Validation', () => {
    test('should have complete security configuration in place', async () => {
      // This test validates that all major security components are deployed and connected
      
      // 1. VPC exists with proper configuration
      expect(outputs.VpcId).toBeTruthy();
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      
      // 2. Bastion host is accessible
      expect(outputs.BastionHostId).toBeTruthy();
      expect(outputs.BastionHostPublicIp).toBeTruthy();
      expect(outputs.BastionHostPublicIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      
      // 3. Private instance exists but is not publicly accessible
      expect(outputs.PrivateInstanceId).toBeTruthy();
      expect(outputs.PrivateInstanceId).toMatch(/^i-[a-f0-9]+$/);
      
      // 4. S3 bucket is created with security features
      expect(outputs.SecureStorageBucketName).toBeTruthy();
      expect(outputs.SecureStorageBucketName).toContain('secure-storage-');
      
      // 5. SNS topic for alerts is configured
      expect(outputs.AlertsTopicArn).toBeTruthy();
      expect(outputs.AlertsTopicArn).toMatch(/^arn:aws:sns:/);
      
      // 6. Dashboard URL is available
      expect(outputs.SecurityDashboardUrl).toBeTruthy();
      expect(outputs.SecurityDashboardUrl).toContain('cloudwatch');
    });

    test('should enforce network segmentation between public and private subnets', async () => {
      // Get bastion instance details
      const bastionCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.BastionHostId]
      });
      const bastionResponse = await ec2Client.send(bastionCommand);
      const bastionSubnetId = bastionResponse.Reservations[0].Instances[0].SubnetId;
      
      // Get private instance details
      const privateCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstanceId]
      });
      const privateResponse = await ec2Client.send(privateCommand);
      const privateSubnetId = privateResponse.Reservations[0].Instances[0].SubnetId;
      
      // Verify they are in different subnets
      expect(bastionSubnetId).not.toBe(privateSubnetId);
      
      // Get subnet details
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [bastionSubnetId, privateSubnetId]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      const bastionSubnet = subnetResponse.Subnets.find(s => s.SubnetId === bastionSubnetId);
      const privateSubnet = subnetResponse.Subnets.find(s => s.SubnetId === privateSubnetId);
      
      // Bastion should be in public subnet
      expect(bastionSubnet.MapPublicIpOnLaunch).toBe(true);
      
      // Private instance should be in private subnet
      expect(privateSubnet.MapPublicIpOnLaunch).toBe(false);
    });
  });
});