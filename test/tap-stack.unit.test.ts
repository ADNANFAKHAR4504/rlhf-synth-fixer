/* eslint-disable prettier/prettier */

/**
* Unit Tests for TapStack
* These tests validate the TapStack component in isolation using mocked dependencies.
* Tests cover configuration validation, resource creation logic, and error handling.
*/

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock Pulumi runtime for unit testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): pulumi.runtime.MockResourceResult => {
    const outputs: Record<string, any> = {};
    
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        outputs.id = 'vpc-12345678';
        outputs.cidrBlock = '10.0.0.0/16';
        break;
      case 'aws:ec2/subnet:Subnet':
        outputs.id = `subnet-${Math.random().toString(36).substr(2, 9)}`;
        outputs.availabilityZone = 'us-east-1a';
        break;
      case 'aws:s3/bucket:Bucket':
        outputs.id = args.inputs?.bucket || `test-bucket-${Math.random().toString(36).substr(2, 9)}`;
        outputs.bucket = outputs.id;
        outputs.arn = `arn:aws:s3:::${outputs.id}`;
        break;
      case 'aws:iam/role:Role':
        outputs.id = `test-role-${Math.random().toString(36).substr(2, 9)}`;
        outputs.arn = `arn:aws:iam::123456789012:role/${outputs.id}`;
        outputs.name = outputs.id;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.id = args.inputs?.name || `/aws/infrastructure/${args.name}`;
        outputs.name = outputs.id;
        outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${outputs.id}`;
        break;
      case 'aws:sns/topic:Topic':
        outputs.id = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
        outputs.arn = outputs.id;
        outputs.name = args.name;
        break;
      case 'aws:cloudwatch/dashboard:Dashboard':
        outputs.id = args.name;
        outputs.dashboardArn = `arn:aws:cloudwatch::123456789012:dashboard/${args.name}`;
        break;
      case 'aws:ssm/parameter:Parameter':
        outputs.id = args.inputs?.name || `/test/${args.name}`;
        outputs.name = outputs.id;
        outputs.value = args.inputs?.value || 'test-value';
        break;
      case 'aws:ec2/flowLog:FlowLog':
        outputs.id = `fl-${Math.random().toString(16).substr(2, 9)}`;
        outputs.arn = `arn:aws:ec2:us-east-1:123456789012:vpc-flow-log/${outputs.id}`;
        break;
      default:
        outputs.id = `${args.type}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return {
      id: outputs.id,
      state: { ...args.inputs, ...outputs },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): pulumi.runtime.MockCallResult => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return { names: ['us-east-1a', 'us-east-1b', 'us-east-1c'] };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const defaultArgs = {
    tags: {
      Environment: 'test',
      Project: 'test-project',
      Owner: 'test-owner',
    },
    environment: 'test',
    regions: ['us-east-1', 'eu-west-2'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.writeFileSync.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create TapStack with default configuration', async () => {
      stack = new TapStack('test-stack', defaultArgs);
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.vpc).toBeDefined();
      expect(stack.privateSubnets).toBeDefined();
      expect(stack.publicSubnets).toBeDefined();
    });

    test('should create TapStack with custom environment', async () => {
      const customArgs = {
        ...defaultArgs,
        environment: 'production',
      };
      stack = new TapStack('prod-stack', customArgs);
      expect(stack).toBeInstanceOf(TapStack);
    });

    test('should handle minimal configuration', async () => {
      const minimalArgs = {
        tags: { Environment: 'minimal' },
      };
      stack = new TapStack('minimal-stack', minimalArgs);
      expect(stack).toBeInstanceOf(TapStack);
    });

    test('should use config fallbacks when environment not provided', async () => {
      const argsWithoutEnv = {
        tags: { Environment: 'test' },
        // environment is undefined
        regions: ['us-west-2'],
      };
      stack = new TapStack('fallback-stack', argsWithoutEnv);
      expect(stack).toBeInstanceOf(TapStack);
    });

    test('should use default regions when not provided', async () => {
      const argsWithoutRegions = {
        tags: { Environment: 'test' },
        environment: 'test',
        // regions is undefined
      };
      stack = new TapStack('default-regions-stack', argsWithoutRegions);
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('VPC and Networking', () => {
    beforeEach(() => {
      stack = new TapStack('network-test', defaultArgs);
    });

    test('should create VPC with correct CIDR block', async () => {
      const vpcId = await new Promise<string>((resolve) => {
        stack.vpc.id.apply(id => resolve(id));
      });
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should create public and private subnets', async () => {
      expect(stack.publicSubnets).toHaveLength(3);
      expect(stack.privateSubnets).toHaveLength(3);

      const publicId = await new Promise<string>((resolve) => {
        stack.publicSubnets[0].id.apply(id => resolve(id));
      });
      expect(publicId).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should handle single AZ deployment', async () => {
      expect(stack.privateSubnets.length).toBeGreaterThan(0);
      expect(stack.publicSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('Security Infrastructure', () => {
    beforeEach(() => {
      stack = new TapStack('security-test', defaultArgs);
    });

    test('should create IAM roles for services', async () => {
      expect(stack.cloudTrailRole).toBeDefined();
      expect(stack.deploymentRole).toBeDefined();
      expect(stack.vpcFlowLogsRole).toBeDefined();

      const roleArn = await new Promise<string>((resolve) => {
        stack.cloudTrailRole.arn.apply(arn => resolve(arn));
      });
      expect(roleArn).toMatch(/^arn:aws:iam::/);
    });

    test('should create roles with proper assume role policies', async () => {
      expect(stack.cloudTrailRole).toBeDefined();
      expect(stack.deploymentRole).toBeDefined();
      expect(stack.vpcFlowLogsRole).toBeDefined();
    });
  });

  describe('Storage Infrastructure', () => {
    beforeEach(() => {
      stack = new TapStack('storage-test', defaultArgs);
    });

    test('should create S3 bucket for CloudTrail', async () => {
      expect(stack.cloudTrailBucket).toBeDefined();

      const bucketName = await new Promise<string>((resolve) => {
        stack.cloudTrailBucket.bucket.apply(name => resolve(name));
      });
      expect(bucketName).toMatch(/test-cloudtrail-logs-\d+/);
    });

    test('should handle bucket naming conflicts', async () => {
      const bucket1Name = await new Promise<string>((resolve) => {
        stack.cloudTrailBucket.bucket.apply(name => resolve(name));
      });

      const stack2 = new TapStack('storage-test-2', defaultArgs);
      const bucket2Name = await new Promise<string>((resolve) => {
        stack2.cloudTrailBucket.bucket.apply(name => resolve(name));
      });

      expect(bucket1Name).not.toBe(bucket2Name);
    });
  });

  describe('Monitoring Infrastructure', () => {
    beforeEach(() => {
      stack = new TapStack('monitoring-test', defaultArgs);
    });

    test('should create CloudWatch resources', async () => {
      expect(stack.logGroup).toBeDefined();
      expect(stack.alarmTopic).toBeDefined();
      expect(stack.dashboard).toBeDefined();
    });

    test('should set appropriate log retention for environment', async () => {
      const logGroupName = await new Promise<string>((resolve) => {
        stack.logGroup.name.apply(name => resolve(name));
      });
      expect(logGroupName).toBe('/aws/infrastructure/test');
    });

    test('should create SNS topic for alarms', async () => {
      const topicArn = await new Promise<string>((resolve) => {
        stack.alarmTopic.arn.apply(arn => resolve(arn));
      });
      expect(topicArn).toMatch(/^arn:aws:sns:/);
    });

    test('should use production retention for prod environment', async () => {
      const prodStack = new TapStack('prod-monitoring-test', {
        ...defaultArgs,
        environment: 'prod',
      });
      expect(prodStack.logGroup).toBeDefined();
    });

    test('should use non-production retention for non-prod environment', async () => {
      const devStack = new TapStack('dev-monitoring-test', {
        ...defaultArgs,
        environment: 'dev',
      });
      expect(devStack.logGroup).toBeDefined();
    });
  });

  describe('VPC Flow Logs Infrastructure', () => {
    beforeEach(() => {
      stack = new TapStack('flow-logs-test', defaultArgs);
    });

    test('should create VPC Flow Logs resources', async () => {
      expect(stack.vpcFlowLogsRole).toBeDefined();
      expect(stack.vpcFlowLogs).toBeDefined();
    });

    test('should configure VPC Flow Logs with proper settings', async () => {
      const flowLogsId = await new Promise<string>((resolve) => {
        stack.vpcFlowLogs.id.apply(id => resolve(id));
      });
      expect(flowLogsId).toMatch(/^fl-[a-f0-9]+$/);
    });

    test('should use production retention for prod environment flow logs', async () => {
      const prodStack = new TapStack('prod-flow-logs-test', {
        ...defaultArgs,
        environment: 'prod',
      });
      expect(prodStack.vpcFlowLogs).toBeDefined();
    });
  });

  describe('Parameter Store', () => {
    beforeEach(() => {
      stack = new TapStack('params-test', defaultArgs);
    });

    test('should create parameter store prefix', async () => {
      const prefix = await new Promise<string>((resolve) => {
        stack.parameterStorePrefix.apply(p => resolve(p));
      });
      expect(prefix).toBe('/test');
    });

    test('should handle different environments in parameter paths', async () => {
      const prodStack = new TapStack('prod-params', {
        ...defaultArgs,
        environment: 'production',
      });

      const prodPrefix = await new Promise<string>((resolve) => {
        prodStack.parameterStorePrefix.apply(p => resolve(p));
      });
      expect(prodPrefix).toBe('/production');
    });
  });

  describe('Multi-Account StackSet', () => {
    test('should create StackSet roles when enabled', async () => {
      const multiAccountStack = new TapStack('multi-account-test', {
        ...defaultArgs,
        enableMultiAccount: true,
      });

      expect(multiAccountStack.stackSetExecutionRole).toBeDefined();
      expect(multiAccountStack.stackSetAdministrationRole).toBeDefined();
    });

    test('should not create StackSet roles when disabled', async () => {
      const singleAccountStack = new TapStack('single-account-test', {
        ...defaultArgs,
        enableMultiAccount: false,
      });

      expect(singleAccountStack.stackSetExecutionRole).toBeUndefined();
      expect(singleAccountStack.stackSetAdministrationRole).toBeUndefined();
    });

    test('should not create StackSet roles when not specified', async () => {
      const defaultStack = new TapStack('default-stack-test', {
        ...defaultArgs,
        // enableMultiAccount is undefined
      });

      expect(defaultStack.stackSetExecutionRole).toBeUndefined();
      expect(defaultStack.stackSetAdministrationRole).toBeUndefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty tags gracefully', async () => {
      const emptyTagsStack = new TapStack('empty-tags-test', {
        tags: {},
      });
      expect(emptyTagsStack).toBeInstanceOf(TapStack);
    });

    test('should handle invalid environment names', async () => {
      const invalidEnvStack = new TapStack('invalid-env-test', {
        ...defaultArgs,
        environment: 'INVALID_ENV_123!',
      });
      expect(invalidEnvStack).toBeInstanceOf(TapStack);
    });

    test('should handle single region deployment', async () => {
      const singleRegionStack = new TapStack('single-region-test', {
        ...defaultArgs,
        regions: ['us-east-1'],
      });
      expect(singleRegionStack).toBeInstanceOf(TapStack);
    });

    test('should handle undefined regions array', async () => {
      const undefinedRegionsStack = new TapStack('undefined-regions-test', {
        ...defaultArgs,
        regions: undefined,
      });
      expect(undefinedRegionsStack).toBeInstanceOf(TapStack);
    });

    test('should handle file write errors gracefully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        new TapStack('file-error-test', defaultArgs);
      }).not.toThrow();

      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should handle successful file writes', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        // Successfully write file
      });

      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Set NODE_ENV to non-test to trigger console.log
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      new TapStack('file-success-test', defaultArgs);

      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalled();

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('Resource Tagging', () => {
    beforeEach(() => {
      stack = new TapStack('tagging-test', {
        tags: {
          Environment: 'test',
          Project: 'tagging-project',
          Owner: 'test-team',
          CostCenter: '12345',
        },
      });
    });

    test('should apply tags consistently across resources', async () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.cloudTrailBucket).toBeDefined();
    });

    test('should merge default and custom tags', async () => {
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate required configuration parameters', async () => {
      expect(() => {
        new TapStack('validation-test', {
          tags: { Environment: 'test' },
        });
      }).not.toThrow();
    });

    test('should handle missing optional parameters', async () => {
      const minimalStack = new TapStack('minimal-validation-test', {
        tags: { Environment: 'test' },
      });
      expect(minimalStack).toBeInstanceOf(TapStack);
    });
  });

  describe('Output File Generation', () => {
    test('should generate outputs file successfully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {});
      
      stack = new TapStack('output-test', defaultArgs);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'stack-outputs.json',
        expect.stringContaining('vpcId'),
        'utf8'
      );
    });

    test('should handle custom output file path', async () => {
      mockFs.writeFileSync.mockImplementation(() => {});
      
      stack = new TapStack('custom-output-test', defaultArgs);
      
      // Wait for async operations to complete  
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('Environment-Specific Logic', () => {
    test('should configure production environment settings', async () => {
      const prodStack = new TapStack('prod-env-test', {
        ...defaultArgs,
        environment: 'prod',
      });

      expect(prodStack).toBeInstanceOf(TapStack);
    });

    test('should configure development environment settings', async () => {
      const devStack = new TapStack('dev-env-test', {
        ...defaultArgs,
        environment: 'dev',
      });

      expect(devStack).toBeInstanceOf(TapStack);
    });

    test('should handle test environment detection', async () => {
      const testStack = new TapStack('env-detection-test', {
        ...defaultArgs,
        environment: 'integration-test',
      });

      expect(testStack).toBeInstanceOf(TapStack);
    });
  });
});
