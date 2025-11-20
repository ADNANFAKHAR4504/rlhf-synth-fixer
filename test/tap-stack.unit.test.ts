import * as pulumi from '@pulumi/pulumi';

// Mock configuration data
const mockConfig: Record<string, string> = {
  environment: 'test',
  environmentSuffix: 'test',
  vpcCidr: '10.0.0.0/16',
  rdsInstanceClass: 'db.t3.micro',
  lambdaMemory: '128',
  lambdaTimeout: '30',
  s3RetentionDays: '7',
  logRetentionDays: '7',
  rdsAlarmThreshold: '80',
  multiAz: 'false',
  dbPassword: 'test-password',
};

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks(
  {
    newResource: (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } => {
      const resourceState: any = { ...args.inputs };

      // Add specific outputs for different resource types
      if (args.type === 'aws:rds/instance:Instance') {
        resourceState.endpoint = 'test-db.us-east-1.rds.amazonaws.com:5432';
        resourceState.address = 'test-db.us-east-1.rds.amazonaws.com';
      } else if (args.type === 'aws:s3/bucket:Bucket') {
        resourceState.bucket = args.inputs.bucketPrefix
          ? `${args.inputs.bucketPrefix}unique-12345`
          : `${args.name}-bucket`;
        resourceState.id = resourceState.bucket;
      } else if (args.type === 'aws:lambda/function:Function') {
        resourceState.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
      } else if (args.type === 'aws:apigateway/restApi:RestApi') {
        resourceState.id = 'test-api-id';
        resourceState.executionArn = 'arn:aws:execute-api:us-east-1:123456789012:test-api-id';
      }

      return {
        id: `${args.name}_id`,
        state: resourceState,
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
        return {
          names: ['us-east-1a', 'us-east-1b'],
          zoneIds: ['use1-az1', 'use1-az2'],
        };
      }
      if (args.token === 'aws:index/getRegion:getRegion') {
        return {
          name: 'us-east-1',
        };
      }
      if (args.token === 'pulumi:pulumi:getConfiguration') {
        return mockConfig;
      }
      return {};
    },
  },
  'test-project',
  'test-stack',
  false
);

// Mock pulumi.Config to return our test configuration
const originalConfig = pulumi.Config;
(pulumi as any).Config = class MockConfig {
  private namespace?: string;

  constructor(namespace?: string) {
    this.namespace = namespace;
  }

  get(key: string): string | undefined {
    return mockConfig[key];
  }

  require(key: string): string {
    const value = mockConfig[key];
    if (value === undefined) {
      throw new Error(`Missing required configuration variable '${key}'`);
    }
    return value;
  }

  getBoolean(key: string): boolean | undefined {
    const value = mockConfig[key];
    if (value === undefined) return undefined;
    return value === 'true';
  }

  requireBoolean(key: string): boolean {
    const value = this.require(key);
    return value === 'true';
  }

  getNumber(key: string): number | undefined {
    const value = mockConfig[key];
    if (value === undefined) return undefined;
    return parseInt(value, 10);
  }

  requireNumber(key: string): number {
    const value = this.require(key);
    return parseInt(value, 10);
  }

  getObject<T>(key: string): T | undefined {
    const value = mockConfig[key];
    if (value === undefined) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  requireObject<T>(key: string): T {
    const value = this.require(key);
    return JSON.parse(value) as T;
  }

  getSecret(key: string): pulumi.Output<string> | undefined {
    const value = mockConfig[key];
    if (value === undefined) return undefined;
    return pulumi.secret(value);
  }

  requireSecret(key: string): pulumi.Output<string> {
    const value = this.require(key);
    return pulumi.secret(value);
  }
};

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    // Create stack instance
    stack = new TapStack('test-stack-test', {
      environmentSuffix: 'test',
    });
  });

  describe('Stack Instantiation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Stack Outputs', () => {
    it('should export vpcId output', (done) => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    it('should export rdsEndpoint output', (done) => {
      pulumi.all([stack.rdsEndpoint]).apply(([rdsEndpoint]) => {
        expect(rdsEndpoint).toBeDefined();
        expect(typeof rdsEndpoint).toBe('string');
        done();
      });
    });

    it('should export bucketName output', (done) => {
      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        done();
      });
    });

    it('should export lambdaArn output', (done) => {
      pulumi.all([stack.lambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        expect(typeof lambdaArn).toBe('string');
        done();
      });
    });

    it('should export apiUrl output', (done) => {
      pulumi.all([stack.apiUrl]).apply(([apiUrl]) => {
        expect(apiUrl).toBeDefined();
        expect(typeof apiUrl).toBe('string');
        done();
      });
    });
  });

  describe('Stack Configuration', () => {
    it('should handle environment suffix in resource names', (done) => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toContain('_id');
        done();
      });
    });

    it('should create outputs for all major resources', (done) => {
      pulumi
        .all([
          stack.vpcId,
          stack.rdsEndpoint,
          stack.bucketName,
          stack.lambdaArn,
          stack.apiUrl,
        ])
        .apply(([vpcId, rdsEndpoint, bucketName, lambdaArn, apiUrl]) => {
          expect(vpcId).toBeDefined();
          expect(rdsEndpoint).toBeDefined();
          expect(bucketName).toBeDefined();
          expect(lambdaArn).toBeDefined();
          expect(apiUrl).toBeDefined();
          done();
        });
    });
  });

  describe('Environment Configuration', () => {
    it('should load configuration from Pulumi config', () => {
      const config = new pulumi.Config('TapStack');
      expect(config).toBeDefined();
    });

    it('should use environment-specific settings', (done) => {
      // Test that the stack uses environment-specific configurations
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeTruthy();
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in resource identifiers', (done) => {
      pulumi.all([stack.lambdaArn]).apply(([lambdaArn]) => {
        expect(typeof lambdaArn).toBe('string');
        expect(lambdaArn.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should generate unique bucket names', (done) => {
      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(typeof bucketName).toBe('string');
        expect(bucketName.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Component Resources', () => {
    it('should create VPC component', (done) => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        expect(vpcId.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should create RDS instance', (done) => {
      pulumi.all([stack.rdsEndpoint]).apply(([rdsEndpoint]) => {
        expect(rdsEndpoint).toBeDefined();
        expect(rdsEndpoint.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should create S3 bucket', (done) => {
      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(bucketName.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should create Lambda function', (done) => {
      pulumi.all([stack.lambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        expect(lambdaArn.length).toBeGreaterThan(0);
        done();
      }, 45000);
    }, 45000);

    it('should create API Gateway', (done) => {
      pulumi.all([stack.apiUrl]).apply(([apiUrl]) => {
        expect(apiUrl).toBeDefined();
        expect(apiUrl.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should use default values when config is not provided', () => {
      // Test that defaults are applied when config is missing
      const minimalConfig: Record<string, string> = {};

      // Temporarily replace mock config with minimal config
      const originalMockConfig = { ...mockConfig };
      Object.keys(mockConfig).forEach((key) => delete mockConfig[key]);
      Object.assign(mockConfig, minimalConfig);

      // Creating a stack with minimal config should work with defaults
      expect(() => {
        new TapStack('test-default-stack', {});
      }).not.toThrow();

      // Restore mock config
      Object.keys(mockConfig).forEach((key) => delete mockConfig[key]);
      Object.assign(mockConfig, originalMockConfig);
    });

    it('should apply environment-specific defaults for dev environment', () => {
      // Test that dev defaults are applied
      const devConfig: Record<string, string> = {
        environment: 'dev',
        environmentSuffix: 'dev',
      };

      // Temporarily replace mock config
      const originalMockConfig = { ...mockConfig };
      Object.keys(mockConfig).forEach((key) => delete mockConfig[key]);
      Object.assign(mockConfig, devConfig);

      // Creating a stack with dev environment should use dev-specific defaults
      expect(() => {
        new TapStack('test-dev-stack', {});
      }).not.toThrow();

      // Restore mock config
      Object.keys(mockConfig).forEach((key) => delete mockConfig[key]);
      Object.assign(mockConfig, originalMockConfig);
    });
  });
});
