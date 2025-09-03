import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { WebAppInfrastructure } from '../lib/webapp-infrastructure';

// Mock Pulumi runtime and core classes
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts: any) {
    this.registerOutputs = jest.fn();
    this.urn = `urn:pulumi:test::test::${type}::${name}`;
    return this;
  }),
  Output: {
    create: jest.fn((value) => ({ 
      apply: jest.fn((fn) => fn(value)),
      promise: () => Promise.resolve(value)
    })),
  },
  output: jest.fn((value) => ({ 
    apply: jest.fn((fn) => fn(value)),
    promise: () => Promise.resolve(value)
  })),
  all: jest.fn((outputs) => ({ 
    apply: jest.fn((fn) => fn(outputs)),
    promise: () => Promise.resolve(outputs)
  })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn((key) => {
      const configs: { [key: string]: any } = {
        'allowedSshCidrs': ['203.26.56.90/32'],
        'instanceType': 't3.micro',
        'aws:region': 'ap-south-1'
      };
      return configs[key];
    }),
    getObject: jest.fn((key) => {
      if (key === 'allowedSshCidrs') return ['203.26.56.90/32'];
      return undefined;
    }),
    require: jest.fn(),
    getBoolean: jest.fn(),
  })),
  getStack: jest.fn(() => 'test-stack'),
  getProject: jest.fn(() => 'test-project'),
  interpolate: jest.fn((template: string) => template),
  secret: jest.fn((value: string) => value),
}));

// Mock AWS Provider and functions
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    this.region = args?.region || 'ap-south-1';
    this.id = `aws-provider-${name}`;
    return this;
  }),
  getAvailabilityZones: jest.fn().mockImplementation(() => 
    Promise.resolve({
      names: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
      zoneIds: ['usw2-az1', 'usw2-az2', 'usw2-az3']
    })
  ),
  ec2: {
    Vpc: jest.fn(),
    Subnet: jest.fn(),
    InternetGateway: jest.fn(),
    RouteTable: jest.fn(),
    Route: jest.fn(),
    RouteTableAssociation: jest.fn(),
    SecurityGroup: jest.fn(),
    SecurityGroupRule: jest.fn(),
    Instance: jest.fn(),
    KeyPair: jest.fn(),
  },
  s3: {
    Bucket: jest.fn(),
    BucketPolicy: jest.fn(),
    BucketVersioning: jest.fn(),
    BucketServerSideEncryptionConfiguration: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
  },
  iam: {
    Role: jest.fn(),
    RolePolicyAttachment: jest.fn(),
    InstanceProfile: jest.fn(),
  },
  rds: {
    SubnetGroup: jest.fn(),
  }
}));

// Mock WebAppInfrastructure
jest.mock('../lib/webapp-infrastructure', () => ({
  WebAppInfrastructure: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    this.vpcId = pulumi.output('vpc-12345');
    this.publicSubnetIds = pulumi.output(['subnet-pub-12345', 'subnet-pub-67890']);
    this.privateSubnetIds = pulumi.output(['subnet-priv-12345', 'subnet-priv-67890']);
    this.webSecurityGroupId = pulumi.output('sg-web-12345');
    this.databaseSecurityGroupId = pulumi.output('sg-db-12345');
    this.webServerInstanceProfileName = pulumi.output('webapp-instance-profile');
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
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {},
        undefined
      );
      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'dev',
          region: 'us-west-2',
          tags: {}
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should create TapStack with custom environment suffix', () => {
      const args = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Project: 'tap'
        }
      };

      const stack = new TapStack('test-stack', args);

      expect(stack).toBeInstanceOf(TapStack);
      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'prod',
          region: 'us-west-2',
          tags: args.tags
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should use default environment suffix when not provided', () => {
      new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'dev'
        }),
        expect.any(Object)
      );
    });

    it('should handle custom tags', () => {
      const customTags = {
        Environment: 'test',
        Project: 'tap',
        Owner: 'engineering',
        CostCenter: '12345'
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags
      });

      expect(stack).toBeInstanceOf(TapStack);
      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          tags: customTags
        }),
        expect.any(Object)
      );
    });

    it('should always use us-west-2 region (hardcoded)', () => {
      new TapStack('test-stack', {});

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          region: 'us-west-2'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Infrastructure Integration', () => {
    it('should call WebAppInfrastructure with correct parameters', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'prod',
          region: 'us-west-2',
          tags: {}
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should expose all infrastructure outputs', () => {
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

    it('should register outputs correctly', () => {
      const stack = new TapStack('test-stack', {});

      expect((stack as any).registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.any(Object),
          publicSubnetIds: expect.any(Object),
          privateSubnetIds: expect.any(Object),
          webSecurityGroupId: expect.any(Object),
          databaseSecurityGroupId: expect.any(Object),
          webServerInstanceProfileName: expect.any(Object),
          databaseSubnetGroupName: expect.any(Object),
          applicationDataBucketName: expect.any(Object),
          backupBucketName: expect.any(Object),
        })
      );
    });

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
          region: 'us-west-2',
          tags: args.tags,
        }),
        expect.objectContaining({
          parent: expect.any(Object),
        })
      );
    });

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
  });

  describe('Error Handling', () => {
    it('should handle infrastructure creation errors', () => {
      (WebAppInfrastructure as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Infrastructure creation failed');
      });

      expect(() => {
        new TapStack('test-stack', {});
      }).toThrow('Infrastructure creation failed');
    });

    it('should validate environment suffix', () => {
      expect(() => {
        new TapStack('test-stack', { environmentSuffix: 'valid-env' });
      }).not.toThrow();
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

  describe('Environment-specific Configuration', () => {
    it('should configure development environment', () => {
      new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'dev'
        }),
        expect.any(Object)
      );
    });

    it('should configure production environment', () => {
      new TapStack('test-stack', { environmentSuffix: 'prod' });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'prod'
        }),
        expect.any(Object)
      );
    });

    it('should configure staging environment', () => {
      new TapStack('test-stack', { environmentSuffix: 'staging' });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'staging'
        }),
        expect.any(Object)
      );
    });

    it('should handle custom environment names', () => {
      new TapStack('test-stack', { environmentSuffix: 'test-env-123' });

      expect(WebAppInfrastructure).toHaveBeenCalledWith(
        'webapp-infra',
        expect.objectContaining({
          environmentSuffix: 'test-env-123'
        }),
        expect.any(Object)
      );
    });

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

  describe('Output Validation', () => {
    it('should have Pulumi Output behavior for all outputs', () => {
      const stack = new TapStack('test-stack', {});

      // Verify all outputs have apply methods (Pulumi Output behavior)
      expect(typeof stack.vpcId.apply).toBe('function');
      expect(typeof stack.publicSubnetIds.apply).toBe('function');
      expect(typeof stack.privateSubnetIds.apply).toBe('function');
      expect(typeof stack.webSecurityGroupId.apply).toBe('function');
      expect(typeof stack.databaseSecurityGroupId.apply).toBe('function');
      expect(typeof stack.webServerInstanceProfileName.apply).toBe('function');
      expect(typeof stack.databaseSubnetGroupName.apply).toBe('function');
      expect(typeof stack.applicationDataBucketName.apply).toBe('function');
      expect(typeof stack.backupBucketName.apply).toBe('function');
    });

    it('should expose correct output types', () => {
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

  describe('Component Resource Behavior', () => {
    it('should inherit from ComponentResource', () => {
      const stack = new TapStack('test-stack', {});

      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {},
        undefined
      );
    });

    it('should handle resource options', () => {
      const resourceOptions = {
        protect: true,
        deleteBeforeReplace: true
      };

      const stack = new TapStack('test-stack', {}, resourceOptions);

      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {},
        resourceOptions
      );
    });

    it('should register outputs with correct structure', () => {
      const stack = new TapStack('test-stack', {});

      expect((stack as any).registerOutputs).toHaveBeenCalledTimes(1);
      const registeredOutputs = ((stack as any).registerOutputs as jest.Mock).mock.calls[0][0];
      
      expect(registeredOutputs).toHaveProperty('vpcId');
      expect(registeredOutputs).toHaveProperty('publicSubnetIds');
      expect(registeredOutputs).toHaveProperty('privateSubnetIds');
      expect(registeredOutputs).toHaveProperty('webSecurityGroupId');
      expect(registeredOutputs).toHaveProperty('databaseSecurityGroupId');
      expect(registeredOutputs).toHaveProperty('webServerInstanceProfileName');
      expect(registeredOutputs).toHaveProperty('databaseSubnetGroupName');
      expect(registeredOutputs).toHaveProperty('applicationDataBucketName');
      expect(registeredOutputs).toHaveProperty('backupBucketName');
    });
  });

  describe('WebAppInfrastructure Mocking Validation', () => {
    it('should properly mock WebAppInfrastructure', () => {
      expect(WebAppInfrastructure).toBeDefined();
      expect(typeof WebAppInfrastructure).toBe('function');
    });

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

    it('should return consistent mock values', () => {
      const stack1 = new TapStack('test-stack-1', {});
      const stack2 = new TapStack('test-stack-2', {});

      // Both stacks should have the same mock structure (functions exist)
      expect(typeof stack1.vpcId.apply).toBe('function');
      expect(typeof stack2.vpcId.apply).toBe('function');
      expect(typeof stack1.publicSubnetIds.apply).toBe('function');
      expect(typeof stack2.publicSubnetIds.apply).toBe('function');
      expect(typeof stack1.privateSubnetIds.apply).toBe('function');
      expect(typeof stack2.privateSubnetIds.apply).toBe('function');
    });
  });

  describe('AWS Provider Mocking', () => {
    it('should properly mock AWS provider', () => {
      expect(aws.Provider).toBeDefined();
      expect(typeof aws.Provider).toBe('function');
    });

    it('should mock getAvailabilityZones function', () => {
      expect(aws.getAvailabilityZones).toBeDefined();
      expect(typeof aws.getAvailabilityZones).toBe('function');
    });

    it('should mock AWS resource constructors', () => {
      expect(aws.ec2.Vpc).toBeDefined();
      expect(aws.ec2.Subnet).toBeDefined();
      expect(aws.ec2.SecurityGroup).toBeDefined();
      expect(aws.s3.Bucket).toBeDefined();
      expect(aws.iam.Role).toBeDefined();
    });
  });
});
