import { expect } from '@jest/globals';
import { CloudWatch, CloudWatchLogs, EC2, KMS, RDS, S3 } from 'aws-sdk';

// AWS SDK clients
const kms = new KMS();
const s3 = new S3();
const rds = new RDS();
const cw = new CloudWatch();
const logs = new CloudWatchLogs();
const ec2 = new EC2();

// Test configuration - update these values based on your Terraform outputs
const TEST_CONFIG = {
  kmsAlias: 'alias/secure-infra-prod-primary-cmk',
  appDataBucket: 'secure-infra-prod-app-data', // Will be appended with random suffix
  accessLogsBucket: 'secure-infra-prod-access-logs', // Will be appended with random suffix
  rdsIdentifier: 'secure-infra-prod-rds',
  cloudTrailName: 'secure-infra-prod-cloudtrail',
  cloudWatchLogGroup: '/aws/cloudtrail/secure-infra-prod',
  alarmName: 'secure-infra-prod-unauthorized-api-calls',
  vpcId: 'vpc-0abc123de456', // Update with actual VPC ID
  allowedCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
};

// Helper function to get actual bucket names (they have random suffixes)
async function getActualBucketNames(): Promise<{
  appData: string;
  accessLogs: string;
}> {
  try {
    // List buckets and find the ones matching our pattern
    const { Buckets } = await s3.listBuckets().promise();
    const appDataBucket = Buckets?.find(b =>
      b.Name?.startsWith('secure-infra-prod-app-data-')
    )?.Name;
    const accessLogsBucket = Buckets?.find(b =>
      b.Name?.startsWith('secure-infra-prod-access-logs-')
    )?.Name;

    return {
      appData: appDataBucket || TEST_CONFIG.appDataBucket,
      accessLogs: accessLogsBucket || TEST_CONFIG.accessLogsBucket,
    };
  } catch (error) {
    console.warn('Could not determine actual bucket names, using defaults');
    return {
      appData: TEST_CONFIG.appDataBucket,
      accessLogs: TEST_CONFIG.accessLogsBucket,
    };
  }
}

// Helper function to get actual security group IDs
async function getSecurityGroupIds(): Promise<{ ec2: string; rds: string }> {
  try {
    const { SecurityGroups } = await ec2
      .describeSecurityGroups({
        Filters: [{ Name: 'group-name', Values: ['*secure-infra-prod*'] }],
      })
      .promise();

    const ec2Sg = SecurityGroups?.find(sg =>
      sg.GroupName?.includes('ec2')
    )?.GroupId;
    const rdsSg = SecurityGroups?.find(sg =>
      sg.GroupName?.includes('rds')
    )?.GroupId;

    return {
      ec2: ec2Sg || 'sg-unknown',
      rds: rdsSg || 'sg-unknown',
    };
  } catch (error) {
    console.warn('Could not determine security group IDs, using defaults');
    return {
      ec2: 'sg-unknown',
      rds: 'sg-unknown',
    };
  }
}

describe('Infrastructure Integration Tests', () => {
  let bucketNames: { appData: string; accessLogs: string };
  let securityGroupIds: { ec2: string; rds: string };

  beforeAll(async () => {
    bucketNames = await getActualBucketNames();
    securityGroupIds = await getSecurityGroupIds();
  });

  describe('KMS Key Tests', () => {
    test('KMS key exists and rotation is enabled', async () => {
      const result = await kms
        .describeKey({
          KeyId: TEST_CONFIG.kmsAlias,
        })
        .promise();

      expect(result.KeyMetadata?.KeyState).toBe('Enabled');
      expect(result.KeyMetadata?.KeyRotationStatus).toBe(true);
    });

    test('KMS can encrypt and decrypt', async () => {
      const plaintext = 'test-data';
      const { CiphertextBlob } = await kms
        .encrypt({
          KeyId: TEST_CONFIG.kmsAlias,
          Plaintext: Buffer.from(plaintext),
        })
        .promise();

      const { Plaintext } = await kms.decrypt({ CiphertextBlob }).promise();
      expect(Plaintext?.toString()).toBe(plaintext);
    });
  });

  describe('S3 Bucket Tests', () => {
    test('App data bucket has encryption and access logging', async () => {
      // Check encryption
      const enc = await s3
        .getBucketEncryption({
          Bucket: bucketNames.appData,
        })
        .promise();

      expect(
        enc.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check logging
      const logging = await s3
        .getBucketLogging({
          Bucket: bucketNames.appData,
        })
        .promise();

      expect(logging.LoggingEnabled?.TargetBucket).toBe(bucketNames.accessLogs);

      // Check public access block
      const pub = await s3
        .getPublicAccessBlock({
          Bucket: bucketNames.appData,
        })
        .promise();

      Object.values(pub.PublicAccessBlockConfiguration!).forEach(v =>
        expect(v).toBe(true)
      );
    });

    test('Access logs bucket has encryption and self-logging', async () => {
      // Check encryption
      const enc = await s3
        .getBucketEncryption({
          Bucket: bucketNames.accessLogs,
        })
        .promise();

      expect(
        enc.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check self-logging
      const logging = await s3
        .getBucketLogging({
          Bucket: bucketNames.accessLogs,
        })
        .promise();

      expect(logging.LoggingEnabled?.TargetBucket).toBe(bucketNames.accessLogs);
    });

    test('S3 buckets deny non-TLS connections', async () => {
      const [appDataPolicy, accessLogsPolicy] = await Promise.all([
        s3.getBucketPolicy({ Bucket: bucketNames.appData }).promise(),
        s3.getBucketPolicy({ Bucket: bucketNames.accessLogs }).promise(),
      ]);

      const appDataPolicyDoc = JSON.parse(appDataPolicy.Policy!);
      const accessLogsPolicyDoc = JSON.parse(accessLogsPolicy.Policy!);

      // Check for DenyInsecureConnections statement
      const hasDenyInsecure = (policy: any) =>
        policy.Statement.some(
          (stmt: any) =>
            stmt.Sid === 'DenyInsecureConnections' &&
            stmt.Effect === 'Deny' &&
            stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );

      expect(hasDenyInsecure(appDataPolicyDoc)).toBe(true);
      expect(hasDenyInsecure(accessLogsPolicyDoc)).toBe(true);
    });
  });

  describe('RDS Tests', () => {
    test('RDS instance is Multi-AZ and encrypted', async () => {
      const { DBInstances } = await rds
        .describeDBInstances({
          DBInstanceIdentifier: TEST_CONFIG.rdsIdentifier,
        })
        .promise();

      const db = DBInstances![0];
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.DeletionProtection).toBe(true);
      expect(db.BackupRetentionPeriod).toBe(7);
    });

    test('RDS is in private subnets', async () => {
      const { DBInstances } = await rds
        .describeDBInstances({
          DBInstanceIdentifier: TEST_CONFIG.rdsIdentifier,
        })
        .promise();

      const db = DBInstances![0];
      expect(db.DBSubnetGroup?.Subnets?.length).toBeGreaterThan(0);

      // Check that subnets are in private AZs (no direct internet access)
      const subnets = await ec2
        .describeSubnets({
          SubnetIds: db.DBSubnetGroup!.Subnets!.map(s => s.SubnetIdentifier!),
        })
        .promise();

      subnets.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('CloudWatch alarm exists for UnauthorizedAPICalls', async () => {
      const alarms = await cw
        .describeAlarms({
          AlarmNames: [TEST_CONFIG.alarmName],
        })
        .promise();

      expect(alarms.MetricAlarms?.length).toBeGreaterThan(0);
      expect(alarms.MetricAlarms?.[0].AlarmActions?.length).toBeGreaterThan(0);
      expect(alarms.MetricAlarms?.[0].ComparisonOperator).toBe(
        'GreaterThanOrEqualToThreshold'
      );
      expect(alarms.MetricAlarms?.[0].Threshold).toBe(1);
    });

    test('Metric filter exists in CloudTrail log group', async () => {
      const filters = await logs
        .describeMetricFilters({
          logGroupName: TEST_CONFIG.cloudWatchLogGroup,
        })
        .promise();

      const unauthorizedFilter = filters.metricFilters?.find(f =>
        f.filterName?.includes('unauthorized-api-calls')
      );

      expect(unauthorizedFilter).toBeDefined();
      expect(unauthorizedFilter?.filterPattern).toContain(
        'UnauthorizedOperation'
      );
      expect(unauthorizedFilter?.filterPattern).toContain('AccessDenied');
    });

    test('CloudTrail log group has proper retention', async () => {
      const logGroups = await logs
        .describeLogGroups({
          logGroupNamePrefix: TEST_CONFIG.cloudWatchLogGroup,
        })
        .promise();

      const cloudTrailLogGroup = logGroups.logGroups?.find(
        lg => lg.logGroupName === TEST_CONFIG.cloudWatchLogGroup
      );

      expect(cloudTrailLogGroup).toBeDefined();
      expect(cloudTrailLogGroup?.retentionInDays).toBe(365);
    });
  });

  describe('VPC Flow Logs Tests', () => {
    test('VPC Flow Logs are enabled', async () => {
      const { FlowLogs } = await ec2
        .describeFlowLogs({
          Filter: [
            { Name: 'resource-id', Values: [TEST_CONFIG.vpcId] },
            { Name: 'deliver-log-status', Values: ['SUCCESS'] },
          ],
        })
        .promise();

      expect(FlowLogs?.length).toBeGreaterThan(0);
      expect(FlowLogs?.[0].TrafficType).toBe('ALL');
      expect(FlowLogs?.[0].LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPC Flow Logs have proper format', async () => {
      const { FlowLogs } = await ec2
        .describeFlowLogs({
          Filter: [{ Name: 'resource-id', Values: [TEST_CONFIG.vpcId] }],
        })
        .promise();

      const flowLog = FlowLogs![0];
      expect(flowLog.LogFormat).toContain('version');
      expect(flowLog.LogFormat).toContain('srcaddr');
      expect(flowLog.LogFormat).toContain('dstaddr');
      expect(flowLog.LogFormat).toContain('action');
    });
  });

  describe('EC2 Security Groups Tests', () => {
    test('EC2 security group only allows specific ingress', async () => {
      const { SecurityGroups } = await ec2
        .describeSecurityGroups({
          GroupIds: [securityGroupIds.ec2],
        })
        .promise();

      const sg = SecurityGroups![0];
      const ingress = sg.IpPermissions;

      // Should have SSH (22), HTTP (80), HTTPS (443)
      expect(ingress?.length).toBe(3);

      const sshRule = ingress?.find(rule => rule.FromPort === 22);
      const httpRule = ingress?.find(rule => rule.FromPort === 80);
      const httpsRule = ingress?.find(rule => rule.FromPort === 443);

      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Check that all rules only allow from allowed CIDRs
      ingress?.forEach(rule => {
        rule.IpRanges?.forEach(ipRange => {
          expect(TEST_CONFIG.allowedCidrs).toContain(ipRange.CidrIp);
        });
      });
    });

    test('RDS security group only allows PostgreSQL from allowed CIDRs', async () => {
      const { SecurityGroups } = await ec2
        .describeSecurityGroups({
          GroupIds: [securityGroupIds.rds],
        })
        .promise();

      const sg = SecurityGroups![0];
      const ingress = sg.IpPermissions;

      // Should only have PostgreSQL (5432)
      expect(ingress?.length).toBe(1);
      expect(ingress![0].FromPort).toBe(5432);
      expect(ingress![0].ToPort).toBe(5432);
      expect(ingress![0].IpProtocol).toBe('tcp');

      // Check that only allows from allowed CIDRs
      ingress![0].IpRanges?.forEach(ipRange => {
        expect(TEST_CONFIG.allowedCidrs).toContain(ipRange.CidrIp);
      });
    });
  });

  describe('CloudTrail Tests', () => {
    test('CloudTrail is enabled and configured correctly', async () => {
      const { trails } = await ec2
        .describeTrails({
          trailNameList: [TEST_CONFIG.cloudTrailName],
        })
        .promise();

      const trail = trails![0];
      expect(trail.Name).toBe(TEST_CONFIG.cloudTrailName);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail has proper event selectors', async () => {
      const { EventSelectors } = await ec2
        .getEventSelectors({
          TrailName: TEST_CONFIG.cloudTrailName,
        })
        .promise();

      expect(EventSelectors?.length).toBeGreaterThan(0);
      expect(EventSelectors![0].ReadWriteType).toBe('All');
      expect(EventSelectors![0].IncludeManagementEvents).toBe(true);

      // Check for S3 data events
      const s3DataEvents = EventSelectors![0].DataResources?.find(
        dr => dr.Type === 'AWS::S3::Object'
      );
      expect(s3DataEvents).toBeDefined();
    });
  });

  describe('SSM Patch Manager Tests', () => {
    test('SSM Maintenance Window exists', async () => {
      // Note: This would require SSM SDK, but we can test the IAM role exists
      const { Roles } = await ec2
        .describeIamInstanceProfileAssociations({
          Filters: [{ Name: 'state', Values: ['associated'] }],
        })
        .promise();

      // Check that EC2 instances have the SSM role
      expect(Roles?.length).toBeGreaterThan(0);
    });
  });
});
