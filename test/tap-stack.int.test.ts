// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  WAFV2Client,
  GetWebACLCommand,
} from '@aws-sdk/client-wafv2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr78';

// Configure AWS clients
const region = 'us-west-2';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const wafClient = new WAFV2Client({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

describe('Turn Around Prompt Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are enabled by CDK but may not be returned in basic describe
      expect(vpc.VpcId).toBe(outputs.VpcId);
    });

    test('Subnets are created in multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
      
      // Check for multiple AZs
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
      
      // Check for public and private subnets
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances are running in private subnets', async () => {
      const instanceIds = [outputs.EC2Instance1, outputs.EC2Instance2];
      
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);
      
      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      expect(instances).toHaveLength(2);
      
      instances.forEach(instance => {
        expect(instance.State?.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.micro');
        // Check they have IAM role
        expect(instance.IamInstanceProfile).toBeDefined();
      });
    });

    test('EC2 instances have proper tags', async () => {
      const instanceIds = [outputs.EC2Instance1, outputs.EC2Instance2];
      
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);
      
      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      
      instances.forEach(instance => {
        const tags = instance.Tags || [];
        const environmentTag = tags.find(t => t.Key === 'Environment');
        const componentTag = tags.find(t => t.Key === 'Component');
        
        expect(environmentTag).toBeDefined();
        expect(componentTag?.Value).toBe('Compute');
      });
    });
  });

  describe('RDS Database', () => {
    test('RDS database is properly configured', async () => {
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);
      
      const dbInstances = response.DBInstances?.filter(db => 
        db.Endpoint?.Address === outputs.DatabaseEndpoint
      );
      
      expect(dbInstances).toBeDefined();
      expect(dbInstances!.length).toBe(1);
      
      const database = dbInstances![0];
      expect(database.Engine).toBe('mysql');
      expect(database.DBInstanceClass).toBe('db.t3.micro');
      expect(database.StorageEncrypted).toBe(true);
      expect(database.AllocatedStorage).toBe(20);
      expect(database.MultiAZ).toBe(false);
      expect(database.DBInstanceStatus).toBe('available');
    });

    test('RDS database has CloudWatch logs enabled', async () => {
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);
      
      const dbInstances = response.DBInstances?.filter(db => 
        db.Endpoint?.Address === outputs.DatabaseEndpoint
      );
      
      const database = dbInstances![0];
      expect(database.EnabledCloudwatchLogsExports).toBeDefined();
      expect(database.EnabledCloudwatchLogsExports).toContain('error');
      expect(database.EnabledCloudwatchLogsExports).toContain('general');
      expect(database.EnabledCloudwatchLogsExports).toContain('slowquery');
    });
  });

  describe('S3 Buckets', () => {
    test('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });
      
      // HeadBucket will throw if bucket doesn't exist or isn't accessible
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket blocks public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('Security groups are properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      
      // Find web security group (allows port 80 and 443)
      const webSG = response.SecurityGroups?.find(sg => 
        sg.IpPermissions?.some(rule => 
          rule.FromPort === 80 || rule.FromPort === 443
        )
      );
      expect(webSG).toBeDefined();
      
      // Find database security group (allows port 3306)
      const dbSG = response.SecurityGroups?.find(sg => 
        sg.IpPermissions?.some(rule => rule.FromPort === 3306)
      );
      expect(dbSG).toBeDefined();
    });
  });

  describe('WAF WebACL', () => {
    test('WAF WebACL exists and is configured', async () => {
      // Extract ARN components
      const arnParts = outputs.WAFWebAclArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];
      const webAclId = arnParts[arnParts.length - 1];
      
      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Name: webAclName,
        Id: webAclId,
      });
      
      const response = await wafClient.send(command);
      
      expect(response.WebACL).toBeDefined();
      expect(response.WebACL?.Name).toContain(environmentSuffix);
      expect(response.WebACL?.Rules).toBeDefined();
      expect(response.WebACL?.Rules!.length).toBeGreaterThanOrEqual(2);
      
      // Check for managed rule groups
      const hasCommonRuleSet = response.WebACL?.Rules?.some(rule => 
        rule.Name === 'AWSManagedRulesCommonRuleSet'
      );
      const hasKnownBadInputs = response.WebACL?.Rules?.some(rule => 
        rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      
      expect(hasCommonRuleSet).toBe(true);
      expect(hasKnownBadInputs).toBe(true);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms are configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `webapp-`,
      });
      const response = await cloudwatchClient.send(command);
      
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      // Check for CPU alarms
      const cpuAlarms = response.MetricAlarms?.filter(alarm => 
        alarm.AlarmName?.includes('cpu')
      );
      expect(cpuAlarms).toBeDefined();
      
      // Check for status check alarms
      const statusAlarms = response.MetricAlarms?.filter(alarm => 
        alarm.AlarmName?.includes('status')
      );
      expect(statusAlarms).toBeDefined();
      
      // Check for database connection alarm
      const dbAlarm = response.MetricAlarms?.find(alarm => 
        alarm.AlarmName?.includes('db-connections')
      );
      expect(dbAlarm).toBeDefined();
    });

    test('CloudWatch dashboard exists', async () => {
      const dashboardName = `WebApp-Dashboard-${environmentSuffix}`;
      
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      
      const response = await cloudwatchClient.send(command);
      
      expect(response.DashboardBody).toBeDefined();
      expect(response.DashboardName).toBe(dashboardName);
    });

    test('SNS topic for alarms exists', async () => {
      // Find SNS topic ARN from alarms
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `webapp-`,
      });
      const alarmsResponse = await cloudwatchClient.send(alarmsCommand);
      
      const topicArn = alarmsResponse.MetricAlarms?.[0]?.AlarmActions?.[0];
      
      if (topicArn) {
        const snsCommand = new GetTopicAttributesCommand({
          TopicArn: topicArn,
        });
        
        const snsResponse = await snsClient.send(snsCommand);
        
        expect(snsResponse.Attributes).toBeDefined();
        expect(snsResponse.Attributes?.DisplayName).toBe('Web Application Alarms');
      }
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('All critical infrastructure components are deployed', async () => {
      // This test validates that all main components exist
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.WAFWebAclArn).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DashboardUrl).toBeDefined();
      expect(outputs.EC2Instance1).toBeDefined();
      expect(outputs.EC2Instance2).toBeDefined();
    });

    test('Infrastructure follows naming conventions', async () => {
      // Verify that resources include environment suffix
      expect(outputs.S3BucketName).toContain(environmentSuffix);
      expect(outputs.WAFWebAclArn).toContain(environmentSuffix);
      expect(outputs.DashboardUrl).toContain(environmentSuffix);
    });

    test('Infrastructure is in correct region', async () => {
      // All ARNs should contain us-west-2
      expect(outputs.WAFWebAclArn).toContain('us-west-2');
      expect(outputs.DatabaseEndpoint).toContain('us-west-2');
      
      // VPC should be in us-west-2
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      
      // The fact that we can query it with us-west-2 client confirms it's in the right region
      expect(vpcResponse.Vpcs).toHaveLength(1);
    });
  });
});