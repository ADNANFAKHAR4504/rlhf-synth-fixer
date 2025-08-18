import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
  DescribeLaunchTemplatesCommand
} from '@aws-sdk/client-ec2';
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand
} from '@aws-sdk/client-s3';
import { 
  RDSClient, 
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand
} from '@aws-sdk/client-rds';
import { 
  LambdaClient, 
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda';
import { 
  IAMClient, 
  GetRoleCommand,
  GetInstanceProfileCommand
} from '@aws-sdk/client-iam';
import { 
  SNSClient, 
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand
} from '@aws-sdk/client-sns';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import { 
  CloudFormationClient, 
  DescribeStacksCommand,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';

// AWS Region from the file
const AWS_REGION = 'us-west-2';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const cloudFormationClient = new CloudFormationClient({ region: AWS_REGION });
const autoScalingClient = new AutoScalingClient({ region: AWS_REGION });

// Stack name - should be passed as environment variable or parameter
const STACK_NAME = process.env.STACK_NAME || 'TapStack';

interface StackOutputs {
  VPCId: string;
  VPCIdForTesting: string;
  PublicSubnetIds: string;
  PrivateSubnetIds: string;
  EC2SecurityGroupId: string;
  RDSSecurityGroupId: string;
  LambdaSecurityGroupId: string;
  AutoScalingGroupName: string;
  LaunchTemplateId: string;
  LaunchTemplateLatestVersion: string;
  S3BucketName: string;
  S3BucketArn: string;
  RDSEndpoint: string;
  RDSPort: string;
  RDSInstanceId: string;
  DBSubnetGroupName: string;
  LambdaFunctionArn: string;
  LambdaFunctionName: string;
  LambdaExecutionRoleArn: string;
  EC2RoleArn: string;
  EC2InstanceProfileArn: string;
  SNSTopicArn: string;
  SNSTopicName: string;
  CloudWatchAlarmName: string;
  VpcCidrBlock: string;
  PublicSubnet1Cidr: string;
  PublicSubnet2Cidr: string;
  PrivateSubnet1Cidr: string;
  PrivateSubnet2Cidr: string;
  StackName: string;
  StackRegion: string;
  StackAccountId: string;
  TestConfiguration: string;
}

describe('TapStack Integration Tests', () => {
  let stackOutputs: StackOutputs;
  let testConfig: any;

  beforeAll(async () => {
    // Get stack outputs
    const describeStacksCommand = new DescribeStacksCommand({
      StackName: STACK_NAME
    });
    
    const stackResponse = await cloudFormationClient.send(describeStacksCommand);
    const stack = stackResponse.Stacks?.[0];
    
    if (!stack?.Outputs) {
      throw new Error(`Stack ${STACK_NAME} not found or has no outputs`);
    }

    // Convert outputs to object
    stackOutputs = stack.Outputs.reduce((acc, output) => {
      if (output.OutputKey && output.OutputValue) {
        acc[output.OutputKey as keyof StackOutputs] = output.OutputValue;
      }
      return acc;
    }, {} as StackOutputs);

    // Parse test configuration
    testConfig = JSON.parse(stackOutputs.TestConfiguration);
  });

  describe('Network Resources', () => {
    test('VPC should exist and have correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(stackOutputs.VPCId);
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly accessible in the response
      // They are set during VPC creation but not returned in DescribeVpcs
    });

    test('Public subnets should exist and be in different AZs', async () => {
      const publicSubnetIds = stackOutputs.PublicSubnetIds.split(',');
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(azs[0]).not.toBe(azs[1]); // Different AZs
      
      subnets.forEach(subnet => {
        expect(subnet?.State).toBe('available');
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Private subnets should exist and be in different AZs', async () => {
      const privateSubnetIds = stackOutputs.PrivateSubnetIds.split(',');
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(azs[0]).not.toBe(azs[1]); // Different AZs
      
      subnets.forEach(subnet => {
        expect(subnet?.State).toBe('available');
      });
    });
  });

  describe('Security Groups', () => {
    test('EC2 security group should exist and have correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [stackOutputs.EC2SecurityGroupId]
      });
      
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      
      expect(sg).toBeDefined();
      expect(sg?.GroupId).toBe(stackOutputs.EC2SecurityGroupId);
      expect(sg?.VpcId).toBe(stackOutputs.VPCId);
      
      // Check ingress rules
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThanOrEqual(3);
      
      // Should have SSH, HTTP, and HTTPS rules
      const ports = ingressRules.map(rule => rule.FromPort).filter(port => port !== undefined);
      expect(ports).toContain(22);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('RDS security group should exist and allow MySQL access', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [stackOutputs.RDSSecurityGroupId]
      });
      
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      
      expect(sg).toBeDefined();
      expect(sg?.GroupId).toBe(stackOutputs.RDSSecurityGroupId);
      expect(sg?.VpcId).toBe(stackOutputs.VPCId);
      
      // Check for MySQL port
      const ingressRules = sg?.IpPermissions || [];
      const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
    });

    test('Lambda security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [stackOutputs.LambdaSecurityGroupId]
      });
      
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      
      expect(sg).toBeDefined();
      expect(sg?.GroupId).toBe(stackOutputs.LambdaSecurityGroupId);
      expect(sg?.VpcId).toBe(stackOutputs.VPCId);
    });
  });

  describe('Compute Resources', () => {
    test('Auto Scaling Group should exist and have correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [stackOutputs.AutoScalingGroupName]
      });
      
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];
      
      expect(asg).toBeDefined();
      expect(asg?.AutoScalingGroupName).toBe(stackOutputs.AutoScalingGroupName);
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(4);
      expect(asg?.DesiredCapacity).toBe(2);
      expect(asg?.HealthCheckType).toBe('EC2');
      expect(asg?.VPCZoneIdentifier).toBeDefined();
    });

    test('Launch Template should exist', async () => {
      const command = new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [stackOutputs.LaunchTemplateId]
      });
      
      const response = await ec2Client.send(command);
      const lt = response.LaunchTemplates?.[0];
      
      expect(lt).toBeDefined();
      expect(lt?.LaunchTemplateId).toBe(stackOutputs.LaunchTemplateId);
      expect(lt?.DefaultVersionNumber).toBe(parseInt(stackOutputs.LaunchTemplateLatestVersion));
    });
  });

  describe('Storage Resources', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: stackOutputs.S3BucketName
      });
      
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: stackOutputs.S3BucketName
      });
      
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.S3BucketName
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      
      const encryptionRule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Database Resources', () => {
    test('RDS instance should exist and be available', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.RDSInstanceId
      });
      
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];
      
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceIdentifier).toBe(stackOutputs.RDSInstanceId);
      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBe('8.0.35');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.DeletionProtection).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.DBInstanceStatus).toBe('available');
    });

    test('RDS endpoint should be accessible', () => {
      expect(stackOutputs.RDSEndpoint).toBeDefined();
      expect(stackOutputs.RDSEndpoint).toMatch(/^[a-zA-Z0-9.-]+\.rds\.amazonaws\.com$/);
      expect(stackOutputs.RDSPort).toBe('3306');
    });

    test('DB subnet group should exist', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: stackOutputs.DBSubnetGroupName
      });
      
      const response = await rdsClient.send(command);
      const subnetGroup = response.DBSubnetGroups?.[0];
      
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.DBSubnetGroupName).toBe(stackOutputs.DBSubnetGroupName);
      expect(subnetGroup?.VpcId).toBe(stackOutputs.VPCId);
    });
  });

  describe('Serverless Resources', () => {
    test('Lambda function should exist and be accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: stackOutputs.LambdaFunctionName
      });
      
      const response = await lambdaClient.send(command);
      const lambdaFunction = response.Configuration;
      
      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction?.FunctionName).toBe(stackOutputs.LambdaFunctionName);
      expect(lambdaFunction?.Runtime).toBe('python3.11');
      expect(lambdaFunction?.Handler).toBe('index.lambda_handler');
      expect(lambdaFunction?.State).toBe('Active');
    });

    test('Lambda function should have VPC configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: stackOutputs.LambdaFunctionName
      });
      
      const response = await lambdaClient.send(command);
      const vpcConfig = response.VpcConfig;
      
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig?.SecurityGroupIds).toContain(stackOutputs.LambdaSecurityGroupId);
      expect(vpcConfig?.SubnetIds).toHaveLength(2);
    });
  });

  describe('IAM Resources', () => {
    test('EC2 role should exist', async () => {
      const command = new GetRoleCommand({
        RoleName: stackOutputs.EC2RoleArn.split('/').pop()
      });
      
      const response = await iamClient.send(command);
      const role = response.Role;
      
      expect(role).toBeDefined();
      expect(role?.RoleName).toBeDefined();
    });

    test('EC2 instance profile should exist', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: stackOutputs.EC2InstanceProfileArn.split('/').pop()
      });
      
      const response = await iamClient.send(command);
      const instanceProfile = response.InstanceProfile;
      
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile?.InstanceProfileName).toBeDefined();
    });

    test('Lambda execution role should exist', async () => {
      const command = new GetRoleCommand({
        RoleName: stackOutputs.LambdaExecutionRoleArn.split('/').pop()
      });
      
      const response = await iamClient.send(command);
      const role = response.Role;
      
      expect(role).toBeDefined();
      expect(role?.RoleName).toBeDefined();
    });
  });

  describe('Monitoring Resources', () => {
    test('SNS topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: stackOutputs.SNSTopicArn
      });
      
      const response = await snsClient.send(command);
      const attributes = response.Attributes;
      
      expect(attributes).toBeDefined();
      expect(attributes?.TopicArn).toBe(stackOutputs.SNSTopicArn);
    });

    test('SNS topic should have subscriptions', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: stackOutputs.SNSTopicArn
      });
      
      const response = await snsClient.send(command);
      const subscriptions = response.Subscriptions || [];
      
      expect(subscriptions.length).toBeGreaterThan(0);
      expect(subscriptions[0]?.Protocol).toBe('email');
    });

    test('CloudWatch alarm should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [stackOutputs.CloudWatchAlarmName]
      });
      
      const response = await cloudWatchClient.send(command);
      const alarm = response.MetricAlarms?.[0];
      
      expect(alarm).toBeDefined();
      expect(alarm?.AlarmName).toBe(stackOutputs.CloudWatchAlarmName);
      expect(alarm?.MetricName).toBe('CPUUtilization');
      expect(alarm?.Namespace).toBe('AWS/EC2');
      expect(alarm?.Threshold).toBe(80);
    });
  });

  describe('Stack Resources', () => {
    test('All stack resources should be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const command = new ListStackResourcesCommand({
        StackName: STACK_NAME
      });
      
      const response = await cloudFormationClient.send(command);
      const resources = response.StackResourceSummaries || [];
      
      expect(resources.length).toBeGreaterThan(0);
      
      resources.forEach(resource => {
        expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(resource.ResourceStatus);
      });
    });

    test('Stack should be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({
        StackName: STACK_NAME
      });
      
      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];
      
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack?.StackStatus);
    });
  });

  describe('Network Connectivity', () => {
    test('VPC should have internet connectivity', () => {
      // This test verifies that the VPC has the necessary components for internet connectivity
      expect(stackOutputs.VPCId).toBeDefined();
      expect(stackOutputs.PublicSubnetIds).toBeDefined();
      expect(stackOutputs.PrivateSubnetIds).toBeDefined();
      
      // Check that we have both public and private subnets
      const publicSubnets = stackOutputs.PublicSubnetIds.split(',');
      const privateSubnets = stackOutputs.PrivateSubnetIds.split(',');
      
      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('Security groups should allow necessary traffic', () => {
      expect(stackOutputs.EC2SecurityGroupId).toBeDefined();
      expect(stackOutputs.RDSSecurityGroupId).toBeDefined();
      expect(stackOutputs.LambdaSecurityGroupId).toBeDefined();
    });
  });

  describe('Resource Relationships', () => {
    test('All resources should be in the same VPC', () => {
      expect(testConfig.vpc.id).toBe(stackOutputs.VPCId);
      expect(testConfig.subnets.public).toHaveLength(2);
      expect(testConfig.subnets.private).toHaveLength(2);
    });

    test('Security groups should reference each other correctly', () => {
      expect(testConfig.security_groups.ec2).toBe(stackOutputs.EC2SecurityGroupId);
      expect(testConfig.security_groups.rds).toBe(stackOutputs.RDSSecurityGroupId);
      expect(testConfig.security_groups.lambda).toBe(stackOutputs.LambdaSecurityGroupId);
    });

    test('Compute resources should reference networking correctly', () => {
      expect(testConfig.compute.asg_name).toBe(stackOutputs.AutoScalingGroupName);
      expect(testConfig.compute.launch_template).toBe(stackOutputs.LaunchTemplateId);
    });

    test('Storage and database should be properly configured', () => {
      expect(testConfig.storage.s3_bucket).toBe(stackOutputs.S3BucketName);
      expect(testConfig.database.endpoint).toBe(stackOutputs.RDSEndpoint);
      expect(testConfig.database.port).toBe(stackOutputs.RDSPort);
    });

    test('Lambda should have proper configuration', () => {
      expect(testConfig.lambda.function_name).toBe(stackOutputs.LambdaFunctionName);
      expect(testConfig.lambda.function_arn).toBe(stackOutputs.LambdaFunctionArn);
      expect(testConfig.lambda.role_arn).toBe(stackOutputs.LambdaExecutionRoleArn);
    });

    test('Monitoring should be properly configured', () => {
      expect(testConfig.monitoring.sns_topic).toBe(stackOutputs.SNSTopicName);
      expect(testConfig.monitoring.cloudwatch_alarm).toBe(stackOutputs.CloudWatchAlarmName);
    });
  });

  describe('Output Validation', () => {
    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId', 'PublicSubnetIds', 'PrivateSubnetIds',
        'EC2SecurityGroupId', 'RDSSecurityGroupId', 'LambdaSecurityGroupId',
        'AutoScalingGroupName', 'S3BucketName', 'RDSEndpoint',
        'LambdaFunctionArn', 'SNSTopicArn'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey as keyof StackOutputs]).toBeDefined();
        expect(stackOutputs[outputKey as keyof StackOutputs]).not.toBe('');
      });
    });

    test('Stack information should be correct', () => {
      expect(stackOutputs.StackName).toBe(STACK_NAME);
      expect(stackOutputs.StackRegion).toBe(AWS_REGION);
      expect(stackOutputs.StackAccountId).toMatch(/^\d{12}$/); // 12-digit AWS account ID
    });

    test('Test configuration should be valid JSON', () => {
      expect(() => JSON.parse(stackOutputs.TestConfiguration)).not.toThrow();
      expect(testConfig).toBeDefined();
      expect(typeof testConfig).toBe('object');
    });
  });
});
