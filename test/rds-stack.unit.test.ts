import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { RdsStack } from '../lib/rds-stack';
import { VpcStack } from '../lib/vpc-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

describe('RdsStack', () => {
  let stack: RdsStack;
  let mockVpcStack: VpcStack;
  const mockDbInstance = {
    id: pulumi.Output.create('db-instance-id'),
    endpoint: pulumi.Output.create('db.example.com:3306'),
    port: pulumi.Output.create(3306),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock VPC Stack
    mockVpcStack = {
      dbSubnetGroup: {
        name: pulumi.Output.create('test-subnet-group'),
      },
      dbSecurityGroup: {
        id: pulumi.Output.create('sg-123'),
      },
    } as any;

    // Mock AWS RDS Instance
    jest
      .spyOn(aws.rds, 'Instance')
      .mockImplementation((() => mockDbInstance) as any);
  });

  describe('constructor', () => {
    it('should create RDS instance with correct configuration', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-test'),
        expect.objectContaining({
          identifier: 'tap-db-test',
          engine: 'mysql',
          engineVersion: '8.0',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          storageType: 'gp2',
          storageEncrypted: true,
        }),
        expect.any(Object)
      );
    });

    it('should configure database credentials', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dbName: 'tapapp',
          username: 'admin',
          password: 'changeme123!',
        }),
        expect.any(Object)
      );
    });

    it('should configure backup settings with 7 days retention', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
        }),
        expect.any(Object)
      );
    });

    it('should use VPC network configuration', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dbSubnetGroupName: mockVpcStack.dbSubnetGroup.name,
          vpcSecurityGroupIds: [mockVpcStack.dbSecurityGroup.id],
        }),
        expect.any(Object)
      );
    });

    it('should disable deletion protection for development', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          deletionProtection: false,
          skipFinalSnapshot: true,
        }),
        expect.any(Object)
      );
    });

    it('should use gp2 storage type as required', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          storageType: 'gp2',
        }),
        expect.any(Object)
      );
    });

    it('should expose database endpoint', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(stack.dbEndpoint).toBeDefined();
      expect(stack.dbEndpoint).toBe(mockDbInstance.endpoint);
    });

    it('should expose database instance', () => {
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        vpcStack: mockVpcStack,
      });

      expect(stack.dbInstance).toBeDefined();
      expect(stack.dbInstance).toBe(mockDbInstance);
    });

    it('should apply tags to RDS instance', () => {
      const tags = { Environment: 'test', Project: 'tap' };
      stack = new RdsStack('test-rds', {
        environmentSuffix: 'test',
        tags,
        vpcStack: mockVpcStack,
      });

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'tap-db-test',
          }),
        }),
        expect.any(Object)
      );
    });
  });
});
