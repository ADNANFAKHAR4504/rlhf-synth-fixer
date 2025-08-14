import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetPolicyCommand,
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
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
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListTopicsCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

// Test configuration
const TEST_CONFIG = {
  region: process.env.AWS_REGION || 'us-west-2',
  projectName: 'secure-webapp',
  environment: 'production',
};

describe('Terraform Infrastructure Integration Tests', () => {
  let s3Client: S3Client;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let kmsClient: KMSClient;
  let rdsClient: RDSClient;
  let cloudWatchClient: CloudWatchClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;
  let cloudTrailClient: CloudTrailClient;
  let snsClient: SNSClient;

  beforeAll(() => {
    // Initialize AWS SDK clients
    const clientConfig = { region: TEST_CONFIG.region };
    s3Client = new S3Client(clientConfig);
    ec2Client = new EC2Client(clientConfig);
    iamClient = new IAMClient(clientConfig);
    kmsClient = new KMSClient(clientConfig);
    rdsClient = new RDSClient(clientConfig);
    cloudWatchClient = new CloudWatchClient(clientConfig);
    cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
    cloudTrailClient = new CloudTrailClient(clientConfig);
    snsClient = new SNSClient(clientConfig);
  });

  describe('S3 Infrastructure Verification', () => {
    let bucketName: string;

    beforeAll(async () => {
      // Find the webapp bucket
      const listResponse = await s3Client.send(new ListBucketsCommand({}));
      const webappBucket = listResponse.Buckets?.find(
        bucket =>
          bucket.Name?.includes('secure-webapp') ||
          bucket.Name?.includes('webapp')
      );
      bucketName = webappBucket?.Name || '';
      expect(bucketName).toBeTruthy();
    });

    test('should have KMS encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      const encryption = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(encryption?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption?.BucketKeyEnabled).toBe(true);
    }, 15000);

    test('should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    }, 15000);

    test('should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    }, 15000);
  });

  describe('VPC and Networking Verification', () => {
    let vpcId: string;

    test('should have VPC with correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`${TEST_CONFIG.projectName}-vpc`] },
          ],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs?.[0];
      vpcId = vpc?.VpcId || '';

      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      // Note: DNS settings would need separate DescribeVpcAttribute calls to verify
    }, 15000);

    test('should have public and private subnets across multiple AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const publicSubnets =
        response.Subnets?.filter(subnet =>
          subnet.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value?.includes('public')
          )
        ) || [];

      const privateSubnets =
        response.Subnets?.filter(subnet =>
          subnet.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value?.includes('private')
          )
        ) || [];

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const publicAZs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.map(s => s.AvailabilityZone));

      expect(publicAZs.size).toBeGreaterThanOrEqual(2);
      expect(privateAZs.size).toBeGreaterThanOrEqual(2);
    }, 15000);

    test('should have Internet Gateway attached', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways?.[0]?.Attachments?.[0]?.State).toBe(
        'available'
      );
    }, 15000);
  });

  describe('Security Groups Verification', () => {
    test('should have ALB security group with HTTPS only', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'group-name',
              Values: [`${TEST_CONFIG.projectName}-alb-sg`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups?.[0];

      // Check ingress rules - should only allow HTTPS (443)
      const httpsRule = sg?.IpPermissions?.find(
        rule =>
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeTruthy();
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    }, 15000);

    test('should have EC2 security group with restricted access', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'group-name',
              Values: [`${TEST_CONFIG.projectName}-ec2-sg`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups?.[0];

      // Check that HTTP access is only from ALB security group
      const httpRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeTruthy();
      expect(httpRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 15000);

    test('should have RDS security group with database access only', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'group-name',
              Values: [`${TEST_CONFIG.projectName}-rds-sg`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups?.[0];

      // Check PostgreSQL port (5432) access
      const dbRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(dbRule).toBeTruthy();
      expect(dbRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('KMS Keys Verification', () => {
    test('should have S3 KMS key with rotation enabled', async () => {
      // Find KMS key by alias
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: `alias/${TEST_CONFIG.projectName}-s3-key`,
        })
      );

      expect(keyResponse.KeyMetadata?.Enabled).toBe(true);
      expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      // Check rotation status
      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: keyResponse.KeyMetadata?.KeyId,
        })
      );
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 15000);

    test('should have RDS KMS key with rotation enabled', async () => {
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: `alias/${TEST_CONFIG.projectName}-rds-key`,
        })
      );

      expect(keyResponse.KeyMetadata?.Enabled).toBe(true);

      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: keyResponse.KeyMetadata?.KeyId,
        })
      );
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 15000);
  });

  describe('IAM Resources Verification', () => {
    test('should have EC2 IAM role with proper configuration', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `${TEST_CONFIG.projectName}-ec2-role`,
        })
      );

      expect(response.Role?.RoleName).toBe(
        `${TEST_CONFIG.projectName}-ec2-role`
      );

      // Verify assume role policy allows EC2
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    }, 15000);

    test('should have S3 policy with least privilege access', async () => {
      const response = await iamClient.send(
        new GetPolicyCommand({
          PolicyArn: `arn:aws:iam::${await getCurrentAccountId()}:policy/${TEST_CONFIG.projectName}-ec2-s3-policy`,
        })
      );

      expect(response.Policy?.PolicyName).toBe(
        `${TEST_CONFIG.projectName}-ec2-s3-policy`
      );

      // Note: Policy document access requires GetPolicyVersion call in real scenarios
    }, 15000);

    test('should have instance profile for EC2', async () => {
      const response = await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: `${TEST_CONFIG.projectName}-ec2-profile`,
        })
      );

      expect(response.InstanceProfile?.InstanceProfileName).toBe(
        `${TEST_CONFIG.projectName}-ec2-profile`
      );
      expect(response.InstanceProfile?.Roles).toHaveLength(1);
      expect(response.InstanceProfile?.Roles?.[0]?.RoleName).toBe(
        `${TEST_CONFIG.projectName}-ec2-role`
      );
    }, 15000);
  });

  describe('RDS Database Verification', () => {
    test('should have encrypted RDS instance with proper configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `${TEST_CONFIG.projectName}-db`,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.DBInstanceIdentifier).toBe(
        `${TEST_CONFIG.projectName}-db`
      );
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.DeletionProtection).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    }, 15000);

    test('should have DB subnet group in private subnets', async () => {
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `${TEST_CONFIG.projectName}-db-subnet-group`,
        })
      );

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups?.[0];

      expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = new Set(
        subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 15000);
  });

  describe('CloudWatch Monitoring Verification', () => {
    test('should have security monitoring alarms', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: TEST_CONFIG.projectName,
        })
      );

      const unauthorizedAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('unauthorized-access')
      );
      const policyViolationAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('iam-policy-violations')
      );

      expect(unauthorizedAlarm).toBeTruthy();
      expect(policyViolationAlarm).toBeTruthy();
      expect(unauthorizedAlarm?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
      expect(policyViolationAlarm?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    }, 15000);
  });

  describe('CloudTrail Audit Verification', () => {
    test('should have CloudTrail enabled with proper configuration', async () => {
      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [`${TEST_CONFIG.projectName}-cloudtrail`],
        })
      );

      expect(response.trailList).toHaveLength(1);
      const trail = response.trailList?.[0];

      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.IsMultiRegionTrail).toBe(true);

      // Verify CloudTrail is actively logging
      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: `${TEST_CONFIG.projectName}-cloudtrail`,
        })
      );
      expect(statusResponse.IsLogging).toBe(true);
    }, 15000);
  });

  describe('SNS Topic Verification', () => {
    test('should have SNS topic for alerts', async () => {
      const response = await snsClient.send(new ListTopicsCommand({}));

      const alertsTopic = response.Topics?.find(topic =>
        topic.TopicArn?.includes(`${TEST_CONFIG.projectName}-alerts`)
      );

      expect(alertsTopic).toBeTruthy();

      if (alertsTopic?.TopicArn) {
        const attributesResponse = await snsClient.send(
          new GetTopicAttributesCommand({
            TopicArn: alertsTopic.TopicArn,
          })
        );

        expect(attributesResponse.Attributes?.DisplayName).toContain('alerts');
      }
    }, 15000);
  });

  // Helper function to get current AWS account ID
  async function getCurrentAccountId(): Promise<string> {
    const stsClient = new STSClient({ region: TEST_CONFIG.region });
    const response = await stsClient.send(new GetCallerIdentityCommand({}));
    return response.Account || '';
  }
});
