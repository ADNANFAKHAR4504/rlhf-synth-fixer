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
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
  secret: jest.fn((value: string) => value),
}));

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { RdsStack } from '../lib/stacks/rds-stack';

describe('RdsStack Unit Tests', () => {
  let rdsStack: RdsStack;
  const mockKmsKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/mock-rds-key';
  const mockPrivateSubnetIds = ['subnet-12345', 'subnet-67890'];
  const mockDbSecurityGroupId = 'sg-db123456';
  const mockDbSecretArn = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:mock-secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create RDS stack with required parameters', () => {
      rdsStack = new RdsStack('test-rds', {
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        dbSecretArn: mockDbSecretArn,
      });
      expect(rdsStack).toBeDefined();
    });

    it('should create RDS stack with custom parameters', () => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'prod',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        dbSecretArn: mockDbSecretArn,
        instanceClass: 'db.t3.large',
        tags: { Environment: 'prod' },
      });
      expect(rdsStack).toBeDefined();
    });
  });

  describe('DB Subnet Group Creation', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        dbSecretArn: mockDbSecretArn,
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
        dbSecretArn: mockDbSecretArn,
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
          performanceInsightsEnabled: true,
          performanceInsightsKmsKeyId: mockKmsKeyArn,
          performanceInsightsRetentionPeriod: 7,
        }),
        expect.any(Object)
      );
    });

    it('should use default instance class when not provided', () => {
      rdsStack = new RdsStack('test-rds-default', {
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        dbSecretArn: mockDbSecretArn,
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
        dbSecretArn: mockDbSecretArn,
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
        dbSecretArn: mockDbSecretArn,
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
        dbSecretArn: mockDbSecretArn,
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

  describe('Security Configuration', () => {
    beforeEach(() => {
      rdsStack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: mockPrivateSubnetIds,
        dbSecurityGroupId: mockDbSecurityGroupId,
        rdsKmsKeyArn: mockKmsKeyArn,
        dbSecretArn: mockDbSecretArn,
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

    it('should enable Performance Insights encryption', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          performanceInsightsEnabled: true,
          performanceInsightsKmsKeyId: mockKmsKeyArn,
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
