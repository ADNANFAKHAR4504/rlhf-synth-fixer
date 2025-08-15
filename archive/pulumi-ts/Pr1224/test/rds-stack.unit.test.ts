// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  rds: {
    SubnetGroup: jest.fn().mockImplementation((name, args) => ({
      id: `mock-subnet-group-${name}`,
      name: args.name,
    })),
    Instance: jest.fn().mockImplementation((name, args) => ({
      id: `mock-db-instance-${name}`,
      arn: `arn:aws:rds:us-east-1:123456789012:db:${args.identifier}`,
      endpoint: `${args.identifier}.cluster-xyz.us-east-1.rds.amazonaws.com`,
      port: 3306,
    })),
  },
  iam: {
    Role: jest.fn().mockImplementation((name, args) => ({
      id: `mock-role-${name}`,
      name: args.name,
      arn: `arn:aws:iam::123456789012:role/${args.name}`,
    })),
    RolePolicyAttachment: jest.fn().mockImplementation((name, args) => ({
      id: `mock-attachment-${name}`,
    })),
  },
  cloudwatch: {
    MetricAlarm: jest.fn().mockImplementation((name, args) => ({
      id: `mock-alarm-${name}`,
      name: args.name,
      arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${args.name}`,
    })),
  },
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
  secret: jest.fn((value: string) => value),
  output: jest.fn().mockImplementation((value) => ({
    apply: jest.fn().mockImplementation((fn) => fn(value))
  })),
}));

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { RdsStack } from '../lib/stacks/rds-stack';

describe('RdsStack Unit Tests', () => {
  let rdsStack: RdsStack;
  const mockKmsKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/mock-rds-key';
  const mockPrivateSubnetIds = ['subnet-12345', 'subnet-67890'];
  const mockDbSecurityGroupId = 'sg-db123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create RDS stack with required parameters', () => {
      rdsStack = new RdsStack('test-rds', {
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });
      expect(rdsStack).toBeDefined();
    });

    it('should create RDS stack with custom parameters', () => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'prod',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        instanceClass: 'db.t3.large',
        tags: { Environment: 'prod' },
      });
      expect(rdsStack).toBeDefined();
    });

    it('should throw error when insufficient private subnets provided', () => {
      // Mock pulumi.output to simulate the error condition
      const mockOutput = jest.fn().mockImplementation((value) => ({
        apply: jest.fn().mockImplementation((fn) => {
          // Simulate insufficient subnets
          expect(() => fn(['subnet-12345'])).toThrow('RDS needs at least two private subnets; got 1.');
        })
      }));
      
      // Temporarily replace the mock
      const originalMock = require('@pulumi/pulumi').output;
      require('@pulumi/pulumi').output = mockOutput;
      
      try {
        new RdsStack('test-rds-error', {
          privateSubnetIds: ['subnet-12345'], // Only one subnet
          dbSecurityGroupId: mockDbSecurityGroupId,
          rdsKmsKeyArn: mockKmsKeyArn,
        });
      } finally {
        // Restore original mock
        require('@pulumi/pulumi').output = originalMock;
      }
    });

    it('should throw error when no private subnets provided', () => {
      // Mock pulumi.output to simulate the error condition
      const mockOutput = jest.fn().mockImplementation((value) => ({
        apply: jest.fn().mockImplementation((fn) => {
          // Simulate no subnets
          expect(() => fn([])).toThrow('RDS needs at least two private subnets; got 0.');
        })
      }));
      
      // Temporarily replace the mock
      const originalMock = require('@pulumi/pulumi').output;
      require('@pulumi/pulumi').output = mockOutput;
      
      try {
        new RdsStack('test-rds-error-empty', {
          privateSubnetIds: [], // No subnets
          dbSecurityGroupId: mockDbSecurityGroupId,
          rdsKmsKeyArn: mockKmsKeyArn,
        });
      } finally {
        // Restore original mock
        require('@pulumi/pulumi').output = originalMock;
      }
    });

    it('should throw error when null private subnets provided', () => {
      // Mock pulumi.output to simulate the error condition
      const mockOutput = jest.fn().mockImplementation((value) => ({
        apply: jest.fn().mockImplementation((fn) => {
          // Simulate null subnets
          expect(() => fn(null)).toThrow('RDS needs at least two private subnets; got 0.');
        })
      }));
      
      // Temporarily replace the mock
      const originalMock = require('@pulumi/pulumi').output;
      require('@pulumi/pulumi').output = mockOutput;
      
      try {
        new RdsStack('test-rds-error-null', {
          privateSubnetIds: null as any, // Null subnets
          dbSecurityGroupId: mockDbSecurityGroupId,
          rdsKmsKeyArn: mockKmsKeyArn,
        });
      } finally {
        // Restore original mock
        require('@pulumi/pulumi').output = originalMock;
      }
    });
  });

  describe('DB Subnet Group Creation', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        tags: { Environment: 'test' },
      });
    });

    it('should create DB subnet group with correct configuration', () => {
      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(
        'tap-db-subnet-group-test',
        expect.objectContaining({
          name: 'tap-db-subnet-group-test',
          subnetIds: mockPrivateSubnetIds,
          tags: expect.objectContaining({
            Name: 'tap-db-subnet-group-test',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('RDS Instance Creation', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        instanceClass: 'db.t3.small',
        tags: { Environment: 'test' },
      });
    });

    it('should create RDS instance with correct basic configuration', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        'tap-db-test',
        expect.objectContaining({
          identifier: 'tap-db-test',
          instanceClass: 'db.t3.small',
          engine: 'mysql',
          engineVersion: '8.0',
          allocatedStorage: 20,
          storageType: 'gp3',
          storageEncrypted: true,
          kmsKeyId: mockKmsKeyArn,
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create RDS instance with database configuration', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dbName: 'tapdb',
          username: 'admin',
          manageMasterUserPassword: true,
          vpcSecurityGroupIds: [mockDbSecurityGroupId],
        }),
        expect.any(Object)
      );
    });

    it('should create RDS instance with backup configuration', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
          skipFinalSnapshot: false,
          finalSnapshotIdentifier: 'tap-db-final-snapshot-test',
          deleteAutomatedBackups: false,
        }),
        expect.any(Object)
      );
    });

    it('should create RDS instance with monitoring configuration', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
          monitoringInterval: 60,
        }),
        expect.any(Object)
      );
    });

    it('should use default instance class when not provided', () => {
      rdsStack = new RdsStack('test-rds-default', {
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          instanceClass: 'db.t3.micro',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Monitoring Role Creation', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should create monitoring role for RDS enhanced monitoring', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'tap-rds-monitoring-role-test',
        expect.objectContaining({
          name: 'tap-rds-monitoring-role-test',
          assumeRolePolicy: expect.stringContaining('monitoring.rds.amazonaws.com'),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should attach enhanced monitoring policy to role', () => {
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        'tap-rds-monitoring-attachment-test',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in resource names', () => {
      const environmentSuffix = 'staging';
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix,
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(
        `tap-db-subnet-group-${environmentSuffix}`,
        expect.objectContaining({
          name: `tap-db-subnet-group-${environmentSuffix}`,
        }),
        expect.any(Object)
      );

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        `tap-db-${environmentSuffix}`,
        expect.objectContaining({
          identifier: `tap-db-${environmentSuffix}`,
        }),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix,
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-db-${environmentSuffix}`,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('CloudWatch Database Insights', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should create CPU utilization alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'tap-db-cpu-alarm-test',
        expect.objectContaining({
          name: 'tap-db-cpu-utilization-test',
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          threshold: 80,
          comparisonOperator: 'GreaterThanThreshold',
        }),
        expect.any(Object)
      );
    });

    it('should create database connections alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'tap-db-connections-alarm-test',
        expect.objectContaining({
          name: 'tap-db-connections-test',
          metricName: 'DatabaseConnections',
          namespace: 'AWS/RDS',
          threshold: 40,
          comparisonOperator: 'GreaterThanThreshold',
        }),
        expect.any(Object)
      );
    });

    it('should create free storage space alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'tap-db-storage-alarm-test',
        expect.objectContaining({
          name: 'tap-db-free-storage-test',
          metricName: 'FreeStorageSpace',
          namespace: 'AWS/RDS',
          threshold: 2000000000,
          comparisonOperator: 'LessThanThreshold',
        }),
        expect.any(Object)
      );
    });

    it('should create read latency alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'tap-db-read-latency-alarm-test',
        expect.objectContaining({
          name: 'tap-db-read-latency-test',
          metricName: 'ReadLatency',
          namespace: 'AWS/RDS',
          threshold: 0.2,
          comparisonOperator: 'GreaterThanThreshold',
        }),
        expect.any(Object)
      );
    });

    it('should create write latency alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'tap-db-write-latency-alarm-test',
        expect.objectContaining({
          name: 'tap-db-write-latency-test',
          metricName: 'WriteLatency',
          namespace: 'AWS/RDS',
          threshold: 0.2,
          comparisonOperator: 'GreaterThanThreshold',
        }),
        expect.any(Object)
      );
    });

    it('should create all alarms with proper dimensions', () => {
      const alarmCalls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      
      alarmCalls.forEach(call => {
        const [name, config] = call;
        expect(config.dimensions).toHaveProperty('DBInstanceIdentifier');
        expect(config.dimensions.DBInstanceIdentifier).toBeDefined();
      });
    });

    it('should create alarms with appropriate evaluation periods', () => {
      const alarmCalls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      
      // Most alarms should have 2 evaluation periods, storage alarm should have 1
      alarmCalls.forEach(call => {
        const [name, config] = call;
        if (name.includes('storage')) {
          expect(config.evaluationPeriods).toBe(1);
        } else {
          expect(config.evaluationPeriods).toBe(2);
        }
      });
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
      });
    });

    it('should enable storage encryption', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          storageEncrypted: true,
          kmsKeyId: mockKmsKeyArn,
        }),
        expect.any(Object)
      );
    });

    it('should use secure password handling', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          manageMasterUserPassword: true,
          masterUserSecretKmsKeyId: mockKmsKeyArn,
        }),
        expect.any(Object)
      );
    });

    it('should configure proper backup retention', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backupRetentionPeriod: 7,
          skipFinalSnapshot: false,
          deleteAutomatedBackups: false,
        }),
        expect.any(Object)
      );
    });
  });
});
