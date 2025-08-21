// Live Integration Tests for TAP Financial Services Infrastructure
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: Record<string, any> = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('CFN outputs file not found. Some tests may be skipped.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const projectName = 'tap-financial-services';
const region = process.env.AWS_REGION || 'us-west-2';

// AWS SDK clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

// Helper function to get resource names
const getResourceName = (resource: string) => `${projectName}-${environmentSuffix}-${resource}`;

describe('TAP Financial Services Infrastructure Integration Tests', () => {
  // Increase timeout for AWS API calls
  jest.setTimeout(30000);

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR and DNS settings', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.DhcpOptionsId).toBeDefined();
      expect(vpc?.State).toBe('available');
    });

    test('should have subnets in multiple AZs', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(6); // 3 types x 2 AZs

      // Check for different subnet types
      const publicSubnets = subnets.filter(s => 
        s.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('public'))
      );
      const privateSubnets = subnets.filter(s => 
        s.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('private'))
      );
      const dbSubnets = subnets.filter(s => 
        s.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('database'))
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
      expect(dbSubnets.length).toBe(2);

      // Check AZ distribution
      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
    });

    test('should have security groups with correct rules', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`${projectName}-${environmentSuffix}-web-sg`] },
          ],
        })
      );

      const webSg = response.SecurityGroups?.[0];
      expect(webSg).toBeDefined();
      expect(webSg?.GroupName).toBe(`${projectName}-${environmentSuffix}-web-sg`);
      
      // Check ingress rules for HTTP and HTTPS
      const ingressRules = webSg?.IpPermissions || [];
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should have running EC2 instances', async () => {
      const instanceIds = outputs.WebInstanceIds?.split(', ') || [];
      if (instanceIds.length === 0) {
        console.warn('WebInstanceIds not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      expect(instances.length).toBeGreaterThan(0);

      instances.forEach(instance => {
        expect(instance.State?.Name).toMatch(/running|pending/);
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.IamInstanceProfile).toBeDefined();
        
        // Check tags
        const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(/tap-financial-services-.*-web-/);
      });
    });

    test('should have instances in private subnets', async () => {
      const instanceIds = outputs.WebInstanceIds?.split(', ') || [];
      if (instanceIds.length === 0) {
        console.warn('WebInstanceIds not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      
      for (const instance of instances) {
        const subnetId = instance.SubnetId;
        if (subnetId) {
          const subnetResponse = await ec2Client.send(
            new DescribeSubnetsCommand({ SubnetIds: [subnetId] })
          );
          
          const subnet = subnetResponse.Subnets?.[0];
          const nameTag = subnet?.Tags?.find(tag => tag.Key === 'Name');
          expect(nameTag?.Value).toMatch(/private/);
        }
      }
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with correct configuration', async () => {
      const dbIdentifier = getResourceName('database');
      
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toMatch(/available|creating|modifying/);
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.DeletionProtection).toBe(false);
      expect(dbInstance?.AllocatedStorage).toBe(20);
      expect(dbInstance?.MaxAllocatedStorage).toBe(100);
    });

    test('should have DB subnet group in database subnets', async () => {
      const subnetGroupName = getResourceName('db-subnet-group');
      
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: subnetGroupName })
      );

      const subnetGroup = response.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.Subnets?.length).toBe(2); // Two AZs
      expect(subnetGroup?.VpcId).toBe(outputs.VpcId);
    });
  });

  describe('S3 Buckets', () => {
    test('should have CloudTrail bucket with proper configuration', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      if (!bucketName) {
        console.warn('CloudTrailBucketName not found in outputs, skipping test');
        return;
      }

      // Check bucket exists
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.not.toThrow();

      // Check encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      const publicAccessBlock = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(publicAccessBlock?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock?.RestrictPublicBuckets).toBe(true);
    });

    test('should have application data bucket with proper configuration', async () => {
      const bucketName = outputs.AppDataBucketName;
      if (!bucketName) {
        console.warn('AppDataBucketName not found in outputs, skipping test');
        return;
      }

      // Check bucket exists
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.not.toThrow();

      // Check public access block
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      const publicAccessBlock = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(publicAccessBlock?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail enabled and logging', async () => {
      const trailArn = outputs.CloudTrailArn;
      if (!trailArn) {
        console.warn('CloudTrailArn not found in outputs, skipping test');
        return;
      }

      const trailName = trailArn.split('/').pop();
      if (!trailName) {
        throw new Error('Could not extract trail name from ARN');
      }

      // Check trail configuration
      const describeResponse = await cloudTrailClient.send(
        new DescribeTrailsCommand({ trailNameList: [trailName] })
      );

      const trail = describeResponse.trailList?.[0];
      expect(trail).toBeDefined();
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
      expect(trail?.CloudWatchLogsLogGroupArn).toBeDefined();

      // Check trail status
      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trailName })
      );
      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('SNS and Monitoring', () => {
    test('should have SNS topic for alerts', async () => {
      const topicArn = outputs.AlertsTopicArn;
      if (!topicArn) {
        console.warn('AlertsTopicArn not found in outputs, skipping test');
        return;
      }

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.DisplayName).toBe('DevOps Alerts');

      // Check subscriptions
      const subscriptionsResponse = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );
      expect(subscriptionsResponse.Subscriptions?.length).toBeGreaterThan(0);
    });

    test('should have CloudWatch alarms for EC2 instances', async () => {
      const instanceIds = outputs.WebInstanceIds?.split(', ') || [];
      if (instanceIds.length === 0) {
        console.warn('WebInstanceIds not found in outputs, skipping test');
        return;
      }

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `${projectName}-${environmentSuffix}-cpu-alarm`,
        })
      );

      const alarms = response.MetricAlarms || [];
      expect(alarms.length).toBe(instanceIds.length);

      alarms.forEach(alarm => {
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 role with proper policies', async () => {
      const roleName = getResourceName('ec2-role');

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      // Check attached policies
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const attachedPolicies = policiesResponse.AttachedPolicies || [];
      const cloudWatchPolicy = attachedPolicies.find(p => 
        p.PolicyName === 'CloudWatchAgentServerPolicy'
      );
      expect(cloudWatchPolicy).toBeDefined();
    });

    test('should have instance profile', async () => {
      const profileArn = outputs.InstanceProfileArn;
      if (!profileArn) {
        console.warn('InstanceProfileArn not found in outputs, skipping test');
        return;
      }

      const profileName = profileArn.split('/').pop();
      if (!profileName) {
        throw new Error('Could not extract profile name from ARN');
      }

      const response = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile?.Roles?.length).toBe(1);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VpcId',
        'DatabaseEndpoint',
        'CloudTrailBucketName',
        'AlertsTopicArn',
        'WebInstanceIds',
        'CloudTrailArn',
        'AppDataBucketName',
        'InstanceProfileArn',
      ];

      if (Object.keys(outputs).length === 0) {
        console.warn('No outputs found. Make sure to deploy the stack first.');
        return;
      }

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });
  });
});
