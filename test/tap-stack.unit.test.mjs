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

import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Mock Setup - Must be done before any imports
// =============================================================================

const mockOutputs = {};
const mockResources = {
  kmsKey: { id: 'mock-kms-key-id', arn: 'arn:aws:kms:ap-southeast-1:123456789012:key/mock-key-id', keyId: 'mock-key-id' },
  kmsAlias: { id: 'mock-kms-alias-id', name: 'alias/healthcare-dev' },
  logGroup: { id: 'mock-log-group-id', name: '/aws/healthcare/audit-dev', arn: 'arn:aws:logs:ap-southeast-1:123456789012:log-group:/aws/healthcare/audit-dev' },
  vpc: { id: 'vpc-mock123', cidrBlock: '10.0.0.0/16' },
  privateSubnet1: { id: 'subnet-mock-private-1', availabilityZone: 'us-east-1a' },
  privateSubnet2: { id: 'subnet-mock-private-2', availabilityZone: 'us-east-1b' },
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
jest.unstable_mockModule('@pulumi/pulumi', () => ({
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
}));

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
jest.unstable_mockModule('@pulumi/aws', () => ({
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
const pulumi = await import('@pulumi/pulumi');
const aws = await import('@pulumi/aws');
const { TapStack } = await import('../lib/tap-stack.mjs');

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
    test('should create stack successfully with default configuration', () => {
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

    test('should create stack with custom environment suffix', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toContain('prod');
    });

    test('should create stack with custom tags', () => {
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

    test('should default environment suffix to "dev" when not provided', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack.bucketName).toContain('dev');
    });

    test('should handle empty configuration object', () => {
      expect(() => {
        new TapStack('test-stack', {});
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // KMS Key Tests
  // ===========================================================================

  describe('KMS Key Configuration', () => {
    test('should create KMS key with proper HIPAA configuration', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });

      expect(mockKmsKey).toHaveBeenCalledTimes(1);

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.description).toContain('HIPAA-compliant');
      expect(kmsConfig.description).toContain('test');
      expect(kmsConfig.enableKeyRotation).toBe(true);
      expect(kmsConfig.deletionWindowInDays).toBe(10);
    });

    test('should create KMS key with proper policy for CloudWatch Logs', () => {
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

    test('should create KMS alias with correct name', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      expect(mockKmsAlias).toHaveBeenCalledTimes(1);

      const aliasConfig = mockKmsAlias.mock.calls[0][1];
      expect(aliasConfig.name).toBe('alias/healthcare-prod');
      expect(aliasConfig.targetKeyId).toBe(mockResources.kmsKey.keyId);
    });

    test('should tag KMS key with HIPAA compliance tags', () => {
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
    test('should create log group with KMS encryption', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockLogGroup).toHaveBeenCalledTimes(1);

      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.name).toBe('/aws/healthcare/audit-dev');
      expect(logConfig.kmsKeyId).toBe(mockResources.kmsKey.arn);
    });

    test('should set retention period to 90 days for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.retentionInDays).toBe(90);
    });

    test('should tag log group with compliance tags', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const logConfig = mockLogGroup.mock.calls[0][1];
      expect(logConfig.tags.Compliance).toBe('HIPAA');
      expect(logConfig.tags.DataClassification).toBe('PHI');
    });

    test('should create log group with dependency on KMS key', () => {
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
    test('should create VPC with correct CIDR block', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockVpc).toHaveBeenCalledTimes(1);

      const vpcConfig = mockVpc.mock.calls[0][1];
      expect(vpcConfig.cidrBlock).toBe('10.0.0.0/16');
      expect(vpcConfig.enableDnsHostnames).toBe(true);
      expect(vpcConfig.enableDnsSupport).toBe(true);
    });

    test('should tag VPC with descriptive name', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      const vpcConfig = mockVpc.mock.calls[0][1];
      expect(vpcConfig.tags.Name).toBe('healthcare-vpc-prod');
      expect(vpcConfig.tags.Compliance).toBe('HIPAA');
    });
  });

  describe('Subnet Configuration', () => {
    test('should create two private subnets in different AZs', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockSubnet).toHaveBeenCalledTimes(2);

      const subnet1Config = mockSubnet.mock.calls[0][1];
      const subnet2Config = mockSubnet.mock.calls[1][1];

      expect(subnet1Config.cidrBlock).toBe('10.0.1.0/24');
      expect(subnet2Config.cidrBlock).toBe('10.0.2.0/24');

      expect(subnet1Config.availabilityZone).toBe('us-east-1a');
      expect(subnet2Config.availabilityZone).toBe('us-east-1b');
    });

    test('should associate subnets with VPC', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const subnet1Config = mockSubnet.mock.calls[0][1];
      const subnet2Config = mockSubnet.mock.calls[1][1];

      expect(subnet1Config.vpcId).toBe(mockResources.vpc.id);
      expect(subnet2Config.vpcId).toBe(mockResources.vpc.id);
    });

    test('should tag subnets with descriptive names', () => {
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

  describe('RDS Configuration', () => {
    test('should create RDS instance with encryption', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(mockRdsInstance).toHaveBeenCalledTimes(1);

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.storageEncrypted).toBe(true);
      expect(rdsConfig.kmsKeyId).toBe(mockResources.kmsKey.arn);
    });

    test('should enforce SSL connections for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const pgConfig = mockParameterGroup.mock.calls[0][1];
      const sslParam = pgConfig.parameters.find(p => p.name === 'rds.force_ssl');

      expect(sslParam).toBeDefined();
      expect(sslParam.value).toBe('1');
    });

    test('should disable public accessibility for security', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.publiclyAccessible).toBe(false);
    });

    test('should enable backup retention for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsConfig = mockRdsInstance.mock.calls[0][1];
      expect(rdsConfig.backupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });
  });

  // ===========================================================================
  // Kinesis Tests
  // ===========================================================================

  describe('Kinesis Data Stream Configuration', () => {
    test('should enable KMS encryption for data at rest', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.encryptionType).toBe('KMS');
      expect(kinesisConfig.kmsKeyId).toBe(mockResources.kmsKey.id);
    });

    test('should set retention period to 7 days for HIPAA compliance', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kinesisConfig = mockKinesisStream.mock.calls[0][1];
      expect(kinesisConfig.retentionPeriod).toBe(168); // 7 days in hours
    });
  });

  // ===========================================================================
  // Stack Outputs Tests
  // ===========================================================================

  describe('Stack Outputs', () => {
    test('should register all required outputs', () => {
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

    test('should expose outputs as stack properties', () => {
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
    test('should ensure all data is encrypted at rest', () => {
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

    test('should enable KMS key rotation', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      const kmsConfig = mockKmsKey.mock.calls[0][1];
      expect(kmsConfig.enableKeyRotation).toBe(true);
    });
  });
});