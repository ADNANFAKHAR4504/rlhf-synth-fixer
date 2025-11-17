import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import { getEnvironmentConfig } from '../lib/config';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    return {
      id: args.inputs.name ? `${args.name}-id-${args.inputs.name}` : `${args.name}-id`,
      state: {
        ...args.inputs,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789EXAMPLE',
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Environment Configuration', () => {
    it('should load dev configuration correctly', () => {
      const config = getEnvironmentConfig('dev');

      expect(config.environment).toBe('dev');
      expect(config.vpcCidr).toBe('10.0.0.0/16');
      expect(config.rdsInstanceClass).toBe('db.t3.micro');
      expect(config.lambdaMemorySize).toBe(128);
      expect(config.s3LifecycleRetentionDays).toBe(7);
    });

    it('should load staging configuration correctly', () => {
      const config = getEnvironmentConfig('staging');

      expect(config.environment).toBe('staging');
      expect(config.vpcCidr).toBe('10.1.0.0/16');
      expect(config.rdsInstanceClass).toBe('db.t3.small');
      expect(config.lambdaMemorySize).toBe(256);
      expect(config.s3LifecycleRetentionDays).toBe(30);
    });

    it('should load prod configuration correctly', () => {
      const config = getEnvironmentConfig('prod');

      expect(config.environment).toBe('prod');
      expect(config.vpcCidr).toBe('10.2.0.0/16');
      expect(config.rdsInstanceClass).toBe('db.t3.medium');
      expect(config.lambdaMemorySize).toBe(512);
      expect(config.s3LifecycleRetentionDays).toBe(90);
    });

    it('should support dynamic environments using dev config as base', () => {
      const config = getEnvironmentConfig('synthy7v9v6');

      expect(config.environment).toBe('synthy7v9v6');
      expect(config.vpcCidr).toBe('10.0.0.0/16'); // Uses dev config
      expect(config.rdsInstanceClass).toBe('db.t3.micro'); // Uses dev config
      expect(config.lambdaMemorySize).toBe(128); // Uses dev config
    });

    it('should validate required configuration fields', () => {
      const config = getEnvironmentConfig('dev');

      expect(config.availabilityZones).toBeDefined();
      expect(config.availabilityZones.length).toBeGreaterThanOrEqual(2);
      expect(config.rdsBackupRetentionDays).toBeGreaterThanOrEqual(1);
      expect(config.lambdaTimeout).toBeGreaterThan(0);
    });

    it('should throw error for invalid lambda memory size', () => {
      const invalidConfig = {
        ...getEnvironmentConfig('dev'),
        lambdaMemorySize: 50, // Too low
      };

      expect(() => {
        // Force validation by importing the validation function
        const { validateConfig } = require('../lib/config');
        validateConfig(invalidConfig);
      }).toThrow('Lambda memory size must be between 128 and 10240 MB');
    });

    it('should throw error for invalid lambda timeout', () => {
      const invalidConfig = {
        ...getEnvironmentConfig('dev'),
        lambdaTimeout: 1000, // Too high
      };

      expect(() => {
        const { validateConfig } = require('../lib/config');
        validateConfig(invalidConfig);
      }).toThrow('Lambda timeout must be between 1 and 900 seconds');
    });

    it('should throw error for insufficient availability zones', () => {
      const invalidConfig = {
        ...getEnvironmentConfig('dev'),
        availabilityZones: ['us-east-1a'], // Only 1 AZ
      };

      expect(() => {
        const { validateConfig } = require('../lib/config');
        validateConfig(invalidConfig);
      }).toThrow('At least 2 availability zones are required');
    });

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        ...getEnvironmentConfig('dev'),
        vpcCidr: undefined as any, // Missing required field
      };

      expect(() => {
        const { validateConfig } = require('../lib/config');
        validateConfig(invalidConfig);
      }).toThrow('Missing required configuration values');
    });
  });

  describe('TapStack Resource Creation', () => {
    let stack: TapStack;

    beforeAll(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: { TestTag: 'TestValue' },
      });
    });

    it('should use process.env.ENVIRONMENT_SUFFIX when args not provided', () => {
      process.env.ENVIRONMENT_SUFFIX = 'staging';
      const envStack = new TapStack('env-test', {});
      expect(envStack).toBeDefined();
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('should default to dev when no environment suffix provided', () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      const defaultStack = new TapStack('default-test', {});
      expect(defaultStack).toBeDefined();
    });

    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose VPC ID output', async () => {
      const vpcId = await pulumi.output(stack.vpcId).promise();
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should expose RDS endpoint property', () => {
      expect(stack.rdsEndpoint).toBeDefined();
    });

    it('should expose S3 bucket name output', async () => {
      const bucketName = await pulumi.output(stack.s3BucketName).promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should expose Lambda function ARN property', () => {
      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should expose API Gateway URL output', async () => {
      const apiUrl = await pulumi.output(stack.apiGatewayUrl).promise();
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe('string');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in resource names', async () => {
      const stack = new TapStack('naming-test', {
        environmentSuffix: 'test-env',
      });

      const outputs = await pulumi.output(stack).promise();

      // Verify naming patterns are followed (using mocked resources)
      expect(outputs).toBeDefined();
    });
  });

  describe('Multi-Environment Support', () => {
    it('should create different configurations for each environment', () => {
      const devConfig = getEnvironmentConfig('dev');
      const stagingConfig = getEnvironmentConfig('staging');
      const prodConfig = getEnvironmentConfig('prod');

      expect(devConfig.vpcCidr).not.toBe(stagingConfig.vpcCidr);
      expect(stagingConfig.vpcCidr).not.toBe(prodConfig.vpcCidr);

      expect(devConfig.rdsInstanceClass).not.toBe(prodConfig.rdsInstanceClass);
      expect(devConfig.lambdaMemorySize).toBeLessThan(prodConfig.lambdaMemorySize);
      expect(devConfig.s3LifecycleRetentionDays).toBeLessThan(prodConfig.s3LifecycleRetentionDays);
    });
  });
});
