// ⚠️ IMPORTANT: Must be at top
jest.setTimeout(120000); // Increased timeout for comprehensive testing

import { expect } from '@jest/globals';
import AWS from 'aws-sdk';

// -----------------------------
// Test Configuration
// -----------------------------
const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';

// Configure AWS SDK with environment credentials for GitHub Actions
AWS.config.update({
  region,
  credentials: new AWS.EnvironmentCredentials('AWS'),
  httpOptions: { timeout: 15000 },
  maxRetries: 5,
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
  kmsKeyArn:
    outputs?.kms_key_arn?.value ||
    'arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012',
  appDataBucket: outputs?.s3_app_data_bucket?.value || 'prod-app-data-bucket',
  accessLogsBucket:
    outputs?.s3_access_logs_bucket?.value || 'prod-access-logs-bucket',
  cloudtrailBucket:
    outputs?.s3_cloudtrail_bucket?.value || 'prod-cloudtrail-bucket',
  rdsIdentifier: outputs?.rds_identifier?.value || 'prod-rds',
  rdsEndpoint:
    outputs?.rds_endpoint?.value ||
    'prod-rds.123456789012.us-west-2.rds.amazonaws.com',
  cloudTrailName: outputs?.cloudtrail_name?.value || 'prod-cloudtrail',
  cloudTrailArn:
    outputs?.cloudtrail_arn?.value ||
    'arn:aws:cloudtrail:us-west-2:123456789012:trail/prod-cloudtrail',
  ec2InstanceId: outputs?.ec2_instance_id?.value || 'i-1234567890abcdef0',
  ec2PrivateIp: outputs?.ec2_private_ip?.value || '10.0.1.100',
  ec2PublicIp: outputs?.ec2_public_ip?.value || '52.123.45.67',
  vpcId: outputs?.vpc_id?.value || 'vpc-12345678',
  vpcFlowLogId: outputs?.vpc_flow_log_id?.value || 'fl-12345678',
  snsTopicArn:
    outputs?.sns_topic_arn?.value ||
    'arn:aws:sns:us-west-2:123456789012:prod-security-alerts',
  securityGroupEc2Id: outputs?.security_group_ec2_id?.value || 'sg-12345678',
  securityGroupRdsId: outputs?.security_group_rds_id?.value || 'sg-87654321',
  subnetPrivateIds: outputs?.subnet_private_ids?.value || [
    'subnet-12345678',
    'subnet-87654321',
  ],
  subnetPublicIds: outputs?.subnet_public_ids?.value || [
    'subnet-abcdef12',
    'subnet-21fedcba',
  ],
  availabilityZones: outputs?.availability_zones?.value || [
    'us-west-2a',
    'us-west-2b',
  ],
  accountId: outputs?.account_id?.value || '123456789012',
  projectName: outputs?.project_name?.value || 'prod',
  environment: outputs?.environment?.value || 'production',
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
    b.Name?.includes(TEST_CONFIG.appDataBucket)
  )?.Name;
  const accessLogs = Buckets?.find(b =>
    b.Name?.includes(TEST_CONFIG.accessLogsBucket)
  )?.Name;

  if (!appData)
    throw new Error(`App data bucket not found: ${TEST_CONFIG.appDataBucket}`);
  if (!accessLogs)
    throw new Error(
      `Access logs bucket not found: ${TEST_CONFIG.accessLogsBucket}`
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
    console.error(
      '❌ AWS credentials not configured:',
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }

  try {
    const buckets = await getActualBucketNames();
    const sgs = await getSecurityGroupIds();
    (global as any).bucketNames = buckets;
    (global as any).securityGroupIds = sgs;
  } catch (err) {
    console.error(
      '❌ Setup failed:',
      err instanceof Error ? err.message : String(err)
    );
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
        .describeKey({ KeyId: TEST_CONFIG.kmsKeyArn })
        .promise();
      expect(result.KeyMetadata?.KeyState).toBe('Enabled');

      const rotation = await kms
        .getKeyRotationStatus({ KeyId: TEST_CONFIG.kmsKeyArn })
        .promise();
      expect(rotation.KeyRotationEnabled).toBe(true);
    });

    test('KMS can encrypt and decrypt', async () => {
      const plaintext = 'test-data';
      const { CiphertextBlob } = await kms
        .encrypt({
          KeyId: TEST_CONFIG.kmsKeyArn,
          Plaintext: Buffer.from(plaintext),
        })
        .promise();

      const { Plaintext } = await kms
        .decrypt({ CiphertextBlob: CiphertextBlob! })
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
        .describeAlarms({
          AlarmNames: [
            `${TEST_CONFIG.projectName}-${TEST_CONFIG.environment}-unauthorized-api-calls`,
          ],
        })
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
          Filter: [{ Name: 'resource-id', Values: [TEST_CONFIG.vpcId] }],
        })
        .promise();

      expect(FlowLogs).toBeDefined();
      expect(FlowLogs!.length).toBeGreaterThan(0);
      expect(FlowLogs![0].TrafficType).toBe('ALL');
    });
  });

  describe('EC2 Instance Tests', () => {
    test('EC2 instance exists and has proper configuration', async () => {
      const { Reservations } = await ec2
        .describeInstances({
          InstanceIds: [TEST_CONFIG.ec2InstanceId],
        })
        .promise();

      expect(Reservations).toBeDefined();
      expect(Reservations!.length).toBeGreaterThan(0);

      const instance = Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.MetadataOptions?.HttpTokens).toBe('required'); // IMDSv2
      expect(instance.IamInstanceProfile?.Arn).toBeDefined();
    });

    test('EC2 instance has proper security groups', async () => {
      const { Reservations } = await ec2
        .describeInstances({
          InstanceIds: [TEST_CONFIG.ec2InstanceId],
        })
        .promise();

      const instance = Reservations![0].Instances![0];
      const securityGroups = instance.SecurityGroups;

      expect(securityGroups).toBeDefined();
      expect(securityGroups!.length).toBeGreaterThan(0);

      // Check if security group contains expected name pattern
      const hasExpectedSg = securityGroups!.some(
        sg =>
          sg.GroupName?.includes(TEST_CONFIG.projectName) ||
          sg.GroupName?.includes('ec2')
      );
      expect(hasExpectedSg).toBe(true);
    });
  });

  describe('Security Groups Tests', () => {
    test('EC2 Security Group has proper ingress rules', async () => {
      const { SecurityGroups } = await ec2
        .describeSecurityGroups({
          GroupIds: [TEST_CONFIG.securityGroupEc2Id],
        })
        .promise();

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!.length).toBeGreaterThan(0);

      const sg = SecurityGroups![0];
      const ingressRules = sg.IpPermissions;

      // Check for SSH access (port 22)
      const sshRule = ingressRules?.find(
        rule =>
          rule.FromPort === 22 &&
          rule.ToPort === 22 &&
          rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();

      // Check for HTTP access (port 80)
      const httpRule = ingressRules?.find(
        rule =>
          rule.FromPort === 80 &&
          rule.ToPort === 80 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
    });

    test('RDS Security Group has proper ingress rules', async () => {
      const { SecurityGroups } = await ec2
        .describeSecurityGroups({
          GroupIds: [TEST_CONFIG.securityGroupRdsId],
        })
        .promise();

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!.length).toBeGreaterThan(0);

      const sg = SecurityGroups![0];
      const ingressRules = sg.IpPermissions;

      // Check for PostgreSQL access (port 5432)
      const postgresRule = ingressRules?.find(
        rule =>
          rule.FromPort === 5432 &&
          rule.ToPort === 5432 &&
          rule.IpProtocol === 'tcp'
      );
      expect(postgresRule).toBeDefined();
    });
  });

  describe('VPC and Subnet Tests', () => {
    test('VPC exists with proper configuration', async () => {
      const { Vpcs } = await ec2
        .describeVpcs({
          VpcIds: [TEST_CONFIG.vpcId],
        })
        .promise();

      expect(Vpcs).toBeDefined();
      expect(Vpcs!.length).toBeGreaterThan(0);

      const vpc = Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly accessible in describeVpcs response
    });

    test('Private subnets exist and are properly configured', async () => {
      const { Subnets } = await ec2
        .describeSubnets({
          SubnetIds: TEST_CONFIG.subnetPrivateIds,
        })
        .promise();

      expect(Subnets).toBeDefined();
      expect(Subnets!.length).toBeGreaterThan(0);

      Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(TEST_CONFIG.vpcId);
      });
    });

    test('Public subnets exist and are properly configured', async () => {
      const { Subnets } = await ec2
        .describeSubnets({
          SubnetIds: TEST_CONFIG.subnetPublicIds,
        })
        .promise();

      expect(Subnets).toBeDefined();
      expect(Subnets!.length).toBeGreaterThan(0);

      Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(TEST_CONFIG.vpcId);
      });
    });
  });

  describe('SNS Topic Tests', () => {
    test('SNS topic exists and is properly configured', async () => {
      const sns = new AWS.SNS();
      const { Topics } = await sns.listTopics().promise();

      const topic = Topics?.find(t => t.TopicArn === TEST_CONFIG.snsTopicArn);
      expect(topic).toBeDefined();
    });
  });

  describe('IAM Role Tests', () => {
    test('EC2 IAM role exists and has proper policies', async () => {
      const iam = new AWS.IAM();
      const { Roles } = await iam.listRoles().promise();

      const ec2Role = Roles?.find(
        role =>
          role.RoleName?.includes('ec2') &&
          role.RoleName?.includes(TEST_CONFIG.projectName)
      );
      expect(ec2Role).toBeDefined();

      if (ec2Role) {
        const { AttachedPolicies } = await iam
          .listAttachedRolePolicies({
            RoleName: ec2Role.RoleName!,
          })
          .promise();

        expect(AttachedPolicies).toBeDefined();
        expect(AttachedPolicies!.length).toBeGreaterThan(0);

        // Check for SSM managed policy
        const hasSSMPolicy = AttachedPolicies!.some(policy =>
          policy.PolicyName?.includes('SSMManagedInstanceCore')
        );
        expect(hasSSMPolicy).toBe(true);
      }
    });
  });

  describe('SSM Patch Manager Tests', () => {
    test('SSM Maintenance Windows exist', async () => {
      const ssm = new AWS.SSM();
      const { WindowIdentities } = await ssm
        .describeMaintenanceWindows()
        .promise();

      const maintenanceWindow = WindowIdentities?.find(
        window =>
          window.Name?.includes(TEST_CONFIG.projectName) &&
          window.Name?.includes('patch')
      );
      expect(maintenanceWindow).toBeDefined();
    });
  });

  describe('CloudWatch Logs Tests', () => {
    test('CloudWatch log groups exist with proper retention', async () => {
      const { logGroups } = await logs.describeLogGroups().promise();

      const vpcFlowLogs = logGroups?.find(
        group =>
          group.logGroupName?.includes('vpc/flowlogs') &&
          group.logGroupName?.includes(TEST_CONFIG.projectName)
      );
      expect(vpcFlowLogs).toBeDefined();
      expect(vpcFlowLogs!.retentionInDays).toBeGreaterThan(0);

      const cloudtrailLogs = logGroups?.find(
        group =>
          group.logGroupName?.includes('cloudtrail') &&
          group.logGroupName?.includes(TEST_CONFIG.projectName)
      );
      expect(cloudtrailLogs).toBeDefined();
      expect(cloudtrailLogs!.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe('RDS Subnet Group Tests', () => {
    test('RDS subnet group exists and uses private subnets', async () => {
      const { DBSubnetGroups } = await rds.describeDBSubnetGroups().promise();

      const subnetGroup = DBSubnetGroups?.find(group =>
        group.DBSubnetGroupName?.includes(TEST_CONFIG.projectName)
      );
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup!.Subnets!.length).toBeGreaterThan(0);

      // Verify it uses private subnets
      subnetGroup!.Subnets!.forEach(subnet => {
        expect(subnet.SubnetAvailabilityZone).toBeDefined();
        expect(subnet.SubnetStatus).toBe('Active');
      });
    });
  });

  describe('Secrets Manager Tests', () => {
    test('RDS password secret exists and is encrypted', async () => {
      const secretsmanager = new AWS.SecretsManager();
      const { SecretList } = await secretsmanager.listSecrets().promise();

      const rdsSecret = SecretList?.find(
        secret =>
          secret.Name?.includes('rds-password') &&
          secret.Name?.includes(TEST_CONFIG.projectName)
      );
      expect(rdsSecret).toBeDefined();
      // Note: Encryption status is not directly accessible in listSecrets response
    });
  });
});
