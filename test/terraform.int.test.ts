// ⚠️ IMPORTANT: Must be at top
jest.setTimeout(60000);

import { expect } from '@jest/globals';
import AWS from 'aws-sdk';

// -----------------------------
// Test Configuration
// -----------------------------
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-1';

// Force AWS SDK to use EC2 instance metadata credentials
AWS.config.update({
  region,
  credentials: new AWS.EC2MetadataCredentials({
    httpOptions: { timeout: 5000 },
    maxRetries: 10,
  }),
});

// Load outputs from Terraform
let outputs: any;
try {
  outputs = require('../outputs.json');
  console.log('✅ Loaded outputs.json');
} catch (err) {
  console.warn('⚠️ outputs.json not found — using defaults');
}

const TEST_CONFIG = {
  kmsAlias:
    outputs?.kms_key_alias?.value || 'alias/secure-infra-prod-primary-cmk',
  appDataBucketPrefix:
    outputs?.app_data_bucket?.value?.split('-').slice(0, -1).join('-') ||
    'secure-infra-prod-app-data',
  accessLogsBucketPrefix:
    outputs?.access_logs_bucket?.value?.split('-').slice(0, -1).join('-') ||
    'secure-infra-prod-access-logs',
  rdsIdentifier: outputs?.rds_identifier?.value || 'secure-infra-prod-rds',
  cloudTrailName:
    outputs?.cloudtrail_name?.value || 'secure-infra-prod-cloudtrail',
  cloudWatchLogGroup:
    outputs?.cloudwatch_log_group?.value || '/aws/cloudtrail/secure-infra-prod',
  alarmName:
    outputs?.alarm_name?.value || 'secure-infra-prod-unauthorized-api-calls',
  vpcId: outputs?.vpc_id?.value || 'vpc-0abc123de456',
  allowedCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
};

// -----------------------------
// AWS SDK v2 Clients
// -----------------------------
const kms = new AWS.KMS();
const s3 = new AWS.S3();
const rds = new AWS.RDS();
const cw = new AWS.CloudWatch();
const logs = new AWS.CloudWatchLogs();
const ec2 = new AWS.EC2();
const cloudtrail = new AWS.CloudTrail();

// -----------------------------
// Helper: Get Actual Bucket Names
// -----------------------------
async function getActualBucketNames() {
  const { Buckets } = await s3.listBuckets().promise();
  const appData = Buckets?.find(b =>
    b.Name?.startsWith(TEST_CONFIG.appDataBucketPrefix)
  )?.Name;
  const accessLogs = Buckets?.find(b =>
    b.Name?.startsWith(TEST_CONFIG.accessLogsBucketPrefix)
  )?.Name;

  if (!appData)
    throw new Error(
      `App data bucket not found: ${TEST_CONFIG.appDataBucketPrefix}`
    );
  if (!accessLogs)
    throw new Error(
      `Access logs bucket not found: ${TEST_CONFIG.accessLogsBucketPrefix}`
    );

  return { appData, accessLogs };
}

// -----------------------------
// Helper: Get Security Group IDs
// -----------------------------
async function getSecurityGroupIds() {
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

  if (!ec2Sg) throw new Error('EC2 Security Group not found');
  if (!rdsSg) throw new Error('RDS Security Group not found');

  return { ec2: ec2Sg, rds: rdsSg };
}

// -----------------------------
// Global Setup & Teardown
// -----------------------------
beforeAll(async () => {
  console.log(`🧪 Running integration tests in region: ${region}`);

  // Verify AWS credentials
  try {
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    console.log(`✅ AWS credentials verified for account: ${identity.Account}`);
  } catch (err) {
    console.error('❌ AWS credentials not configured:', err.message);
    throw err;
  }

  try {
    const buckets = await getActualBucketNames();
    const sgs = await getSecurityGroupIds();
    (global as any).bucketNames = buckets;
    (global as any).securityGroupIds = sgs;
  } catch (err) {
    console.error('❌ Setup failed:', (err as Error).message);
    throw err;
  }
}, 60000);

afterAll(() => {
  console.log('🧹 Integration tests completed');
});

// -----------------------------
// Test Suite
// -----------------------------
describe('Infrastructure Integration Tests', () => {
  let bucketNames: { appData: string; accessLogs: string };
  let securityGroupIds: { ec2: string; rds: string };

  beforeAll(() => {
    bucketNames = (global as any).bucketNames;
    securityGroupIds = (global as any).securityGroupIds;
  });

  describe('KMS Key Tests', () => {
    test('KMS key exists and rotation is enabled', async () => {
      const result = await kms
        .describeKey({ KeyId: TEST_CONFIG.kmsAlias })
        .promise();
      expect(result.KeyMetadata?.KeyState).toBe('Enabled');

      const rotation = await kms
        .getKeyRotationStatus({ KeyId: TEST_CONFIG.kmsAlias })
        .promise();
      expect(rotation.KeyRotationEnabled).toBe(true);
    });

    test('KMS can encrypt and decrypt', async () => {
      const plaintext = 'test-data';
      const { CiphertextBlob } = await kms
        .encrypt({
          KeyId: TEST_CONFIG.kmsAlias,
          Plaintext: Buffer.from(plaintext),
        })
        .promise();

      const { Plaintext } = await kms
        .decrypt({ CiphertextBlob })
        .promise();
      expect(Plaintext?.toString()).toBe(plaintext);
    });
  });

  describe('S3 Bucket Tests', () => {
    test('App data bucket has encryption and access logging', async () => {
      const enc = await s3
        .getBucketEncryption({ Bucket: bucketNames.appData })
        .promise();
      expect(
        enc.ServerSideEncryptionConfiguration?.Rules[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      const logging = await s3
        .getBucketLogging({ Bucket: bucketNames.appData })
        .promise();
      expect(logging.LoggingEnabled?.TargetBucket).toBe(bucketNames.accessLogs);

      const pub = await s3
        .getPublicAccessBlock({ Bucket: bucketNames.appData })
        .promise();
      const config = pub.PublicAccessBlockConfiguration;
      Object.values(config || {}).forEach(v => expect(v).toBe(true));
    });

    test('S3 buckets deny non-TLS connections', async () => {
      const [appDataPolicy, accessLogsPolicy] = await Promise.all([
        s3.getBucketPolicy({ Bucket: bucketNames.appData }).promise(),
        s3.getBucketPolicy({ Bucket: bucketNames.accessLogs }).promise(),
      ]);

      const hasDenyInsecure = (policy: any) => {
        const doc = JSON.parse(policy.Policy);
        return doc.Statement.some(
          (stmt: any) =>
            stmt.Sid === 'DenyInsecureConnections' &&
            stmt.Effect === 'Deny' &&
            stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
      };

      expect(hasDenyInsecure(appDataPolicy)).toBe(true);
      expect(hasDenyInsecure(accessLogsPolicy)).toBe(true);
    });
  });

  describe('RDS Tests', () => {
    test('RDS instance is Multi-AZ and encrypted', async () => {
      const { DBInstances } = await rds
        .describeDBInstances({
          DBInstanceIdentifier: TEST_CONFIG.rdsIdentifier,
        })
        .promise();

      expect(DBInstances).toBeDefined();
      expect(DBInstances!.length).toBeGreaterThan(0);

      const db = DBInstances![0];
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('CloudWatch alarm exists for UnauthorizedAPICalls', async () => {
      const alarms = await cw
        .describeAlarms({ AlarmNames: [TEST_CONFIG.alarmName] })
        .promise();
      expect(alarms.MetricAlarms).toBeDefined();
      expect(alarms.MetricAlarms!.length).toBeGreaterThan(0);
      expect(alarms.MetricAlarms![0].AlarmActions?.length).toBeGreaterThan(0);
    });
  });

  describe('CloudTrail Tests', () => {
    test('CloudTrail is enabled and configured correctly', async () => {
      const { trailList } = await cloudtrail
        .describeTrails({
          trailNameList: [TEST_CONFIG.cloudTrailName],
        })
        .promise();

      expect(trailList).toBeDefined();
      expect(trailList!.length).toBeGreaterThan(0);

      const trail = trailList![0];
      expect(trail.Name).toBe(TEST_CONFIG.cloudTrailName);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('VPC Flow Logs Tests', () => {
    test('VPC Flow Logs are enabled', async () => {
      const { FlowLogs } = await ec2
        .describeFlowLogs({
          Filters: [{ Name: 'resource-id', Values: [TEST_CONFIG.vpcId] }],
        })
        .promise();

      expect(FlowLogs).toBeDefined();
      expect(FlowLogs!.length).toBeGreaterThan(0);
      expect(FlowLogs![0].TrafficType).toBe('ALL');
    });
  });
});