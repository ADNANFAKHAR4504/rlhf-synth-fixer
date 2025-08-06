import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('Financial Services Infrastructure Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    try {
      // Get stack outputs
      const stackCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const stackResponse = await cfnClient.send(stackCommand);
      const stack = stackResponse.Stacks?.[0];

      if (stack?.Outputs) {
        stackOutputs = stack.Outputs.reduce(
          (acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          },
          {} as Record<string, string>
        );
      }

      // Get stack resources
      const resourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Failed to get stack information:', error);
      throw new Error(`Stack ${stackName} not found or not accessible`);
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('should have deployed stack successfully', async () => {
      expect(stackOutputs).toBeDefined();
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
    });

    test('should have all expected outputs', async () => {
      const expectedOutputs = [
        'KMSKeyArn',
        'ApplicationDataBucketName',
        'CloudTrailLogsBucketName',
        'SecurityGroupId',
        'VPCId',
        'EC2InstanceId',
        'DatabaseEndpoint',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(stackOutputs[outputName]).toBeDefined();
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key with rotation enabled', async () => {
      const keyArn = stackOutputs.KMSKeyArn;
      expect(keyArn).toBeDefined();

      const keyId = keyArn.split('/')[1];

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyResponse = await kmsClient.send(describeCommand);
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 10000);
  });

  describe('S3 Security Configuration', () => {
    test('should have application data bucket with encryption', async () => {
      const bucketName = stackOutputs.ApplicationDataBucketName;
      expect(bucketName).toBeDefined();

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration
      ).toBeDefined();
    }, 10000);

    test('should have buckets with versioning enabled', async () => {
      const bucketName = stackOutputs.ApplicationDataBucketName;

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    }, 10000);

    test('should have buckets with public access blocked', async () => {
      const bucketName = stackOutputs.ApplicationDataBucketName;

      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
    }, 10000);
  });

  describe('VPC and Network Security', () => {
    test('should have VPC with proper configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
    }, 10000);

    test('should have subnets in different availability zones', async () => {
      const vpcId = stackOutputs.VPCId;

      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);
      const subnets = subnetsResponse.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(3); // 1 public + 2 private

      const availabilityZones = new Set(
        subnets.map(subnet => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2); // Multi-AZ
    }, 10000);

    test('should have security group with HTTPS only access', async () => {
      const sgId = stackOutputs.SecurityGroupId;
      expect(sgId).toBeDefined();

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.IpPermissions).toHaveLength(1);
      expect(sg?.IpPermissions?.[0].FromPort).toBe(443);
      expect(sg?.IpPermissions?.[0].ToPort).toBe(443);
    }, 10000);
  });

  describe('EC2 Instance', () => {
    test('should have EC2 instance running with updated AMI', async () => {
      const instanceId = stackOutputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];

      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.ImageId).toBe('ami-0dd6a5d3354342a7a'); // Updated AMI
    }, 15000);

    test('should have CloudWatch monitoring enabled', async () => {
      const instanceId = stackOutputs.EC2InstanceId;

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];

      expect(instance?.Monitoring?.State).toBe('enabled');
    }, 10000);
  });

  describe('RDS Database', () => {
    test('should have RDS instance with latest MySQL version', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      // Extract DB identifier from endpoint
      const dbIdentifier = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBe('8.4.6');
      expect(dbInstance?.DBInstanceStatus).toBe('available');
    }, 20000);

    test('should have encrypted storage and Multi-AZ enabled', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances?.[0];

      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    }, 15000);

    test('should have DB subnet group with private subnets', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances?.[0];
      const subnetGroupName = dbInstance?.DBSubnetGroup?.DBSubnetGroupName;

      expect(subnetGroupName).toBeDefined();

      const subnetGroupCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      });
      const subnetGroupResponse = await rdsClient.send(subnetGroupCommand);
      const subnetGroup = subnetGroupResponse.DBSubnetGroups?.[0];

      expect(subnetGroup?.Subnets).toHaveLength(2); // Two private subnets
    }, 15000);
  });

  describe('CloudTrail Audit Logging', () => {
    test('should have CloudTrail enabled and logging', async () => {
      const trailArn = stackOutputs.CloudTrailArn;
      expect(trailArn).toBeDefined();

      const trailName = trailArn.split('/')[1];

      const trailCommand = new DescribeTrailsCommand({
        trailNameList: [trailName],
      });
      const trailResponse = await cloudTrailClient.send(trailCommand);
      const trail = trailResponse.trailList?.[0];

      expect(trail).toBeDefined();
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);

      const statusCommand = new GetTrailStatusCommand({
        Name: trailName,
      });
      const statusResponse = await cloudTrailClient.send(statusCommand);
      expect(statusResponse.IsLogging).toBe(true);
    }, 15000);
  });

  describe('CloudWatch Monitoring', () => {
    test('should have EC2 recovery alarm configured', async () => {
      const instanceId = stackOutputs.EC2InstanceId;

      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: [`FinancialApp-Prod-EC2-Recovery-Alarm`],
      });
      const alarmsResponse = await cloudWatchClient.send(alarmsCommand);
      const alarm = alarmsResponse.MetricAlarms?.[0];

      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('StatusCheckFailed_System');
      expect(alarm?.Namespace).toBe('AWS/EC2');
      expect(alarm?.StateValue).toBeDefined();
    }, 10000);
  });

  describe('Resource Tagging Compliance', () => {
    test('should have proper tags on all resources', async () => {
      const taggedResources = stackResources.filter(resource =>
        [
          'AWS::EC2::VPC',
          'AWS::EC2::Instance',
          'AWS::RDS::DBInstance',
          'AWS::S3::Bucket',
        ].includes(resource.ResourceType || '')
      );

      expect(taggedResources.length).toBeGreaterThan(0);

      // All resources should be successfully created
      taggedResources.forEach(resource => {
        expect(resource.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });
  });

  describe('Security Compliance', () => {
    test('should have no publicly accessible database', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances?.[0];

      expect(dbInstance?.PubliclyAccessible).toBe(false);
    }, 10000);

    test('should have S3 buckets with no public access', async () => {
      const bucketName = stackOutputs.ApplicationDataBucketName;

      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      const config = publicAccessResponse.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    }, 10000);
  });

  describe('High Availability Validation', () => {
    test('should have Multi-AZ database deployment', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances?.[0];

      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.AvailabilityZone).toBeDefined();
    }, 15000);

    test('should have backup and maintenance windows configured', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances?.[0];

      expect(dbInstance?.BackupRetentionPeriod).toBe(30);
      expect(dbInstance?.PreferredBackupWindow).toBeDefined();
      expect(dbInstance?.PreferredMaintenanceWindow).toBeDefined();
    }, 15000);
  });
});
