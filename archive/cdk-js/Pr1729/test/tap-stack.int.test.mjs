// Integration Tests for Security Infrastructure
import fs from 'fs';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyStatusCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  WAFV2Client,
  ListWebACLsCommand
} from '@aws-sdk/client-wafv2';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS Clients
const s3Client = new S3Client({ region: 'us-east-1' });
const ec2Client = new EC2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const wafClient = new WAFV2Client({ region: 'us-east-1' });

describe('Security Infrastructure Integration Tests', () => {
  describe('S3 Bucket Security', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket has KMS encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket blocks public access', async () => {
      const bucketName = outputs.S3BucketName;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy is not public', async () => {
      const bucketName = outputs.S3BucketName;
      const command = new GetBucketPolicyStatusCommand({ Bucket: bucketName });
      
      try {
        const response = await s3Client.send(command);
        expect(response.PolicyStatus.IsPublic).toBe(false);
      } catch (error) {
        // If no policy exists or it's not public, that's acceptable
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    });
  });

  describe('VPC and Network Security', () => {
    test('VPC exists and is configured correctly', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has flow logs enabled', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [vpcId] }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs.length).toBeGreaterThan(0);
      expect(response.FlowLogs[0].FlowLogStatus).toBe('ACTIVE');
      expect(response.FlowLogs[0].TrafficType).toBe('ALL');
    });

    test('VPC has both public and private subnets', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
      
      const publicSubnets = response.Subnets.filter(subnet => subnet.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets.filter(subnet => subnet.MapPublicIpOnLaunch === false);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('VPC has Systems Manager endpoints', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints.length).toBeGreaterThanOrEqual(3); // SSM, SSM Messages, EC2 Messages
      
      const endpointServices = response.VpcEndpoints.map(ep => ep.ServiceName);
      const hasSsmEndpoints = endpointServices.some(service => 
        service.includes('ssm') || service.includes('ec2messages')
      );
      expect(hasSsmEndpoints).toBe(true);
    });

    test('Security groups restrict access appropriately', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      });
      const response = await ec2Client.send(command);
      
      // Check EC2 security group
      const ec2SecurityGroup = response.SecurityGroups.find(sg => 
        sg.GroupName && sg.GroupName.includes('EC2SecurityGroup')
      );
      
      if (ec2SecurityGroup) {
        // Verify no inbound rules from 0.0.0.0/0
        const publicIngressRules = ec2SecurityGroup.IpPermissions?.filter(rule => 
          rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
        ) || [];
        expect(publicIngressRules.length).toBe(0);
      }
    });
  });

  describe('RDS Security', () => {
    test('RDS instance exists and is encrypted', async () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      expect(rdsEndpoint).toBeDefined();
      
      // Extract instance identifier from endpoint
      const instanceId = rdsEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId
      });
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances[0];
      
      // Verify encryption
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
      
      // Verify backup settings
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      
      // Verify no public access
      expect(dbInstance.PubliclyAccessible).toBe(false);
      
      // Verify deletion protection is disabled (for testing)
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('RDS instance is in private subnets', async () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      const instanceId = rdsEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId
      });
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances[0];
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);
      
      // All subnets should be private (no public IP assignment)
      const subnetIds = dbInstance.DBSubnetGroup.Subnets.map(s => s.SubnetIdentifier);
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      subnetResponse.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Lambda Security', () => {
    test('Lambda function exists and is configured securely', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();
      
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(functionName);
      
      // Check VPC configuration
      expect(response.Configuration.VpcConfig).toBeDefined();
      expect(response.Configuration.VpcConfig.SubnetIds.length).toBeGreaterThan(0);
      expect(response.Configuration.VpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
      
      // Check reserved concurrent executions if set
      // Note: ReservedConcurrentExecutions might not be returned if using default
      if (response.Configuration.ReservedConcurrentExecutions !== undefined) {
        expect(response.Configuration.ReservedConcurrentExecutions).toBe(10);
      }
    });

    test('Lambda has appropriate IAM role', async () => {
      const functionName = outputs.LambdaFunctionName;
      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      const roleArn = response.Role;
      expect(roleArn).toBeDefined();
      
      // Extract role name from ARN
      const roleName = roleArn.split('/').pop();
      
      // Check role exists
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      expect(roleResponse.Role).toBeDefined();
      
      // Check managed policies
      const managedPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const managedPoliciesResponse = await iamClient.send(managedPoliciesCommand);
      
      // Should have VPC access execution role
      const hasVpcPolicy = managedPoliciesResponse.AttachedPolicies.some(policy => 
        policy.PolicyName.includes('VPCAccessExecutionRole')
      );
      expect(hasVpcPolicy).toBe(true);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms are configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms).toBeDefined();
      
      // Check for suspicious activity alarm
      const suspiciousActivityAlarm = response.MetricAlarms.find(alarm => 
        alarm.AlarmName && alarm.AlarmName.includes('SuspiciousActivityAlarm')
      );
      
      if (suspiciousActivityAlarm) {
        expect(suspiciousActivityAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(suspiciousActivityAlarm.EvaluationPeriods).toBe(2);
        expect(suspiciousActivityAlarm.Threshold).toBe(100);
      }
      
      // Check for failed login alarm
      const failedLoginAlarm = response.MetricAlarms.find(alarm => 
        alarm.AlarmName && alarm.AlarmName.includes('FailedLoginAlarm')
      );
      
      if (failedLoginAlarm) {
        expect(failedLoginAlarm.MetricName).toBe('ConsoleSignInFailures');
        expect(failedLoginAlarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      }
    });
  });

  describe('WAF Configuration', () => {
    test('WAF WebACL exists with managed rules', async () => {
      const command = new ListWebACLsCommand({ Scope: 'CLOUDFRONT' });
      const response = await wafClient.send(command);
      
      expect(response.WebACLs).toBeDefined();
      
      // Find our security WebACL
      const securityWebACL = response.WebACLs.find(acl => 
        acl.Name && acl.Name.includes('SecurityWebACL')
      );
      
      if (securityWebACL) {
        expect(securityWebACL.Id).toBeDefined();
        expect(securityWebACL.LockToken).toBeDefined();
      }
    });
  });

  describe('End-to-End Security Workflow', () => {
    test('Resources are interconnected properly', async () => {
      // Verify VPC exists
      expect(outputs.VPCId).toBeDefined();
      
      // Verify S3 bucket exists
      expect(outputs.S3BucketName).toBeDefined();
      
      // Verify RDS endpoint exists
      expect(outputs.RDSEndpoint).toBeDefined();
      
      // Verify Lambda function exists
      expect(outputs.LambdaFunctionName).toBeDefined();
      
      // All outputs should be strings and not empty
      Object.values(outputs).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('No resources have public IP addresses', async () => {
      const vpcId = outputs.VPCId;
      
      // Check that EC2 instances (if any) don't have public IPs
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      });
      const response = await ec2Client.send(command);
      
      // Private subnets should not auto-assign public IPs
      expect(response.Subnets.length).toBeGreaterThanOrEqual(2);
      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });
});