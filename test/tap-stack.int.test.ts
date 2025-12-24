import * as fs from 'fs';
import {
  S3Client,
  GetBucketVersioningCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS clients
const s3Client = new S3Client({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-west-2' });
const iamClient = new IAMClient({ region: 'us-west-2' });

describe('CloudFormation Stack Integration Tests', () => {
  describe('S3 Bucket Tests', () => {
    test('should have S3 bucket created with correct name', async () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toContain('cloud-setup-bucket');
      expect(outputs.S3BucketName).toContain(outputs.EnvironmentSuffix);
    });

    test('should have versioning enabled on S3 bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled on S3 bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access blocked on S3 bucket', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('should be able to upload and list objects in S3 bucket', async () => {
      const testKey = `test-object-${Date.now()}.txt`;
      const testContent = 'Test content for integration test';
      
      // Upload object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);
      
      // List objects
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        Prefix: 'test-object',
      });
      const listResponse = await s3Client.send(listCommand);
      
      expect(listResponse.Contents).toBeDefined();
      const uploadedObject = listResponse.Contents?.find(obj => obj.Key === testKey);
      expect(uploadedObject).toBeDefined();
    });
  });

  describe('EC2 Instance Tests', () => {
    test('should have EC2 instance created and running', async () => {
      expect(outputs.EC2InstanceId).toBeDefined();
      
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations?.[0]?.Instances).toBeDefined();
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      expect(instance?.InstanceId).toBe(outputs.EC2InstanceId);
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.InstanceType).toMatch(/^t3\.(micro|small|medium)$/);
    });

    test('should have EC2 instance with monitoring enabled', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      expect(instance?.Monitoring?.State).toBe('enabled');
    });

    test('should have EC2 instance in correct VPC and subnet', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.SubnetId).toBeDefined();
      
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      expect(instance?.VpcId).toBe(outputs.VPCId);
      expect(instance?.SubnetId).toBe(outputs.SubnetId);
    });

    test('should have EC2 instance with correct tags', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      
      const projectTag = instance?.Tags?.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('CloudSetup');
      
      const nameTag = instance?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain('CloudSetup-Instance');
    });
  });

  describe('Security Group Tests', () => {
    test('should have security group with SSH access from specific IP', async () => {
      expect(outputs.EC2SecurityGroupId).toBeDefined();
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.EC2SecurityGroupId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      const securityGroup = response.SecurityGroups?.[0];
      
      expect(securityGroup?.GroupId).toBe(outputs.EC2SecurityGroupId);
      
      const sshRule = securityGroup?.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpProtocol).toBe('tcp');
      expect(sshRule?.IpRanges).toBeDefined();
    });
  });

  describe('IAM Role Tests', () => {
    test('should have IAM role created for EC2 instance', async () => {
      expect(outputs.IAMRoleArn).toBeDefined();
      
      const roleName = outputs.IAMRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
    });

    test('should have S3 ListBucket permission in IAM role', async () => {
      const roleName = outputs.IAMRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ListBucketPolicy',
      });
      const response = await iamClient.send(command);
      
      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(decodeURIComponent(response.PolicyDocument || '{}'));
      
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement[0]?.Action).toBe('s3:ListBucket');
      expect(policyDoc.Statement[0]?.Effect).toBe('Allow');
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('should have DynamoDB table created with correct name', async () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName).toContain('CloudSetupTable');
      expect(outputs.DynamoDBTableName).toContain(outputs.EnvironmentSuffix);
    });

    test('should have DynamoDB table with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.DynamoDBTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    });

    test('should have DynamoDB table with correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);
      
      const hashKey = response.Table?.KeySchema?.find(key => key.KeyType === 'HASH');
      expect(hashKey).toBeDefined();
      expect(hashKey?.AttributeName).toBe('id');
    });

    test('should be able to write and read from DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;
      const testData = {
        id: { S: testId },
        testField: { S: 'Integration test data' },
        timestamp: { N: Date.now().toString() },
      };
      
      // Put item
      const putCommand = new PutItemCommand({
        TableName: outputs.DynamoDBTableName,
        Item: testData,
      });
      await dynamoClient.send(putCommand);
      
      // Get item
      const getCommand = new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: { id: { S: testId } },
      });
      const getResponse = await dynamoClient.send(getCommand);
      
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id?.S).toBe(testId);
      expect(getResponse.Item?.testField?.S).toBe('Integration test data');
    });
  });

  describe('CloudWatch Alarm Tests', () => {
    test('should have CloudWatch alarm created for CPU utilization', async () => {
      expect(outputs.CloudWatchAlarmName).toBeDefined();
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.CloudWatchAlarmName],
      });
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      
      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe(outputs.CloudWatchAlarmName);
      expect(alarm?.MetricName).toBe('CPUUtilization');
      expect(alarm?.Threshold).toBe(70);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm?.Namespace).toBe('AWS/EC2');
    });

    test('should have CloudWatch alarm associated with correct EC2 instance', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.CloudWatchAlarmName],
      });
      const response = await cloudWatchClient.send(command);
      
      const alarm = response.MetricAlarms?.[0];
      const instanceDimension = alarm?.Dimensions?.find(dim => dim.Name === 'InstanceId');
      expect(instanceDimension?.Value).toBe(outputs.EC2InstanceId);
    });
  });

  describe('Stack Outputs Tests', () => {
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'EC2InstanceId',
        'EC2InstancePublicIP',
        'EC2SecurityGroupId',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'IAMRoleArn',
        'CloudWatchAlarmName',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'SubnetId'
      ];
      
      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('Resource Connectivity Tests', () => {
    test('should verify EC2 instance can access S3 bucket', async () => {
      // Get EC2 instance details
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations?.[0]?.Instances?.[0];
      
      // Verify instance has IAM role attached
      expect(instance?.IamInstanceProfile).toBeDefined();
      expect(instance?.IamInstanceProfile?.Arn).toContain('CloudSetup-EC2Profile');
      
      // Verify IAM role has permission to list S3 bucket
      const roleName = outputs.IAMRoleArn.split('/').pop();
      const roleCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ListBucketPolicy',
      });
      const roleResponse = await iamClient.send(roleCommand);
      const policyDoc = JSON.parse(decodeURIComponent(roleResponse.PolicyDocument || '{}'));
      
      // Check that the policy references the correct bucket
      expect(policyDoc.Statement[0]?.Resource).toContain(outputs.S3BucketArn);
    });
  });
});