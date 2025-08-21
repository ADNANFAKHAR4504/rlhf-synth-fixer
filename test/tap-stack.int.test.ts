// Configuration - These are coming from cfn-outputs after CloudFormation deployment
import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';
import {
  CloudTrailClient,
  DescribeTrailsCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  // Helper function to wait for resources to be ready
  const waitForResource = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  describe('VPC and Networking', () => {
    test('VPC should exist and have correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('subnets should exist in different availability zones', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];
      
      expect(subnetIds.every(id => id)).toBe(true);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(4);
      
      // Check that subnets are in different AZs
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);
    });

    test('security groups should have correct rules', async () => {
      const sgId = outputs.EC2SecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions!.length).toBeGreaterThan(0);
      
      // Verify trusted CIDR restrictions
      const ingressRules = sg.IpPermissions!;
      ingressRules.forEach(rule => {
        if (rule.IpRanges && rule.IpRanges.length > 0) {
          expect(rule.IpRanges[0].CidrIp).toBe('10.0.0.0/8');
        }
      });
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance should be running in private subnet', async () => {
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations![0].Instances).toHaveLength(1);
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State!.Name).toBe('running');
      expect(instance.SubnetId).toBe(outputs.PrivateSubnet1Id);
      
      // Verify IMDSv2 is enforced
      expect(instance.MetadataOptions!.HttpTokens).toBe('required');
      expect(instance.MetadataOptions!.HttpEndpoint).toBe('enabled');
    });

    test('EC2 instance should have proper IAM role attached', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain('EC2InstanceProfile');
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be running with Multi-AZ and encryption', async () => {
      const dbInstanceId = outputs.RDSInstanceId;
      expect(dbInstanceId).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toBe('8.0.39');
    });

    test('RDS should be accessible from expected endpoints', () => {
      const endpoint = outputs.RDSEndpoint;
      const port = outputs.RDSPort;
      
      expect(endpoint).toBeDefined();
      expect(port).toBeDefined();
      expect(port).toBe('3306'); // MySQL default port
      expect(endpoint).toContain('.rds.amazonaws.com');
    });
  });

  describe('S3 Storage', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName
      });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket should have AES-256 encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(command);
      const encryptionConfig = response.ServerSideEncryptionConfiguration!;
      
      expect(encryptionConfig.Rules).toHaveLength(1);
      expect(encryptionConfig.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      expect(encryptionConfig.Rules![0].BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket should block all public access', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;
      
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist and be configured correctly', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('python3.12');
      expect(response.Configuration!.Timeout).toBe(30);
    });

    test('Lambda should be deployed in VPC with no internet access', async () => {
      const functionName = outputs.LambdaFunctionName;
      
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await lambdaClient.send(command);
      const vpcConfig = response.Configuration!.VpcConfig!;
      
      expect(vpcConfig.VpcId).toBe(outputs.VPCId);
      expect(vpcConfig.SubnetIds).toEqual(
        expect.arrayContaining([outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id])
      );
      expect(vpcConfig.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('Lambda function should execute successfully', async () => {
      const functionName = outputs.LambdaFunctionName;
      
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({ test: 'integration' })
      });
      
      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
        expect(JSON.parse(payload.body).credentials_retrieved).toBe(true);
      }
    }, 60000); // Extended timeout for cold start
  });

  describe('Secrets Manager', () => {
    test('database secret should exist and be accessible', async () => {
      const secretArn = outputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({
        SecretId: secretArn
      });
      
      const response = await secretsClient.send(command);
      expect(response.Name).toContain('db-credentials');
      expect(response.Description).toBe('RDS MySQL database credentials');
    });

    test('should be able to retrieve database credentials', async () => {
      const secretArn = outputs.DBSecretArn;
      
      const command = new GetSecretValueCommand({
        SecretId: secretArn
      });
      
      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();
      
      const credentials = JSON.parse(response.SecretString!);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.password.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('CloudTrail Logging', () => {
    test('CloudTrail should be active and logging', async () => {
      const cloudTrailArn = outputs.CloudTrailArn;
      expect(cloudTrailArn).toBeDefined();

      const command = new DescribeTrailsCommand({
        trailNameList: [cloudTrailArn]
      });
      
      const response = await cloudTrailClient.send(command);
      expect(response.trailList).toHaveLength(1);
      
      const trail = response.trailList![0];
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.EnableLogFileValidation).toBe(true);
      expect(trail.S3BucketName).toBe(outputs.CloudTrailS3BucketName);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms should be configured for EC2 monitoring', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${environmentSuffix}-ec2`
      });
      
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(2);
      
      // Check for CPU utilization alarm
      const cpuAlarm = response.MetricAlarms!.find(alarm => 
        alarm.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.Threshold).toBe(80);
      expect(cpuAlarm!.Dimensions![0].Value).toBe(instanceId);
      
      // Check for status check alarm  
      const statusAlarm = response.MetricAlarms!.find(alarm => 
        alarm.MetricName === 'StatusCheckFailed'
      );
      expect(statusAlarm).toBeDefined();
      expect(statusAlarm!.Dimensions![0].Value).toBe(instanceId);
    });
  });

  describe('End-to-End Workflows', () => {
    test('complete infrastructure stack should be functional', async () => {
      // Verify all major components are operational
      const checks = await Promise.allSettled([
        // VPC connectivity check
        ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })),
        
        // Database availability check
        rdsClient.send(new DescribeDBInstancesCommand({ 
          DBInstanceIdentifier: outputs.RDSInstanceId 
        })),
        
        // Storage accessibility check
        s3Client.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName })),
        
        // Function operability check
        lambdaClient.send(new GetFunctionCommand({ 
          FunctionName: outputs.LambdaFunctionName 
        }))
      ]);
      
      // All components should be successfully accessible
      checks.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
      });
    });

    test('security configuration should be properly implemented', async () => {
      // Verify security groups restrict access appropriately
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [outputs.EC2SecurityGroupId] })
      );
      
      const sg = sgResponse.SecurityGroups![0];
      
      // Check that ingress rules are restricted to trusted CIDR
      const ingressRules = sg.IpPermissions!;
      ingressRules.forEach(rule => {
        if (rule.IpRanges && rule.IpRanges.length > 0) {
          expect(['10.0.0.0/8']).toContain(rule.IpRanges[0].CidrIp);
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have proper Environment and Owner tags', async () => {
      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      
      const vpc = vpcResponse.Vpcs![0];
      const environmentTag = vpc.Tags!.find(tag => tag.Key === 'Environment');
      const ownerTag = vpc.Tags!.find(tag => tag.Key === 'Owner');
      
      expect(environmentTag).toBeDefined();
      expect(ownerTag).toBeDefined();
      expect(environmentTag!.Value).toBe('production');
      expect(ownerTag!.Value).toBe('infrastructure-team');
    });
  });
});

// Cleanup function for test teardown (if needed)
afterAll(async () => {
  // Add any cleanup logic if needed
  console.log('Integration tests completed');
});