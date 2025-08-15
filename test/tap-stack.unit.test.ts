import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { WebAppInfrastructure } from '../lib/webapp-infrastructure';

// Mock Pulumi
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts: any) {
    this.registerOutputs = jest.fn();
    return this;
  }),
  Output: {
    create: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  },
  output: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  all: jest.fn((outputs) => ({ apply: jest.fn((fn) => fn(outputs)) })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn((key) => {
      if (key === 'stateBucketName') return 'test-state-bucket';
      return undefined;
    }),
  })),
  getStack: jest.fn(() => 'test-stack'),
}));

// Mock AWS
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    this.region = args?.region || 'us-east-1';
    return this;
  }),
}));

// Mock WebAppInfrastructure
jest.mock('../lib/webapp-infrastructure', () => ({
  WebAppInfrastructure: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    this.vpcId = pulumi.output('vpc-12345');
    this.publicSubnetIds = pulumi.output(['subnet-12345', 'subnet-67890']);
    this.privateSubnetIds = pulumi.output(['subnet-abcde', 'subnet-fghij']);
    this.webSecurityGroupId = pulumi.output('sg-web123');
    this.databaseSecurityGroupId = pulumi.output('sg-db456');
    this.webServerInstanceProfileName = pulumi.output('webapp-profile');
    this.databaseSubnetGroupName = pulumi.output('webapp-db-subnet-group');
    this.applicationDataBucketName = pulumi.output('webapp-app-data-bucket');
    this.backupBucketName = pulumi.output('webapp-backup-bucket');
    this.region = args.region || 'us-west-2';
    return this;
  })
}));

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create TapStack with default arguments', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeInstanceOf(TapStack);
      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'dev',
          region: 'us-west-2', // TapStack hardcodes this region
        }),
        expect.objectContaining({
          parent: expect.any(Object),
        })
      );
    });

    it('should create TapStack with custom arguments', () => {
      const customArgs = {
        environmentSuffix: 'prod',
        stateBucketName: 'custom-state-bucket',
        tags: {
          Project: 'CustomProject',
          Owner: 'TestTeam',
        },
      };

      const stack = new TapStack('test-stack', customArgs);

      expect(stack).toBeInstanceOf(TapStack);
      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'prod',
          region: 'us-west-2', // TapStack hardcodes this region
          tags: customArgs.tags,
        }),
        expect.objectContaining({
          parent: expect.any(Object),
        })
      );
    });

    it('should always use us-west-2 region (hardcoded)', () => {
      new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          region: 'us-west-2',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Infrastructure Integration', () => {
    it('should pass correct arguments to WebAppInfrastructure', () => {
      const args = {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Project: 'webapp',
        },
      };

      new TapStack('test-stack', args);

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'staging',
          region: 'us-west-2', // Always hardcoded
          tags: args.tags,
        }),
        expect.objectContaining({
          parent: expect.any(Object),
        })
      );
    });

    it('should expose infrastructure outputs', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.databaseSecurityGroupId).toBeDefined();
      expect(stack.webServerInstanceProfileName).toBeDefined();
      expect(stack.databaseSubnetGroupName).toBeDefined();
      expect(stack.applicationDataBucketName).toBeDefined();
      expect(stack.backupBucketName).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create infrastructure with proper parent relationship', () => {
      const stack = new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.any(Object),
        expect.objectContaining({
          parent: stack,
        })
      );
    });

    it('should register outputs correctly', () => {
      const stack = new TapStack('test-stack', {});

      // Note: registerOutputs is protected, so we can't directly test it
      // Instead, we verify that the stack has the expected outputs
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.databaseSecurityGroupId).toBeDefined();
      expect(stack.webServerInstanceProfileName).toBeDefined();
      expect(stack.databaseSubnetGroupName).toBeDefined();
      expect(stack.applicationDataBucketName).toBeDefined();
      expect(stack.backupBucketName).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle infrastructure creation errors', () => {
      // Mock WebAppInfrastructure to throw error
      (WebAppInfrastructure as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Infrastructure creation failed');
      });

      expect(() => {
        new TapStack('test-stack', {});
      }).toThrow('Infrastructure creation failed');
    });

    it('should use default environment suffix when not provided', () => {
      new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'dev',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Tagging and Metadata', () => {
    it('should propagate tags to infrastructure', () => {
      const tags = {
        Environment: 'test',
        Project: 'webapp',
        Owner: 'engineering',
        CostCenter: '12345',
      };

      new TapStack('test-stack', { tags });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          tags,
        }),
        expect.any(Object)
      );
    });

    it('should handle empty tags', () => {
      new TapStack('test-stack', { tags: {} });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          tags: {},
        }),
        expect.any(Object)
      );
    });

    it('should use empty tags object when tags not provided', () => {
      new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          tags: {},
        }),
        expect.any(Object)
      );
    });
  });

  describe('WebAppInfrastructure Mocking Validation', () => {
    it('should properly mock WebAppInfrastructure outputs', () => {
      const stack = new TapStack('test-stack', {});

      // Verify all expected outputs are mocked
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.databaseSecurityGroupId).toBeDefined();
      expect(stack.webServerInstanceProfileName).toBeDefined();
      expect(stack.databaseSubnetGroupName).toBeDefined();
      expect(stack.applicationDataBucketName).toBeDefined();
      expect(stack.backupBucketName).toBeDefined();

      // Verify outputs have apply methods (Pulumi Output behavior)
      expect(typeof stack.vpcId.apply).toBe('function');
      expect(typeof stack.publicSubnetIds.apply).toBe('function');
      expect(typeof stack.privateSubnetIds.apply).toBe('function');
    });

    it('should mock WebAppInfrastructure constructor arguments correctly', () => {
      const args = {
        environmentSuffix: 'test',
        tags: { Test: 'Value' },
      };

      new TapStack('test-stack', args);

      const mockCall = (WebAppInfrastructure as unknown as jest.Mock).mock.calls[0];
      expect(mockCall[0]).toBe('webapp-infra');
      expect(mockCall[1]).toMatchObject({
        environmentSuffix: 'test',
        region: 'us-west-2',
        tags: { Test: 'Value' },
      });
      expect(mockCall[2]).toMatchObject({
        parent: expect.any(Object),
      });
    });
  });

  describe('Configuration Behavior', () => {
    it('should handle different environment suffixes', () => {
      const environments = ['dev', 'staging', 'prod', 'test'];

      environments.forEach(env => {
        jest.clearAllMocks();
        new TapStack('test-stack', { environmentSuffix: env });

        expect(WebAppInfrastructure).toHaveBeenCalledWith(
          'webapp-infra',
          expect.objectContaining({
            environmentSuffix: env,
          }),
          expect.any(Object)
        );
      });
    });

    it('should maintain consistent region regardless of input', () => {
      // Even if we try to pass a different region, TapStack hardcodes us-west-2
      new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          region: 'us-west-2',
        }),
        expect.any(Object)
      );
    });
  });
});
