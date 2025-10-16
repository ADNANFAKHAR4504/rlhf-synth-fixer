/**
 * Comprehensive Unit Tests for HIPAA-Compliant Healthcare Data Pipeline Stack
 *
 * This test suite validates:
 * - Stack instantiation and configuration
 * - Resource creation with correct parameters
 * - HIPAA compliance requirements (encryption, logging, SSL)
 * - Security configurations (KMS, IAM, Security Groups)
 * - Network isolation (VPC, Subnets)
 * - Monitoring and alerting setup
 */

// =============================================================================
// Mock Setup - Must be done before any imports
// =============================================================================

const mockOutputs = {};
const mockResources = {
  kmsKey: { id: 'mock-kms-key-id', arn: 'arn:aws:kms:ap-southeast-1:123456789012:key/mock-key-id', keyId: 'mock-key-id' },
  kmsAlias: { id: 'mock-kms-alias-id', name: 'alias/healthcare-dev' },
  logGroup: { id: 'mock-log-group-id', name: '/aws/healthcare/audit-dev', arn: 'arn:aws:logs:ap-southeast-1:123456789012:log-group:/aws/healthcare/audit-dev' },
  vpc: { id: 'vpc-mock123', cidrBlock: '10.0.0.0/16' },
  privateSubnet1: { id: 'subnet-mock-private-1', availabilityZone: 'ap-southeast-1a' },
  privateSubnet2: { id: 'subnet-mock-private-2', availabilityZone: 'ap-southeast-1b' },
  dbSubnetGroup: { id: 'mock-db-subnet-group', name: 'healthcare-db-subnet-dev' },
  rdsSecurityGroup: { id: 'sg-mock-rds', name: 'healthcare-rds-sg-dev' },
  rdsParameterGroup: { id: 'mock-pg-params', name: 'healthcare-pg-params-dev' },
  rdsInstance: { id: 'mock-rds-instance', identifier: 'healthcare-rds-dev', endpoint: 'healthcare-rds-dev.123456.ap-southeast-1.rds.amazonaws.com:5432' },
  kinesisStream: { id: 'mock-kinesis-stream', name: 'healthcare-stream-dev', arn: 'arn:aws:kinesis:ap-southeast-1:123456789012:stream/healthcare-stream-dev' },
  kinesisRole: { id: 'mock-kinesis-role', name: 'healthcare-kinesis-role-dev', arn: 'arn:aws:iam::123456789012:role/healthcare-kinesis-role-dev' },
  kinesisPolicy: { id: 'mock-kinesis-policy' },
  kinesisIteratorAlarm: { id: 'mock-iterator-alarm' },
  rdsCpuAlarm: { id: 'mock-rds-cpu-alarm' },
};

// Mock Pulumi
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    ComponentResource: jest.fn().mockImplementation(function(type, name, args, opts) {
      this.registerOutputs = jest.fn((outputs) => {
        Object.assign(mockOutputs, outputs);
      });
    }),
    Output: {
      create: jest.fn((val) => val),
      isInstance: jest.fn(() => false),
    },
    output: jest.fn((val) => val),
    interpolate: jest.fn((...args) => {
      if (args.length === 1 && Array.isArray(args[0])) {
        return args[0].join('');
      }
      return args.join('');
    }),
    all: jest.fn((args) => ({
      apply: (fn) => fn(Array.isArray(args) ? args : [args]),
    })),
    secret: jest.fn((val) => val),
  };
});

// Mock AWS SDK functions
const mockGetCallerIdentity = jest.fn(() => Promise.resolve({ accountId: '123456789012' }));
const mockGetRegion = jest.fn(() => Promise.resolve({ name: 'ap-southeast-1' }));

// Mock AWS resources with call tracking
const createMockResource = (resourceData) => jest.fn().mockImplementation(() => resourceData);

const mockKmsKey = createMockResource(mockResources.kmsKey);
const mockKmsAlias = createMockResource(mockResources.kmsAlias);
const mockLogGroup = createMockResource(mockResources.logGroup);
const mockVpc = createMockResource(mockResources.vpc);
const mockSubnet = jest.fn()
  .mockImplementationOnce(() => mockResources.privateSubnet1)
  .mockImplementationOnce(() => mockResources.privateSubnet2);
const mockDbSubnetGroup = createMockResource(mockResources.dbSubnetGroup);
const mockSecurityGroup = createMockResource(mockResources.rdsSecurityGroup);
const mockParameterGroup = createMockResource(mockResources.rdsParameterGroup);
const mockRdsInstance = createMockResource(mockResources.rdsInstance);
const mockKinesisStream = createMockResource(mockResources.kinesisStream);
const mockIamRole = createMockResource(mockResources.kinesisRole);
const mockRolePolicy = createMockResource(mockResources.kinesisPolicy);
const mockMetricAlarm = jest.fn()
  .mockImplementationOnce(() => mockResources.kinesisIteratorAlarm)
  .mockImplementationOnce(() => mockResources.rdsCpuAlarm);

// Mock AWS
jest.mock('@pulumi/aws', () => ({
  getCallerIdentity: mockGetCallerIdentity,
  getRegion: mockGetRegion,
  kms: {
    Key: mockKmsKey,
    Alias: mockKmsAlias,
  },
  cloudwatch: {
    LogGroup: mockLogGroup,
    MetricAlarm: mockMetricAlarm,
  },
  ec2: {
    Vpc: mockVpc,
    Subnet: mockSubnet,
    SecurityGroup: mockSecurityGroup,
  },
  rds: {
    SubnetGroup: mockDbSubnetGroup,
    ParameterGroup: mockParameterGroup,
    Instance: mockRdsInstance,
  },
  kinesis: {
    Stream: mockKinesisStream,
  },
  iam: {
    Role: mockIamRole,
    RolePolicy: mockRolePolicy,
  },
}));

// Import after mocking
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack.mjs';

// =============================================================================
// Test Suite
// =============================================================================

describe('HIPAA-Compliant Healthcare Data Pipeline Stack', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    Object.keys(mockOutputs).forEach(key => delete mockOutputs[key]);
  });

  // ===========================================================================
  // Stack Instantiation Tests
  // ===========================================================================

  describe('Stack Instantiation', () => {
    it('should create stack successfully with default configuration', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {},
        undefined
      );
    });

    it('should create stack with custom environment suffix', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toContain('prod');
    });

    it('should create stack with custom tags', () => {
      const customTags = {
        Project: 'Healthcare',
        Team: 'DataEngineering',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: customTags
      });

      expect(stack).toBeDefined();
    });

    it('should default environment suffix to "dev" when not provided', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack.bucketName).toContain('dev');
    });

    it('should handle empty configuration object', () => {
      expect(() => {
        new TapStack('test-stack', {});
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // KMS Key Tests
  // ===========================================================================

  describe('KMS Key Configuration', () => {
    it('should create KMS key with proper HIPAA configuration', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });

      expect(mockKmsKey).toHaveBeenCalledTimes(1);

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.description).toContain('HIPAA-compliant');
      expect(kmsConfig.description).toContain('test');
      expect(kmsConfig.enableKeyRotation).toBe(true);
      expect(kmsConfig.deletionWindowInDays).toBe(10);
    });

    it('should create KMS key with proper policy for CloudWatch Logs', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.policy).toBeDefined();

      // Verify policy contains CloudWatch Logs permissions
      const policy = JSON.parse(kmsConfig.policy);
      expect(policy.Statement).toHaveLength(2);

      const cwLogsStatement = policy.Statement.find(s => s.Sid === 'Allow CloudWatch Logs');
      expect(cwLogsStatement).toBeDefined();
      expect(cwLogsStatement.Principal.Service).toContain('logs');
      expect(cwLogsStatement.Action).toContain('kms:Encrypt');
      expect(cwLogsStatement.Action).toContain('kms:Decrypt');
      expect(cwLogsStatement.Action).toContain('kms:GenerateDataKey*');
    });

    it('should create KMS alias with correct name', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      expect(mockKmsAlias).toHaveBeenCalledTimes(1);

      const aliasConfig = mockKmsAlias.mock.calls[0][1];
      expect(aliasConfig.name).toBe('alias/healthcare-prod');
      expect(aliasConfig.targetKeyId).toBe(mockResources.kmsKey.keyId);
    });

    it('should tag KMS key with HIPAA compliance tags', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.tags.Compliance).toBe('HIPAA');
      expect(kmsConfig.tags.DataClassification).toBe('PHI');
      expect(kmsConfig.tags.Environment).toBe('test');
    });
  });

  // ===========================================================================
  // CloudWatch Logs Tests
  // ===========================================================================

  describe('CloudWatch Log Group Configuration', () => {
    it('should create log group with KMS encryption', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockLogGroup).toHaveBeenCalledTimes(1);

      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.name).toBe('/aws/healthcare/audit-dev');
      expect(logConfig.kmsKeyId).toBe(mockResources.kmsKey.arn);
    });

    it('should set retention period to 90 days for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.retentionInDays).toBe(90);
    });

    it('should tag log group with compliance tags', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.tags.Compliance).toBe('HIPAA');
      expect(logConfig.tags.DataClassification).toBe('PHI');
    });

    it('should create log group with dependency on KMS key', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const logOptions = mockLogGroup.mock.calls[0][2];
      expect(logOptions.dependsOn).toBeDefined();
      expect(Array.isArray(logOptions.dependsOn)).toBe(true);
    });
  });

  // ===========================================================================
  // VPC and Network Tests
  // ===========================================================================

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockVpc).toHaveBeenCalledTimes(1);

      const vpcConfig = mockVpc.mock.calls[0][1];
      expect(vpcConfig.cidrBlock).toBe('10.0.0.0/16');
      expect(vpcConfig.enableDnsHostnames).toBe(true);
      expect(vpcConfig.enableDnsSupport).toBe(true);
    });

    it('should tag VPC with descriptive name', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      const vpcConfig = mockVpc.mock.calls[0][1];
      expect(vpcConfig.tags.Name).toBe('healthcare-vpc-prod');
      expect(vpcConfig.tags.Compliance).toBe('HIPAA');
    });
  });

  describe('Subnet Configuration', () => {
    it('should create two private subnets in different AZs', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockSubnet).toHaveBeenCalledTimes(2);

      const subnet1Config = mockSubnet.mock.calls[0][1];
      const subnet2Config = mockSubnet.mock.calls[1][1];

      expect(subnet1Config.cidrBlock).toBe('10.0.1.0/24');
      expect(subnet2Config.cidrBlock).toBe('10.0.2.0/24');

      expect(subnet1Config.availabilityZone).toBe('ap-southeast-1a');
      expect(subnet2Config.availabilityZone).toBe('ap-southeast-1b');
    });

    it('should associate subnets with VPC', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const subnet1Config = mockSubnet.mock.calls[0][1];
      const subnet2Config = mockSubnet.mock.calls[1][1];

      expect(subnet1Config.vpcId).toBe(mockResources.vpc.id);
      expect(subnet2Config.vpcId).toBe(mockResources.vpc.id);
    });

    it('should tag subnets with descriptive names', () => {
      new TapStack('test-stack', { environmentSuffix: 'staging' });

      const subnet1Config = mockSubnet.mock.calls[0][1];
      const subnet2Config = mockSubnet.mock.calls[1][1];

      expect(subnet1Config.tags.Name).toBe('healthcare-private-1-staging');
      expect(subnet2Config.tags.Name).toBe('healthcare-private-2-staging');
    });
  });

  // ===========================================================================
  // RDS Database Tests
  // ===========================================================================

  describe('RDS Subnet Group Configuration', () => {
    it('should create DB subnet group with both subnets', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockDbSubnetGroup).toHaveBeenCalledTimes(1);

      const subnetGroupConfig = mockDbSubnetGroup.mock.calls[0][1];
      expect(subnetGroupConfig.name).toBe('healthcare-db-subnet-dev');
      expect(subnetGroupConfig.subnetIds).toHaveLength(2);
    });
  });

  describe('RDS Security Group Configuration', () => {
    it('should create security group with restricted PostgreSQL access', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockSecurityGroup).toHaveBeenCalledTimes(1);

      const sgConfig = mockSecurityGroup.mock.calls[0][1];
      expect(sgConfig.name).toBe('healthcare-rds-sg-dev');
      expect(sgConfig.description).toContain('HIPAA-compliant');
      expect(sgConfig.vpcId).toBe(mockResources.vpc.id);
    });

    it('should restrict ingress to VPC CIDR only', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const sgConfig = mockSecurityGroup.mock.calls[0][1];
      const ingressRule = sgConfig.ingress[0];

      expect(ingressRule.fromPort).toBe(5432);
      expect(ingressRule.toPort).toBe(5432);
      expect(ingressRule.protocol).toBe('tcp');
      expect(ingressRule.cidrBlocks).toEqual(['10.0.0.0/16']);
      expect(ingressRule.description).toContain('PostgreSQL');
    });

    it('should allow all outbound traffic', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const sgConfig = mockSecurityGroup.mock.calls[0][1];
      const egressRule = sgConfig.egress[0];

      expect(egressRule.fromPort).toBe(0);
      expect(egressRule.toPort).toBe(0);
      expect(egressRule.protocol).toBe('-1');
      expect(egressRule.cidrBlocks).toEqual(['0.0.0.0/0']);
    });
  });

  describe('RDS Parameter Group Configuration', () => {
    it('should create parameter group with PostgreSQL 15 family', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockParameterGroup).toHaveBeenCalledTimes(1);

      const pgConfig = mockParameterGroup.mock.calls[0][1];
      expect(pgConfig.name).toBe('healthcare-pg-params-dev');
      expect(pgConfig.family).toBe('postgres15');
      expect(pgConfig.description).toContain('HIPAA compliance');
    });

    it('should enforce SSL connections for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const pgConfig = mockParameterGroup.mock.calls[0][1];
      const sslParam = pgConfig.parameters.find(p => p.name === 'rds.force_ssl');

      expect(sslParam).toBeDefined();
      expect(sslParam.value).toBe('1');
    });

    it('should enable connection logging for audit trail', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const pgConfig = mockParameterGroup.mock.calls[0][1];
      const logConnParam = pgConfig.parameters.find(p => p.name === 'log_connections');
      const logDisconnParam = pgConfig.parameters.find(p => p.name === 'log_disconnections');

      expect(logConnParam).toBeDefined();
      expect(logConnParam.value).toBe('1');
      expect(logDisconnParam).toBeDefined();
      expect(logDisconnParam.value).toBe('1');
    });
  });

  describe('RDS Instance Configuration', () => {
    it('should create PostgreSQL instance with correct version', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockRdsInstance).toHaveBeenCalledTimes(1);

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.identifier).toBe('healthcare-rds-dev');
      expect(rdsConfig.engine).toBe('postgres');
      expect(rdsConfig.engineVersion).toBe('15.8');
    });

    it('should enable storage encryption with KMS', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.storageEncrypted).toBe(true);
      expect(rdsConfig.kmsKeyId).toBe(mockResources.kmsKey.arn);
    });

    it('should disable public accessibility for security', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.publiclyAccessible).toBe(false);
    });

    it('should configure with appropriate instance class', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.instanceClass).toBe('db.t3.small');
      expect(rdsConfig.allocatedStorage).toBe(20);
      expect(rdsConfig.storageType).toBe('gp3');
    });

    it('should enable backup retention for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.backupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    it('should enable CloudWatch logs exports', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.enabledCloudwatchLogsExports).toContain('postgresql');
    });

    it('should associate with correct security group and subnet group', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.dbSubnetGroupName).toBe(mockResources.dbSubnetGroup.name);
      expect(rdsConfig.vpcSecurityGroupIds).toContain(mockResources.rdsSecurityGroup.id);
    });

    it('should skip final snapshot for destroyability', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.skipFinalSnapshot).toBe(true);
      expect(rdsConfig.deletionProtection).toBe(false);
    });

    it('should use correct database name and credentials', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.dbName).toBe('patientdata');
      expect(rdsConfig.username).toBe('hipaaadmin');
      expect(rdsConfig.password).toBeDefined();
    });
  });

  // ===========================================================================
  // Kinesis Data Stream Tests
  // ===========================================================================

  describe('Kinesis Data Stream Configuration', () => {
    it('should create Kinesis stream with correct configuration', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockKinesisStream).toHaveBeenCalledTimes(1);

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.name).toBe('healthcare-stream-dev');
      expect(kinesisConfig.shardCount).toBe(1);
    });

    it('should enable KMS encryption for data at rest', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.encryptionType).toBe('KMS');
      expect(kinesisConfig.kmsKeyId).toBe(mockResources.kmsKey.id);
    });

    it('should set retention period to 7 days for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.retentionPeriod).toBe(168); // 7 days in hours
    });

    it('should use provisioned stream mode', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.streamModeDetails.streamMode).toBe('PROVISIONED');
    });
  });

  // ===========================================================================
  // IAM Configuration Tests
  // ===========================================================================

  describe('IAM Role Configuration', () => {
    it('should create IAM role for Kinesis processing', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockIamRole).toHaveBeenCalledTimes(1);

      const roleConfig = mockIamRole.mock.calls[0][1];
      expect(roleConfig.name).toBe('healthcare-kinesis-role-dev');
      expect(roleConfig.description).toContain('least privilege');
    });

    it('should allow Lambda service to assume the role', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const roleConfig = mockIamRole.mock.calls[0][1];
      const assumePolicy = JSON.parse(roleConfig.assumeRolePolicy);

      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });
  });

  describe('IAM Policy Configuration', () => {
    it('should create IAM policy with Kinesis permissions', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockRolePolicy).toHaveBeenCalledTimes(1);

      const policyConfig = mockRolePolicy.mock.calls[0][1];
      expect(policyConfig.name).toBe('healthcare-kinesis-policy-dev');
      expect(policyConfig.role).toBe(mockResources.kinesisRole.id);
    });

    it('should grant least-privilege Kinesis access', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const policyConfig = mockRolePolicy.mock.calls[0][1];
      const policy = JSON.parse(policyConfig.policy);

      const kinesisStatement = policy.Statement.find(s =>
        s.Action.some(a => a.startsWith('kinesis:'))
      );

      expect(kinesisStatement).toBeDefined();
      expect(kinesisStatement.Effect).toBe('Allow');
      expect(kinesisStatement.Action).toContain('kinesis:GetRecords');
      expect(kinesisStatement.Action).toContain('kinesis:PutRecord');
      expect(kinesisStatement.Resource).toBe(mockResources.kinesisStream.arn);
    });

    it('should grant KMS decrypt and generate data key permissions', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const policyConfig = mockRolePolicy.mock.calls[0][1];
      const policy = JSON.parse(policyConfig.policy);

      const kmsStatement = policy.Statement.find(s =>
        s.Action.some(a => a.startsWith('kms:'))
      );

      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:GenerateDataKey');
      expect(kmsStatement.Resource).toBe(mockResources.kmsKey.arn);
    });

    it('should grant CloudWatch Logs permissions', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const policyConfig = mockRolePolicy.mock.calls[0][1];
      const policy = JSON.parse(policyConfig.policy);

      const logsStatement = policy.Statement.find(s =>
        s.Action.some(a => a.startsWith('logs:'))
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('logs:CreateLogGroup');
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
    });
  });

  // ===========================================================================
  // CloudWatch Alarms Tests
  // ===========================================================================

  describe('CloudWatch Alarms Configuration', () => {
    it('should create Kinesis iterator age alarm', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockMetricAlarm).toHaveBeenCalledTimes(2);

      const iteratorAlarmConfig = mockMetricAlarm.mock.calls[0][1];
      expect(iteratorAlarmConfig.name).toBe('kinesis-iterator-age-dev');
      expect(iteratorAlarmConfig.metricName).toBe('GetRecords.IteratorAgeMilliseconds');
      expect(iteratorAlarmConfig.namespace).toBe('AWS/Kinesis');
    });

    it('should configure iterator alarm with appropriate threshold', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const iteratorAlarmConfig = mockMetricAlarm.mock.calls[0][1];
      expect(iteratorAlarmConfig.threshold).toBe(60000); // 60 seconds
      expect(iteratorAlarmConfig.comparisonOperator).toBe('GreaterThanThreshold');
      expect(iteratorAlarmConfig.evaluationPeriods).toBe(2);
      expect(iteratorAlarmConfig.period).toBe(300);
    });

    it('should create RDS CPU utilization alarm', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsCpuAlarmConfig = mockMetricAlarm.mock.calls[1][1];
      expect(rdsCpuAlarmConfig.name).toBe('rds-cpu-utilization-dev');
      expect(rdsCpuAlarmConfig.metricName).toBe('CPUUtilization');
      expect(rdsCpuAlarmConfig.namespace).toBe('AWS/RDS');
    });

    it('should configure RDS CPU alarm with 80% threshold', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsCpuAlarmConfig = mockMetricAlarm.mock.calls[1][1];
      expect(rdsCpuAlarmConfig.threshold).toBe(80);
      expect(rdsCpuAlarmConfig.comparisonOperator).toBe('GreaterThanThreshold');
      expect(rdsCpuAlarmConfig.statistic).toBe('Average');
    });

    it('should associate alarms with correct resources', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const iteratorAlarmConfig = mockMetricAlarm.mock.calls[0][1];
      const rdsCpuAlarmConfig = mockMetricAlarm.mock.calls[1][1];

      expect(iteratorAlarmConfig.dimensions.StreamName).toBe(mockResources.kinesisStream.name);
      expect(rdsCpuAlarmConfig.dimensions.DBInstanceIdentifier).toBe(mockResources.rdsInstance.identifier);
    });
  });

  // ===========================================================================
  // Outputs and Exports Tests
  // ===========================================================================

  describe('Stack Outputs', () => {
    it('should register all required outputs', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(stack.registerOutputs).toHaveBeenCalledTimes(1);
      expect(mockOutputs).toHaveProperty('vpcId');
      expect(mockOutputs).toHaveProperty('kmsKeyId');
      expect(mockOutputs).toHaveProperty('kinesisStreamName');
      expect(mockOutputs).toHaveProperty('kinesisStreamArn');
      expect(mockOutputs).toHaveProperty('rdsEndpoint');
      expect(mockOutputs).toHaveProperty('rdsInstanceId');
      expect(mockOutputs).toHaveProperty('auditLogGroupName');
      expect(mockOutputs).toHaveProperty('kinesisRoleArn');
    });

    it('should expose outputs as stack properties', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(stack.vpcId).toBe(mockResources.vpc.id);
      expect(stack.kmsKeyId).toBe(mockResources.kmsKey.id);
      expect(stack.kinesisStreamName).toBe(mockResources.kinesisStream.name);
      expect(stack.kinesisStreamArn).toBe(mockResources.kinesisStream.arn);
      expect(stack.rdsEndpoint).toBe(mockResources.rdsInstance.endpoint);
      expect(stack.rdsInstanceId).toBe(mockResources.rdsInstance.id);
      expect(stack.auditLogGroupName).toBe(mockResources.logGroup.name);
      expect(stack.bucketName).toContain('healthcare-data');
    });
  });

  // ===========================================================================
  // HIPAA Compliance Tests
  // ===========================================================================

  describe('HIPAA Compliance Validation', () => {
    it('should apply HIPAA compliance tags to all resources', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // Check KMS key tags
      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.tags.Compliance).toBe('HIPAA');
      expect(kmsConfig.tags.DataClassification).toBe('PHI');

      // Check other resource tags
      const vpcConfig = mockVpc.mock.calls[0][1];
      expect(vpcConfig.tags.Compliance).toBe('HIPAA');

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.tags.Compliance).toBe('HIPAA');
    });

    it('should ensure all data is encrypted at rest', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // RDS encryption
      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.storageEncrypted).toBe(true);

      // Kinesis encryption
      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.encryptionType).toBe('KMS');

      // CloudWatch Logs encryption
      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.kmsKeyId).toBeDefined();
    });

    it('should enforce encryption in transit (SSL)', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const pgConfig = mockParameterGroup.mock.calls[0][1];
      const sslParam = pgConfig.parameters.find(p => p.name === 'rds.force_ssl');

      expect(sslParam.value).toBe('1');
    });

    it('should enable comprehensive audit logging', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // CloudWatch log group created
      expect(mockLogGroup).toHaveBeenCalled();

      // RDS logging enabled
      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.enabledCloudwatchLogsExports).toBeDefined();

      // Connection logging enabled
      const pgConfig = mockParameterGroup.mock.calls[0][1];
      expect(pgConfig.parameters.some(p => p.name === 'log_connections')).toBe(true);
    });

    it('should implement network isolation', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // Private subnets only
      expect(mockSubnet).toHaveBeenCalledTimes(2);

      // RDS not publicly accessible
      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.publiclyAccessible).toBe(false);

      // Security group restricts access to VPC
      const sgConfig = mockSecurityGroup.mock.calls[0][1];
      expect(sgConfig.ingress[0].cidrBlocks).toEqual(['10.0.0.0/16']);
    });

    it('should configure appropriate data retention periods', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // CloudWatch Logs: 90 days
      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.retentionInDays).toBe(90);

      // Kinesis: 7 days
      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.retentionPeriod).toBe(168);

      // RDS backups: 7 days
      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.backupRetentionPeriod).toBe(7);
    });

    it('should enable KMS key rotation', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.enableKeyRotation).toBe(true);
    });
  });

  // ===========================================================================
  // Resource Parent Relationship Tests
  // ===========================================================================

  describe('Resource Hierarchy', () => {
    it('should set stack as parent for all resources', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // Verify parent is set for key resources
      expect(mockKmsKey.mock.calls[0][2]).toHaveProperty('parent');
      expect(mockVpc.mock.calls[0][2]).toHaveProperty('parent');
      expect(mockRdsInstance.mock.calls[0][2]).toHaveProperty('parent');
      expect(mockKinesisStream.mock.calls[0][2]).toHaveProperty('parent');
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty tags object', () => {
      expect(() => {
        new TapStack('test-stack', { tags: {} });
      }).not.toThrow();
    });

    it('should merge custom tags with compliance tags', () => {
      new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: { CustomTag: 'CustomValue' }
      });

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.tags.CustomTag).toBe('CustomValue');
      expect(kmsConfig.tags.Compliance).toBe('HIPAA');
    });
  });

  // ===========================================================================
  // Integration Points
  // ===========================================================================

  describe('Resource Dependencies', () => {
    it('should ensure proper resource creation order', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      // KMS key should be created before log group
      const kmsCallIndex = mockKmsKey.mock.invocationCallOrder[0];
      const logGroupCallIndex = mockLogGroup.mock.invocationCallOrder[0];
      expect(kmsCallIndex).toBeLessThan(logGroupCallIndex);

      // VPC should be created before subnets
      const vpcCallIndex = mockVpc.mock.invocationCallOrder[0];
      const subnetCallIndex = mockSubnet.mock.invocationCallOrder[0];
      expect(vpcCallIndex).toBeLessThan(subnetCallIndex);
    });
  });
});
