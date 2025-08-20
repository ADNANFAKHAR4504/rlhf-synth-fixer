// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  runtime: {
    setMocks: jest.fn(),
  },
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {
      // Mock implementation
    }
    registerOutputs(outputs: any) {
      // Mock implementation
    }
  },
  all: jest.fn().mockImplementation(values => Promise.resolve(values)),
  Output: jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'region') return 'ap-south-1';
      if (key === 'vpcCidr') return '10.0.0.0/16';
      return undefined;
    }),
    getObject: jest.fn().mockImplementation((key: string) => {
      const mockConfigs: Record<string, any> = {
        availabilityZones: ['ap-south-1a', 'ap-south-1b'],
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        rdsConfig: {
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          engine: 'mysql',
          engineVersion: '8.0',
          dbName: 'appdb',
          username: 'admin',
        },
        s3Config: {
          lifecyclePolicies: {
            transitionToIa: 30,
            transitionToGlacier: 90,
            expiration: 365,
          },
        },
        tags: {
          Environment: 'test',
          Project: 'TAP',
          Owner: 'DevTeam',
        },
      };
      return mockConfigs[key];
    }),
    require: jest.fn(),
    getBoolean: jest.fn(),
  })),
  interpolate: jest.fn((template: string) => template),
  secret: jest.fn((value: string) => value),
  output: jest.fn().mockImplementation(value => ({
    apply: (fn: any) => fn(value),
  })),
}));

// Mock the Infrastructure class
class MockInfrastructure {
  vpcId = 'mock-vpc-id';
  publicSubnetIds = ['mock-public-subnet-1', 'mock-public-subnet-2'];
  privateSubnetIds = ['mock-private-subnet-1', 'mock-private-subnet-2'];
  rdsEndpoint = 'mock-rds-endpoint.amazonaws.com';
  s3BucketName = 'mock-s3-bucket-name';
  applicationRoleArn = 'arn:aws:iam::123456789012:role/mock-app-role';
  kmsKeyId = 'mock-kms-key-id';
  instanceProfileArn = 'arn:aws:iam::123456789012:instance-profile/mock-profile';
  webSecurityGroupId = 'mock-web-sg-id';
  appSecurityGroupId = 'mock-app-sg-id';
  securityAlertsTopicArn = 'arn:aws:sns:ap-south-1:123456789012:mock-topic';
  
  constructor(...args: any[]) {
    // Mock constructor
  }
}

const InfrastructureConstructorSpy = jest.fn();

jest.mock('../lib/infrastructure', () => ({
  Infrastructure: class extends MockInfrastructure {
    constructor(...args: any[]) {
      super();
      InfrastructureConstructorSpy(...args);
    }
  },
  createResourceName: jest.fn((baseName: string, region: string, environment: string) => 
    `${baseName}-${environment}-${region}`
  ),
  createTags: jest.fn((baseTags: Record<string, string>, region: string) => ({
    ...baseTags,
    Region: region,
    ManagedBy: 'Pulumi',
  })),
}));

import { Infrastructure } from '../lib/infrastructure';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create TapStack with default arguments', () => {
      const stack = new TapStack('test-stack', {});
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          region: 'ap-south-1',
          availabilityZones: ['ap-south-1a', 'ap-south-1b'],
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'TAP',
            Owner: 'DevTeam',
          }),
        }),
        'dev',
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create TapStack with custom environment suffix', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };
      
      const stack = new TapStack('test-stack', args);
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'prod',
          }),
        }),
        'prod',
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create TapStack with custom tags', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: {
          CustomTag: 'CustomValue',
          Team: 'Backend',
        },
      };
      
      const stack = new TapStack('test-stack', args);
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging',
            CustomTag: 'CustomValue',
            Team: 'Backend',
          }),
        }),
        'staging',
        expect.objectContaining({ parent: stack })
      );
    });

    it('should merge custom tags with default tags correctly', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'test',
        tags: {
          Project: 'CustomProject',
          NewTag: 'NewValue',
        },
      };
      
      const stack = new TapStack('test-stack', args);
      
      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'test',
            Project: 'CustomProject',
            NewTag: 'NewValue',
          }),
        }),
        'test',
        expect.objectContaining({ parent: stack })
      );
    });
  });

  describe('Properties', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-stack', {});
    });

    it('should expose infrastructure property', () => {
      expect(stack.infrastructure).toBeDefined();
      expect(stack.infrastructure).toBeInstanceOf(Infrastructure);
    });

    it('should expose vpcId output', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcId).toBe('mock-vpc-id');
    });

    it('should expose publicSubnetIds output', () => {
      expect(stack.publicSubnetIds).toBeDefined();
      expect(Array.isArray(stack.publicSubnetIds)).toBe(true);
      expect(stack.publicSubnetIds).toHaveLength(2);
      expect(stack.publicSubnetIds).toEqual(['mock-public-subnet-1', 'mock-public-subnet-2']);
    });

    it('should expose privateSubnetIds output', () => {
      expect(stack.privateSubnetIds).toBeDefined();
      expect(Array.isArray(stack.privateSubnetIds)).toBe(true);
      expect(stack.privateSubnetIds).toHaveLength(2);
      expect(stack.privateSubnetIds).toEqual(['mock-private-subnet-1', 'mock-private-subnet-2']);
    });

    it('should expose rdsEndpoint output', () => {
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.rdsEndpoint).toBe('mock-rds-endpoint.amazonaws.com');
    });

    it('should expose s3BucketName output', () => {
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.s3BucketName).toBe('mock-s3-bucket-name');
    });

    it('should expose applicationRoleArn output', () => {
      expect(stack.applicationRoleArn).toBeDefined();
      expect(stack.applicationRoleArn).toBe('arn:aws:iam::123456789012:role/mock-app-role');
    });

    it('should expose kmsKeyId output', () => {
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyId).toBe('mock-kms-key-id');
    });

    it('should expose instanceProfileArn output', () => {
      expect(stack.instanceProfileArn).toBeDefined();
      expect(stack.instanceProfileArn).toBe('arn:aws:iam::123456789012:instance-profile/mock-profile');
    });
  });

  describe('Configuration Handling', () => {
    it('should use default configuration when no config is provided', () => {
      const mockConfig = require('@pulumi/pulumi').Config;
      mockConfig.mockImplementation(() => ({
        get: jest.fn().mockReturnValue(undefined),
        getObject: jest.fn().mockReturnValue(undefined),
      }));

      const stack = new TapStack('test-stack', {});

      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          region: 'ap-south-1',
          vpcCidr: '10.0.0.0/16',
          availabilityZones: ['ap-south-1a', 'ap-south-1b'],
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        }),
        'dev',
        expect.objectContaining({ parent: stack })
      );
    });

    it('should handle custom region configuration', () => {
      const mockConfig = require('@pulumi/pulumi').Config;
      mockConfig.mockImplementation(() => ({
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'region') return 'us-west-2';
          return undefined;
        }),
        getObject: jest.fn().mockReturnValue(undefined),
      }));

      const stack = new TapStack('test-stack', {});

      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          region: 'us-west-2',
          availabilityZones: ['us-west-2a', 'us-west-2b'],
        }),
        'dev',
        expect.objectContaining({ parent: stack })
      );
    });
  });

  describe('Output Registration', () => {
    it('should register all outputs correctly', () => {
      const mockRegisterOutputs = jest.fn();
      const MockComponentResource = require('@pulumi/pulumi').ComponentResource;
      MockComponentResource.prototype.registerOutputs = mockRegisterOutputs;

      const stack = new TapStack('test-stack', {});

      expect(mockRegisterOutputs).toHaveBeenCalledWith({
        vpcId: stack.vpcId,
        publicSubnetIds: stack.publicSubnetIds,
        privateSubnetIds: stack.privateSubnetIds,
        rdsEndpoint: stack.rdsEndpoint,
        s3BucketName: stack.s3BucketName,
        applicationRoleArn: stack.applicationRoleArn,
        kmsKeyId: stack.kmsKeyId,
        instanceProfileArn: stack.instanceProfileArn,
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    it('should pass correct environment suffix to infrastructure', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'production' });

      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.any(Object),
        'production',
        expect.objectContaining({ parent: stack })
      );
    });

    it('should ensure environment tag matches environment suffix', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'custom-env',
        tags: {
          Environment: 'should-be-overridden',
        },
      };

      const stack = new TapStack('test-stack', args);

      expect(InfrastructureConstructorSpy).toHaveBeenCalledWith(
        'infrastructure',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'custom-env',
          }),
        }),
        'custom-env',
        expect.objectContaining({ parent: stack })
      );
    });
  });
});
